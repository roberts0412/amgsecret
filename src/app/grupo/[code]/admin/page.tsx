import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditGroupForm, RemoveParticipantButton } from "@/components/forms";
import { Card, CardTitle, PageShell, StatusBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { MIN_PARTICIPANTS } from "@/lib/draw/draw";
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

  const view = await getOrganizerView(getDb(), me);
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
        <ul className="grid gap-1 text-sm">
          <li>{confirmed >= MIN_PARTICIPANTS ? "✅" : "⬜"} Pelo menos {MIN_PARTICIPANTS} participantes confirmados ({confirmed})</li>
          <li>{waiting === 0 ? "✅" : "⚠️"} {waiting === 0 ? "Todos confirmaram" : `${waiting} ainda não confirmou — fica de fora do sorteio`}</li>
        </ul>
        <p className="mt-3 text-sm text-slate-500">Exclusões e o botão de sortear chegam na próxima etapa.</p>
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
