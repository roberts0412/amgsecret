import "server-only";
import { AppError } from "@/lib/errors";
import { receiverLookup, senderLookup } from "@/lib/security/pair-crypto";
import type { WishInput } from "@/lib/validation";
import { type Db, requireParticipant, type SessionParticipant } from "./common";
import { getMyFriend } from "./draws";

/*
 * Lista de desejos, mensagens secretas e mural.
 *
 * Visibilidade (sempre derivada da sessão, nunca de um id vindo do cliente):
 * - minha lista: só eu;
 * - lista de outra pessoa: só quem a tirou no sorteio ATIVO;
 * - mensagens: só o destinatário (e o remetente vê as que enviou);
 * - mural: participantes do grupo.
 */

export const MAX_WISHES = 20;
export const MAX_MESSAGES_PER_DRAW = 50;
const WALL_PAGE = 50;

// ---------------------------------------------------------------------------
// Lista de desejos (opcional)
// ---------------------------------------------------------------------------

export interface WishView {
  id: string;
  product: string;
  description: string | null;
  approxPriceCents: number | null;
  url: string | null;
  note: string | null;
}

const wishSelect = { id: true, product: true, description: true, approxPriceCents: true, url: true, note: true } as const;

export async function listMyWishes(db: Db, session: SessionParticipant | null): Promise<WishView[]> {
  const me = requireParticipant(session);
  return db.wishlistItem.findMany({ where: { participantId: me.id }, orderBy: { createdAt: "asc" }, select: wishSelect });
}

export async function addWish(db: Db, session: SessionParticipant | null, input: WishInput): Promise<void> {
  const me = requireParticipant(session);
  const count = await db.wishlistItem.count({ where: { participantId: me.id } });
  if (count >= MAX_WISHES) throw new AppError("LIMIT_REACHED", `Você pode ter até ${MAX_WISHES} desejos na lista.`);
  await db.wishlistItem.create({
    data: {
      participantId: me.id,
      product: input.product,
      description: input.description ?? null,
      approxPriceCents: input.approxPrice ?? null,
      url: input.url ?? null,
      note: input.note ?? null,
    },
  });
}

export async function deleteWish(db: Db, session: SessionParticipant | null, wishId: string): Promise<void> {
  const me = requireParticipant(session);
  // participantId no WHERE: só apaga o que é MEU
  const r = await db.wishlistItem.deleteMany({ where: { id: wishId, participantId: me.id } });
  if (r.count === 0) throw new AppError("NOT_FOUND", "Desejo não encontrado.");
}

/** Lista de quem EU tirei. Não existe versão "de um participante qualquer". */
export async function getFriendWishes(db: Db, session: SessionParticipant | null): Promise<WishView[] | null> {
  const friend = await getMyFriend(db, session);
  if (!friend) return null;
  return db.wishlistItem.findMany({ where: { participantId: friend.id }, orderBy: { createdAt: "asc" }, select: wishSelect });
}

// ---------------------------------------------------------------------------
// Mensagens secretas
// ---------------------------------------------------------------------------

export interface MessageView {
  /** Enviada por mim? (para alinhar à direita na conversa) */
  mine: boolean;
  body: string;
  /** Só o DIA — horário exato poderia ajudar a descobrir o remetente. */
  day: string;
}

