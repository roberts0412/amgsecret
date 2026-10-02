import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { emailEnabled } from "@/lib/email/send";
import { getEnv } from "@/lib/env";
import { sendEventReminders } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

/**
 * Lembretes por e-mail, chamado 1x por dia por um agendador
 * (netlify/functions/lembretes.mjs na Netlify; cron + curl no servidor próprio).
 * Exige Authorization: Bearer <CRON_SECRET>.
 */
export async function POST(request: Request) {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const ok = timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(secret).digest());
  if (!ok) return new Response("Unauthorized", { status: 401 });
  if (!emailEnabled()) return Response.json({ ok: true, skipped: "RESEND_API_KEY ausente" });
  const r = await sendEventReminders(getDb());
  return Response.json({ ok: true, ...r }, { headers: { "Cache-Control": "no-store" } });
}
