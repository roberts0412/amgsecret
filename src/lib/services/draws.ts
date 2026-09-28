import "server-only";
import { draw, DrawError, isDrawPossible, MIN_PARTICIPANTS, validateAssignment, type Exclusion } from "@/lib/draw/draw";
import { AppError } from "@/lib/errors";
import { decryptReceiver, encryptReceiver, receiverLookup } from "@/lib/security/pair-crypto";
import { type Db, isUniqueViolation, lockGroup, requireOrganizer, requireParticipant, type SessionParticipant, type Tx } from "./common";

/*
 * Sorteio, exclusões e resultado.
 *
 * Regra de ouro: NENHUMA função daqui devolve a lista de pares. O único
 * resultado exposto é o do próprio participante (getMyResult/revealMyResult),
 * derivado da sessão dele.
 */

const LOCKED_AFTER_DRAW = "O sorteio já foi feito. Para mudar exclusões, reabra o grupo (o sorteio atual será cancelado).";

// ---------------------------------------------------------------------------
// Exclusões (somente organizador, somente antes do sorteio)
// ---------------------------------------------------------------------------

export interface ExclusionView {
  id: string;
  participantName: string;
  excludedName: string;
}

export async function listExclusions(db: Db, session: SessionParticipant | null): Promise<ExclusionView[]> {
  const org = requireOrganizer(session);
  const rows = await db.exclusion.findMany({
    where: { groupId: org.group.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, participant: { select: { name: true } }, excludedParticipant: { select: { name: true } } },
  });
  return rows.map((r) => ({ id: r.id, participantName: r.participant.name, excludedName: r.excludedParticipant.name }));
}

async function requireOpenGroup(tx: Tx, groupId: string) {
  await lockGroup(tx, groupId);
  const g = await tx.group.findUniqueOrThrow({ where: { id: groupId }, select: { status: true } });
  if (g.status !== "OPEN") throw new AppError("GROUP_LOCKED", LOCKED_AFTER_DRAW);
}

/**
 * "A não pode tirar B" (e, se `mutual`, "B não pode tirar A").
 * Retorna se o sorteio ainda é possível com os confirmados atuais — para
 * avisar cedo, sem bloquear (confirmações ainda podem mudar).
 */
export async function addExclusion(
  db: Db,
  session: SessionParticipant | null,
  input: { participantId: string; excludedParticipantId: string; mutual: boolean },
): Promise<{ stillPossible: boolean }> {
  const org = requireOrganizer(session);
  if (input.participantId === input.excludedParticipantId) {
    throw new AppError("VALIDATION", "Escolha duas pessoas diferentes.");
  }
  await db.$transaction(async (tx) => {
    await requireOpenGroup(tx, org.group.id);
    const found = await tx.participant.count({
      where: { id: { in: [input.participantId, input.excludedParticipantId] }, groupId: org.group.id, status: { not: "REMOVED" } },
    });
    if (found !== 2) throw new AppError("NOT_FOUND", "Participante não encontrado.");

    const pairs = [[input.participantId, input.excludedParticipantId]];
    if (input.mutual) pairs.push([input.excludedParticipantId, input.participantId]);
    // skipDuplicates: repetir uma regra já existente não é erro
    await tx.exclusion.createMany({
      data: pairs.map(([a, b]) => ({ groupId: org.group.id, participantId: a!, excludedParticipantId: b! })),
      skipDuplicates: true,
    });
  });
  const readiness = await getDrawReadiness(db, org);
  return { stillPossible: readiness.confirmed < MIN_PARTICIPANTS || readiness.possible };
}

export async function removeExclusion(db: Db, session: SessionParticipant | null, exclusionId: string): Promise<void> {
  const org = requireOrganizer(session);
  await db.$transaction(async (tx) => {
    await requireOpenGroup(tx, org.group.id);
    const r = await tx.exclusion.deleteMany({ where: { id: exclusionId, groupId: org.group.id } });
    if (r.count === 0) throw new AppError("NOT_FOUND", "Exclusão não encontrada.");
  });
}

// ---------------------------------------------------------------------------
// Situação do sorteio
// ---------------------------------------------------------------------------

