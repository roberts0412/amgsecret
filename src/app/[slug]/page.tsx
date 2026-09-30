import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { btn, Card, PageShell } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { getSeoPage, HOW_IT_WORKS, jsonLdScript, SEO_PAGES } from "@/lib/seo-pages";
import { SITE_NAME } from "@/lib/brand";

type Props = { params: Promise<{ slug: string }> };

/** Só os slugs conhecidos existem; qualquer outro vira 404 (sem páginas "fantasma" indexáveis). */
export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getSeoPage((await params).slug);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `/${page.slug}`,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "article",
    },
  };
}

export default async function SeoPage({ params }: Props) {
  const page = getSeoPage((await params).slug);
  if (!page) notFound();
  const base = getEnv().APP_URL;
  const others = SEO_PAGES.filter((p) => p.slug !== page.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: new URL("/", base).toString() },
        { "@type": "ListItem", position: 2, name: page.h1, item: new URL(`/${page.slug}`, base).toString() },
      ],
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      <nav aria-label="Você está em" className="text-sm text-slate-500">
        <Link href="/" className="underline">Início</Link> › <span>{page.h1}</span>
      </nav>

      <article className="flex flex-col gap-4">
        <header className="py-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{page.h1}</h1>
          <p className="mt-3 text-lg text-slate-700">{page.intro}</p>
        </header>

        <Link href="/criar" className={btn.primary}>
          {page.cta ?? "Criar amigo secreto grátis"}
        </Link>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Como funciona</h2>
          <ol className="grid gap-3">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <strong>{s.title}.</strong> {s.text}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        {page.sections.map((s) => (
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

        <Link href="/criar" className={btn.primary}>
          Começar agora — é grátis
        </Link>

        <nav aria-label="Veja também" className="mt-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Veja também</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                  {p.h1}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>

      <AdSlot />
    </PageShell>
  );
}
