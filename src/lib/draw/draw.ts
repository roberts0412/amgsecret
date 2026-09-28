import { randomInt } from "node:crypto";

/**
 * Núcleo do sorteio do amigo secreto.
 *
 * O problema é encontrar uma bijeção giver -> receiver (uma permutação) em que:
 *   - ninguém tira a si próprio;
 *   - nenhuma exclusão (giver, receiver) é violada.
 *
 * Isso equivale a um emparelhamento perfeito num grafo bipartido
 * (doadores x recebedores, arestas = pares permitidos). Por isso:
 *   1. tentamos amostragem por rejeição (permutação uniforme aleatória) — quando
 *      encontra, o resultado é uniforme entre todas as combinações válidas;
 *   2. se não encontrar, usamos emparelhamento por caminhos aumentantes (Kuhn)
 *      com ordens embaralhadas — é completo: acha uma solução SE e SOMENTE SE
 *      ela existir.
 * Todo resultado passa por `validateAssignment` antes de ser devolvido.
 */

export type ParticipantId = string;

export interface Exclusion {
  participantId: ParticipantId;
  excludedParticipantId: ParticipantId;
}

/** Mapa giver -> receiver. */
export type Assignment = Map<ParticipantId, ParticipantId>;

export type DrawErrorCode =
  | "NOT_ENOUGH_PARTICIPANTS"
  | "DUPLICATE_PARTICIPANT"
  | "UNKNOWN_PARTICIPANT_IN_EXCLUSION"
  | "NO_VALID_COMBINATION";

export const MIN_PARTICIPANTS = 3;

export const DRAW_ERROR_MESSAGES: Record<DrawErrorCode, string> = {
  NOT_ENOUGH_PARTICIPANTS: `O sorteio precisa de pelo menos ${MIN_PARTICIPANTS} participantes confirmados.`,
  DUPLICATE_PARTICIPANT: "Há participantes duplicados no sorteio.",
  UNKNOWN_PARTICIPANT_IN_EXCLUSION: "Há exclusões que citam participantes fora do sorteio.",
  NO_VALID_COMBINATION:
    "Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões.",
};

export class DrawError extends Error {
  constructor(public readonly code: DrawErrorCode) {
    super(DRAW_ERROR_MESSAGES[code]);
    this.name = "DrawError";
  }
}

export type RandomInt = (maxExclusive: number) => number;

const cryptoRandomInt: RandomInt = (max) => randomInt(max);

export interface DrawOptions {
  /** Fonte de aleatoriedade; padrão é `crypto.randomInt` (CSPRNG). */
  random?: RandomInt;
  /** Tentativas de amostragem uniforme antes de cair no emparelhamento. */
  rejectionAttempts?: number;
}

function shuffle<T>(items: readonly T[], random: RandomInt): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildForbidden(
  participants: readonly ParticipantId[],
  exclusions: readonly Exclusion[],
): Map<ParticipantId, Set<ParticipantId>> {
  const known = new Set(participants);
  const forbidden = new Map<ParticipantId, Set<ParticipantId>>();
  for (const p of participants) forbidden.set(p, new Set([p]));
  for (const e of exclusions) {
    if (!known.has(e.participantId) || !known.has(e.excludedParticipantId)) {
      throw new DrawError("UNKNOWN_PARTICIPANT_IN_EXCLUSION");
    }
    forbidden.get(e.participantId)!.add(e.excludedParticipantId);
  }
  return forbidden;
}

function checkInput(participants: readonly ParticipantId[]): void {
  if (participants.length < MIN_PARTICIPANTS) throw new DrawError("NOT_ENOUGH_PARTICIPANTS");
  if (new Set(participants).size !== participants.length) throw new DrawError("DUPLICATE_PARTICIPANT");
}

