import type { Metadata } from "next";
import Link from "next/link";
import { btn, Card, PageShell } from "@/components/ui";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Sobre o site",
  description: `Quem faz o ${SITE_NAME}, por que o site existe, como ele se mantém grátis e como cuidamos do sigilo do sorteio.`,
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <PageShell>
      <article className="flex flex-col gap-4 text-slate-700 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:ml-5 [&_ul]:list-disc">
        <header>
          <p className="text-4xl" aria-hidden>🎁</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Sobre o {SITE_NAME}</h1>
        </header>

        <p>
          Oi! Eu sou o Robert, desenvolvedor de software aqui de São Paulo, e fiz o {SITE_NAME} porque cansei de ver
          amigo secreto dar errado por causa do papelzinho: alguém tirava o próprio nome, o sorteio tinha que ser feito
          de novo, a prima que mora em outra cidade ficava de fora e, no fim, quem organizava acabava sabendo quem tinha
          tirado quem.
        </p>
        <p>
          A ideia era simples: um sorteio que qualquer pessoa consiga usar pelo celular, sem baixar aplicativo e sem
          criar conta, em que cada um vê só o próprio resultado. Com o tempo vieram a lista de desejos, as mensagens
          anônimas, o mural do grupo e os guias com dicas para organizar a brincadeira.
        </p>

        <h2>O que você encontra aqui</h2>
        <ul>
          <li>Sorteio online de amigo secreto, amigo oculto, amigo da onça e amigo chocolate.</li>
          <li>Lista de desejos que só quem te tirou consegue ver.</li>
          <li>Mensagens anônimas para tirar dúvidas sobre o presente.</li>
          <li>
            <Link href="/guias" className="underline">Guias</Link> com regras, dicas para firma, família e escola e
            ideias para a hora da revelação.
          </li>
          <li>
            <Link href="/ideias-de-presente" className="underline">Ideias de presente</Link> organizadas por valor.
          </li>
        </ul>

        <h2>Como o sigilo é garantido</h2>
        <p>
          O resultado do sorteio é guardado de forma cifrada, e nem o organizador do grupo consegue ver os pares. Cada
          participante acessa a própria área por um link privado e um PIN. Páginas com informações do sorteio nunca
          exibem anúncios. Os detalhes estão na <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>

        <h2>Como o site se mantém grátis</h2>
        <p>
          O {SITE_NAME} é gratuito para quem organiza e para quem participa. Para pagar a hospedagem e continuar
          melhorando o site, algumas páginas públicas podem exibir um anúncio discreto, e algumas ideias de presente
          levam a lojas parceiras (se você comprar por elas, o site pode receber uma pequena comissão, sem custo extra
          para você).
        </p>

        <h2>Fale comigo</h2>
        <p>
          Encontrou um problema, tem uma sugestão ou quer contar como foi o seu amigo secreto? Adoro receber mensagens.
          Veja como falar comigo na página de <Link href="/contato" className="underline">contato</Link>.
        </p>

        <Card highlight>
          <h2 className="text-lg font-bold">Organize o seu amigo secreto</h2>
          <p className="mt-1 text-slate-700">Leva menos de um minuto e é grátis.</p>
          <Link href="/criar" className={`${btn.primary} mt-3`}>Criar grupo e sortear</Link>
        </Card>
      </article>
    </PageShell>
  );
}
