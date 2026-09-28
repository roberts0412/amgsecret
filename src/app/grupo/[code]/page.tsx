import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logoutAction } from "@/actions/groups";
import { ConfirmParticipationForm, CopyButton, JoinGroupForm } from "@/components/forms";
import { Alert, btn, Card, CardTitle, ExternalLink, PageShell, StatusBadge } from "@/components/ui";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { formatCents, formatWhen } from "@/lib/format";
import { getPublicGroupView } from "@/lib/services/groups";
import { groupUrl, inviteMessage, whatsappShareUrl } from "@/lib/share";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const group = await getPublicGroupView(getDb(), code);
  if (!group) return { title: "Grupo não encontrado", robots: { index: false } };
  return {
    title: group.name,
    description: `Você foi convidado(a) para o amigo secreto "${group.name}". Entre e confirme sua participação.`,
    robots: { index: false, follow: false },
    openGraph: { title: `🎁 Amigo secreto: ${group.name}`, description: "Entre pelo link e confirme sua participação." },
  };
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { code: rawCode } = await params;
  const group = await getPublicGroupView(getDb(), rawCode);
  if (!group) notFound();
  const { code } = group;
  if (rawCode !== code) redirect(`/grupo/${code}`); // URL canônica (maiúsculas)

  const sp = await searchParams;
  const me = await getSession(code);
  const token = me ? await getSessionToken(code) : null;
  const { APP_URL } = getEnv();
  const publicUrl = groupUrl(APP_URL, code);
  const privateUrl = token ? new URL(`/acesso/${token}`, APP_URL).toString() : null;
  const when = formatWhen(group.eventDate, group.eventTime);
  const pending = group.participants.length - group.confirmedCount;

  return (
    <PageShell>
      {me && sp.novo === "1" && me.role === "ORGANIZER" && (
        <Alert tone="success">Grupo criado! 🎉 Agora convide a galera pelo WhatsApp.</Alert>
      )}
      {me && sp.entrou === "1" && <Alert tone="success">Você entrou no grupo! Confirme sua participação abaixo.</Alert>}

      <Card>
        <p className="text-sm font-medium text-brand">Amigo secreto</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{group.name}</h1>
        <dl className="mt-3 grid gap-1.5 text-slate-700">
          {when && (
            <div className="flex gap-2">
              <dt aria-label="Quando">📅</dt>
              <dd className="first-letter:uppercase">{when}</dd>
            </div>
          )}
          {group.location && (
            <div className="flex gap-2">
              <dt aria-label="Local">📍</dt>
              <dd>{group.location}</dd>
            </div>
          )}
          {group.giftValueCents !== null && (
            <div className="flex gap-2">
              <dt aria-label="Valor do presente">💰</dt>
              <dd>Presente de até {formatCents(group.giftValueCents)}</dd>
            </div>
          )}
        </dl>
        {group.description && <p className="mt-3 whitespace-pre-line text-slate-700">{group.description}</p>}
        {group.status === "DRAWN" && (
          <p className="mt-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">Sorteio realizado ✓</span>
          </p>
        )}
      </Card>

      {me ? (
        <Card>
          <CardTitle>Olá, {me.name}!</CardTitle>
          {me.status === "INVITED" && group.status === "OPEN" && (
            <>
              <p className="mb-3 text-slate-700">Confirme que você vai participar para entrar no sorteio.</p>
              <ConfirmParticipationForm code={code} />
            </>
          )}
          {me.status === "CONFIRMED" && group.status === "OPEN" && (
            <p className="text-slate-700">Sua participação está confirmada ✓ Aguarde o sorteio.</p>
          )}
          {me.status === "INVITED" && group.status === "DRAWN" && (
            <p className="text-slate-700">O sorteio foi feito antes da sua confirmação. Fale com o organizador.</p>
          )}
          {me.role === "ORGANIZER" && (
            <Link href={`/grupo/${code}/admin`} className={`${btn.secondary} mt-3`}>
              ⚙️ Painel do organizador
            </Link>
          )}
        </Card>
      ) : group.status === "OPEN" ? (
        <Card>
          <CardTitle>Participar</CardTitle>
          <JoinGroupForm code={code} />
        </Card>
      ) : (
        <Alert>
          O sorteio deste grupo já foi realizado. Se você participa, abra o seu <strong>link privado</strong> para ver quem
          você tirou.
        </Alert>
      )}

      {me && (
        <Card>
          <CardTitle>Convidar</CardTitle>
          <div className="flex flex-col gap-2">
            <ExternalLink href={whatsappShareUrl(inviteMessage(group, publicUrl))} className={btn.whatsapp}>
              Compartilhar no WhatsApp
            </ExternalLink>
            <CopyButton text={publicUrl} label="Copiar link do grupo" />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>
          Participantes <span className="font-normal text-slate-500">({group.participants.length})</span>
        </CardTitle>
        <ul className="divide-y divide-slate-100">
          {group.participants.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                {p.name}
                {p.nickname && <span className="text-slate-500"> ({p.nickname})</span>}
                {p.isOrganizer && <span className="ml-1 text-xs text-slate-500">· organizador</span>}
              </span>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-500">
          {group.confirmedCount} confirmado{group.confirmedCount === 1 ? "" : "s"}
          {pending > 0 && ` · ${pending} aguardando`}
        </p>
      </Card>

      {me && privateUrl && (
        <Card highlight>
          <CardTitle>🔑 Seu link privado</CardTitle>
          <p className="mb-3 text-sm text-slate-700">
            É a sua chave para ver quem você tirou, neste ou em outro celular. <strong>Guarde e não compartilhe.</strong>
          </p>
          <CopyButton text={privateUrl} label="Copiar meu link privado" />
          <form action={logoutAction} className="mt-3 text-center">
            <input type="hidden" name="code" value={code} />
            <button type="submit" className="text-sm text-slate-500 underline">
              Sair deste aparelho
            </button>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
