import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { GroupStatus, ParticipantRole, ParticipantStatus, Plan } from "@/generated/prisma/enums";
import { AppError } from "@/lib/errors";

export type Db = PrismaClient;
export type Tx = Prisma.TransactionClient;

/** Participante autenticado (derivado SOMENTE do token da sessão). */
export interface SessionParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  group: { id: string; code: string; name: string; status: GroupStatus; plan: Plan; gameKind: string };
}

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Trava a linha do grupo até o fim da transação. Toda mudança estrutural
 * (entrar, remover, sortear) passa por aqui, então elas nunca se intercalam.
 */
export async function lockGroup(tx: Tx, groupId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Group" WHERE id = ${groupId} FOR UPDATE`;
}

export function requireOrganizer(session: SessionParticipant | null): SessionParticipant {
  if (!session) throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Abra seu link privado novamente.");
  if (session.role !== "ORGANIZER") throw new AppError("FORBIDDEN", "Apenas o organizador pode fazer isso.");
  return session;
}

export function requireParticipant(session: SessionParticipant | null): SessionParticipant {
  if (!session) throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Abra seu link privado novamente.");
  return session;
}
