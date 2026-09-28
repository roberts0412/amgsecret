import "server-only";
import { AppError } from "@/lib/errors";
import { planFeatures } from "@/lib/plans";
import { hashPin, lockDurationMs, PIN_MAX_ATTEMPTS, verifyPin } from "@/lib/security/pin";
import { generateToken, hashToken, isWellFormedToken, normalizeGroupCode } from "@/lib/security/tokens";
import { nameKey } from "@/lib/text";
import type { JoinGroupInput } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";
import { type Db, isUniqueViolation, lockGroup, requireParticipant, type SessionParticipant } from "./common";

/** Atualiza lastSeenAt no máximo a cada 5 min (evita 1 escrita por página). */
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export interface JoinResult {
  code: string;
  token: string;
}

/** Entrar no grupo pelo link público. Cria o participante como INVITED. */
export async function joinGroup(db: Db, rawCode: string, input: JoinGroupInput): Promise<JoinResult> {
  const code = normalizeGroupCode(rawCode);
  if (!code) throw new AppError("NOT_FOUND", "Grupo não encontrado. Confira o link.");
  const token = generateToken();
  const pinHash = await hashPin(input.pin); // antes da transação: scrypt é lento

  try {
    await db.$transaction(async (tx) => {
      const group = await tx.group.findUnique({ where: { code }, select: { id: true } });
      if (!group) throw new AppError("NOT_FOUND", "Grupo não encontrado. Confira o link.");
      await lockGroup(tx, group.id);

      // relê já com a trava (status/plano podem ter mudado entre as consultas)
      const locked = await tx.group.findUniqueOrThrow({ where: { id: group.id }, select: { status: true, plan: true } });
      if (locked.status !== "OPEN") {
        throw new AppError(
          "GROUP_LOCKED",
          locked.status === "DRAWN"
            ? "O sorteio deste grupo já foi realizado. Fale com o organizador."
            : "Este grupo não aceita mais participantes.",
        );
      }
      const active = await tx.participant.count({ where: { groupId: group.id, status: { not: "REMOVED" } } });
      const max = planFeatures(locked.plan).maxParticipants;
      if (active >= max) throw new AppError("LIMIT_REACHED", `Este grupo atingiu o limite de ${max} participantes.`);

      await tx.participant.create({
        data: {
          groupId: group.id,
          name: input.name,
          nameKey: nameKey(input.name),
          nickname: input.nickname ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          tokenHash: hashToken(token),
          pinHash,
          status: "INVITED",
        },
      });
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new AppError(
        "CONFLICT",
        `Já existe alguém chamado "${input.name}" neste grupo. Se for você, abra seu link privado; se não, use um sobrenome ou apelido.`,
        { name: "Nome já usado neste grupo." },
      );
    }
    throw e;
  }
  return { code, token };
}

/**
 * Resolve a sessão a partir do token do cookie. Retorna null para qualquer
 * falha (token malformado, inexistente, de outro grupo, participante removido)
 * — sem distinguir o motivo, para não servir de oráculo.
 */
export async function authenticate(db: Db, rawCode: string, token: unknown): Promise<SessionParticipant | null> {
  const code = normalizeGroupCode(rawCode);
  if (!code || !isWellFormedToken(token)) return null;

  const p = await db.participant.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true, name: true, role: true, status: true, lastSeenAt: true,
      group: { select: { id: true, code: true, name: true, status: true, plan: true } },
    },
  });
  if (!p || p.status === "REMOVED" || p.group.code !== code || p.group.status === "ARCHIVED") return null;

  if (!p.lastSeenAt || Date.now() - p.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
    await db.participant.update({ where: { id: p.id }, data: { lastSeenAt: new Date() } });
  }
  return { id: p.id, name: p.name, role: p.role, status: p.status, group: p.group };
}

/**
 * Resolve só o token (link privado /acesso/<token>), sem saber o grupo.
 * Usado para mostrar "Entrar como Fulano no grupo X?".
 */
export async function findByAccessToken(db: Db, token: unknown) {
  if (!isWellFormedToken(token)) return null;
  const p = await db.participant.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { name: true, status: true, group: { select: { code: true, name: true, status: true } } },
  });
  if (!p || p.status === "REMOVED" || p.group.status === "ARCHIVED") return null;
  return { name: p.name, groupCode: p.group.code, groupName: p.group.name };
}

