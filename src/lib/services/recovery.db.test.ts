import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import { createPrismaClient } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { createGroup, removeParticipant } from "./groups";
import { authenticate, hasPin, joinGroup, recoverAccess, setPin } from "./participants";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

const PIN = "730164";
const WRONG = "482915";
const MIN = 60_000;

async function codeOf(p: Promise<unknown>): Promise<AppError["code"] | "OK"> {
  try {
    await p;
    return "OK";
  } catch (e) {
    if (e instanceof AppError) return e.code;
    throw e;
  }
}

async function setup() {
  const org = await createGroup(db, { name: "Natal", organizerName: "Robert", pin: "905527" });
  const maria = await joinGroup(db, org.code, { name: "Maria Souza", pin: PIN });
  return { code: org.code, org, maria };
}

describe("recoverAccess", () => {
  it("nome + PIN certos: gera token novo e o link antigo para de funcionar", async () => {
    const { code, maria } = await setup();
    const r = await recoverAccess(db, code, { name: "  maria SOUZA ", pin: PIN });
    expect(r.code).toBe(code);
    expect(r.token).not.toBe(maria.token);
    expect(await authenticate(db, code, maria.token)).toBeNull(); // celular perdido perde o acesso
    expect((await authenticate(db, code, r.token))?.name).toBe("Maria Souza");
  });

  it("funciona também depois do sorteio", async () => {
    const { code } = await setup();
    await db.group.update({ where: { code }, data: { status: "DRAWN" } });
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: PIN }))).toBe("OK");
  });

  it("mesma mensagem para PIN errado, nome inexistente, removido e outro grupo", async () => {
    const { code, org, maria } = await setup();
    const other = await createGroup(db, { name: "Outro", organizerName: "Zé", pin: "905527" });
    const messages = new Set<string>();
    const attempt = async (c: string, name: string, pin: string) => {
      try {
        await recoverAccess(db, c, { name, pin });
      } catch (e) {
        expect((e as AppError).code).toBe("UNAUTHORIZED");
        messages.add((e as AppError).message);
      }
    };
    await attempt(code, "Maria Souza", WRONG);
    await attempt(code, "Fulano", PIN);
    await attempt(other.code, "Maria Souza", PIN); // nome existe, mas em outro grupo
    const orgSession = await authenticate(db, code, org.token);
    const mariaSession = await authenticate(db, code, maria.token);
    await removeParticipant(db, orgSession, mariaSession!.id);
    await attempt(code, "Maria Souza", PIN); // removida
    expect([...messages]).toEqual(["Nome ou PIN incorretos."]);
  });

  it("bloqueia na 5ª tentativa errada, mesmo que depois acerte; libera após o prazo", async () => {
    const { code } = await setup();
    const t0 = new Date("2026-10-01T12:00:00Z");
    for (let i = 1; i <= 4; i++) expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: WRONG }, t0))).toBe("UNAUTHORIZED");
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: WRONG }, t0))).toBe("RATE_LIMITED");
    // bloqueado: nem o PIN certo entra (senão o bloqueio não protege nada)
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: PIN }, new Date(t0.getTime() + 14 * MIN)))).toBe("RATE_LIMITED");
    // passou o prazo de 15 min
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: PIN }, new Date(t0.getTime() + 16 * MIN)))).toBe("OK");
    const row = await db.participant.findFirstOrThrow({ where: { name: "Maria Souza" } });
    expect(row.pinFailedAttempts).toBe(0);
    expect(row.pinLockedUntil).toBeNull();
  });

  it("bloqueio progressivo: 2ª rodada de erros bloqueia por 30 min", async () => {
    const { code } = await setup();
    let t = new Date("2026-10-01T12:00:00Z").getTime();
    const wrong = () => codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: WRONG }, new Date(t)));
    for (let i = 0; i < 5; i++) await wrong();
    t += 16 * MIN;
    for (let i = 0; i < 4; i++) expect(await wrong()).toBe("UNAUTHORIZED");
    expect(await wrong()).toBe("RATE_LIMITED");
    const row = await db.participant.findFirstOrThrow({ where: { name: "Maria Souza" } });
    expect(row.pinFailedAttempts).toBe(10);
    expect(row.pinLockedUntil!.getTime()).toBe(t + 30 * MIN);
  });

  it("acertar na 5ª tentativa entra normalmente", async () => {
    const { code } = await setup();
    for (let i = 0; i < 4; i++) await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: WRONG }));
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: PIN }))).toBe("OK");
  });

  it("ataque em paralelo: no máximo 5 palpites são conferidos", async () => {
    const { code } = await setup();
    const results = await Promise.all(
      Array.from({ length: 30 }, () => codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: WRONG }))),
    );
    // 4 "incorreto" + 1 que bloqueou; todo o resto barrado antes de conferir o PIN
    expect(results.filter((r) => r === "UNAUTHORIZED")).toHaveLength(4);
    expect(results.filter((r) => r === "RATE_LIMITED")).toHaveLength(26);
    const row = await db.participant.findFirstOrThrow({ where: { name: "Maria Souza" } });
    expect(row.pinFailedAttempts).toBe(5);
  });

  it("horário do bloqueio correto mesmo com o banco em outro fuso", async () => {
    const url = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL!);
    url.searchParams.set("options", "-c TimeZone=America/Sao_Paulo");
    const brDb = createPrismaClient(url.toString());
    try {
      const [tzRow] = await brDb.$queryRaw<{ tz: string }[]>`SELECT current_setting('TimeZone') AS tz`;
      const tz = tzRow?.tz;
      expect(tz).toBe("America/Sao_Paulo");
      const { code } = await setup();
      const t0 = new Date("2026-10-01T12:00:00Z");
      for (let i = 0; i < 5; i++) await codeOf(recoverAccess(brDb, code, { name: "Maria Souza", pin: WRONG }, t0));
      const row = await brDb.participant.findFirstOrThrow({ where: { name: "Maria Souza" } });
      expect(row.pinLockedUntil!.toISOString()).toBe("2026-10-01T12:15:00.000Z");
      // e continua bloqueado 14 min depois, liberado 16 min depois
      expect(await codeOf(recoverAccess(brDb, code, { name: "Maria Souza", pin: PIN }, new Date(t0.getTime() + 14 * MIN)))).toBe("RATE_LIMITED");
      expect(await codeOf(recoverAccess(brDb, code, { name: "Maria Souza", pin: PIN }, new Date(t0.getTime() + 16 * MIN)))).toBe("OK");
    } finally {
      await brDb.$disconnect();
    }
  });
});

describe("setPin / hasPin", () => {
  it("logado pode trocar o PIN; o antigo deixa de valer", async () => {
    const { code, maria } = await setup();
    const s = await authenticate(db, code, maria.token);
    expect(await hasPin(db, s)).toBe(true);
    await setPin(db, s, "250813");
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: PIN }))).toBe("UNAUTHORIZED");
    expect(await codeOf(recoverAccess(db, code, { name: "Maria Souza", pin: "250813" }))).toBe("OK");
  });

  it("sem sessão não troca", async () => {
    expect(await codeOf(setPin(db, null, "250813"))).toBe("UNAUTHORIZED");
    expect(await hasPin(db, null)).toBe(false);
  });

  it("o PIN não fica legível no banco", async () => {
    await setup();
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM "Participant"`);
    expect(JSON.stringify(rows)).not.toContain(PIN);
  });
});
