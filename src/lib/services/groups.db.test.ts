import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import { AppError } from "@/lib/errors";
import { hashToken } from "@/lib/security/tokens";
import type { CreateGroupInput } from "@/lib/validation";
import type { SessionParticipant } from "./common";
import { createGroup, getOrganizerView, getPublicGroupView, removeParticipant, updateGroupDetails, updateTheme } from "./groups";
import { authenticate, confirmParticipation, findByAccessToken, joinGroup } from "./participants";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

const groupInput: CreateGroupInput = {
  name: "Natal da Família",
  organizerName: "Robert",
  eventDate: "2026-12-24",
  eventTime: "20:00",
  location: "Casa da vó",
  giftValue: 10000,
  pin: "482915",
};

const PIN = "730164";

async function expectAppError(p: Promise<unknown>, code: AppError["code"]) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
  return err as AppError;
}

async function setup() {
  const { code, token } = await createGroup(db, groupInput);
  const organizer = (await authenticate(db, code, token))!;
  return { code, token, organizer };
}

async function join(code: string, name: string, extra: object = {}) {
  const r = await joinGroup(db, code, { name, pin: PIN, ...extra });
  return { ...r, session: (await authenticate(db, code, r.token))! };
}

describe("createGroup", () => {
  it("cria grupo com organizador confirmado e guarda só o hash do token", async () => {
    const { code, token } = await createGroup(db, groupInput);
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);

    const group = await db.group.findUniqueOrThrow({ where: { code }, include: { participants: true } });
    expect(group).toMatchObject({ name: "Natal da Família", eventDate: "2026-12-24", giftValueCents: 10000, status: "OPEN" });
    expect(group.participants).toHaveLength(1);
    const org = group.participants[0]!;
    expect(org).toMatchObject({ name: "Robert", role: "ORGANIZER", status: "CONFIRMED" });
    expect(org.confirmedAt).not.toBeNull();
    expect(group.creatorId).toBe(org.id);
    expect(org.tokenHash).toBe(hashToken(token));
    expect(org.tokenHash).not.toContain(token);
  });

  it("cada grupo tem código e token diferentes", async () => {
    const a = await createGroup(db, groupInput);
    const b = await createGroup(db, groupInput);
    expect(a.code).not.toBe(b.code);
    expect(a.token).not.toBe(b.token);
  });
});

describe("authenticate", () => {
  it("resolve o participante e atualiza lastSeenAt", async () => {
    const { code, token, organizer } = await setup();
    expect(organizer).toMatchObject({ name: "Robert", role: "ORGANIZER", group: { code, status: "OPEN" } });
    const row = await db.participant.findUniqueOrThrow({ where: { id: organizer.id } });
    expect(row.lastSeenAt).not.toBeNull();
    expect(await authenticate(db, code.toLowerCase(), token)).not.toBeNull();
  });

  it("recusa token malformado, inexistente ou de outro grupo", async () => {
    const { code, token } = await setup();
    const other = await createGroup(db, groupInput);
    expect(await authenticate(db, code, "curto")).toBeNull();
    expect(await authenticate(db, code, undefined)).toBeNull();
    expect(await authenticate(db, code, "A".repeat(43))).toBeNull();
    expect(await authenticate(db, other.code, token)).toBeNull(); // token válido, grupo errado
    expect(await authenticate(db, "XXXXXX", token)).toBeNull();
    expect(await authenticate(db, "../../x", token)).toBeNull();
  });

  it("findByAccessToken mostra só nome e grupo", async () => {
    const { code, token } = await setup();
    expect(await findByAccessToken(db, token)).toEqual({ name: "Robert", groupCode: code, groupName: "Natal da Família" });
    expect(await findByAccessToken(db, "x")).toBeNull();
  });
});

