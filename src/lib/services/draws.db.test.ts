import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import { AppError } from "@/lib/errors";
import { decryptReceiver } from "@/lib/security/pair-crypto";
import type { SessionParticipant } from "./common";
import { createGroup, removeParticipant } from "./groups";
import {
  addExclusion,
  getDrawReadiness,
  getMyFriend,
  getMyResultState,
  listExclusions,
  redoDraw,
  removeExclusion,
  reopenGroup,
  revealMyResult,
  runDraw,
} from "./draws";
import { authenticate, confirmParticipation, joinGroup } from "./participants";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

const PIN = "730164";

async function codeOf(p: Promise<unknown>): Promise<AppError["code"] | "OK"> {
  try {
    await p;
    return "OK";
  } catch (e) {
    if (e instanceof AppError) return e.code;
    throw e;
  }
}

/** Grupo com organizador + N membros confirmados (e `invited` não confirmados). */
async function setup(names = ["Maria", "João", "Carlos"], invited: string[] = []) {
  const { code, token } = await createGroup(db, { name: "Natal", organizerName: "Robert", pin: "905527" });
  const org = (await authenticate(db, code, token))!;
  const people: Record<string, SessionParticipant> = { Robert: org };
  for (const n of [...names, ...invited]) {
    const r = await joinGroup(db, code, { name: n, pin: PIN });
    const s = (await authenticate(db, code, r.token))!;
    if (names.includes(n)) await confirmParticipation(db, s);
    people[n] = (await authenticate(db, code, r.token))!;
  }
  return { code, org, people };
}

/** Lê TODOS os pares decifrando (só o teste faz isso — a aplicação não tem essa função). */
async function allPairs(groupId: string): Promise<Map<string, string>> {
  const pairs = await db.drawPair.findMany({ where: { draw: { groupId, status: "ACTIVE" } } });
  return new Map(pairs.map((p) => [p.giverId, decryptReceiver({ drawId: p.drawId, giverId: p.giverId }, p.receiverEnc)]));
}

function expectValidDerangement(pairs: Map<string, string>, ids: string[]) {
  expect([...pairs.keys()].sort()).toEqual([...ids].sort()); // cada um tira exatamente 1
  expect([...pairs.values()].sort()).toEqual([...ids].sort()); // cada um é tirado exatamente 1 vez
  for (const [g, r] of pairs) expect(g).not.toBe(r); // ninguém tira a si mesmo
}

describe("exclusões", () => {
  it("organizador adiciona (mútua), lista e remove", async () => {
    const { org, people } = await setup();
    const r = await addExclusion(db, org, { participantId: people.Maria!.id, excludedParticipantId: people.João!.id, mutual: true });
    expect(r.stillPossible).toBe(true);
    const list = await listExclusions(db, org);
    expect(list.map((e) => `${e.participantName}->${e.excludedName}`)).toEqual(["Maria->João", "João->Maria"]);
    // repetir não duplica nem dá erro
    await addExclusion(db, org, { participantId: people.Maria!.id, excludedParticipantId: people.João!.id, mutual: false });
    expect(await listExclusions(db, org)).toHaveLength(2);
    await removeExclusion(db, org, list[0]!.id);
    expect(await listExclusions(db, org)).toHaveLength(1);
  });

  it("avisa quando as regras tornam o sorteio impossível", async () => {
    const { org, people } = await setup(); // 4 confirmados
    const R = people.Robert!.id, M = people.Maria!.id, J = people.João!.id;
    await addExclusion(db, org, { participantId: R, excludedParticipantId: M, mutual: false });
    await addExclusion(db, org, { participantId: R, excludedParticipantId: J, mutual: false });
    const r = await addExclusion(db, org, { participantId: R, excludedParticipantId: people.Carlos!.id, mutual: false });
    expect(r.stillPossible).toBe(false); // Robert não pode tirar ninguém
  });

  it("permissões e validações", async () => {
    const { org, people } = await setup();
    const other = await setup(["Ana", "Bia", "Caio"]);
    const M = people.Maria!.id, J = people.João!.id;
    expect(await codeOf(addExclusion(db, people.Maria!, { participantId: M, excludedParticipantId: J, mutual: false }))).toBe("FORBIDDEN");
    expect(await codeOf(addExclusion(db, org, { participantId: M, excludedParticipantId: M, mutual: false }))).toBe("VALIDATION");
    expect(await codeOf(addExclusion(db, org, { participantId: M, excludedParticipantId: other.people.Ana!.id, mutual: false }))).toBe("NOT_FOUND");
    const [e] = await Promise.all([addExclusion(db, other.org, { participantId: other.people.Ana!.id, excludedParticipantId: other.people.Bia!.id, mutual: false })]);
    expect(e.stillPossible).toBe(true);
    const otherExclusion = (await listExclusions(db, other.org))[0]!;
    expect(await codeOf(removeExclusion(db, org, otherExclusion.id))).toBe("NOT_FOUND"); // de outro grupo
  });

  it("bloqueadas depois do sorteio", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    expect(await codeOf(addExclusion(db, org, { participantId: people.Maria!.id, excludedParticipantId: people.João!.id, mutual: false }))).toBe("GROUP_LOCKED");
  });
});

