import { isIP } from "node:net";

/**
 * IP do cliente para rate limiting.
 * Só confia em cabeçalhos de proxy quando TRUST_PROXY=true; caso contrário
 * qualquer um forjaria o cabeçalho para escapar do limite.
 * Na Netlify (NETLIFY=true, definido pela própria plataforma) o único
 * cabeçalho confiável é x-nf-client-connection-ip: lá X-Real-IP e
 * X-Forwarded-For podem chegar com valores enviados pelo próprio cliente.
 */
export function clientIpFromHeaders(
  headers: Headers,
  trustProxy: boolean,
  netlify = process.env.NETLIFY === "true",
): string {
  if (!trustProxy) return "direct";
  if (netlify) {
    const nf = headers.get("x-nf-client-connection-ip")?.trim();
    return nf && isIP(nf) ? nf : "direct";
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real && isIP(real)) return real;
  // primeiro da lista = cliente original (o proxy confiável acrescenta à direita)
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (first && isIP(first)) return first;
  return "direct";
}
