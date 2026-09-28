import { formatCents } from "@/lib/validation";

/** "2026-12-24" -> "quinta-feira, 24 de dezembro de 2026" (sem depender do fuso do servidor). */
export function formatEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2026-12-24" -> "24/12" */
export function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

export function formatWhen(eventDate: string | null, eventTime: string | null): string | null {
  if (!eventDate && !eventTime) return null;
  if (!eventDate) return `às ${eventTime}`;
  return eventTime ? `${formatEventDate(eventDate)}, às ${eventTime}` : formatEventDate(eventDate);
}

export { formatCents };
