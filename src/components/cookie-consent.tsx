"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Consent, CONSENT_EVENT, consentCookie, readConsent } from "@/lib/consent";

/** Aviso de cookies discreto, no rodapé. Só é montado quando há anúncios configurados. */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(readConsent(document.cookie) === null), []);
  if (!open) return null;

  const choose = (value: Consent) => {
    document.cookie = consentCookie(value, location.protocol === "https:");
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setOpen(false);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <p className="text-sm text-slate-700">
          Usamos cookies essenciais para o site funcionar e, com a sua permissão, cookies de anúncios para manter o
          site grátis. <Link href="/privacidade" className="underline">Saiba mais</Link>.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => choose("essential")}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">
            Só essenciais
          </button>
          <button type="button" onClick={() => choose("all")}
            className="min-h-11 flex-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white">
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
