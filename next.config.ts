import type { NextConfig } from "next";

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