describe("joinGroup", () => {
  it("entra como convidado e confirma", async () => {
    const { code } = await setup();
    const { session } = await join(code, "Maria", { email: "maria@x.com" });
    expect(session).toMatchObject({ name: "Maria", role: "MEMBER", status: "INVITED" });

    await confirmParticipation(db, session);
    const row = await db.participant.findUniqueOrThrow({ where: { id: session.id } });
    expect(row.status).toBe("CONFIRMED");
    expect(row.confirmedAt).not.toBeNull();
    // idempotente
    await confirmParticipation(db, session);
  });

  it("recusa nome repetido (acento/caixa/espaços) com mensagem amigável", async () => {
    const { code } = await setup();
    await join(code, "José Silva");
    const err = await expectAppError(joinGroup(db, code, { name: "jose  silva", pin: PIN }), "CONFLICT");
    expect(err.fieldErrors?.name).toBeDefined();
    await expectAppError(joinGroup(db, code, { name: "ROBERT", pin: PIN }), "CONFLICT"); // nome do organizador
  });

  it("código inexistente ou inválido", async () => {
    await expectAppError(joinGroup(db, "ZZZZZZ", { name: "Ana", pin: PIN }), "NOT_FOUND");
    await expectAppError(joinGroup(db, "'; DROP TABLE", { name: "Ana", pin: PIN }), "NOT_FOUND");
  });

  it("não entra depois do sorteio", async () => {
    const { code } = await setup();
    await db.group.update({ where: { code }, data: { status: "DRAWN" } });
    await expectAppError(joinGroup(db, code, { name: "Ana", pin: PIN }), "GROUP_LOCKED");
  });

  it("respeita o limite do plano", async () => {
    const { code } = await setup();
    const group = await db.group.findUniqueOrThrow({ where: { code } });
    await db.participant.createMany({
      data: Array.from({ length: 49 }, (_, i) => ({
        groupId: group.id, name: `P${i}`, nameKey: `p${i}`, tokenHash: hashToken(`t${i}`),
      })),
    });
    await expectAppError(joinGroup(db, code, { name: "Excedente", pin: PIN }), "LIMIT_REACHED");
  });

  it("concorrência: nunca passa do limite, mesmo com entradas simultâneas", async () => {
    const { code } = await setup();
    const group = await db.group.findUniqueOrThrow({ where: { code } });
    await db.participant.createMany({
      data: Array.from({ length: 45 }, (_, i) => ({
        groupId: group.id, name: `P${i}`, nameKey: `p${i}`, tokenHash: hashToken(`t${i}`),
      })),
    });
    // 46 ativos; sobram 4 vagas para 20 pedidos simultâneos
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) => joinGroup(db, code, { name: `Novo ${i}`, pin: PIN })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(4);
    for (const r of results) {
      if (r.status === "rejected") expect((r.reason as AppError).code).toBe("LIMIT_REACHED");
    }
    expect(await db.participant.count({ where: { groupId: group.id } })).toBe(50);
  });

  it("concorrência: mesmo nome ao mesmo tempo → só um entra", async () => {
    const { code } = await setup();
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => joinGroup(db, code, { name: "Carla", pin: PIN })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("não confirma depois do sorteio", async () => {
    const { code } = await setup();
    const { session } = await join(code, "Maria");
    await db.group.update({ where: { code }, data: { status: "DRAWN" } });
    await expectAppError(confirmParticipation(db, session), "GROUP_LOCKED");
    await expectAppError(confirmParticipation(db, null), "UNAUTHORIZED");
  });
});

describe("visões", () => {
  it("pública: só nome/apelido/status — sem ids, contatos ou tokens", async () => {
    const { code } = await setup();
    const { session } = await join(code, "Maria", { email: "maria@x.com", phone: "11987654321", nickname: "Mari" });
    await join(code, "João");
    await confirmParticipation(db, session);

    const view = (await getPublicGroupView(db, code))!;
    expect(view.participants).toEqual([
      { name: "Robert", nickname: null, status: "CONFIRMED", isOrganizer: true },
      { name: "Maria", nickname: "Mari", status: "CONFIRMED", isOrganizer: false },
      { name: "João", nickname: null, status: "INVITED", isOrganizer: false },
    ]);
    expect(view.confirmedCount).toBe(2);
    const json = JSON.stringify(view);
    for (const secret of ["maria@x.com", "11987654321", session.id, "tokenHash", "email", "phone", "\"id\""]) {
      expect(json).not.toContain(secret);
    }
  });

  it("pública: grupo inexistente/código inválido → null", async () => {
    expect(await getPublicGroupView(db, "ZZZZZZ")).toBeNull();
    expect(await getPublicGroupView(db, "<script>")).toBeNull();
  });

  it("organizador vê status; membro não acessa o painel", async () => {
    const { code, organizer } = await setup();
    const { session: maria } = await join(code, "Maria");
    const view = await getOrganizerView(db, organizer);
    expect(view.participants.map((p) => [p.name, p.status])).toEqual([["Robert", "CONFIRMED"], ["Maria", "INVITED"]]);
    expect(JSON.stringify(view)).not.toMatch(/email|phone|token/i);
    await expectAppError(getOrganizerView(db, maria), "FORBIDDEN");
    await expectAppError(getOrganizerView(db, null), "UNAUTHORIZED");
  });
});

describe("updateGroupDetails", () => {
  it("só o organizador altera; vale mesmo após o sorteio", async () => {
    const { code, organizer } = await setup();
    const { session: maria } = await join(code, "Maria");
    await expectAppError(updateGroupDetails(db, maria, { name: "Hackeado" }), "FORBIDDEN");

    await db.group.update({ where: { code }, data: { status: "DRAWN" } });
    await updateGroupDetails(db, organizer, { name: "Natal 2026", location: "Sítio", giftValue: 5000 });
    const g = await db.group.findUniqueOrThrow({ where: { code } });
    expect(g).toMatchObject({ name: "Natal 2026", location: "Sítio", giftValueCents: 5000, eventDate: null, status: "DRAWN" });
  });
});

describe("removeParticipant", () => {
  it("remove: invalida token, libera o nome e apaga exclusões", async () => {
    const { code, organizer } = await setup();
    const maria = await join(code, "Maria");
    const joao = await join(code, "João");
    await db.exclusion.create({
      data: { groupId: organizer.group.id, participantId: joao.session.id, excludedParticipantId: maria.session.id },
    });

    await removeParticipant(db, organizer, maria.session.id);

    expect(await authenticate(db, code, maria.token)).toBeNull();
    expect(await db.exclusion.count()).toBe(0);
    const view = (await getPublicGroupView(db, code))!;
    expect(view.participants.map((p) => p.name)).toEqual(["Robert", "João"]);
    // o nome pode ser usado de novo
    const again = await join(code, "Maria");
    expect(again.session.status).toBe("INVITED");
  });

  it("regras de permissão", async () => {
    const { code, organizer } = await setup();
    const maria = await join(code, "Maria");
    const joao = await join(code, "João");
    const other = await setup();

    await expectAppError(removeParticipant(db, maria.session, joao.session.id), "FORBIDDEN"); // membro
    await expectAppError(removeParticipant(db, organizer, organizer.id), "FORBIDDEN"); // a si mesmo
    await expectAppError(removeParticipant(db, other.organizer, maria.session.id), "NOT_FOUND"); // outro grupo
    await expectAppError(removeParticipant(db, organizer, "id-inventado"), "NOT_FOUND");
    await removeParticipant(db, organizer, maria.session.id);
    await expectAppError(removeParticipant(db, organizer, maria.session.id), "NOT_FOUND"); // já removido
  });

  it("não remove depois do sorteio", async () => {
    const { code, organizer } = await setup();
    const maria = await join(code, "Maria");
    await db.group.update({ where: { code }, data: { status: "DRAWN" } });
    await expectAppError(removeParticipant(db, organizer, maria.session.id), "GROUP_LOCKED");
  });

  it("sessão antiga de organizador rebaixado não passa (papel vem do banco a cada request)", async () => {
    const { code, token } = await setup();
    const s = (await authenticate(db, code, token)) as SessionParticipant;
    await db.participant.update({ where: { id: s.id }, data: { role: "MEMBER" } });
    const fresh = await authenticate(db, code, token);
    await expectAppError(getOrganizerView(db, fresh), "FORBIDDEN");
  });
});

describe("updateTheme", () => {
  it("grátis: só o clássico; premium: todos; membro não troca", async () => {
    const { code, token, organizer } = await setup();
    const maria = await join(code, "Maria");
    await expectAppError(updateTheme(db, organizer, "natal"), "FORBIDDEN");
    await expectAppError(updateTheme(db, organizer, "hacker"), "NOT_FOUND");
    await expectAppError(updateTheme(db, maria.session, "classico"), "FORBIDDEN");
    await db.group.update({ where: { code }, data: { plan: "PREMIUM" } });
    // sessão relida do banco já enxerga o plano novo
    const premiumOrg = (await authenticate(db, code, token))!;
    expect(premiumOrg.group.plan).toBe("PREMIUM");
    await updateTheme(db, premiumOrg, "natal");
    expect((await db.group.findUniqueOrThrow({ where: { code } })).theme).toBe("natal");
  });
});
