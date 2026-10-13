import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { btn, Card, PageShell } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { formatGuideDate, getGuide, GUIDES, GUIDES_HUB } from "@/lib/guides";
import { jsonLdScript } from "@/lib/seo-pages";
import { SITE_NAME } from "@/lib/brand";
import { GIFT_HUB } from "@/lib/gift-ideas";

type Props = { params: Promise<{ slug: string }> };

/** Só os guias conhecidos existem; qualquer outro vira 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  const path = `${GUIDES_HUB.path}/${guide.slug}`;
  return {
    title: { absolute: guide.title },
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: path,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const base = getEnv().APP_URL;
  const path = `${GUIDES_HUB.path}/${guide.slug}`;
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.h1,
      description: guide.description,
      inLanguage: "pt-BR",
      datePublished: guide.updated,
      dateModified: guide.updated,
      mainEntityOfPage: new URL(path, base).toString(),
      author: { "@type": "Organization", name: SITE_NAME, url: new URL("/sobre", base).toString() },
      publisher: { "@type": "Organization", name: SITE_NAME, url: base },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: new URL("/", base).toString() },
        { "@type": "ListItem", position: 2, name: "Guias", item: new URL(GUIDES_HUB.path, base).toString() },
        { "@type": "ListItem", position: 3, name: guide.h1, item: new URL(path, base).toString() },
      ],
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      <nav aria-label="Você está em" className="text-sm text-slate-500">
        <Link href="/" className="underline">Início</Link> ›{" "}
        <Link href={GUIDES_HUB.path} className="underline">Guias</Link>
      </nav>

      <article className="flex flex-col gap-4">
        <header className="py-2">
          <p className="text-4xl" aria-hidden>{guide.emoji}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{guide.h1}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Atualizado em <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time> · por{" "}
            <Link href="/sobre" className="underline">{SITE_NAME}</Link>
          </p>
          <p className="mt-3 text-lg text-slate-700">{guide.intro}</p>
        </header>

        {guide.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="text-slate-700">{p}</p>
            ))}
            {s.bullets && (
              <ul className="ml-5 list-disc text-slate-700">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <Card highlight>
          <h2 className="text-lg font-bold">Organize o seu em um minuto</h2>
          <p className="mt-1 text-slate-700">
            Crie o grupo, mande o link no WhatsApp e faça o sorteio. Ninguém tira a si mesmo e nem o organizador vê os
            pares.
          </p>
          <Link href="/criar" className={`${btn.primary} mt-3`}>Criar amigo secreto grátis</Link>
        </Card>

        <nav aria-label="Leia também" className="mt-2">
          <h2 className="mb-2 text-lg font-bold">Leia também</h2>
          <ul className="grid gap-2">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`${GUIDES_HUB.path}/${g.slug}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                  <span aria-hidden>{g.emoji}</span> {g.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link href={GIFT_HUB.path} className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                <span aria-hidden>🎁</span> Ideias de presente por valor
              </Link>
            </li>
          </ul>
        </nav>
      </article>

      <AdSlot />
    </PageShell>
  );
}
