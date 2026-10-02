import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { btn, Card, PageShell } from "@/components/ui";
import { SITE_NAME } from "@/lib/brand";
import { GIFT_HUB, GIFT_PAGES } from "@/lib/gift-ideas";

export const metadata: Metadata = {
  title: { absolute: GIFT_HUB.title },
  description: GIFT_HUB.description,
  alternates: { canonical: GIFT_HUB.path },
  openGraph: { title: GIFT_HUB.title, description: GIFT_HUB.description, url: GIFT_HUB.path, siteName: SITE_NAME, locale: "pt_BR", type: "website" },
};

export default function GiftHubPage() {
  return (
    <PageShell>
      <nav aria-label="Você está em" className="text-sm text-slate-500">
        <Link href="/" className="underline">Início</Link> › <span>Ideias de presente</span>
      </nav>
      <header className="py-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{GIFT_HUB.h1}</h1>
        <p className="mt-3 text-lg text-slate-700">
          Escolha o valor combinado no seu grupo e veja ideias úteis, gostosas e divertidas, inclusive para o amigo da onça.
        </p>
      </header>
      <ul className="grid gap-3">
        {GIFT_PAGES.map((p) => (
          <li key={p.slug}>
            <Link href={`${GIFT_HUB.path}/${p.slug}`} className="block rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:bg-slate-50">
              <p className="text-2xl font-extrabold text-brand">Até R$ {p.maxReais}</p>
              <p className="text-slate-700">{p.groups.reduce((n, g) => n + g.ideas.length, 0)} ideias de presente →</p>
            </Link>
          </li>
        ))}
      </ul>
      <Card highlight>
        <h2 className="text-lg font-bold">Ainda não sorteou?</h2>
        <p className="mt-1 text-slate-700">Crie o grupo, mande o link no WhatsApp e cada um vê só quem tirou. Grátis.</p>
        <Link href="/criar" className={`${btn.primary} mt-3`}>Criar amigo secreto grátis</Link>
      </Card>
      <AdSlot />
    </PageShell>
  );
}
