import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { ConfirmParticipationForm, CopyButton, JoinGroupForm } from "@/components/forms";
import { NativeShareButton } from "@/components/share-buttons";
import { WallPostForm } from "@/components/social-forms";
import { Wall } from "@/components/social-views";
import { Alert, btn, Card, CardTitle, ExternalLink, PageShell, StatusBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { formatCents, formatWhen } from "@/lib/format";
import { getGroupView } from "@/lib/queries";
import { hasPin } from "@/lib/services/participants";
import { listWall } from "@/lib/services/social";
import { groupUrl, inviteMessage, whatsappShareUrl } from "@/lib/share";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const group = await getGroupView(code);
  if (!group) return { title: "Grupo não encontrado", robots: { index: false } };
  return {
    title: group.name,
    description: `Você foi convidado(a) para o amigo secreto "${group.name}". Entre e confirme sua participação.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `🎁 Amigo secreto: ${group.name}`,
      description: "Entre pelo link e confirme sua participação.",
      siteName: "Amigo Secreto",
      locale: "pt_BR",
      type: "website",
    },
  };
}

/**
 * Página do grupo. ATENÇÃO: esta página exibe anúncio (script de terceiros),
 * então NÃO pode conter segredos: nada de token/link privado, PIN ou pares.
 * Tudo isso fica em /grupo/<código>/eu (sem anúncios).
 */
export default async function GroupPage({ params, searchParams }: Props) {
  const { code: rawCode } = await params;
  const group = await getGroupView(rawCode);
  if (!group) notFound();
  const { code } = group;
  if (rawCode !== code) redirect(`/grupo/${code}`); // URL canônica (maiúsculas)

  const sp = await searchParams;
  const me = await getSession(code);
  const [meHasPin, wall] = me ? await Promise.all([hasPin(getDb(), me), listWall(getDb(), me)]) : [false, []];
  const publicUrl = groupUrl(getEnv().APP_URL, code);
  const when = formatWhen(group.eventDate, group.eventTime);
  const pending = group.participants.length - group.confirmedCount;

  return (
    <PageShell>
      {me && sp.novo === "1" && me.role === "ORGANIZER" && (
        <Alert tone="success">
          Grupo criado! 🎉 Convide a galera pelo WhatsApp e{" "}
          <Link href={`/grupo/${code}/eu`} className="font-semibold underline">guarde seu link privado</Link>.
        </Alert>
      )}
      {me && sp.entrou === "1" && <Alert tone="success">Você entrou no grupo! Confirme sua participação abaixo.</Alert>}
      {me && !meHasPin && (
        <Alert>
          🔒 Você ainda não tem PIN de recuperação.{" "}
          <Link href={`/grupo/${code}/eu`} className="font-semibold underline">Criar agora</Link>
        </Alert>
      )}

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
          {me.status === "CONFIRMED" && group.status === "DRAWN" && (
            <p className="text-slate-700">O sorteio foi feito! 🎉</p>
          )}
          {me.status === "INVITED" && group.status === "DRAWN" && (
            <p className="text-slate-700">O sorteio foi feito antes da sua confirmação. Fale com o organizador.</p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <Link href={`/grupo/${code}/eu`} className={group.status === "DRAWN" ? btn.primary : btn.secondary}>
              {group.status === "DRAWN" ? "🎁 Ver meu amigo secreto" : "👤 Minha área: desejos e link privado"}
            </Link>
            {me.role === "ORGANIZER" && (
              <Link href={`/grupo/${code}/admin`} className={btn.secondary}>
                ⚙️ Painel do organizador
              </Link>
            )}
          </div>
        </Card>
      ) : group.status === "OPEN" ? (
        <Card>
          <CardTitle>Participar</CardTitle>
          <JoinGroupForm code={code} />
          <p className="mt-4 text-center text-sm">
            Já participa?{" "}
            <Link href={`/grupo/${code}/recuperar`} className="font-medium text-brand underline">
              Recuperar meu acesso
            </Link>
          </p>
        </Card>
      ) : (
        <Alert>
          O sorteio deste grupo já foi realizado. Se você participa, abra o seu <strong>link privado</strong> ou{" "}
          <Link href={`/grupo/${code}/recuperar`} className="font-medium underline">
            recupere seu acesso com o PIN
          </Link>
          .
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
            <NativeShareButton title={`Amigo secreto: ${group.name}`} text={inviteMessage(group, publicUrl)} />
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

      {me && (
        <Card>
          <CardTitle>💬 Mural do grupo</CardTitle>
          <div className="flex flex-col gap-4">
            <WallPostForm code={code} />
            <Wall posts={wall} code={code} />
          </div>
        </Card>
      )}

      <AdSlot plan={group.plan} />
    </PageShell>
  );
}
