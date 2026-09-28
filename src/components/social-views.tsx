import type { MessageView, WallPostView, WishView } from "@/lib/services/social";
import { formatCents } from "@/lib/format";
import { DeleteWallPostButton, DeleteWishButton } from "./social-forms";

/** "hoje", "ontem" ou "dd/mm" (sem horário, de propósito). */
export function dayLabel(day: string, today: string): string {
  if (day === today) return "hoje";
  const y = new Date(`${today}T00:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  if (day === y.toISOString().slice(0, 10)) return "ontem";
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

export function WishList({ wishes, code, editable }: { wishes: WishView[]; code: string; editable: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {wishes.map((w) => (
        <li key={w.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold break-words">{w.product}</p>
              {w.approxPriceCents !== null && <p className="text-sm text-slate-600">≈ {formatCents(w.approxPriceCents)}</p>}
            </div>
            {editable && <DeleteWishButton code={code} wishId={w.id} />}
          </div>
          {w.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-700 break-words">{w.description}</p>}
          {w.note && <p className="mt-1 whitespace-pre-line text-sm text-slate-500 break-words">📝 {w.note}</p>}
          {w.url && (
            <a
              href={w.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="mt-2 inline-block text-sm font-medium text-brand underline"
            >
              Ver produto em {hostOf(w.url)} ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Conversation({
  messages, today, otherLabel, empty,
}: {
  messages: MessageView[]; today: string; otherLabel: string; empty: string;
}) {
  if (messages.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {messages.map((m, i) => (
        <li key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.mine ? "bg-brand text-white" : "bg-slate-100 text-slate-900"}`}>
            <p className="text-xs opacity-75">{m.mine ? "Você" : otherLabel} · {dayLabel(m.day, today)}</p>
            <p className="whitespace-pre-line break-words">{m.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Wall({ posts, code }: { posts: WallPostView[]; code: string }) {
  if (posts.length === 0) return <p className="text-sm text-slate-500">Ninguém escreveu ainda. Comece a conversa!</p>;
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((p) => (
        <li key={p.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm"><strong>{p.authorName}</strong> <span className="text-slate-500">· {fmt.format(p.createdAt)}</span></p>
            {p.canDelete && <DeleteWallPostButton code={code} postId={p.id} />}
          </div>
          <p className="mt-1 whitespace-pre-line break-words">{p.body}</p>
        </li>
      ))}
    </ul>
  );
}
