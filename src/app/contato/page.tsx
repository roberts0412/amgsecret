import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, PageShell } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contato",
  description: `Fale com o ${SITE_NAME}: dúvidas, sugestões, problemas no sorteio e pedidos sobre os seus dados.`,
  alternates: { canonical: "/contato" },
};

const TIKTOK_URL = "https://www.tiktok.com/@_seuamigosecreto";

export default function ContactPage() {
  const contact = getEnv().CONTACT_EMAIL;
  return (
    <PageShell>
      <article className="flex flex-col gap-4 text-slate-700 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:ml-5 [&_ul]:list-disc">
        <header>
          <p className="text-4xl" aria-hidden>✉️</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Contato</h1>
        </header>

        <p>
          Tem alguma dúvida, encontrou um erro ou quer sugerir uma melhoria? Pode mandar mensagem, eu leio todas e
          costumo responder em até dois dias úteis.
        </p>

        <h2>Como falar comigo</h2>
        <ul>
          {contact && (
            <li>
              E-mail: <a href={`mailto:${contact}`} className="underline">{contact}</a>
            </li>
          )}
          <li>
            TikTok: <ExternalLink href={TIKTOK_URL} className="underline">@_seuamigosecreto</ExternalLink> (mensagem direta)
          </li>
        </ul>

        <h2>Antes de escrever, veja se ajuda</h2>
        <ul>
          <li>
            <strong>Perdi o link do meu grupo:</strong> abra o link do grupo que foi enviado no WhatsApp e use a opção de
            recuperar acesso com o seu PIN.
          </li>
          <li>
            <strong>Quero saber quem eu tirei:</strong> o resultado aparece só no seu link privado. Por segurança, nem eu
            nem o organizador conseguimos ver os pares.
          </li>
          <li>
            <strong>Dúvidas sobre como organizar:</strong> os <Link href="/guias" className="underline">guias</Link> têm
            regras, dicas e ideias para cada tipo de grupo.
          </li>
        </ul>

        <h2>Seus dados</h2>
        <p>
          Para pedir acesso, correção ou exclusão dos seus dados, escreva pelos canais acima informando o nome do grupo e
          o seu nome no grupo. Mais detalhes na <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </article>
    </PageShell>
  );
}
