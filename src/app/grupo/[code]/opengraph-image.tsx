import { getDb } from "@/lib/db/client";
import { formatCents, formatShortDate } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { SITE_NAME } from "@/lib/brand";

export const alt = "Convite para o amigo secreto";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Prévia do convite no WhatsApp. Mostra só o que já está no convite
 * (nome, data, valor) — nunca participantes ou resultados.
 */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeGroupCode((await params).code);
  const group = code
    ? await getDb().group.findUnique({
        where: { code },
        select: { name: true, eventDate: true, eventTime: true, giftValueCents: true, status: true },
      })
    : null;
  if (!group || group.status === "ARCHIVED") {
    return ogCard({ title: SITE_NAME, lines: ["Sorteio online e grátis"], footer: "Convite pelo WhatsApp" });
  }
  const lines: string[] = [];
  if (group.eventDate) lines.push(`Dia ${formatShortDate(group.eventDate)}${group.eventTime ? ` às ${group.eventTime}` : ""}`);
  if (group.giftValueCents !== null) lines.push(`Presente de até ${formatCents(group.giftValueCents)}`);
  return ogCard({ title: group.name, lines, footer: "Toque para entrar e confirmar" });
}
