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
import { Card, CardTitle, PageShell, StatusBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { MIN_PARTICIPANTS } from "@/lib/draw/draw";
import { formatDateTime } from "@/lib/format";
import { getDrawReadiness, listExclusions } from "@/lib/services/draws";
import { getOrganizerView, getPublicGroupView } from "@/lib/services/groups";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Painel do organizador", robots: { index: false, follow: false } };

/** Formata centavos para o campo de edição ("100" ou "99,90"). */
function centsToInput(cents: number | null): string | undefined {
  if (cents === null) return undefined;
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}

export default async function AdminPage({ params }: Props) {
  const { code: rawCode } = await params;
  const group = await getPublicGroupView(getDb(), rawCode);
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
              <StatusBadge status={p.status} />
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
    </PageShell>
  );
}
