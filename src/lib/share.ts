import { formatCents, formatShortDate } from "@/lib/format";
import { type GameLike, gameTerm } from "@/lib/game-kinds";

export interface ShareableGroup extends GameLike {
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
  const lines = [`🎁 Você foi convidado(a) para o ${gameTerm(group)} *${group.name}*!`, ""];
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

/** Lembrete para quem ainda não confirmou (o organizador manda no grupo). */
export function reminderMessage(groupName: string, pendingNames: string[], url: string, game?: GameLike): string {
  const who =
    pendingNames.length === 0
      ? ""
      : pendingNames.length <= 8
        ? pendingNames.join(", ")
        : `${pendingNames.slice(0, 8).join(", ")} e mais ${pendingNames.length - 8}`;
  return [
    `⏰ Lembrete do ${gameTerm(game)} *${groupName}*!`,
    who ? `Ainda falta confirmar: ${who}.` : "Ainda tem gente sem confirmar.",
    "",
    "Confirme pelo link para entrar no sorteio:",
    url,
  ].join("\n");
}

/** Aviso de que o sorteio foi feito — sem revelar nada. */
export function drawDoneMessage(groupName: string, url: string, game?: GameLike): string {
  return [
    `🎉 O sorteio do ${gameTerm(game)} *${groupName}* foi feito!`,
    "",
    "Abra o link, entre na sua área e toque em \"Revelar\" para ver quem você tirou. 🤫",
    url,
  ].join("\n");
}

/** Lembrete para quem ainda não abriu o resultado (sem revelar nada). */
export function notViewedReminderMessage(groupName: string, names: string[], url: string, game?: GameLike): string {
  const who = names.length <= 8 ? names.join(", ") : `${names.slice(0, 8).join(", ")} e mais ${names.length - 8}`;
  return [
    `🎁 O sorteio do ${gameTerm(game)} *${groupName}* já foi feito!`,
    `Ainda não viram quem tiraram: ${who}.`,
    "",
    "Abra o link, entre na sua área e toque em \"Revelar\" 🤫",
    url,
  ].join("\n");
}
