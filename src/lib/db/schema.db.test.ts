import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { makeGroup, testDb, truncateAll } from "../../../test/db";
import { decryptReceiver, encryptReceiver, receiverLookup } from "@/lib/security/pair-crypto";
import { generateGroupCode, generateToken, hashToken } from "@/lib/security/tokens";
import { nameKey } from "@/lib/text";

/**
 * Testa as garantias do BANCO (não da aplicação): mesmo com um bug nos
 * services, estes estados inválidos precisam ser recusados.
 */
const db = testDb();

beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

/** Erros do Postgres chegam embrulhados pelo Prisma/adapter; checamos a mensagem. */
async function rejects(p: Promise<unknown>, pattern: RegExp) {
  await expect(p).rejects.toThrow(pattern);
}

describe("Participant", () => {
  it("nome é único por grupo (ignorando acento/caixa), mas pode repetir em outro grupo", async () => {
    const { group } = await makeGroup(db, ["José", "Bia", "Caio"]);
    await rejects(
      db.participant.create({
        data: { groupId: group.id, name: "jose", nameKey: nameKey("jose"), tokenHash: hashToken(generateToken()) },
      }),
      /Unique constraint|unique/i,
    );
    const other = await makeGroup(db, ["José", "X", "Y"]);
    expect(other.participants[0]!.nameKey).toBe("jose");
  });

  it("tokenHash é único globalmente", async () => {
    const { group, participants } = await makeGroup(db);
    await rejects(
      db.participant.create({
        data: { groupId: group.id, name: "Duda", nameKey: "duda", tokenHash: participants[0]!.tokenHash },
      }),
      /Unique constraint|unique/i,
    );
  });

  it("nome em branco é recusado", async () => {
    const { group } = await makeGroup(db);
    await rejects(
      db.participant.create({ data: { groupId: group.id, name: "   ", nameKey: "x", tokenHash: hashToken("x") } }),
      /Participant_name_not_blank|check constraint/i,
    );
  });
});

