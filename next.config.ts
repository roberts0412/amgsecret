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
const isDev = process.env.NODE_ENV === "development";
const isHttps = (process.env.APP_URL ?? "").startsWith("https://");

/*
 * Content-Security-Policy SEM nonce (recomendação do Next para manter páginas
 * estáticas — com nonce, todas as páginas viram dinâmicas).
 * - scripts: só do próprio site + Google AdSense (e 'unsafe-inline', exigido
 *   pelos scripts inline do Next sem nonce; a defesa principal contra XSS é o
 *   escape automático do React, testado em E2E);
 * - nada de <object>/<embed>, <base> injetado, formulários para outros sites
 *   ou o site dentro de iframe alheio.
 * Se os anúncios pararem de aparecer, veja erros de CSP no console do navegador.
 */
const GOOGLE_ADS =
  "https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com https://*.gstatic.com https://*.adtrafficquality.google";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${GOOGLE_ADS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${GOOGLE_ADS}`,
  `frame-src ${GOOGLE_ADS}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // janelas abertas pelo site (anúncios, lojas) não controlam a aba do site
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // servidor mínimo e autocontido (.next/standalone) para rodar no Docker
  output: "standalone",
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
