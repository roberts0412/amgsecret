import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logoutAction } from "@/actions/groups";
import { RevealFriend } from "@/components/draw-forms";
import { CopyButton, SetPinForm } from "@/components/forms";
import { AddWishForm, ReplyToSantaForm } from "@/components/social-forms";
import { gameTerm } from "@/lib/game-kinds";
import { Conversation, WishList } from "@/components/social-views";
import { Alert, btn, Card, CardTitle, ExternalLink, PageShell } from "@/components/ui";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { getMyResultState } from "@/lib/services/draws";
import { hasPin } from "@/lib/services/participants";
import { conversationWithSanta, listMyWishes, MAX_WISHES } from "@/lib/services/social";
import { whatsappShareUrl } from "@/lib/share";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { todayInEventTz } from "@/lib/validation";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = { title: "Minha área", robots: { index: false, follow: false } };

/**
 * Área privada do participante — SEM anúncios (tem link privado e dados
 * secretos). O nome do amigo secreto não vem no HTML: só aparece ao tocar
 * em "Revelar" (Server Action) ou ao abrir /eu/amigo de propósito.
 */
export default async function MyAreaPage({ params, searchParams }: Props) {
  const { code: rawCode } = await params;
  const code = normalizeGroupCode(rawCode);
  if (!code) notFound();
  if (rawCode !== code) redirect(`/grupo/${code}/eu`);

  const me = await getSession(code);
  if (!me) redirect(`/grupo/${code}`);
  const sp = await searchParams;
  const db = getDb();
  const [result, wishes, fromSanta, meHasPin, token] = await Promise.all([
    getMyResultState(db, me),
    listMyWishes(db, me),
    conversationWithSanta(db, me),
    hasPin(db, me),
    getSessionToken(code),
  ]);
  const privateUrl = token ? new URL(`/acesso/${token}`, getEnv().APP_URL).toString() : null;
  const today = todayInEventTz();
  const term = gameTerm(me.group.gameKind);

  return (
    <PageShell>
      <Link href={`/grupo/${code}`} className="text-sm text-brand underline">
        ← {me.group.name}
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Minha área</h1>
      {sp.recuperado === "1" && (
        <Alert tone="success">
          Acesso recuperado! 🔑 Seu link privado mudou — o antigo não funciona mais. Guarde o novo abaixo.
        </Alert>
      )}

      <Card>
        <CardTitle>{`🎁 Meu ${term}`}</CardTitle>
        {result.state === "NOT_DRAWN" && (
          <p className="text-slate-700">⏳ O sorteio ainda não foi feito. Volte aqui depois que o organizador sortear!</p>
        )}
        {result.state === "NOT_IN_DRAW" && (
          <p className="text-slate-700">
            Você não entrou neste sorteio (sua participação não estava confirmada). Fale com o organizador.
          </p>
        )}
        {result.state === "READY" && (
          <>
            <RevealFriend code={code} alreadyViewed={result.viewed} term={term} />
            <Link href={`/grupo/${code}/eu/amigo`} className={`${btn.secondary} mt-4`}>
              Ver lista de desejos e mandar mensagem anônima
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">Sorteio de {formatDateTime(result.drawnAt)}</p>
          </>
        )}
      </Card>

      {result.state === "READY" && (
        <Card>
          <CardTitle>💌 Mensagens de quem te tirou</CardTitle>
          <div className="flex flex-col gap-4">
            <Conversation messages={fromSanta} today={today} otherLabel={`Seu ${term}`}
              empty="Nenhuma mensagem ainda. Quem te tirou pode te mandar mensagens anônimas por aqui." />
            <ReplyToSantaForm code={code} term={term} />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>📝 Minha lista de desejos <span className="text-sm font-normal text-slate-500">(opcional)</span></CardTitle>
        <p className="mb-3 text-sm text-slate-600">
          Ajuda quem te tirou a acertar no presente. Só essa pessoa vê a sua lista, e só depois do sorteio.
        </p>
        <div className="flex flex-col gap-3">
          {wishes.length > 0 && <WishList wishes={wishes} code={code} editable />}
          {wishes.length < MAX_WISHES ? (
            <AddWishForm code={code} />
          ) : (
            <p className="text-sm text-slate-500">Você atingiu o limite de {MAX_WISHES} desejos.</p>
          )}
        </div>
      </Card>

      <Card highlight>
        <CardTitle>🔑 Seu link privado</CardTitle>
        <p className="mb-3 text-sm text-slate-700">
          É a sua chave para ver quem você tirou, neste ou em outro celular. <strong>Guarde e não compartilhe.</strong>
        </p>
        {privateUrl && (
          <div className="flex flex-col gap-2">
            <CopyButton text={privateUrl} label="Copiar meu link privado" />
            <ExternalLink
              href={whatsappShareUrl(`🔑 Meu link privado do ${term} "${me.group.name}" (não compartilhe):\n${privateUrl}`)}
              className={btn.secondary}
            >
              Salvar no meu WhatsApp
            </ExternalLink>
            <p className="text-xs text-slate-500">
              Dica: no WhatsApp, envie para você mesmo (&quot;Você&quot; no topo da lista de contatos).
            </p>
          </div>
        )}
        {meHasPin ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-600">Trocar meu PIN</summary>
            <div className="mt-3">
              <SetPinForm code={code} hasPin />
            </div>
          </details>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Crie seu PIN de recuperação</p>
            <p className="mb-3 text-sm text-slate-600">Sem PIN, se você perder o link não será possível recuperar o acesso.</p>
            <SetPinForm code={code} hasPin={false} />
          </div>
        )}
        <form action={logoutAction} className="mt-3 text-center">
          <input type="hidden" name="code" value={code} />
          <button type="submit" className="text-sm text-slate-500 underline">
            Sair deste aparelho
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