async function loadDrawInput(tx: Tx | Db, groupId: string) {
  const confirmed = await tx.participant.findMany({
    where: { groupId, status: "CONFIRMED" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const ids = confirmed.map((p) => p.id);
  const idSet = new Set(ids);
  // só valem exclusões entre pessoas que estão no sorteio
  const exclusions: Exclusion[] = (
    await tx.exclusion.findMany({ where: { groupId }, select: { participantId: true, excludedParticipantId: true } })
  ).filter((e) => idSet.has(e.participantId) && idSet.has(e.excludedParticipantId));
  return { ids, exclusions };
}

export interface DrawReadiness {
  confirmed: number;
  invited: number;
  possible: boolean;
  status: "OPEN" | "DRAWN" | "ARCHIVED";
  drawnAt: Date | null;
  /** Quantos já revelaram o resultado (sem dizer quem tirou quem). */
  viewedCount: number;
  pairCount: number;
}

export async function getDrawReadiness(db: Db, session: SessionParticipant | null): Promise<DrawReadiness> {
  const org = requireOrganizer(session);
  const [group, invited, input, active] = await Promise.all([
    db.group.findUniqueOrThrow({ where: { id: org.group.id }, select: { status: true } }),
    db.participant.count({ where: { groupId: org.group.id, status: "INVITED" } }),
    loadDrawInput(db, org.group.id),
    db.draw.findFirst({
      where: { groupId: org.group.id, status: "ACTIVE" },
      select: { createdAt: true, _count: { select: { pairs: true } } },
    }),
  ]);
  const viewedCount = active
    ? await db.drawPair.count({ where: { draw: { groupId: org.group.id, status: "ACTIVE" }, viewedAt: { not: null } } })
    : 0;
  return {
    confirmed: input.ids.length,
    invited,
    possible: isDrawPossible(input.ids, input.exclusions),
    status: group.status,
    drawnAt: active?.createdAt ?? null,
    viewedCount,
    pairCount: active?._count.pairs ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Sortear / refazer / reabrir
// ---------------------------------------------------------------------------

function toAppError(e: unknown): never {
  if (e instanceof DrawError) {
    throw new AppError(e.code === "NO_VALID_COMBINATION" ? "CONFLICT" : "VALIDATION", e.message);
  }
  throw e;
}

/**
 * Executa o sorteio DENTRO da transação `tx` (que já deve ter travado o grupo):
 * 1. confirmados; 2. mínimo; 3. exclusões; 4. gera combinação; 5-7. valida
 * pares (ninguém tira a si mesmo, ninguém é tirado 2x, exclusões); 8. salva.
 * Qualquer erro desfaz a transação inteira — nunca há sorteio parcial.
 */
async function drawInsideTx(tx: Tx, groupId: string): Promise<{ drawId: string; size: number }> {
  const { ids, exclusions } = await loadDrawInput(tx, groupId);
  if (ids.length < MIN_PARTICIPANTS) {
    throw new AppError("VALIDATION", `O sorteio precisa de pelo menos ${MIN_PARTICIPANTS} participantes confirmados.`);
  }
  let assignment;
  try {
    assignment = draw(ids, exclusions);
  } catch (e) {
    toAppError(e);
  }
  // revalidação independente, imediatamente antes de gravar
  const check = validateAssignment(ids, exclusions, assignment);
  if (!check.ok) throw new Error(`Sorteio inválido: ${check.reason}`);

  let created;
  try {
    created = await tx.draw.create({ data: { groupId }, select: { id: true } });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("CONFLICT", "Já existe um sorteio ativo neste grupo.");
    throw e;
  }
  await tx.drawPair.createMany({
    data: [...assignment].map(([giverId, receiverId]) => ({
      drawId: created.id,
      giverId,
      receiverEnc: encryptReceiver({ drawId: created.id, giverId }, receiverId),
      receiverLookup: receiverLookup(created.id, receiverId),
    })),
  });
  // conferência final no banco: um par por participante
  const saved = await tx.drawPair.count({ where: { drawId: created.id } });
  if (saved !== ids.length) throw new Error("Quantidade de pares gravados não confere.");

  await tx.group.update({ where: { id: groupId }, data: { status: "DRAWN" } });
  return { drawId: created.id, size: ids.length };
}

export async function runDraw(db: Db, session: SessionParticipant | null): Promise<{ size: number }> {
  const org = requireOrganizer(session);
  return db.$transaction(
    async (tx) => {
      await lockGroup(tx, org.group.id);
      const g = await tx.group.findUniqueOrThrow({ where: { id: org.group.id }, select: { status: true } });
      if (g.status === "DRAWN") throw new AppError("CONFLICT", "O sorteio já foi realizado.");
      if (g.status !== "OPEN") throw new AppError("GROUP_LOCKED", "Este grupo foi arquivado.");
      const { size } = await drawInsideTx(tx, org.group.id);
      return { size };
    },
    { timeout: 30_000 },
  );
}

/** Invalida o sorteio ativo: marca INVALIDATED e apaga pares e mensagens dele. */
async function invalidateActiveDraw(tx: Tx, groupId: string): Promise<void> {
  const active = await tx.draw.findFirst({ where: { groupId, status: "ACTIVE" }, select: { id: true } });
  if (!active) return;
  await tx.secretMessage.deleteMany({ where: { drawId: active.id } });
  await tx.drawPair.deleteMany({ where: { drawId: active.id } });
  await tx.draw.update({ where: { id: active.id }, data: { status: "INVALIDATED", invalidatedAt: new Date() } });
}

async function requireDrawn(tx: Tx, groupId: string) {
  await lockGroup(tx, groupId);
  const g = await tx.group.findUniqueOrThrow({ where: { id: groupId }, select: { status: true } });
  if (g.status !== "DRAWN") throw new AppError("CONFLICT", "Ainda não há sorteio para refazer.");
}

/**
 * Refaz o sorteio: invalida o anterior (resultados e mensagens antigos deixam
 * de existir) e sorteia de novo com os confirmados atuais. Atômico: se o novo
 * sorteio falhar, o anterior continua valendo.
 */
export async function redoDraw(db: Db, session: SessionParticipant | null): Promise<{ size: number }> {
  const org = requireOrganizer(session);
  return db.$transaction(
    async (tx) => {
      await requireDrawn(tx, org.group.id);
      await invalidateActiveDraw(tx, org.group.id);
      await tx.group.update({ where: { id: org.group.id }, data: { status: "OPEN" } });
      const { size } = await drawInsideTx(tx, org.group.id);
      return { size };
    },
    { timeout: 30_000 },
  );
}

/** Cancela o sorteio e reabre o grupo para mudanças (participantes/exclusões). */
export async function reopenGroup(db: Db, session: SessionParticipant | null): Promise<void> {
  const org = requireOrganizer(session);
  await db.$transaction(async (tx) => {
    await requireDrawn(tx, org.group.id);
    await invalidateActiveDraw(tx, org.group.id);
    await tx.group.update({ where: { id: org.group.id }, data: { status: "OPEN" } });
  });
}

// ---------------------------------------------------------------------------
// Resultado do próprio participante
// ---------------------------------------------------------------------------

export type MyResult =
  | { state: "NOT_DRAWN" }
  | { state: "NOT_IN_DRAW" }
  | { state: "READY"; drawnAt: Date; viewed: boolean };

/** Situação do MEU resultado, sem revelar o nome (a página não carrega o segredo). */
export async function getMyResultState(db: Db, session: SessionParticipant | null): Promise<MyResult> {
  const me = requireParticipant(session);
  const active = await db.draw.findFirst({
    where: { groupId: me.group.id, status: "ACTIVE" },
    select: { id: true, createdAt: true },
  });
  if (!active) return { state: "NOT_DRAWN" };
  const pair = await db.drawPair.findUnique({
    where: { drawId_giverId: { drawId: active.id, giverId: me.id } },
    select: { viewedAt: true },
  });
  if (!pair) return { state: "NOT_IN_DRAW" };
  return { state: "READY", drawnAt: active.createdAt, viewed: pair.viewedAt !== null };
}

export interface RevealedFriend {
  /** ID do amigo — usado só no servidor (lista de desejos, mensagens). */
  id: string;
  name: string;
  nickname: string | null;
}

/**
 * Decifra e devolve QUEM EU TIREI. A identidade vem só da sessão; não existe
 * parâmetro de "de quem" — é impossível pedir o resultado de outra pessoa.
 */
export async function getMyFriend(db: Db, session: SessionParticipant | null): Promise<RevealedFriend | null> {
  const me = requireParticipant(session);
  const pair = await db.drawPair.findFirst({
    where: { giverId: me.id, draw: { groupId: me.group.id, status: "ACTIVE" } },
    select: { id: true, drawId: true, receiverEnc: true },
  });
  if (!pair) return null;
  const receiverId = decryptReceiver({ drawId: pair.drawId, giverId: me.id }, pair.receiverEnc);
  const friend = await db.participant.findFirst({
    where: { id: receiverId, groupId: me.group.id },
    select: { id: true, name: true, nickname: true },
  });
  if (!friend) throw new Error("Participante sorteado não encontrado.");
  return friend;
}

/** Revela o resultado ao próprio participante e registra que ele viu. */
export async function revealMyResult(db: Db, session: SessionParticipant | null): Promise<RevealedFriend> {
  const me = requireParticipant(session);
  const friend = await getMyFriend(db, me);
  if (!friend) throw new AppError("NOT_FOUND", "Você não participa do sorteio atual.");
  await db.drawPair.updateMany({
    where: { giverId: me.id, viewedAt: null, draw: { groupId: me.group.id, status: "ACTIVE" } },
    data: { viewedAt: new Date() },
  });
  return friend;
}
