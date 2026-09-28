import { NextResponse, type NextRequest } from "next/server";
import { clientIpFromHeaders } from "@/lib/security/client-ip";
import { MemoryRateLimitStore } from "@/lib/security/rate-limit";

/**
 * Limite de acessos às páginas de grupo e de link privado (GET), por IP.
 * Dificulta varrer códigos de grupo (/grupo/XXXXXX) ou tokens em massa.
 * Contador próprio, por processo (suficiente para 1 servidor; com várias
 * instâncias, use limite também no proxy/CDN).
 */
const store = new MemoryRateLimitStore();
const RULE = { limit: 300, windowSec: 10 * 60 };

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  const ip = clientIpFromHeaders(request.headers, process.env.TRUST_PROXY === "true");
  const r = store.consume(`page:${ip}`, RULE);
  if (!r.ok) {
    return new NextResponse("Muitas requisições. Tente novamente em alguns minutos.", {
      status: 429,
      headers: { "Retry-After": String(r.retryAfterSec), "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/grupo/:path*", "/acesso/:path*"],
};