describe("runDraw", () => {
  it("sorteia só os confirmados, grava pares cifrados e bloqueia o grupo", async () => {
    const { org, people } = await setup(["Maria", "João", "Carlos"], ["Pendente"]);
    const r = await runDraw(db, org);
    expect(r.size).toBe(4);
    const confirmedIds = ["Robert", "Maria", "João", "Carlos"].map((n) => people[n]!.id);
    expectValidDerangement(await allPairs(org.group.id), confirmedIds);
    expect((await db.group.findUniqueOrThrow({ where: { id: org.group.id } })).status).toBe("DRAWN");
    // quem não confirmou fica de fora
    expect(await getMyResultState(db, people.Pendente!)).toEqual({ state: "NOT_IN_DRAW" });
  });

  it("respeita exclusões em muitos sorteios", async () => {
    for (let round = 0; round < 15; round++) {
      await truncateAll(db);
      const { org, people } = await setup(["Maria", "João", "Carlos", "Ana"]);
      const R = people.Robert!.id, M = people.Maria!.id, J = people.João!.id, C = people.Carlos!.id;
      await addExclusion(db, org, { participantId: R, excludedParticipantId: M, mutual: true });
      await addExclusion(db, org, { participantId: J, excludedParticipantId: C, mutual: false });
      await runDraw(db, org);
      const pairs = await allPairs(org.group.id);
      expectValidDerangement(pairs, Object.values(people).map((p) => p.id));
      expect(pairs.get(R)).not.toBe(M);
      expect(pairs.get(M)).not.toBe(R);
      expect(pairs.get(J)).not.toBe(C);
    }
  }, 60_000); // 15 rodadas completas (cada participante gera hash de PIN)

  it("exclusões de quem está fora do sorteio são ignoradas", async () => {
    const { org, people } = await setup(["Maria", "João"], ["Pendente"]);
    await addExclusion(db, org, { participantId: people.Pendente!.id, excludedParticipantId: people.Maria!.id, mutual: true });
    expect((await runDraw(db, org)).size).toBe(3);
  });

  it("sem combinação possível: mensagem exigida e NADA é salvo", async () => {
    const { org, people } = await setup();
    const R = people.Robert!.id;
    for (const n of ["Maria", "João", "Carlos"]) {
      await addExclusion(db, org, { participantId: R, excludedParticipantId: people[n]!.id, mutual: false });
    }
    await expect(runDraw(db, org)).rejects.toThrow(
      "Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões.",
    );
    expect(await db.draw.count()).toBe(0);
    expect(await db.drawPair.count()).toBe(0);
    expect((await db.group.findUniqueOrThrow({ where: { id: org.group.id } })).status).toBe("OPEN");
  });

  it("precisa de 3 confirmados", async () => {
    const { org } = await setup(["Maria"], ["João", "Carlos"]);
    await expect(runDraw(db, org)).rejects.toThrow(/pelo menos 3 participantes confirmados/);
    expect(await db.draw.count()).toBe(0);
  });

  it("só o organizador sorteia; não sorteia duas vezes", async () => {
    const { org, people } = await setup();
    expect(await codeOf(runDraw(db, people.Maria!))).toBe("FORBIDDEN");
    expect(await codeOf(runDraw(db, null))).toBe("UNAUTHORIZED");
    await runDraw(db, org);
    expect(await codeOf(runDraw(db, org))).toBe("CONFLICT");
    expect(await db.draw.count()).toBe(1);
  });

  it("concorrência: 5 cliques simultâneos em 'sortear' geram UM sorteio", async () => {
    const { org } = await setup();
    const results = await Promise.all(Array.from({ length: 5 }, () => codeOf(runDraw(db, org))));
    expect(results.filter((r) => r === "OK")).toHaveLength(1);
    expect(await db.draw.count()).toBe(1);
    expect(await db.drawPair.count()).toBe(4);
  });

  it("concorrência: alguém entrando durante o sorteio não fica meio dentro", async () => {
    const { code, org } = await setup();
    const [drawResult, joinResult] = await Promise.all([
      codeOf(runDraw(db, org)),
      codeOf(joinGroup(db, code, { name: "Atrasado", pin: PIN })),
    ]);
    expect(drawResult).toBe("OK");
    // ou entrou antes (e ficou de fora por não estar confirmado) ou foi barrado
    expect(["OK", "GROUP_LOCKED"]).toContain(joinResult);
    expect(await db.drawPair.count()).toBe(4);
  });

  it("atomicidade: falha no meio da gravação desfaz tudo", async () => {
    const { org } = await setup();
    // gatilho que derruba a inserção do 3º par
    await db.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION test_fail_third_pair() RETURNS trigger AS $$
      BEGIN
        IF (SELECT count(*) FROM "DrawPair" WHERE "drawId" = NEW."drawId") >= 2 THEN
          RAISE EXCEPTION 'falha simulada';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;`);
    await db.$executeRawUnsafe(
      `CREATE TRIGGER test_fail_third_pair BEFORE INSERT ON "DrawPair" FOR EACH ROW EXECUTE FUNCTION test_fail_third_pair();`,
    );
    try {
      await expect(runDraw(db, org)).rejects.toThrow();
      expect(await db.draw.count()).toBe(0);
      expect(await db.drawPair.count()).toBe(0);
      expect((await db.group.findUniqueOrThrow({ where: { id: org.group.id } })).status).toBe("OPEN");
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER test_fail_third_pair ON "DrawPair"; DROP FUNCTION test_fail_third_pair();`);
    }
    // depois de corrigido, sorteia normalmente
    expect((await runDraw(db, org)).size).toBe(4);
  });

  it("depois do sorteio: ninguém entra, confirma ou é removido", async () => {
    const { code, org, people } = await setup(["Maria", "João", "Carlos"], ["Pendente"]);
    await runDraw(db, org);
    expect(await codeOf(joinGroup(db, code, { name: "Novo", pin: PIN }))).toBe("GROUP_LOCKED");
    expect(await codeOf(confirmParticipation(db, people.Pendente!))).toBe("GROUP_LOCKED");
    expect(await codeOf(removeParticipant(db, org, people.Maria!.id))).toBe("GROUP_LOCKED");
  });
});