/** Confirma participação (INVITED -> CONFIRMED), apenas antes do sorteio. */
export async function confirmParticipation(db: Db, session: SessionParticipant | null): Promise<void> {
  const me = requireParticipant(session);
  await db.$transaction(async (tx) => {
    await lockGroup(tx, me.group.id);
    const group = await tx.group.findUniqueOrThrow({ where: { id: me.group.id }, select: { status: true } });
    if (group.status !== "OPEN") {
      throw new AppError("GROUP_LOCKED", "O sorteio já foi realizado; não é mais possível confirmar.");
    }
    // updateMany com filtro de status: idempotente e não "ressuscita" removidos
    await tx.participant.updateMany({
      where: { id: me.id, status: "INVITED" },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
  });
}

// ---------------------------------------------------------------------------
// Recuperação de acesso por PIN
// ---------------------------------------------------------------------------

const RECOVERY_FAILED = "Nome ou PIN incorretos.";

/**
 * Recupera o acesso com nome + PIN. Em caso de sucesso GERA UM TOKEN NOVO:
 * o link antigo (talvez no celular perdido) deixa de funcionar.
 *
 * Segurança:
 * - mesma mensagem para "nome não existe", "sem PIN" e "PIN errado";
 * - participante inexistente também passa pelo scrypt (tempo igual);
 * - cada tentativa é RESERVADA no banco antes de conferir o PIN, num único
 *   UPDATE atômico que já grava o bloqueio na 5ª tentativa da rodada. Assim,
 *   nem tentativas em paralelo passam de 5 palpites por rodada;
 * - bloqueio progressivo: 15 min, 30 min, 1 h... até 24 h.
 */
export async function recoverAccess(
  db: Db,
  rawCode: string,
  input: { name: string; pin: string },
  now = new Date(),
): Promise<JoinResult> {
  const code = normalizeGroupCode(rawCode);
  if (!code) throw new AppError("NOT_FOUND", "Grupo não encontrado. Confira o link.");

  const p = await db.participant.findFirst({
    where: { nameKey: nameKey(input.name), status: { not: "REMOVED" }, group: { code, status: { not: "ARCHIVED" } } },
    select: { id: true, pinHash: true },
  });
  if (!p) {
    await verifyPin(input.pin, null); // mesmo custo de tempo
    throw new AppError("UNAUTHORIZED", RECOVERY_FAILED);
  }

  // As colunas DateTime do Prisma são "timestamp" em UTC. Convertemos `now`
  // explicitamente para UTC (um cast simples usaria o fuso da sessão do banco).
  const nowUtc = Prisma.sql`(${now.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
  // reserva a tentativa; se estiver bloqueado, nenhuma linha é atualizada
  const reserved = await db.$queryRaw<{ attempts: number }[]>(Prisma.sql`
    UPDATE "Participant"
       SET "pinFailedAttempts" = "pinFailedAttempts" + 1,
           "pinLockedUntil" = CASE
             WHEN ("pinFailedAttempts" + 1) % ${PIN_MAX_ATTEMPTS}::int = 0
             THEN ${nowUtc} + make_interval(mins => LEAST(15 * power(2, ("pinFailedAttempts" + 1) / ${PIN_MAX_ATTEMPTS}::int - 1), 1440)::int)
             ELSE NULL END
     WHERE id = ${p.id}
       AND ("pinLockedUntil" IS NULL OR "pinLockedUntil" <= ${nowUtc})
 RETURNING "pinFailedAttempts" AS attempts`);

  if (reserved.length === 0) {
    const locked = await db.participant.findUnique({ where: { id: p.id }, select: { pinLockedUntil: true } });
    throw new AppError("RATE_LIMITED", lockedMessage(locked?.pinLockedUntil ?? now, now));
  }

  if (!(await verifyPin(input.pin, p.pinHash))) {
    const attempts = reserved[0]!.attempts;
    if (lockDurationMs(attempts) > 0) {
      throw new AppError("RATE_LIMITED", lockedMessage(new Date(now.getTime() + lockDurationMs(attempts)), now));
    }
    throw new AppError("UNAUTHORIZED", RECOVERY_FAILED);
  }

  // PIN certo: token novo (derruba o link antigo) e zera o contador/bloqueio
  const token = generateToken();
  await db.participant.update({
    where: { id: p.id },
    data: { tokenHash: hashToken(token), tokenIssuedAt: now, pinFailedAttempts: 0, pinLockedUntil: null },
  });
  return { code, token };
}

function lockedMessage(until: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000));
  const when = minutes >= 60 ? `${Math.ceil(minutes / 60)} hora(s)` : `${minutes} minuto(s)`;
  return `Muitas tentativas erradas. Por segurança, tente novamente em ${when}.`;
}

/** Cria ou troca o PIN (precisa estar logado — o cookie prova a identidade). */
export async function setPin(db: Db, session: SessionParticipant | null, pin: string): Promise<void> {
  const me = requireParticipant(session);
  await db.participant.update({
    where: { id: me.id },
    data: { pinHash: await hashPin(pin), pinFailedAttempts: 0, pinLockedUntil: null },
  });
}

/** Indica se o participante já tem PIN (para lembrar quem ainda não criou). */
export async function hasPin(db: Db, session: SessionParticipant | null): Promise<boolean> {
  if (!session) return false;
  const p = await db.participant.findUnique({ where: { id: session.id }, select: { pinHash: true } });
  return !!p?.pinHash;
}
