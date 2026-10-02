import "server-only";
import { getEnv } from "@/lib/env";
import { sendEmails, type OutgoingEmail } from "@/lib/email/send";
import { drawDoneEmail, reminderEmail } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { gameTerm } from "@/lib/game-kinds";
import { groupUrl } from "@/lib/share";
import { addDays, todayInEventTz } from "@/lib/validation";
import type { Db } from "./common";

/** Dias antes da festa em que o lembrete é enviado. */
export const REMINDER_DAYS_BEFORE = 3;

/**
 * Avisa por e-mail quem está no sorteio ativo e informou e-mail.
 * Não revela resultado; falhas de envio não afetam o sorteio.
 */
export async function notifyDrawDone(db: Db, groupId: string, send = sendEmails): Promise<number> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { code: true, name: true, gameKind: true, gameName: true, status: true },
  });
  if (!group || group.status !== "DRAWN") return 0;
  const people = await db.participant.findMany({
    where: {
      groupId,
      status: "CONFIRMED",
      email: { not: null },
      givingPairs: { some: { draw: { status: "ACTIVE" } } },
    },
    select: { id: true, name: true, email: true },
  });
  const url = groupUrl(getEnv().APP_URL, group.code);
  const term = gameTerm(group);
  const messages: OutgoingEmail[] = people.map((p) => {
    const unsubUrl = unsubscribeUrl(p.id);
    return { to: p.email!, unsubUrl, ...drawDoneEmail({ term, groupName: group.name, groupUrl: url, unsubUrl, name: p.name }) };
  });
  return send(messages);
}

/**
 * Lembrete diário (rota /api/cron/lembretes): grupos sorteados cuja festa é
 * daqui a REMINDER_DAYS_BEFORE dias. Cada grupo é "reservado" com um UPDATE
 * condicional antes do envio, então duas execuções simultâneas não mandam
 * o lembrete duas vezes.
 */
export async function sendEventReminders(db: Db, now = new Date(), send = sendEmails): Promise<{ groups: number; emails: number }> {
  const target = addDays(todayInEventTz(now), REMINDER_DAYS_BEFORE);
  const groups = await db.group.findMany({
    where: { status: "DRAWN", eventDate: target, reminderSentAt: null },
    select: {
      id: true, code: true, name: true, gameKind: true, gameName: true,
      eventDate: true, eventTime: true, location: true, giftValueCents: true,
    },
    take: 200,
  });
  let done = 0;
  let emails = 0;
  for (const g of groups) {
    const claimed = await db.group.updateMany({ where: { id: g.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;
    done++;
    const people = await db.participant.findMany({
      where: { groupId: g.id, status: "CONFIRMED", email: { not: null } },
      select: { id: true, name: true, email: true },
    });
    const url = groupUrl(getEnv().APP_URL, g.code);
    const term = gameTerm(g);
    emails += await send(
      people.map((p) => {
        const unsubUrl = unsubscribeUrl(p.id);
        return {
          to: p.email!,
          unsubUrl,
          ...reminderEmail({
            term, groupName: g.name, groupUrl: url, unsubUrl, name: p.name,
            eventDate: g.eventDate!, eventTime: g.eventTime, location: g.location, giftValueCents: g.giftValueCents,
          }),
        };
      }),
    );
  }
  return { groups: done, emails };
}

/** Descadastro: apaga o e-mail do participante (LGPD). */
export async function unsubscribeParticipant(db: Db, participantId: string): Promise<void> {
  await db.participant.updateMany({ where: { id: participantId }, data: { email: null } });
}
