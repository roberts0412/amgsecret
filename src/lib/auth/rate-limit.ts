import "server-only";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { clientIpFromHeaders } from "@/lib/security/client-ip";
import { getRateLimitStore, RATE_LIMITS, type RateLimitAction } from "@/lib/security/rate-limit";

/** Aplica o limite da ação para o IP atual (e, opcionalmente, um sujeito extra). */
export async function enforceRateLimit(action: RateLimitAction, subject?: string): Promise<void> {
  const ip = clientIpFromHeaders(await headers(), getEnv().TRUST_PROXY);
  const key = `${action}:${ip}${subject ? `:${subject}` : ""}`;
  const r = getRateLimitStore().consume(key, RATE_LIMITS[action]);
  if (!r.ok) {
    const minutes = Math.ceil(r.retryAfterSec / 60);
    throw new AppError(
      "RATE_LIMITED",
      `Muitas tentativas. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
    );
  }
}
