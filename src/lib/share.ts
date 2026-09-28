import { formatCents, formatShortDate } from "@/lib/format";

export interface ShareableGroup {
  name: string;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  giftValueCents: number | null;
}

/** Link público do grupo. `baseUrl` vem de APP_URL (nunca do Host da requisição). */
export function groupUrl(baseUrl: string, code: string): string {
  return new URL(`/grupo/${code}`, baseUrl).toString();
}

export function inviteMessage(group: ShareableGroup, url: string): string {
  const lines = [`🎁 Você foi convidado(a) para o amigo secreto *${group.name}*!`, ""];
  if (group.eventDate) lines.push(`📅 ${formatShortDate(group.eventDate)}${group.eventTime ? ` às ${group.eventTime}` : ""}`);
  else if (group.eventTime) lines.push(`🕗 ${group.eventTime}`);
  if (group.location) lines.push(`📍 ${group.location}`);
  if (group.giftValueCents !== null) lines.push(`💰 Presente de até ${formatCents(group.giftValueCents)}`);
  if (lines.length > 2) lines.push("");
  lines.push("Entre pelo link e confirme sua participação:", url);
  return lines.join("\n");
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