describe("resultado individual", () => {
  it("cada um vê só o próprio amigo, e o resultado bate com o par gravado", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    const pairs = await allPairs(org.group.id);
    const seen = new Set<string>();
    for (const s of Object.values(people)) {
      expect(await getMyResultState(db, s)).toMatchObject({ state: "READY", viewed: false });
      const friend = await revealMyResult(db, s);
      expect(friend.id).toBe(pairs.get(s.id));
      expect(friend.id).not.toBe(s.id);
      seen.add(friend.id);
      expect(await getMyResultState(db, s)).toMatchObject({ state: "READY", viewed: true });
    }
    expect(seen.size).toBe(4);
  });

  it("antes do sorteio: NOT_DRAWN; sem sessão: não autorizado", async () => {
    const { people } = await setup();
    expect(await getMyResultState(db, people.Maria!)).toEqual({ state: "NOT_DRAWN" });
    expect(await getMyFriend(db, people.Maria!)).toBeNull();
    expect(await codeOf(revealMyResult(db, people.Maria!))).toBe("NOT_FOUND");
    expect(await codeOf(getMyResultState(db, null))).toBe("UNAUTHORIZED");
  });

  it("organizador vê quantos já revelaram, nunca quem tirou quem", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    await revealMyResult(db, people.Maria!);
    await revealMyResult(db, people.Maria!); // revelar de novo não conta 2x
    const r = await getDrawReadiness(db, org);
    expect(r).toMatchObject({ status: "DRAWN", viewedCount: 1, pairCount: 4 });
    expect(JSON.stringify(r)).not.toMatch(/Maria|João|Carlos|giver|receiver/);
  });
});

