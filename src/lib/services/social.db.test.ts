import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import { AppError } from "@/lib/errors";
import { decryptReceiver } from "@/lib/security/pair-crypto";
import type { SessionParticipant } from "./common";
import { createGroup } from "./groups";
import { redoDraw, runDraw } from "./draws";
import { authenticate, confirmParticipation, joinGroup } from "./participants";
import {
  addWish,
  conversationWithFriend,
  conversationWithSanta,
  deleteWallPost,
  deleteWish,
  getFriendWishes,
  listMyWishes,
  listWall,
  MAX_WISHES,
  postToWall,
  replyToSanta,
  sendToFriend,
} from "./social";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

async function codeOf(p: Promise<unknown>): Promise<AppError["code"] | "OK"> {
  try {
    await p;
    return "OK";
  } catch (e) {
    if (e instanceof AppError) return e.code;
    throw e;
  }
}

async function setup(names = ["Maria", "João", "Carlos"]) {
  const { code, token } = await createGroup(db, { name: "Natal", organizerName: "Robert", pin: "905527" });
  const people: Record<string, SessionParticipant> = { Robert: (await authenticate(db, code, token))! };
  for (const n of names) {
    const r = await joinGroup(db, code, { name: n, pin: "730164" });
    await confirmParticipation(db, (await authenticate(db, code, r.token))!);
    people[n] = (await authenticate(db, code, r.token))!;
  }
  return { code, people, org: people.Robert! };
}

/** giver -> receiver por NOME (só o teste decifra tudo). */
async function pairsByName(people: Record<string, SessionParticipant>) {
  const byId = new Map(Object.entries(people).map(([n, s]) => [s.id, n]));
  const rows = await db.drawPair.findMany({ where: { draw: { status: "ACTIVE" } } });
  const out: Record<string, string> = {};
  for (const r of rows) out[byId.get(r.giverId)!] = byId.get(decryptReceiver({ drawId: r.drawId, giverId: r.giverId }, r.receiverEnc))!;
  return out;
}

const santaOf = (pairs: Record<string, string>, name: string) => Object.keys(pairs).find((g) => pairs[g] === name)!;

describe("lista de desejos", () => {
  it("é opcional e o dono gerencia a própria lista", async () => {
    const { people } = await setup();
    expect(await listMyWishes(db, people.Maria!)).toEqual([]);
    await addWish(db, people.Maria!, { product: "Fone Bluetooth", approxPrice: 15000, url: "https://loja.com/fone" });
    await addWish(db, people.Maria!, { product: "Livro" });
    const mine = await listMyWishes(db, people.Maria!);
    expect(mine.map((w) => w.product)).toEqual(["Fone Bluetooth", "Livro"]);
    expect(mine[0]).toMatchObject({ approxPriceCents: 15000, url: "https://loja.com/fone", description: null });

    // João não apaga desejo da Maria
    expect(await codeOf(deleteWish(db, people.João!, mine[0]!.id))).toBe("NOT_FOUND");
    await deleteWish(db, people.Maria!, mine[0]!.id);
    expect(await listMyWishes(db, people.Maria!)).toHaveLength(1);
  });

  it(`limite de ${MAX_WISHES} itens`, async () => {
    const { people } = await setup();
    for (let i = 0; i < MAX_WISHES; i++) await addWish(db, people.Maria!, { product: `Item ${i}` });
    expect(await codeOf(addWish(db, people.Maria!, { product: "Mais um" }))).toBe("LIMIT_REACHED");
  });

  it("antes do sorteio ninguém vê a lista dos outros", async () => {
    const { people } = await setup();
    await addWish(db, people.Maria!, { product: "Fone" });
    for (const s of Object.values(people)) expect(await getFriendWishes(db, s)).toBeNull();
  });

  it("depois do sorteio, SÓ quem tirou a pessoa vê a lista dela", async () => {
    const { org, people } = await setup();
    for (const n of Object.keys(people)) await addWish(db, people[n]!, { product: `Desejo de ${n}` });
    await runDraw(db, org);
    const pairs = await pairsByName(people);
    for (const [viewer, s] of Object.entries(people)) {
      const visible = (await getFriendWishes(db, s))!;
      expect(visible.map((w) => w.product)).toEqual([`Desejo de ${pairs[viewer]}`]);
    }
  });

  it("quem tirou alguém sem desejos vê lista vazia (não erro)", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    for (const s of Object.values(people)) expect(await getFriendWishes(db, s)).toEqual([]);
  });
});

