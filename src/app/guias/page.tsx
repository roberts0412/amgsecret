import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { btn, Card, PageShell } from "@/components/ui";
import { SITE_NAME } from "@/lib/brand";
import { GUIDES, GUIDES_HUB } from "@/lib/guides";

export const metadata: Metadata = {
  title: { absolute: GUIDES_HUB.title },
  description: GUIDES_HUB.description,
  alternates: { canonical: GUIDES_HUB.path },
  openGraph: {
    title: GUIDES_HUB.title,
    description: GUIDES_HUB.description,
    url: GUIDES_HUB.path,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
  },
};

export default function GuidesHubPage() {
  return (
    <PageShell>
      <nav aria-label="Você está em" className="text-sm text-slate-500">
        <Link href="/" className="underline">Início</Link> › <span>Guias</span>
      </nav>

      <header className="py-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{GUIDES_HUB.h1}</h1>
        <p className="mt-3 text-lg text-slate-700">
          Ficou com a missão de organizar a brincadeira deste ano? Aqui estão as dicas que a gente juntou para a troca
          de presentes dar certo, seja na família, na firma, na escola ou com a turma espalhada pelo país.
        </p>
      </header>

      <ul className="grid gap-3">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`${GUIDES_HUB.path}/${g.slug}`} className="flex gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:bg-slate-50">
              <span className="text-3xl" aria-hidden>{g.emoji}</span>
              <span>
                <span className="block font-bold text-slate-900">{g.h1}</span>
                <span className="mt-1 block text-sm text-slate-600">{g.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Card highlight>
        <h2 className="text-lg font-bold">Pronto para sortear?</h2>
        <p className="mt-1 text-slate-700">Crie o grupo, mande o link no WhatsApp e cada pessoa vê só quem tirou. Grátis.</p>
        <Link href="/criar" className={`${btn.primary} mt-3`}>Criar amigo secreto grátis</Link>
      </Card>

      <AdSlot />
    </PageShell>
  );
}
