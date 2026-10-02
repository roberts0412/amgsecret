import "server-only";
import type { Db } from "./common";

/**
 * Números do site para o dono (painel /painel). Só contagens agregadas:
 * nenhum nome, contato, código de grupo ou resultado sai daqui.
 */
export interface SiteStats {
  groups: number;
  groupsDrawn: number;
  participants: number;
  /** Pessoas que já revelaram o resultado no sorteio ativo do grupo. */
  revealed: number;
  wishes: number;
  byKind: { kind: string; count: number }[];
  /** Últimos 30 dias (fuso de São Paulo), do mais recente ao mais antigo. */
  daily: { day: string; groups: number; participants: number }[];
}

export async function getSiteStats(db: Db): Promise<SiteStats> {
  const [groups, groupsDrawn, participants, revealed, wishes, byKind, dailyGroups, dailyPeople] = await Promise.all([
    db.group.count({ where: { status: { not: "ARCHIVED" } } }),
    db.group.count({ where: { status: "DRAWN" } }),
    db.participant.count({ where: { status: { not: "REMOVED" } } }),
    db.drawPair.count({ where: { viewedAt: { not: null }, draw: { status: "ACTIVE" } } }),
    db.wishlistItem.count(),
    db.group.groupBy({ by: ["gameKind"], _count: { _all: true }, where: { status: { not: "ARCHIVED" } } }),
    db.$queryRaw<{ day: string; n: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day, count(*) AS n
      FROM "Group" WHERE "createdAt" > now() - interval '30 days' GROUP BY 1`,
    db.$queryRaw<{ day: string; n: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day, count(*) AS n
      FROM "Participant" WHERE "createdAt" > now() - interval '30 days' GROUP BY 1`,
  ]);
  const g = new Map(dailyGroups.map((r) => [r.day, Number(r.n)]));
  const p = new Map(dailyPeople.map((r) => [r.day, Number(r.n)]));
  const daily = [...new Set([...g.keys(), ...p.keys()])]
    .sort()
    .reverse()
    .map((day) => ({ day, groups: g.get(day) ?? 0, participants: p.get(day) ?? 0 }));
  return {
    groups,
    groupsDrawn,
    participants,
    revealed,
    wishes,
    byKind: byKind.map((k) => ({ kind: k.gameKind, count: k._count._all })).sort((a, b) => b.count - a.count),
    daily,
  };
}
