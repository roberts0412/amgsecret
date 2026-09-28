import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecoverAccessForm } from "@/components/forms";
import { Card, CardTitle, PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getGroupView } from "@/lib/queries";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Recuperar acesso", robots: { index: false, follow: false } };

export default async function RecoverPage({ params }: Props) {
  const { code: rawCode } = await params;
  const group = await getGroupView(rawCode);
  if (!group) notFound();
  if (rawCode !== group.code) redirect(`/grupo/${group.code}/recuperar`);
  if (await getSession(group.code)) redirect(`/grupo/${group.code}`); // já está logado

  return (
    <PageShell>
      <Link href={`/grupo/${group.code}`} className="text-sm text-brand underline">
        ← Voltar ao grupo
      </Link>
      <Card>
        <p className="text-sm font-medium text-brand">{group.name}</p>
        <CardTitle>Recuperar meu acesso</CardTitle>
        <p className="mb-4 text-sm text-slate-700">
          Perdeu o link ou trocou de celular? Informe seu nome e o PIN que você criou ao entrar no grupo.
          Um <strong>novo link privado</strong> será criado e o antigo deixará de funcionar.
        </p>
        <RecoverAccessForm code={group.code} />
      </Card>
      <p className="text-center text-sm text-slate-500">
        Esqueceu o PIN? Por segurança, nem o organizador consegue recuperá-lo.
      </p>
    </PageShell>
  );
}
