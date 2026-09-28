import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AddExclusionForm,
  RedoDrawButton,
  RemoveExclusionButton,
  ReopenGroupButton,
  RunDrawButton,
} from "@/components/draw-forms";
import { EditGroupForm, RemoveParticipantButton } from "@/components/forms";
import { DeleteGroupForm, ThemePicker } from "@/components/share-buttons";
import { Badge, btn, Card, CardTitle, ExternalLink, PageShell, StatusBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { MIN_PARTICIPANTS } from "@/lib/draw/draw";
import { formatDateTime } from "@/lib/format";
import { getEnv } from "@/lib/env";
import { PLANS } from "@/lib/plans";
import { getDrawReadiness, listExclusions } from "@/lib/services/draws";
import { drawDoneMessage, groupUrl, notViewedReminderMessage, reminderMessage, whatsappShareUrl } from "@/lib/share";
import { effectiveTheme, THEMES } from "@/lib/themes";
import { getGroupView } from "@/lib/queries";
import { getOrganizerView } from "@/lib/services/groups";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Painel do organizador", robots: { index: false, follow: false } };

/** Formata centavos para o campo de edição ("100" ou "99,90"). */
function centsToInput(cents: number | null): string | undefined {
  if (cents === null) return undefined;
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}

export default async function AdminPage({ params }: Props) {
  const { code: rawCode } = await params;
  const group = await getGroupView(rawCode);
  if (!group) notFound();
  const { code } = group;

  const me = await getSession(code);
  // não revela o painel a quem não é organizador — volta para a página do grupo
  if (!me || me.role !== "ORGANIZER") redirect(`/grupo/${code}`);

  const [view, readiness, exclusions] = await Promise.all([
    getOrganizerView(getDb(), me),
    getDrawReadiness(getDb(), me),
    listExclusions(getDb(), me),
  ]);
  const confirmed = view.participants.filter((p) => p.status === "CONFIRMED").length;
  const waiting = view.participants.length - confirmed;
  const isOpen = group.status === "OPEN";
  const publicUrl = groupUrl(getEnv().APP_URL, code);
  const pendingNames = view.participants.filter((p) => p.status === "INVITED").map((p) => p.name);
  const notViewedNames = view.participants.filter((p) => p.viewed === false).map((p) => p.name);
  const everyoneViewed = readiness.status === "DRAWN" && readiness.pairCount > 0 && notViewedNames.length === 0;

  return (
    <PageShell>
      <Link href={`/grupo/${code}`} className="text-sm text-brand underline">
        ← Voltar ao grupo
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Painel do organizador</h1>

      <Card>
        <CardTitle>Participantes</CardTitle>
        <ul className="divide-y divide-slate-100">
          {view.participants.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 flex-1 truncate">
                {p.name}
                {p.role === "ORGANIZER" && <span className="ml-1 text-xs text-slate-500">· você</span>}
              </span>
              {p.viewed === null ? (
                <StatusBadge status={p.status} />
              ) : p.viewed ? (
                <Badge color="green">já viu ✓</Badge>
              ) : (
                <Badge color="amber">ainda não viu</Badge>
              )}
              {isOpen && p.role !== "ORGANIZER" && (
                <RemoveParticipantButton code={code} participantId={p.id} name={p.name} />
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-500">
          {confirmed} confirmado{confirmed === 1 ? "" : "s"} · {waiting} aguardando · limite de {view.maxParticipants}
        </p>
      </Card>

      <Card>
        <CardTitle>Sorteio</CardTitle>
        {readiness.status === "DRAWN" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-xl bg-green-50 p-3 text-green-900 ring-1 ring-green-200">
              ✅ Sorteio realizado{readiness.drawnAt && ` em ${formatDateTime(readiness.drawnAt)}`}.{" "}
              <strong>{readiness.viewedCount}</strong> de {readiness.pairCount} já viram o resultado.
            </p>
            {readiness.pairCount > 0 && (
              <div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Quantos já viram o resultado"
                  aria-valuemin={0}
                  aria-valuemax={readiness.pairCount}
                  aria-valuenow={readiness.viewedCount}
                >
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.round((readiness.viewedCount / readiness.pairCount) * 100)}%` }} />
                </div>
                {everyoneViewed ? (
                  <p className="mt-2 font-semibold text-green-800">🎉 Todo mundo já viu quem tirou!</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">
                    Ainda não viram: <strong>{notViewedNames.join(", ")}</strong>
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-slate-600">
              Nem você, como organizador, consegue ver quem tirou quem. 🔒
            </p>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Precisa mudar algo?</summary>
              <div className="mt-3 flex flex-col gap-3">
                <RedoDrawButton code={code} />
                <ReopenGroupButton code={code} />
                <p className="text-xs text-slate-500">
                  Refazer sorteia de novo com os mesmos confirmados. Reabrir permite mudar participantes e exclusões
                  antes de sortear de novo. Em ambos, os resultados e mensagens anteriores são apagados.
                </p>
              </div>
            </details>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="grid gap-1 text-sm">
              <li>{readiness.confirmed >= MIN_PARTICIPANTS ? "✅" : "⬜"} Pelo menos {MIN_PARTICIPANTS} confirmados ({readiness.confirmed})</li>
              <li>
                {readiness.invited === 0 ? "✅ Todos confirmaram" : `⚠️ ${readiness.invited} ainda não confirmou — fica de fora do sorteio`}
              </li>
              {readiness.confirmed >= MIN_PARTICIPANTS && (
                <li>{readiness.possible ? "✅ As exclusões permitem o sorteio" : "❌ As exclusões atuais impedem o sorteio"}</li>
              )}
            </ul>
            {readiness.confirmed >= MIN_PARTICIPANTS && !readiness.possible && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-200" role="alert">
                Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões.
              </p>
            )}
            <RunDrawButton code={code} disabled={readiness.confirmed < MIN_PARTICIPANTS || !readiness.possible} />
          </div>
        )}
      </Card>

      {((isOpen && pendingNames.length > 0) || readiness.status === "DRAWN") && (
        <Card>
          <CardTitle>📣 Avisar o grupo</CardTitle>
          {readiness.status === "DRAWN" ? (
            <div className="flex flex-col gap-2">
              {notViewedNames.length > 0 && (
                <ExternalLink
                  href={whatsappShareUrl(notViewedReminderMessage(group.name, notViewedNames, publicUrl))}
                  className={btn.whatsapp}
                >
                  Cobrar quem ainda não viu ({notViewedNames.length})
                </ExternalLink>
              )}
              <ExternalLink href={whatsappShareUrl(drawDoneMessage(group.name, publicUrl))} className={notViewedNames.length > 0 ? btn.secondary : btn.whatsapp}>
                Avisar que o sorteio foi feito
              </ExternalLink>
            </div>
          ) : (
            <ExternalLink href={whatsappShareUrl(reminderMessage(group.name, pendingNames, publicUrl))} className={btn.whatsapp}>
              Cobrar quem não confirmou ({pendingNames.length})
            </ExternalLink>
          )}
        </Card>
      )}

      <Card>
        <CardTitle>Exclusões</CardTitle>
        <p className="mb-3 text-sm text-slate-600">Ex.: casais ou irmãos que não devem se tirar.</p>
        {exclusions.length > 0 && (
          <ul className="mb-4 divide-y divide-slate-100">
            {exclusions.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong>{e.participantName}</strong> não pode tirar <strong>{e.excludedName}</strong>
                </span>
                {isOpen && <RemoveExclusionButton code={code} exclusionId={e.id} />}
              </li>
            ))}
          </ul>
        )}
        {isOpen ? (
          view.participants.length >= 2 ? (
            <AddExclusionForm code={code} participants={view.participants.map((p) => ({ id: p.id, name: p.name }))} />
          ) : (
            <p className="text-sm text-slate-500">Convide mais pessoas para criar exclusões.</p>
          )
        ) : (
          <p className="text-sm text-slate-500">Para mudar exclusões, reabra o grupo.</p>
        )}
      </Card>

      <Card>
        <CardTitle>🎨 Tema do grupo</CardTitle>
        <ThemePicker
          code={code}
          themes={THEMES}
          current={effectiveTheme(group.theme, group.plan)}
          allowed={[...PLANS[group.plan].themes]}
        />
      </Card>

      <Card>
        <CardTitle>Dados do evento</CardTitle>
        <EditGroupForm
          code={code}
          defaults={{
            name: group.name,
            description: group.description ?? undefined,
            eventDate: group.eventDate ?? undefined,
            eventTime: group.eventTime ?? undefined,
            location: group.location ?? undefined,
            giftValue: centsToInput(group.giftValueCents),
          }}
        />
      </Card>
      <details className="rounded-2xl bg-white p-5 ring-1 ring-red-200">
        <summary className="cursor-pointer font-semibold text-red-800">Excluir grupo</summary>
        <p className="my-3 text-sm text-slate-600">
          Apaga o grupo e todos os dados dele (participantes, sorteio, listas de desejos, mensagens e mural).
          Não dá para desfazer.
        </p>
        <DeleteGroupForm code={code} />
      </details>
    </PageShell>
  );
}
