import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { checkBasicAuth, renderPanel } from "@/lib/owner-panel";
import { clientIpFromHeaders } from "@/lib/security/client-ip";
import { getRateLimitStore, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getSiteStats } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

/** Painel do dono (números agregados). Sem OWNER_PANEL_PASSWORD, não existe. */
export async function GET(request: Request) {
  const env = getEnv();
  if (!env.OWNER_PANEL_PASSWORD) return new Response("Not found", { status: 404, headers: NO_STORE });

  if (!checkBasicAuth(request.headers.get("authorization"), env.OWNER_PANEL_PASSWORD)) {
    // só tentativas erradas contam no limite (o navegador sempre manda uma sem senha primeiro)
    if (request.headers.get("authorization")) {
      const ip = clientIpFromHeaders(await headers(), env.TRUST_PROXY);
      const r = getRateLimitStore().consume(`ownerPanel:${ip}`, RATE_LIMITS.ownerPanel);
      if (!r.ok) {
        return new Response("Muitas tentativas. Tente mais tarde.", {
          status: 429,
          headers: { ...NO_STORE, "Retry-After": String(r.retryAfterSec), "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }
    return new Response("Senha necessária.", {
      status: 401,
      headers: { ...NO_STORE, "WWW-Authenticate": 'Basic realm="Painel do dono", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const stats = await getSiteStats(getDb());
  return new Response(renderPanel(stats), { headers: { ...NO_STORE, "Content-Type": "text/html; charset=utf-8" } });
}