/** Emparelhamento perfeito por caminhos aumentantes (Kuhn), com ordens aleatórias. */
function findMatching(
  participants: readonly ParticipantId[],
  forbidden: Map<ParticipantId, Set<ParticipantId>>,
  random: RandomInt,
): Assignment | null {
  const givers = shuffle(participants, random);
  const candidates = new Map<ParticipantId, ParticipantId[]>();
  for (const g of givers) {
    const blocked = forbidden.get(g)!;
    candidates.set(g, shuffle(participants.filter((r) => !blocked.has(r)), random));
  }

  const giverOf = new Map<ParticipantId, ParticipantId>(); // receiver -> giver

  const tryAssign = (giver: ParticipantId, visited: Set<ParticipantId>): boolean => {
    for (const r of candidates.get(giver)!) {
      if (visited.has(r)) continue;
      visited.add(r);
      const current = giverOf.get(r);
      if (current === undefined || tryAssign(current, visited)) {
        giverOf.set(r, giver);
        return true;
      }
    }
    return false;
  };

  for (const g of givers) {
    if (!tryAssign(g, new Set())) return null;
  }

  const result: Assignment = new Map();
  for (const [receiver, giver] of giverOf) result.set(giver, receiver);
  return result;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Validação independente do algoritmo que gerou o resultado.
 * Deve ser chamada antes de persistir qualquer sorteio.
 */
export function validateAssignment(
  participants: readonly ParticipantId[],
  exclusions: readonly Exclusion[],
  assignment: Assignment,
): ValidationResult {
  const known = new Set(participants);
  if (participants.length < MIN_PARTICIPANTS) return { ok: false, reason: "poucos participantes" };
  if (known.size !== participants.length) return { ok: false, reason: "participante duplicado" };
  if (assignment.size !== participants.length) return { ok: false, reason: "quantidade de pares incorreta" };

  const received = new Set<ParticipantId>();
  for (const [giver, receiver] of assignment) {
    if (!known.has(giver) || !known.has(receiver)) return { ok: false, reason: "participante desconhecido" };
    if (giver === receiver) return { ok: false, reason: "alguém tirou a si próprio" };
    if (received.has(receiver)) return { ok: false, reason: "alguém foi sorteado duas vezes" };
    received.add(receiver);
  }
  for (const p of participants) {
    if (!assignment.has(p)) return { ok: false, reason: "alguém ficou sem tirar ninguém" };
    if (!received.has(p)) return { ok: false, reason: "alguém não foi sorteado" };
  }
  for (const e of exclusions) {
    if (assignment.get(e.participantId) === e.excludedParticipantId) {
      return { ok: false, reason: "exclusão violada" };
    }
  }
  return { ok: true };
}

/** Indica se existe ao menos uma combinação válida (sem sortear de fato). */
export function isDrawPossible(
  participants: readonly ParticipantId[],
  exclusions: readonly Exclusion[],
): boolean {
  if (participants.length < MIN_PARTICIPANTS || new Set(participants).size !== participants.length) {
    return false;
  }
  const forbidden = buildForbidden(participants, exclusions);
  return findMatching(participants, forbidden, () => 0) !== null;
}

/**
 * Realiza o sorteio. Lança `DrawError` se as regras não permitem nenhuma
 * combinação — nunca devolve resultado parcial.
 */
export function draw(
  participants: readonly ParticipantId[],
  exclusions: readonly Exclusion[] = [],
  options: DrawOptions = {},
): Assignment {
  const random = options.random ?? cryptoRandomInt;
  const attempts = options.rejectionAttempts ?? 50;

  checkInput(participants);
  const forbidden = buildForbidden(participants, exclusions);

  let result: Assignment | null = null;

  for (let i = 0; i < attempts && result === null; i++) {
    const perm = shuffle(participants, random);
    if (participants.every((p, idx) => !forbidden.get(p)!.has(perm[idx]!))) {
      result = new Map(participants.map((p, idx) => [p, perm[idx]!]));
    }
  }

  result ??= findMatching(participants, forbidden, random);
  if (result === null) throw new DrawError("NO_VALID_COMBINATION");

  const check = validateAssignment(participants, exclusions, result);
  if (!check.ok) {
    // Não deveria acontecer; falha fechada em vez de salvar algo inválido.
    throw new Error(`Sorteio inválido gerado internamente: ${check.reason}`);
  }
  return result;
}
