import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { GiftList } from "@/components/gift-list";
import { btn, Card, PageShell } from "@/components/ui";
import { SITE_NAME } from "@/lib/brand";
import { getEnv } from "@/lib/env";
import { GIFT_HUB, GIFT_PAGES, getGiftPage } from "@/lib/gift-ideas";
import { jsonLdScript } from "@/lib/seo-pages";

type Props = { params: Promise<{ faixa: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GIFT_PAGES.map((p) => ({ faixa: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getGiftPage((await params).faixa);
  if (!page) return {};
  const path = `${GIFT_HUB.path}/${page.slug}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.title, description: page.description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "article" },
  };
}

export default async function GiftPage({ params }: Props) {
  const page = getGiftPage((await params).faixa);
  if (!page) notFound();
  const env = getEnv();
  const others = GIFT_PAGES.filter((p) => p.slug !== page.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: new URL("/", env.APP_URL).toString() },
        { "@type": "ListItem", position: 2, name: GIFT_HUB.h1, item: new URL(GIFT_HUB.path, env.APP_URL).toString() },
        { "@type": "ListItem", position: 3, name: page.h1, item: new URL(`${GIFT_HUB.path}/${page.slug}`, env.APP_URL).toString() },
      ],
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <nav aria-label="Você está em" className="text-sm text-slate-500">
        <Link href="/" className="underline">Início</Link> ›{" "}
        <Link href={GIFT_HUB.path} className="underline">Ideias de presente</Link> › <span>Até R$ {page.maxReais}</span>
      </nav>

      <header className="py-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{page.h1}</h1>
        <p className="mt-3 text-lg text-slate-700">{page.intro}</p>
      </header>

      <GiftList groups={page.groups} maxReais={page.maxReais} tag={env.AMAZON_ASSOCIATE_TAG} />

      <Card highlight>
        <h2 className="text-lg font-bold">Acerte de primeira com a lista de desejos</h2>
        <p className="mt-1 text-slate-700">
          No {SITE_NAME}, cada participante pode montar uma lista de desejos que só quem o tirou consegue ver.
        </p>
        <Link href="/criar" className={`${btn.primary} mt-3`}>Criar amigo secreto grátis</Link>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Perguntas frequentes</h2>
        <div className="flex flex-col divide-y divide-slate-100">
          {page.faq.map((f) => (
            <details key={f.q} className="py-3">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <nav aria-label="Outras faixas de preço">
        <h2 className="mb-2 text-sm font-semibold text-slate-600">Outros valores</h2>
        <ul className="flex flex-wrap gap-2">
          {others.map((p) => (
            <li key={p.slug}>
              <Link href={`${GIFT_HUB.path}/${p.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                Até R$ {p.maxReais}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot />
    </PageShell>
  );
}
