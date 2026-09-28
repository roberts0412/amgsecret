"use client";

import Link from "next/link";
import { useEffect } from "react";
import { btn } from "@/components/ui";

/** Erro inesperado: mensagem amigável, sem detalhes técnicos para o usuário. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5">
        <p className="text-4xl" aria-hidden>😕</p>
        <h1 className="mt-2 text-xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-slate-600">Tente de novo em instantes. Seus dados estão seguros.</p>
        {error.digest && <p className="mt-2 text-xs text-slate-400">Código: {error.digest}</p>}
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={reset} className={btn.primary}>
            Tentar de novo
          </button>
          <Link href="/" className={btn.secondary}>
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
