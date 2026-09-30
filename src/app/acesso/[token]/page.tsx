import type { Metadata } from "next";
import { gameTerm } from "@/lib/game-kinds";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessForm } from "@/components/forms";
import { btn, Card, PageShell } from "@/components/ui";
import { getSessionToken } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { findByAccessToken } from "@/lib/services/participants";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Link privado",
  robots: { index: false, follow: false },
  // não gera prévia com dados do grupo em apps de mensagem
  openGraph: null,
};

/**
 * Link privado: /acesso/<token>.
 * GET só mostra "Entrar como Fulano?" — o login acontece num POST (botão).
 * Assim, pré-visualizações do WhatsApp e links maliciosos não logam ninguém
 * sem querer (login CSRF).
 */
export default async function AccessPage({ params }: Props) {
  const { token } = await params;
  const found = await findByAccessToken(getDb(), token);

  if (!found) {
    return (
      <PageShell>
        <Card className="text-center">
          <p className="text-4xl" aria-hidden>🔒</p>
          <h1 className="mt-2 text-xl font-bold">Link inválido</h1>
          <p className="mt-2 text-slate-600">Este link não existe mais ou foi copiado incompleto. Fale com o organizador.</p>
          <Link href="/" className={`${btn.secondary} mt-4`}>
            Ir para o início
          </Link>
        </Card>
      </PageShell>
    );
  }

  // já está logado com este mesmo link neste aparelho
  if ((await getSessionToken(found.groupCode)) === token) redirect(`/grupo/${found.groupCode}`);

  return (
    <PageShell>
      <Card>
        <p className="text-4xl" aria-hidden>🔑</p>
        <h1 className="mt-2 text-xl font-bold">Olá, {found.name}!</h1>
        <p className="mt-2 mb-4 text-slate-600">
          Este é o seu link privado do {gameTerm(found)} <strong>{found.groupName}</strong>.
        </p>
        <AccessForm token={token} name={found.name} groupName={found.groupName} />
        <p className="mt-3 text-xs text-slate-500">Não é você? Feche esta página — este link é pessoal.</p>
      </Card>
    </PageShell>
  );
}
