import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

/**
 * /grupo/ NÃO é bloqueado aqui de propósito: as páginas de grupo já têm
 * noindex (meta + X-Robots-Tag), que é o jeito certo de ficar fora da busca —
 * bloquear no robots impediria o buscador de ler o noindex e quebraria a
 * prévia do convite em apps cujos robôs respeitam robots.txt.
 * /acesso/ (links privados) é bloqueado e também não gera prévia.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/acesso/"] }],
    sitemap: new URL("/sitemap.xml", getEnv().APP_URL).toString(),
  };
}
