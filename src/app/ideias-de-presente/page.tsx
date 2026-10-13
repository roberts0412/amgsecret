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
      <section className="flex flex-col gap-2 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">Como escolher um bom presente de amigo secreto</h2>
        <p>
          O melhor presente nem sempre é o mais caro, e sim o que mostra que você prestou atenção na pessoa. Antes de
          sair comprando, vale seguir três passos simples.
        </p>
        <ul className="ml-5 list-disc">
          <li>
            <strong>Olhe a lista de desejos.</strong> Se a pessoa montou uma, é o caminho mais seguro. Se não montou,
            mande uma pergunta anônima: “você prefere algo útil ou algo divertido?”.
          </li>
          <li>
            <strong>Pense na rotina dela.</strong> Quem trabalha no escritório gosta de itens de mesa; quem vive na
            academia, de garrafinha e acessórios; quem cozinha, de utensílios bonitos.
          </li>
          <li>
            <strong>Respeite o valor combinado.</strong> Passar muito do valor deixa os outros sem graça, e ficar muito
            abaixo parece descaso. Se encontrar algo por menos, complete com um cartão escrito à mão.
          </li>
        </ul>
        <p>
          Quando você não conhece bem quem tirou, como no amigo secreto da firma, prefira presentes úteis e neutros e
          evite perfumes, roupas com tamanho e piadas sobre aparência. Tem mais dicas no guia de{" "}
          <Link href="/guias/amigo-secreto-na-empresa" className="underline">amigo secreto na empresa</Link>.
        </p>
      </section>

      <Card highlight>
        <h2 className="text-lg font-bold">Ainda não sorteou?</h2>
        <p className="mt-1 text-slate-700">Crie o grupo, mande o link no WhatsApp e cada um vê só quem tirou. Grátis.</p>
        <Link href="/criar" className={`${btn.primary} mt-3`}>Criar amigo secreto grátis</Link>
      </Card>
      <AdSlot />
    </PageShell>
  );
}
