import type { NextConfig } from "next";

/*
 * APP_URL entra nas páginas ESTÁTICAS (SEO, sitemap, robots, canonical) no
 * momento do build. Se o build de produção usar localhost, o sitemap e as URLs
 * canônicas sairão erradas — avisamos alto aqui.
 */
if (process.argv.includes("build") && process.env.NODE_ENV !== "test") {
  const appUrl = process.env.APP_URL ?? "";
  if (!appUrl || /localhost|127\.0\.0\.1/.test(appUrl)) {
    console.warn(
      `\n⚠️  APP_URL=${appUrl || "(vazio)"} — em produção, defina APP_URL com o domínio real ANTES do build ` +
        `(sitemap, robots e URLs canônicas são gerados no build).\n`,
    );
  }
}

// Cabeçalhos de segurança básicos. A CSP completa (com nonce) entra na etapa de
// revisão de segurança, quando existirem os scripts de anúncios/analytics.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // páginas de grupo: fora dos buscadores
      { source: "/grupo/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // link privado: o token está na URL — nunca enviar como Referer nem indexar
      {
        source: "/acesso/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
