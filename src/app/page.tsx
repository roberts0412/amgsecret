import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { GoToGroupForm } from "@/components/forms";
import { GIFT_HUB } from "@/lib/gift-ideas";
import { btn, Card, PageShell } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { GUIDES, GUIDES_HUB } from "@/lib/guides";
import { HOW_IT_WORKS, jsonLdScript, SEO_PAGES } from "@/lib/seo-pages";
import { SITE_NAME } from "@/lib/brand";
import { NAMED_GAME_KINDS, gameTitle } from "@/lib/game-kinds";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: amigo secreto e amigo oculto online e grátis` },
  description:
    "Sorteio online e grátis de amigo secreto, amigo oculto, amigo da onça e amigo chocolate: convite pelo WhatsApp, lista de desejos e mensagens anônimas.",
  alternates: { canonical: "/" },
};

const HOME_FAQ = [
  { q: "É grátis?", a: "Sim. Criar o grupo, convidar, sortear e usar a lista de desejos e as mensagens anônimas não custa nada." },
  { q: "Precisa baixar aplicativo ou criar conta?", a: "Não. Tudo funciona no navegador do celular ou do computador. Cada pessoa entra só com o nome e cria um PIN para recuperar o acesso." },
  { q: "O organizador consegue ver quem tirou quem?", a: "Não. O resultado fica guardado de forma cifrada e cada pessoa vê apenas o próprio. O organizador só acompanha quantas pessoas já viram." },
  { q: "Dá para impedir que casais se tirem?", a: "Sim. Antes do sorteio, o organizador cadastra exclusões, e o sistema só sorteia combinações que respeitem todas elas." },
  { q: "Quantas pessoas podem participar?", a: "A partir de 3 pessoas, com até 50 participantes por grupo." },
];

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
          {NAMED_GAME_KINDS.map((k) => (
            <li key={k.id} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">
              <span aria-hidden>{k.emoji}</span> {gameTitle({ gameKind: k.id })}
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

      <section className="flex flex-col gap-2 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">Por que fazer o sorteio online?</h2>
        <p>
          No papelzinho, sempre tem alguém que tira o próprio nome, o parente que mora longe fica de fora e quem
          organiza acaba sabendo todos os pares. Aqui cada pessoa entra pelo link no próprio celular, o sorteio respeita
          as regras do grupo (como casais que não se tiram) e o resultado fica guardado em segredo, até do organizador.
        </p>
        <p>
          Depois do sorteio, cada participante pode montar uma lista de desejos que só quem o tirou vê e mandar
          mensagens anônimas para tirar dúvidas sobre o presente. Tudo grátis, sem aplicativo e sem cadastro.
        </p>
      </section>

      <section aria-labelledby="guias-home" className="flex flex-col gap-2">
        <h2 id="guias-home" className="text-xl font-bold">Dicas para organizar</h2>
        <ul className="grid gap-2">
          {GUIDES.slice(0, 5).map((g) => (
            <li key={g.slug}>
              <Link href={`${GUIDES_HUB.path}/${g.slug}`} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200 hover:bg-slate-50">
                <span className="text-xl" aria-hidden>{g.emoji}</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{g.h1}</span>
                  <span className="block text-xs text-slate-600">{g.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={GUIDES_HUB.path} className="text-sm font-semibold text-brand underline">Ver todos os guias →</Link>
      </section>

      <nav aria-label="Brincadeiras" className="mt-2">
        <h2 className="mb-2 text-xl font-bold">Escolha a sua brincadeira</h2>
        <ul className="flex flex-wrap gap-2">
          {SEO_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
                {p.h1}
              </Link>
            </li>
          ))}
          <li>
            <Link href={GIFT_HUB.path} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
              🎁 Ideias de presente por valor
            </Link>
          </li>
        </ul>
      </nav>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Perguntas frequentes</h2>
        <div className="flex flex-col divide-y divide-slate-100">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="py-3">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <p className="text-center text-sm text-slate-600">
        Feito com carinho em São Paulo. <Link href="/sobre" className="underline">Conheça o site</Link>.
      </p>

      <AdSlot />
    </PageShell>
  );
}