describe("Group", () => {
  it("recusa valor negativo e formatos inválidos de data/hora", async () => {
    const base = { code: generateGroupCode(), name: "G" };
    await rejects(db.group.create({ data: { ...base, giftValueCents: -1 } }), /giftValue_nonneg|check/i);
    await rejects(db.group.create({ data: { ...base, eventDate: "25/12/2026" } }), /eventDate_format|check/i);
    await rejects(db.group.create({ data: { ...base, eventTime: "24:00" } }), /eventTime_format|check/i);
    const ok = await db.group.create({ data: { ...base, eventDate: "2026-12-25", eventTime: "20:30", giftValueCents: 10000 } });
    expect(ok.status).toBe("OPEN");
    expect(ok.plan).toBe("FREE");
  });

  it("código é único", async () => {
    const g = await db.group.create({ data: { code: "ABCDEF", name: "G" } });
    await rejects(db.group.create({ data: { code: g.code, name: "H" } }), /Unique constraint|unique/i);
  });

  it("apagar o grupo apaga tudo em cascata", async () => {
    const { group, participants } = await makeGroup(db);
    const [a, b, c] = participants as [typeof participants[0], typeof participants[0], typeof participants[0]];
    await db.exclusion.create({ data: { groupId: group.id, participantId: a.id, excludedParticipantId: b.id } });
    const draw = await db.draw.create({ data: { groupId: group.id } });
    await db.drawPair.create({
      data: { drawId: draw.id, giverId: a.id, receiverEnc: encryptReceiver({ drawId: draw.id, giverId: a.id }, c.id), receiverLookup: receiverLookup(draw.id, c.id) },
    });
    await db.wishlistItem.create({ data: { participantId: b.id, product: "Livro" } });
    await db.wallPost.create({ data: { groupId: group.id, authorId: a.id, body: "Oi!" } });
    await db.secretMessage.create({ data: { drawId: draw.id, recipientId: c.id, senderLookup: "0".repeat(64), body: "Psiu" } });

    await db.group.delete({ where: { id: group.id } });
    const counts = await Promise.all([
      db.participant.count(), db.exclusion.count(), db.draw.count(), db.drawPair.count(),
      db.wishlistItem.count(), db.wallPost.count(), db.secretMessage.count(),
    ]);
    expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("Exclusion", () => {
  it("recusa excluir a si mesmo e exclusão duplicada", async () => {
    const { group, participants: [a, b] } = await makeGroup(db);
    await rejects(
      db.exclusion.create({ data: { groupId: group.id, participantId: a!.id, excludedParticipantId: a!.id } }),
      /Exclusion_not_self|check/i,
    );
    await db.exclusion.create({ data: { groupId: group.id, participantId: a!.id, excludedParticipantId: b!.id } });
    await rejects(
      db.exclusion.create({ data: { groupId: group.id, participantId: a!.id, excludedParticipantId: b!.id } }),
      /Unique constraint|unique/i,
    );
    // o sentido inverso é outra regra, permitida
    await db.exclusion.create({ data: { groupId: group.id, participantId: b!.id, excludedParticipantId: a!.id } });
  });

  it("recusa participante de outro grupo (FK composta)", async () => {
    const g1 = await makeGroup(db);
    const g2 = await makeGroup(db, ["Dan", "Eva", "Fábio"]);
    await rejects(
      db.exclusion.create({
        data: { groupId: g1.group.id, participantId: g1.participants[0]!.id, excludedParticipantId: g2.participants[0]!.id },
      }),
      /Foreign key|foreign key/i,
    );
    await rejects(
      db.exclusion.create({
        data: { groupId: g1.group.id, participantId: g2.participants[0]!.id, excludedParticipantId: g2.participants[1]!.id },
      }),
      /Foreign key|foreign key/i,
    );
  });
});

describe("Draw / DrawPair", () => {
  it("permite no máximo um sorteio ativo por grupo", async () => {
    const { group } = await makeGroup(db);
    const first = await db.draw.create({ data: { groupId: group.id } });
    await rejects(db.draw.create({ data: { groupId: group.id } }), /Draw_one_active_per_group|Unique constraint|unique/i);

    await db.draw.update({ where: { id: first.id }, data: { status: "INVALIDATED", invalidatedAt: new Date() } });
    const second = await db.draw.create({ data: { groupId: group.id } });
    expect(second.status).toBe("ACTIVE");

    // outro grupo não é afetado
    const other = await makeGroup(db, ["Dan", "Eva", "Fábio"]);
    await db.draw.create({ data: { groupId: other.group.id } });
  });

  it("sorteio invalidado exige data de invalidação", async () => {
    const { group } = await makeGroup(db);
    await rejects(db.draw.create({ data: { groupId: group.id, status: "INVALIDATED" } }), /Draw_invalidated_has_date|check/i);
  });

  it("cada pessoa tira no máximo uma vez e é tirada no máximo uma vez por sorteio", async () => {
    const { group, participants: [a, b, c] } = await makeGroup(db);
    const draw = await db.draw.create({ data: { groupId: group.id } });
    const pair = (giver: string, receiver: string) => ({
      drawId: draw.id,
      giverId: giver,
      receiverEnc: encryptReceiver({ drawId: draw.id, giverId: giver }, receiver),
      receiverLookup: receiverLookup(draw.id, receiver),
    });
    await db.drawPair.create({ data: pair(a!.id, b!.id) });
    await rejects(db.drawPair.create({ data: pair(a!.id, c!.id) }), /Unique constraint|unique/i); // A tira 2x
    await rejects(db.drawPair.create({ data: pair(c!.id, b!.id) }), /Unique constraint|unique/i); // B tirado 2x
  });

  it("o banco não guarda o sorteado em claro, mas o servidor consegue ler", async () => {
    const { group, participants: [a, b] } = await makeGroup(db);
    const draw = await db.draw.create({ data: { groupId: group.id } });
    await db.drawPair.create({
      data: {
        drawId: draw.id, giverId: a!.id,
        receiverEnc: encryptReceiver({ drawId: draw.id, giverId: a!.id }, b!.id),
        receiverLookup: receiverLookup(draw.id, b!.id),
      },
    });
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM "DrawPair"`);
    expect(JSON.stringify(rows)).not.toContain(b!.id);

    const stored = await db.drawPair.findUniqueOrThrow({ where: { drawId_giverId: { drawId: draw.id, giverId: a!.id } } });
    expect(decryptReceiver({ drawId: draw.id, giverId: a!.id }, stored.receiverEnc)).toBe(b!.id);
    // "quem me tirou?" sem decifrar nada
    const whoGotB = await db.drawPair.findUnique({
      where: { drawId_receiverLookup: { drawId: draw.id, receiverLookup: receiverLookup(draw.id, b!.id) } },
    });
    expect(whoGotB?.giverId).toBe(a!.id);
  });
});

describe("WallPost / Wishlist / SecretMessage", () => {
  it("autor do mural precisa ser do mesmo grupo", async () => {
    const g1 = await makeGroup(db);
    const g2 = await makeGroup(db, ["Dan", "Eva", "Fábio"]);
    await rejects(
      db.wallPost.create({ data: { groupId: g1.group.id, authorId: g2.participants[0]!.id, body: "invasão" } }),
      /Foreign key|foreign key/i,
    );
  });

  it("recusa textos em branco e preço negativo", async () => {
    const { group, participants: [a] } = await makeGroup(db);
    await rejects(db.wallPost.create({ data: { groupId: group.id, authorId: a!.id, body: "  " } }), /not_blank|check/i);
    await rejects(db.wishlistItem.create({ data: { participantId: a!.id, product: " " } }), /not_blank|check/i);
    await rejects(db.wishlistItem.create({ data: { participantId: a!.id, product: "X", approxPriceCents: -5 } }), /price_nonneg|check/i);
    const draw = await db.draw.create({ data: { groupId: group.id } });
    await rejects(
      db.secretMessage.create({ data: { drawId: draw.id, recipientId: a!.id, senderLookup: "0".repeat(64), body: "\n" } }),
      /not_blank|check/i,
    );
  });

  it("mensagem secreta não tem coluna de remetente em claro", async () => {
    const cols = await db.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'SecretMessage'`,
    );
    const names = cols.map((c) => c.column_name);
    expect(names).toContain("senderLookup");
    expect(names.some((n) => /^sender(Id)?$/i.test(n))).toBe(false);
  });

  it("invalidar/apagar pares de um sorteio apaga as mensagens dele", async () => {
    const { group, participants: [a] } = await makeGroup(db);
    const draw = await db.draw.create({ data: { groupId: group.id } });
    await db.secretMessage.create({ data: { drawId: draw.id, recipientId: a!.id, senderLookup: "0".repeat(64), body: "Oi" } });
    await db.draw.delete({ where: { id: draw.id } });
    expect(await db.secretMessage.count()).toBe(0);
  });
});
