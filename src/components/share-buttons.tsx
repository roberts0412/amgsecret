"use client";

import { useActionState, useEffect, useState } from "react";
import { updateThemeAction } from "@/actions/groups";
import { initialActionState } from "@/lib/action-state";
import type { ThemeInfo } from "@/lib/themes";
import { FormMessage } from "./form-kit";
import { btn } from "./ui";

/**
 * Compartilhar pelo menu nativo do celular (Telegram, SMS, e-mail...).
 * Só aparece onde o navegador suporta (a maioria dos celulares).
 */
/** `text` já pode conter o link; `url` separado faria alguns apps repetirem o link. */
export function NativeShareButton({ title, text, url }: { title: string; text: string; url?: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  if (!supported) return null;
  return (
    <button
      type="button"
      className={btn.secondary}
      onClick={async () => {
        try {
          await navigator.share(url ? { title, text, url } : { title, text });
        } catch {
          // usuário cancelou o menu — nada a fazer
        }
      }}
    >
      Outras formas de compartilhar
    </button>
  );
}

export function ThemePicker({
  code,
  themes,
  current,
  allowed,
}: {
  code: string;
  themes: readonly ThemeInfo[];
  current: string;
  allowed: string[];
}) {
  const [state, action] = useActionState(updateThemeAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <div className="grid grid-cols-2 gap-2">
        {themes.map((t) => {
          const locked = !allowed.includes(t.id);
          const active = t.id === current;
          return (
            <button
              key={t.id}
              type="submit"
              name="theme"
              value={t.id}
              disabled={locked || active}
              aria-pressed={active}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium ${
                active ? "border-brand ring-2 ring-brand/30" : "border-slate-300"
              } ${locked ? "cursor-not-allowed opacity-60" : "bg-white hover:bg-slate-50"}`}
            >
              <span className="size-5 shrink-0 rounded-full" style={{ background: t.swatch }} aria-hidden />
              <span className="flex-1">{t.label}</span>
              {locked && <span aria-label="Premium">🔒</span>}
              {active && <span aria-label="Tema atual">✓</span>}
            </button>
          );
        })}
      </div>
      {allowed.length < themes.length && (
        <p className="text-xs text-slate-500">🔒 Temas extras fazem parte do plano Premium (em breve).</p>
      )}
    </form>
  );
}
