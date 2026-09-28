import type { ReactNode } from "react";
import { PageShell } from "./ui";

/** Layout simples para páginas de texto (privacidade, termos). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <PageShell>
      <article className="flex flex-col gap-4 text-slate-700 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:ml-5 [&_ul]:list-disc">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">Atualizado em {updated}</p>
        </header>
        {children}
      </article>
    </PageShell>
  );
}
