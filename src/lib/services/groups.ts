import "server-only";
import type { GroupStatus, ParticipantRole, ParticipantStatus, Plan } from "@/generated/prisma/enums";
import { AppError } from "@/lib/errors";
import { planFeatures } from "@/lib/plans";
import { isThemeAllowed, THEMES } from "@/lib/themes";
import { hashPin } from "@/lib/security/pin";
import { generateGroupCode, generateToken, hashToken, normalizeGroupCode } from "@/lib/security/tokens";
import { nameKey } from "@/lib/text";
import type { CreateGroupInput, GroupDetailsInput } from "@/lib/validation";
import { type Db, isUniqueViolation, lockGroup, requireOrganizer, type SessionParticipant } from "./common";

const CODE_ATTEMPTS = 5;

export interface CreatedGroup {
  code: string;
  /** Token em claro do organizador — só vai para o cookie/link privado dele. */
  token: string;
}

export async function createGroup(db: Db, input: CreateGroupInput): Promise<CreatedGroup> {
  const token = generateToken();
  const pinHash = await hashPin(input.pin);
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = generateGroupCode();
    try {
      await db.$transaction(async (tx) => {
        const group = await tx.group.create({
          data: {
            code,
            name: input.name,
            description: input.description ?? null,
            eventDate: input.eventDate ?? null,
            eventTime: input.eventTime ?? null,
            location: input.location ?? null,
            giftValueCents: input.giftValue ?? null,
          },
          select: { id: true },
        });
        const organizer = await tx.participant.create({
          data: {
            groupId: group.id,
            name: input.organizerName,
            nameKey: nameKey(input.organizerName),
            tokenHash: hashToken(token),
            pinHash,
            role: "ORGANIZER",
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
          select: { id: true },
        });
        await tx.group.update({ where: { id: group.id }, data: { creatorId: organizer.id } });
      });
      return { code, token };
    } catch (e) {
      // colisão de código (raríssima): tenta outro
      if (isUniqueViolation(e) && attempt < CODE_ATTEMPTS - 1) continue;
      throw e;
    }
  }
  throw new Error("unreachable");
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export interface PublicParticipant {
  name: string;
  nickname: string | null;
  status: Exclude<ParticipantStatus, "REMOVED">;
  isOrganizer: boolean;
}

export interface PublicGroupView {
  code: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  giftValueCents: number | null;
  status: GroupStatus;
  plan: Plan;
  theme: string;
  participants: PublicParticipant[];
  confirmedCount: number;
}

/**
 * Visão pública do grupo: SÓ nome/apelido/status dos participantes.
 * Seleção explícita de campos — nunca devolve e-mail, telefone ou tokenHash.
 */
export async function getPublicGroupView(db: Db, rawCode: string): Promise<PublicGroupView | null> {
  const code = normalizeGroupCode(rawCode);
  if (!code) return null;
  const group = await db.group.findUnique({
    where: { code },
    select: {
      code: true, name: true, description: true, eventDate: true, eventTime: true,
      location: true, giftValueCents: true, status: true, plan: true, theme: true,
      participants: {
        where: { status: { not: "REMOVED" } },
        orderBy: { createdAt: "asc" },
        select: { name: true, nickname: true, status: true, role: true },
      },
    },
  });
  if (!group || group.status === "ARCHIVED") return null;
  const participants = group.participants.map((p) => ({
    name: p.name,
    nickname: p.nickname,
    status: p.status as PublicParticipant["status"],
    isOrganizer: p.role === "ORGANIZER",
  }));
  return {
    ...group,
    participants,
    confirmedCount: participants.filter((p) => p.status === "CONFIRMED").length,
  };
}

export interface OrganizerParticipant {
  id: string;
  name: string;
  nickname: string | null;
  status: Exclude<ParticipantStatus, "REMOVED">;
  role: ParticipantRole;
}

export interface OrganizerView {
  maxParticipants: number;
  participants: OrganizerParticipant[];
}

/** Painel do organizador: status de cada um. Nada sobre resultados/pares. */
export async function getOrganizerView(db: Db, session: SessionParticipant | null): Promise<OrganizerView> {
  const org = requireOrganizer(session);
  const participants = await db.participant.findMany({
    where: { groupId: org.group.id, status: { not: "REMOVED" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, nickname: true, status: true, role: true },
  });
  return {
    maxParticipants: planFeatures(org.group.plan).maxParticipants,
    participants: participants as OrganizerParticipant[],
  };
}

// ---------------------------------------------------------------------------
// Alterações do organizador
// ---------------------------------------------------------------------------

/** Detalhes do evento (nome, data, local...) não são estruturais: podem mudar após o sorteio. */
export async function updateGroupDetails(db: Db, session: SessionParticipant | null, input: GroupDetailsInput) {
  const org = requireOrganizer(session);
  const updated = await db.group.updateMany({
    where: { id: org.group.id, status: { not: "ARCHIVED" } },
    data: {
      name: input.name,
      description: input.description ?? null,
      eventDate: input.eventDate ?? null,
      eventTime: input.eventTime ?? null,
      location: input.location ?? null,
      giftValueCents: input.giftValue ?? null,
    },
  });
  if (updated.count === 0) throw new AppError("GROUP_LOCKED", "Este grupo foi arquivado.");
}

/**
 * Remove participante (somente antes do sorteio). Invalida o token dele na
 * hora, libera o nome para reuso e apaga as exclusões que o envolvem.
 */
export async function removeParticipant(db: Db, session: SessionParticipant | null, participantId: string) {
  const org = requireOrganizer(session);
  if (participantId === org.id) throw new AppError("FORBIDDEN", "O organizador não pode remover a si mesmo.");

  await db.$transaction(async (tx) => {
    await lockGroup(tx, org.group.id);
    const group = await tx.group.findUniqueOrThrow({ where: { id: org.group.id }, select: { status: true } });
    if (group.status !== "OPEN") {
      throw new AppError("GROUP_LOCKED", "O sorteio já foi feito. Para remover alguém, é preciso refazer o sorteio.");
    }
    // groupId no WHERE: impede remover participante de OUTRO grupo passando um id qualquer
    const target = await tx.participant.findFirst({
      where: { id: participantId, groupId: org.group.id, status: { not: "REMOVED" } },
      select: { id: true, role: true },
    });
    if (!target) throw new AppError("NOT_FOUND", "Participante não encontrado.");
    if (target.role === "ORGANIZER") throw new AppError("FORBIDDEN", "Não é possível remover um organizador.");

    await tx.exclusion.deleteMany({
      where: { OR: [{ participantId: target.id }, { excludedParticipantId: target.id }] },
    });
    await tx.participant.update({
      where: { id: target.id },
      data: {
        status: "REMOVED",
        removedAt: new Date(),
        nameKey: `~removido~${target.id}`,
        tokenHash: hashToken(generateToken()), // token antigo deixa de valer
      },
    });
  });
}

/** Troca o tema do grupo. Temas premium só em grupos PREMIUM (checado aqui, não só na tela). */
export async function updateTheme(db: Db, session: SessionParticipant | null, theme: string): Promise<void> {
  const org = requireOrganizer(session);
  if (!THEMES.some((t) => t.id === theme)) throw new AppError("NOT_FOUND", "Tema não encontrado.");
  if (!isThemeAllowed(theme, org.group.plan)) {
    throw new AppError("FORBIDDEN", "Este tema faz parte do plano Premium (em breve).");
  }
  await db.group.update({ where: { id: org.group.id }, data: { theme } });
}