function dayOf(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

async function activeDrawId(db: Db, groupId: string): Promise<string | null> {
  const d = await db.draw.findFirst({ where: { groupId, status: "ACTIVE" }, select: { id: true } });
  return d?.id ?? null;
}

async function enforceMessageLimit(db: Db, drawId: string, mySenderLookup: string) {
  const sent = await db.secretMessage.count({ where: { drawId, senderLookup: mySenderLookup } });
  if (sent >= MAX_MESSAGES_PER_DRAW) {
    throw new AppError("LIMIT_REACHED", `Limite de ${MAX_MESSAGES_PER_DRAW} mensagens por sorteio atingido.`);
  }
}

/** Eu -> quem eu tirei (chega anônima). */
export async function sendToFriend(db: Db, session: SessionParticipant | null, body: string): Promise<void> {
  const me = requireParticipant(session);
  const drawId = await activeDrawId(db, me.group.id);
  const friend = drawId ? await getMyFriend(db, me) : null;
  if (!drawId || !friend) throw new AppError("NOT_FOUND", "Você não participa do sorteio atual.");
  const mine = senderLookup(drawId, me.id);
  await enforceMessageLimit(db, drawId, mine);
  await db.secretMessage.create({
    data: { drawId, recipientId: friend.id, senderLookup: mine, direction: "FROM_SANTA", body },
  });
}

/** Eu -> quem me tirou (resposta; eu não sei quem é, o servidor sabe). */
export async function replyToSanta(db: Db, session: SessionParticipant | null, body: string): Promise<void> {
  const me = requireParticipant(session);
  const drawId = await activeDrawId(db, me.group.id);
  if (!drawId) throw new AppError("NOT_FOUND", "Ainda não há sorteio.");
  const pair = await db.drawPair.findUnique({
    where: { drawId_receiverLookup: { drawId, receiverLookup: receiverLookup(drawId, me.id) } },
    select: { giverId: true },
  });
  if (!pair) throw new AppError("NOT_FOUND", "Você não participa do sorteio atual.");
  const mine = senderLookup(drawId, me.id);
  await enforceMessageLimit(db, drawId, mine);
  await db.secretMessage.create({
    data: { drawId, recipientId: pair.giverId, senderLookup: mine, direction: "FROM_FRIEND", body },
  });
}

/** Conversa com quem EU tirei: o que eu mandei + as respostas dele(a). */
export async function conversationWithFriend(db: Db, session: SessionParticipant | null): Promise<MessageView[]> {
  const me = requireParticipant(session);
  const drawId = await activeDrawId(db, me.group.id);
  const friend = drawId ? await getMyFriend(db, me) : null;
  if (!drawId || !friend) return [];
  const mine = senderLookup(drawId, me.id);
  const rows = await db.secretMessage.findMany({
    where: {
      drawId,
      OR: [
        { direction: "FROM_SANTA", recipientId: friend.id, senderLookup: mine },
        { direction: "FROM_FRIEND", recipientId: me.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { body: true, createdAt: true, direction: true },
  });
  return rows.map((r) => ({ mine: r.direction === "FROM_SANTA", body: r.body, day: dayOf(r.createdAt) }));
}

/** Conversa com quem ME tirou (anônimo): o que ele(a) mandou + minhas respostas. */
export async function conversationWithSanta(db: Db, session: SessionParticipant | null): Promise<MessageView[]> {
  const me = requireParticipant(session);
  const drawId = await activeDrawId(db, me.group.id);
  if (!drawId) return [];
  const mine = senderLookup(drawId, me.id);
  const rows = await db.secretMessage.findMany({
    where: {
      drawId,
      OR: [
        { direction: "FROM_SANTA", recipientId: me.id },
        { direction: "FROM_FRIEND", senderLookup: mine },
      ],
    },
    orderBy: { createdAt: "asc" },
    // senderLookup NÃO é selecionado: o destinatário nunca recebe nada do remetente
    select: { body: true, createdAt: true, direction: true },
  });
  return rows.map((r) => ({ mine: r.direction === "FROM_FRIEND", body: r.body, day: dayOf(r.createdAt) }));
}

// ---------------------------------------------------------------------------
// Mural (público no grupo, NÃO anônimo)
// ---------------------------------------------------------------------------

export interface WallPostView {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  canDelete: boolean;
}

export async function listWall(db: Db, session: SessionParticipant | null): Promise<WallPostView[]> {
  const me = requireParticipant(session);
  const rows = await db.wallPost.findMany({
    where: { groupId: me.group.id, hiddenAt: null },
    orderBy: { createdAt: "desc" },
    take: WALL_PAGE,
    select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.author.name,
    body: r.body,
    createdAt: r.createdAt,
    canDelete: r.authorId === me.id || me.role === "ORGANIZER",
  }));
}

export async function postToWall(db: Db, session: SessionParticipant | null, body: string): Promise<void> {
  const me = requireParticipant(session);
  await db.wallPost.create({ data: { groupId: me.group.id, authorId: me.id, body } });
}

/** O autor apaga o próprio post; o organizador pode ocultar qualquer um. */
export async function deleteWallPost(db: Db, session: SessionParticipant | null, postId: string): Promise<void> {
  const me = requireParticipant(session);
  const r = await db.wallPost.updateMany({
    where: {
      id: postId,
      groupId: me.group.id,
      hiddenAt: null,
      ...(me.role === "ORGANIZER" ? {} : { authorId: me.id }),
    },
    data: { hiddenAt: new Date() },
  });
  if (r.count === 0) throw new AppError("NOT_FOUND", "Mensagem não encontrada.");
}
