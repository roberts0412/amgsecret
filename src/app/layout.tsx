import type { Metadata, Viewport } from "next";
import { CookieConsent } from "@/components/cookie-consent";
import { adMode } from "@/lib/ads";
import { getEnv } from "@/lib/env";
import "./globals.css";

/** metadataBase: URLs absolutas nas prévias (og:image precisa de URL completa). */
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getEnv().APP_URL),
    title: { default: "Amigo Secreto Online Grátis", template: "%s · Amigo Secreto" },
    description: "Crie seu amigo secreto online, grátis, com sorteio seguro, lista de desejos e convite pelo WhatsApp.",
    applicationName: "Amigo Secreto",
    openGraph: { siteName: "Amigo Secreto", locale: "pt_BR", type: "website" },
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