describe("mensagens secretas", () => {
  it("amigo secreto manda anônimo; destinatário responde; ninguém mais vê", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    const pairs = await pairsByName(people);
    const santa = santaOf(pairs, "Maria");

    await sendToFriend(db, people[santa]!, "Oi Maria! Qual sua cor favorita?");
    const mariaInbox = await conversationWithSanta(db, people.Maria!);
    expect(mariaInbox).toEqual([{ mine: false, body: "Oi Maria! Qual sua cor favorita?", day: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }]);
    // nada do remetente chega ao destinatário
    expect(JSON.stringify(mariaInbox)).not.toContain(santa);
    expect(JSON.stringify(mariaInbox)).not.toMatch(/sender|Lookup|id/i);

    await replyToSanta(db, people.Maria!, "Azul! 💙");
    expect((await conversationWithSanta(db, people.Maria!)).map((m) => [m.mine, m.body])).toEqual([
      [false, "Oi Maria! Qual sua cor favorita?"],
      [true, "Azul! 💙"],
    ]);
    expect((await conversationWithFriend(db, people[santa]!)).map((m) => [m.mine, m.body])).toEqual([
      [true, "Oi Maria! Qual sua cor favorita?"],
      [false, "Azul! 💙"],
    ]);

    // terceiros: não aparecem nas conversas de ninguém mais
    for (const n of Object.keys(people)) {
      if (n === "Maria" || n === santa) continue;
      const all = [...(await conversationWithSanta(db, people[n]!)), ...(await conversationWithFriend(db, people[n]!))];
      expect(all.map((m) => m.body)).not.toContain("Oi Maria! Qual sua cor favorita?");
      expect(all.map((m) => m.body)).not.toContain("Azul! 💙");
    }
  });

  it("a tabela de mensagens não revela os pares", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    for (const s of Object.values(people)) await sendToFriend(db, s, "oi");
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM "SecretMessage"`);
    const ids = Object.values(people).map((p) => p.id);
    for (const r of rows) {
      // só o destinatário aparece em claro; nenhuma coluna contém o id do remetente
      const others = Object.entries(r).filter(([k]) => k !== "recipientId").map(([, v]) => String(v));
      for (const id of ids) expect(others.join("|")).not.toContain(id);
    }
  });

  it("sem sorteio não há mensagens; limite por sorteio", async () => {
    const { org, people } = await setup();
    expect(await codeOf(sendToFriend(db, people.Maria!, "oi"))).toBe("NOT_FOUND");
    expect(await codeOf(replyToSanta(db, people.Maria!, "oi"))).toBe("NOT_FOUND");
    expect(await conversationWithSanta(db, people.Maria!)).toEqual([]);
    await runDraw(db, org);
    for (let i = 0; i < 50; i++) await sendToFriend(db, people.Maria!, `msg ${i}`);
    expect(await codeOf(sendToFriend(db, people.Maria!, "mais uma"))).toBe("LIMIT_REACHED");
    expect(await codeOf(replyToSanta(db, people.Maria!, "e resposta"))).toBe("LIMIT_REACHED");
  });

  it("refazer o sorteio apaga as conversas antigas", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    await sendToFriend(db, people.Maria!, "antiga");
    await redoDraw(db, org);
    for (const s of Object.values(people)) {
      expect(await conversationWithFriend(db, s)).toEqual([]);
      expect(await conversationWithSanta(db, s)).toEqual([]);
    }
  });
});

describe("mural", () => {
  it("participantes postam com nome; autor apaga o próprio; organizador oculta qualquer um", async () => {
    const { org, people } = await setup();
    await postToWall(db, people.Maria!, "Quem leva a sobremesa?");
    await postToWall(db, people.João!, "Eu levo!");
    const wall = await listWall(db, people.Carlos!);
    expect(wall.map((p) => [p.authorName, p.body, p.canDelete])).toEqual([
      ["João", "Eu levo!", false],
      ["Maria", "Quem leva a sobremesa?", false],
    ]);
    const joaoPost = wall[0]!.id;
    const mariaPost = wall[1]!.id;
    expect(await codeOf(deleteWallPost(db, people.Carlos!, joaoPost))).toBe("NOT_FOUND"); // não é dele
    await deleteWallPost(db, people.João!, joaoPost);
    expect((await listWall(db, org)).find((p) => p.id === mariaPost)?.canDelete).toBe(true);
    await deleteWallPost(db, org, mariaPost);
    expect(await listWall(db, people.Maria!)).toEqual([]);
  });

  it("mural é por grupo e exige participar", async () => {
    const a = await setup();
    const b = await setup(["Ana", "Bia", "Caio"]);
    await postToWall(db, a.people.Maria!, "grupo A");
    expect(await listWall(db, b.people.Ana!)).toEqual([]);
    const postId = (await listWall(db, a.people.Maria!))[0]!.id;
    expect(await codeOf(deleteWallPost(db, b.org, postId))).toBe("NOT_FOUND"); // organizador de OUTRO grupo
    expect(await codeOf(listWall(db, null))).toBe("UNAUTHORIZED");
    expect(await codeOf(postToWall(db, null, "x"))).toBe("UNAUTHORIZED");
  });
});
