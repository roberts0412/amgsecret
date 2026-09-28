"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";
import { Alert, btn } from "./ui";

/** Peças de formulário (cliente): campo com erro, botão com estado de envio, mensagem. */

type FieldProps = {
  name: string;
  label: string;
  state: ActionState;
  hint?: string;
  optional?: boolean;
  textarea?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

export function Field({ name, label, state, hint, optional, textarea, defaultValue, ...rest }: FieldProps) {
  const error = state.fieldErrors?.[name];
  const id = `f-${name}`;
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  // após erro, repreenche com o que a pessoa digitou (React 19 limpa o form após a action)
  const value = state.values?.[name] ?? defaultValue;
  const cls = `mt-1 block w-full rounded-xl border bg-white px-3 py-3 text-base shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 ${
    error ? "border-red-400" : "border-slate-300"
  }`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label} {optional && <span className="font-normal text-slate-500">(opcional)</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={3}
          defaultValue={value as string | undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          maxLength={rest.maxLength}
          placeholder={rest.placeholder}
          className={cls}
        />
      ) : (
        <input
          id={id}
          name={name}
          defaultValue={value}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cls}
          {...rest}
        />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Enviando…",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof btn;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`${btn[variant]} ${className}`}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>;
}
