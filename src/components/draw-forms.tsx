"use client";

import { useActionState, useState } from "react";
import {
  addExclusionAction,
  redoDrawAction,
  removeExclusionAction,
  reopenGroupAction,
  revealAction,
  runDrawAction,
  type RevealState,
} from "@/actions/draws";
import { initialActionState } from "@/lib/action-state";
import { FormMessage, SubmitButton } from "./form-kit";
import { btn } from "./ui";

export const REDO_CONFIRM_TEXT =
  "Alguns participantes podem já ter visto seus resultados. Tem certeza que deseja refazer o sorteio?";

type Option = { id: string; name: string };

const selectCls =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export function AddExclusionForm({ code, participants }: { code: string; participants: Option[] }) {
  const [state, action] = useActionState(addExclusionAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <label className="text-sm font-medium">
        Quem
        <select name="participantId" required defaultValue="" className={selectCls}>
          <option value="" disabled>Escolha…</option>
          {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">
        não pode tirar
        <select name="excludedParticipantId" required defaultValue="" className={selectCls}>
          <option value="" disabled>Escolha…</option>
          {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="mutual" defaultChecked className="size-5 accent-brand" />
        Nos dois sentidos (ex.: casais)
      </label>
      <SubmitButton variant="secondary" pendingText="Salvando…">Adicionar regra</SubmitButton>
    </form>
  );
}

export function RemoveExclusionButton({ code, exclusionId }: { code: string; exclusionId: string }) {
  const [state, action] = useActionState(removeExclusionAction, initialActionState);
  return (
    <form action={action}>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="exclusionId" value={exclusionId} />
      <SubmitButton variant="danger" pendingText="…">Remover</SubmitButton>
      {state.message && !state.ok && <p className="text-xs text-red-700" role="alert">{state.message}</p>}
    </form>
  );
}

/** Botão que só envia se a pessoa confirmar o diálogo (e manda confirm=sim). */
function ConfirmedActionForm({
  code,
  action,
  state,
  confirmText,
  label,
  pendingText,
  variant,
}: {
  code: string;
  action: (form: FormData) => void;
  state: typeof initialActionState;
  confirmText: string;
  label: string;
  pendingText: string;
  variant: keyof typeof btn;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="confirm" value="sim" />
      <FormMessage state={state} />
      <SubmitButton variant={variant} pendingText={pendingText}>{label}</SubmitButton>
    </form>
  );
}

export function RunDrawButton({ code, disabled }: { code: string; disabled: boolean }) {
  const [state, action] = useActionState(runDrawAction, initialActionState);
  if (disabled) {
    return (
      <button type="button" disabled className={btn.primary}>
        Realizar sorteio
      </button>
    );
  }
  return (
    <ConfirmedActionForm
      code={code}
      action={action}
      state={state}
      confirmText="Realizar o sorteio agora? Depois dele, só dá para mudar participantes ou exclusões refazendo o sorteio."
      label="🎲 Realizar sorteio"
      pendingText="Sorteando…"
      variant="primary"
    />
  );
}

export function RedoDrawButton({ code }: { code: string }) {
  const [state, action] = useActionState(redoDrawAction, initialActionState);
  return (
    <ConfirmedActionForm code={code} action={action} state={state} confirmText={REDO_CONFIRM_TEXT}
      label="Refazer sorteio" pendingText="Sorteando de novo…" variant="secondary" />
  );
}

export function ReopenGroupButton({ code }: { code: string }) {
  const [state, action] = useActionState(reopenGroupAction, initialActionState);
  return (
    <ConfirmedActionForm
      code={code}
      action={action}
      state={state}
      confirmText={`${REDO_CONFIRM_TEXT}\n\nO sorteio atual será cancelado e o grupo volta a aceitar mudanças.`}
      label="Cancelar sorteio e reabrir grupo"
      pendingText="Reabrindo…"
      variant="secondary"
    />
  );
}

/**
 * Revela o amigo secreto sob demanda. O nome NÃO está no HTML da página:
 * só chega ao navegador quando a pessoa toca em "Revelar".
 */
export function RevealFriend({ code, alreadyViewed }: { code: string; alreadyViewed: boolean }) {
  const [state, action] = useActionState<RevealState, FormData>(revealAction, { ok: false });
  const [hidden, setHidden] = useState(false);

  if (state.ok && state.friend && !hidden) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-sm text-slate-600">Você tirou</p>
        <p className="text-4xl font-extrabold tracking-tight text-brand" data-testid="friend-name">
          {state.friend.name}
        </p>
        {state.friend.nickname && <p className="text-slate-600">({state.friend.nickname})</p>}
        <p className="text-sm text-slate-600">🤫 Guarde segredo!</p>
        <button type="button" onClick={() => setHidden(true)} className="text-sm text-slate-500 underline">
          Esconder
        </button>
      </div>
    );
  }
  return (
    <form action={(fd) => { setHidden(false); action(fd); }} className="flex flex-col gap-3 text-center">
      <input type="hidden" name="code" value={code} />
      <p className="text-5xl" aria-hidden>🎁</p>
      <p className="text-slate-700">
        {alreadyViewed ? "Toque para ver de novo quem você tirou." : "Confira se ninguém está olhando a sua tela…"}
      </p>
      {state.message && <p className="text-sm text-red-700" role="alert">{state.message}</p>}
      <SubmitButton pendingText="Revelando…">Revelar meu amigo secreto</SubmitButton>
    </form>
  );
}
