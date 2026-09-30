import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { GoToGroupForm } from "@/components/forms";
import { btn, Card, PageShell } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { jsonLdScript, SEO_PAGES } from "@/lib/seo-pages";
import { SITE_NAME } from "@/lib/brand";
import { GAME_KINDS, gameTitle } from "@/lib/game-kinds";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: amigo secreto e amigo oculto online e grátis` },
  description:
    "Sorteio online e grátis de amigo secreto, amigo oculto, amigo da onça e amigo chocolate: convite pelo WhatsApp, lista de desejos e mensagens anônimas.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: ["Amigo oculto online", "Sorteio de amigo secreto", "Amigo da onça online"],
    url: getEnv().APP_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="py-6 text-center">
        <p className="text-6xl" aria-hidden>🎁</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Amigo secreto e amigo oculto online e grátis</h1>
        <p className="mt-2 text-slate-600">
          Crie o grupo, mande o link no WhatsApp e faça o sorteio. Cada pessoa vê só quem tirou.
        </p>
        <ul aria-label="Serve para" className="mt-4 flex flex-wrap justify-center gap-2">
          {GAME_KINDS.map((k) => (
            <li key={k.id} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">
              <span aria-hidden>{k.emoji}</span> {gameTitle(k.id)}
            </li>
          ))}
        </ul>
      </div>

      <Link href="/criar" className={btn.primary}>
        Criar grupo e sortear
      </Link>

      <Card>
        <GoToGroupForm />
      </Card>

      <ul className="mt-2 grid gap-2 text-sm text-slate-700">
        <li>✅ Ninguém tira a si mesmo — sorteio garantido</li>
        <li>🔒 Nem o organizador vê os pares</li>
        <li>📝 Lista de desejos e mensagens anônimas</li>
      </ul>

      <nav aria-label="Guias" className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-600">Saiba mais</h2>
        <ul className="flex flex-wrap gap-2">
          {SEO_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                {p.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot />
    </PageShell>
  );
}
