import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RevealFriend } from "@/components/draw-forms";
import { Card, CardTitle, PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDateTime } from "@/lib/format";
import { getMyResultState } from "@/lib/services/draws";
import { normalizeGroupCode } from "@/lib/security/tokens";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Meu amigo secreto", robots: { index: false, follow: false } };

/**
 * Área do participante. Esta página NÃO carrega o nome do amigo secreto:
 * ele só é buscado (via Server Action autenticada) quando a pessoa toca em
 * "Revelar". Assim o segredo não fica no HTML, em cache ou em prévias.
 */
export default async function MyAreaPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = normalizeGroupCode(rawCode);
  if (!code) notFound();
  if (rawCode !== code) redirect(`/grupo/${code}/eu`);

  const me = await getSession(code);
  if (!me) redirect(`/grupo/${code}`);
  const result = await getMyResultState(getDb(), me);

  return (
    <PageShell>
      <Link href={`/grupo/${code}`} className="text-sm text-brand underline">
        ← {me.group.name}
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Meu amigo secreto</h1>

      <Card>
        {result.state === "NOT_DRAWN" && (
          <div className="text-center">
            <p className="text-5xl" aria-hidden>⏳</p>
            <p className="mt-2 text-slate-700">O sorteio ainda não foi feito. Volte aqui depois que o organizador sortear!</p>
          </div>
        )}
        {result.state === "NOT_IN_DRAW" && (
          <p className="text-slate-700">
            Você não entrou neste sorteio (sua participação não estava confirmada). Fale com o organizador.
          </p>
        )}
        {result.state === "READY" && (
          <>
            <RevealFriend code={code} alreadyViewed={result.viewed} />
            <p className="mt-4 text-center text-xs text-slate-500">Sorteio de {formatDateTime(result.drawnAt)}</p>
          </>
        )}
      </Card>

      {result.state === "READY" && (
        <Card>
          <CardTitle>Em breve</CardTitle>
          <p className="text-sm text-slate-600">
            Lista de desejos do seu amigo secreto e mensagens anônimas chegam na próxima etapa.
          </p>
        </Card>
      )}
    </PageShell>
  );
}
