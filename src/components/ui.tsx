import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Componentes visuais simples (servidor). */

export const btn = {
  primary:
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60",
  secondary:
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60",
  whatsapp:
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]",
  // min-h-11 (44px): área de toque mínima recomendada no celular
  danger:
    "inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60",
};

export function Card({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  /** Borda de destaque (ex.: link privado). Prop própria para não conflitar classes de ring. */
  highlight?: boolean;
}) {
  const ring = highlight ? "ring-2 ring-amber-300" : "ring-1 ring-slate-900/5";
  return <section className={`rounded-2xl bg-white p-5 shadow-sm ${ring} ${className}`}>{children}</section>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold">{children}</h2>;
}

const badgeStyles = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-100 text-rose-800",
};

export function Badge({ color, children }: { color: keyof typeof badgeStyles; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[color]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: "INVITED" | "CONFIRMED" }) {
  return status === "CONFIRMED" ? <Badge color="green">confirmado</Badge> : <Badge color="amber">aguardando</Badge>;
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand">
          <span aria-hidden>🎁</span> Amigo Secreto
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-4 pb-10">{children}</main>
      <footer className="py-6 text-center text-xs text-slate-500">
        Cada participante vê somente o próprio amigo secreto.
      </footer>
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const styles = {
    info: "bg-sky-50 text-sky-900 ring-sky-200",
    success: "bg-green-50 text-green-900 ring-green-200",
    error: "bg-red-50 text-red-900 ring-red-200",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm ring-1 ${styles}`}>
      {children}
    </div>
  );
}

export function ExternalLink(props: ComponentProps<"a">) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}