describe("refazer / reabrir", () => {
  it("refazer invalida o anterior, apaga pares e mensagens antigas e gera novo sorteio", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    const first = await db.draw.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const mariaFriend = (await getMyFriend(db, people.Maria!))!;
    await db.secretMessage.create({ data: { drawId: first.id, recipientId: mariaFriend.id, senderLookup: "0".repeat(64), body: "oi" } });

    await redoDraw(db, org);

    const old = await db.draw.findUniqueOrThrow({ where: { id: first.id } });
    expect(old.status).toBe("INVALIDATED");
    expect(old.invalidatedAt).not.toBeNull();
    expect(await db.drawPair.count({ where: { drawId: first.id } })).toBe(0);
    expect(await db.secretMessage.count()).toBe(0);
    const active = await db.draw.findMany({ where: { status: "ACTIVE" } });
    expect(active).toHaveLength(1);
    expect(active[0]!.id).not.toBe(first.id);
    expectValidDerangement(await allPairs(org.group.id), Object.values(people).map((p) => p.id));
    expect(await getMyResultState(db, people.Maria!)).toMatchObject({ state: "READY", viewed: false });
  });

  it("refazer que falha mantém o sorteio anterior valendo", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    const before = await allPairs(org.group.id);
    // derruba a confirmação de todos direto no banco para o novo sorteio falhar (< 3)
    await db.participant.updateMany({ where: { id: { in: [people.Maria!.id, people.João!.id] } }, data: { status: "INVITED" } });
    expect(await codeOf(redoDraw(db, org))).toBe("VALIDATION");
    expect(await allPairs(org.group.id)).toEqual(before);
    expect((await db.group.findUniqueOrThrow({ where: { id: org.group.id } })).status).toBe("DRAWN");
  });

  it("reabrir cancela o sorteio e libera mudanças", async () => {
    const { org, people } = await setup();
    await runDraw(db, org);
    await reopenGroup(db, org);
    expect(await db.drawPair.count()).toBe(0);
    expect((await db.group.findUniqueOrThrow({ where: { id: org.group.id } })).status).toBe("OPEN");
    expect(await getMyResultState(db, people.Maria!)).toEqual({ state: "NOT_DRAWN" });
    await removeParticipant(db, org, people.Carlos!.id);
    expect((await runDraw(db, org)).size).toBe(3);
  });

  it("só organizador; só quando há sorteio", async () => {
    const { org, people } = await setup();
    expect(await codeOf(redoDraw(db, org))).toBe("CONFLICT");
    expect(await codeOf(reopenGroup(db, org))).toBe("CONFLICT");
    await runDraw(db, org);
    expect(await codeOf(redoDraw(db, people.Maria!))).toBe("FORBIDDEN");
    expect(await codeOf(reopenGroup(db, people.Maria!))).toBe("FORBIDDEN");
  });
});

describe("painel: quem já viu o resultado", () => {
  it("mostra viu/não viu por pessoa, sem expor pares", async () => {
    const { getOrganizerView } = await import("./groups");
    const { org, people } = await setup(["Maria", "João", "Carlos"], ["Pendente"]);
    let view = await getOrganizerView(db, org);
    expect(view.participants.every((p) => p.viewed === null)).toBe(true); // sem sorteio

    await runDraw(db, org);
    await revealMyResult(db, people.Maria!);
    view = await getOrganizerView(db, org);
    const byName = Object.fromEntries(view.participants.map((p) => [p.name, p.viewed]));
    expect(byName).toEqual({ Robert: false, Maria: true, João: false, Carlos: false, Pendente: null });
    // nada sobre quem tirou quem
    expect(JSON.stringify(view)).not.toMatch(/receiver|giver|friend/i);
  });
});
