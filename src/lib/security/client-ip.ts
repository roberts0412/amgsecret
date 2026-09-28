import { isIP } from "node:net";

/**
 * IP do cliente para rate limiting.
 * Só confia em X-Real-IP / X-Forwarded-For quando TRUST_PROXY=true; caso
 * contrário qualquer um forjaria o cabeçalho para escapar do limite.
 */
export function clientIpFromHeaders(headers: Headers, trustProxy: boolean): string {
  if (trustProxy) {
    const real = headers.get("x-real-ip")?.trim();
    if (real && isIP(real)) return real;
    // primeiro da lista = cliente original (o proxy confiável acrescenta à direita)
    const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (first && isIP(first)) return first;
  }
  return "direct";
}
