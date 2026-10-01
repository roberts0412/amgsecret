import type { Metadata, Viewport } from "next";
import { CookieConsent } from "@/components/cookie-consent";
import { adMode } from "@/lib/ads";
import { getEnv } from "@/lib/env";
import "./globals.css";
import { SITE_NAME } from "@/lib/brand";

/** metadataBase: URLs absolutas nas prévias (og:image precisa de URL completa). */
export function generateMetadata(): Metadata {
  const env = getEnv();
  return {
    metadataBase: new URL(env.APP_URL),
    // verificação do site no AdSense (meta tag): só com ADSENSE_CLIENT_ID (validado como ca-pub-<números>)
    ...(env.ADSENSE_CLIENT_ID && { other: { "google-adsense-account": env.ADSENSE_CLIENT_ID } }),
    title: { default: `${SITE_NAME} — sorteio online e grátis`, template: `%s · ${SITE_NAME}` },
    description: "Crie seu amigo secreto online, grátis, com sorteio seguro, lista de desejos e convite pelo WhatsApp.",
    applicationName: SITE_NAME,
    openGraph: { siteName: SITE_NAME, locale: "pt_BR", type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e11d48",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        {children}
        {/* aviso de cookies só existe quando há anúncios de verdade */}
        {adMode().kind === "adsense" && <CookieConsent />}
      </body>
    </html>
  );
}
