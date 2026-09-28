"use client";

import { useActionState, useState } from "react";
import {
  accessWithTokenAction,
  confirmParticipationAction,
  createGroupAction,
  goToGroupAction,
  joinGroupAction,
  recoverAccessAction,
  removeParticipantAction,
  setPinAction,
  updateGroupAction,
} from "@/actions/groups";
import { initialActionState } from "@/lib/action-state";
import { Field, FormMessage, SubmitButton } from "./form-kit";
import { btn } from "./ui";

/** Campos de detalhes do evento, usados em "criar" e "editar". */
function GroupDetailsFields({
  state,
  defaults,
}: {
  state: typeof initialActionState;
  defaults?: Partial<Record<"name" | "description" | "eventDate" | "eventTime" | "location" | "giftValue", string>>;
}) {
  return (
    <>
      <Field name="name" label="Nome do amigo secreto" state={state} required minLength={3} maxLength={80}
        placeholder="Ex.: Natal da Família" defaultValue={defaults?.name} autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="eventDate" label="Data" type="date" state={state} optional defaultValue={defaults?.eventDate} />
        <Field name="eventTime" label="Horário" type="time" state={state} optional defaultValue={defaults?.eventTime} />
      </div>
      <Field name="location" label="Local" state={state} optional maxLength={120}
        placeholder="Ex.: Casa da vó" defaultValue={defaults?.location} />
      <Field name="giftValue" label="Valor do presente (R$)" state={state} optional inputMode="decimal"
        placeholder="Ex.: 100" defaultValue={defaults?.giftValue} maxLength={20} />
      <Field name="description" label="Recado para o grupo" textarea state={state} optional maxLength={500}
        placeholder="Ex.: Vamos trocar os presentes depois da ceia!" defaultValue={defaults?.description} />
    </>
  );
}

/**
 * PIN de recuperação + confirmação. type=password com teclado numérico:
 * não aparece na tela nem fica no preenchimento automático como texto comum.
 */
function PinFields({ state, label = "Crie um PIN de 6 números" }: { state: typeof initialActionState; label?: string }) {
  const common = {
    type: "password",
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    maxLength: 6,
    autoComplete: "new-password",
    state,
  };
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
      <legend className="sr-only">PIN de recuperação</legend>
      <Field name="pin" label={label} {...common}
        hint="Serve para recuperar seu acesso se você perder o link. Não use data de nascimento nem 123456." />
      <Field name="pinConfirm" label="Repita o PIN" {...common} />
    </fieldset>
  );
}

export function CreateGroupForm() {
  const [state, action] = useActionState(createGroupAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <GroupDetailsFields state={state} />
      <Field name="organizerName" label="Seu nome" state={state} required minLength={2} maxLength={60}
        placeholder="Como o grupo te conhece" autoComplete="given-name"
        hint="Você também participa do sorteio." />
      <PinFields state={state} />
      <SubmitButton pendingText="Criando…">Criar amigo secreto</SubmitButton>
    </form>
  );
}

export function EditGroupForm({
  code,
  defaults,
}: {
  code: string;
  defaults: Partial<Record<"name" | "description" | "eventDate" | "eventTime" | "location" | "giftValue", string>>;
}) {
  const [state, action] = useActionState(updateGroupAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <GroupDetailsFields state={state} defaults={defaults} />
      <SubmitButton variant="secondary" pendingText="Salvando…">Salvar alterações</SubmitButton>
    </form>
  );
}

export function JoinGroupForm({ code }: { code: string }) {
  const [state, action] = useActionState(joinGroupAction, initialActionState);
  const [expanded, setExpanded] = useState(false);
  // reabre os campos extras se houver valor ou erro neles após o envio
  const more =
    expanded || ["nickname", "email", "phone"].some((k) => state.values?.[k] || state.fieldErrors?.[k]);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <Field name="name" label="Seu nome" state={state} required minLength={2} maxLength={60}
        placeholder="Ex.: Maria Souza" autoComplete="name"
        hint="Use o nome que o grupo reconhece. Se houver outra pessoa com o mesmo nome, inclua o sobrenome." />
      {more ? (
        <>
          <Field name="nickname" label="Apelido" state={state} optional maxLength={40} />
          <Field name="email" label="E-mail" type="email" state={state} optional autoComplete="email" maxLength={254} />
          <Field name="phone" label="Celular" type="tel" state={state} optional autoComplete="tel" maxLength={20} />
          <p className="text-xs text-slate-500">Seus contatos não aparecem para o grupo.</p>
        </>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className="self-start text-sm font-medium text-brand underline">
          + Apelido, e-mail ou celular
        </button>
      )}
      <PinFields state={state} />
      <SubmitButton pendingText="Entrando…">Entrar no grupo</SubmitButton>
    </form>
  );
}

export function GoToGroupForm() {
  const [state, action] = useActionState(goToGroupAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <FormMessage state={state} />
      <Field name="code" label="Código ou link do grupo" state={state} required
        placeholder="Ex.: K7PX2M" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={200} />
      <SubmitButton variant="secondary" pendingText="Procurando…">Entrar em um grupo</SubmitButton>
    </form>
  );
}

export function ConfirmParticipationForm({ code }: { code: string }) {
  const [state, action] = useActionState(confirmParticipationAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Confirmando…">Confirmar minha participação</SubmitButton>
    </form>
  );
}

export function RemoveParticipantButton({ code, participantId, name }: { code: string; participantId: string; name: string }) {
  const [state, action] = useActionState(removeParticipantAction, initialActionState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Remover ${name} do grupo?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="participantId" value={participantId} />
      <SubmitButton variant="danger" pendingText="Removendo…">Remover</SubmitButton>
      {state.message && !state.ok && <p className="text-xs text-red-700" role="alert">{state.message}</p>}
    </form>
  );
}

export function AccessForm({ token, name, groupName }: { token: string; name: string; groupName: string }) {
  const [state, action] = useActionState(accessWithTokenAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Entrando…">
        Entrar como {name} em “{groupName}”
      </SubmitButton>
    </form>
  );
}

export function CopyButton({ text, label = "Copiar link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn.secondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copie o link:", text);
        }
      }}
    >
      {copied ? "Copiado! ✓" : label}
    </button>
  );
}

export function RecoverAccessForm({ code }: { code: string }) {
  const [state, action] = useActionState(recoverAccessAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <Field name="name" label="Seu nome no grupo" state={state} required maxLength={60} autoComplete="name" />
      <Field name="pin" label="Seu PIN" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
        autoComplete="current-password" state={state} />
      <SubmitButton pendingText="Verificando…">Recuperar meu acesso</SubmitButton>
      <p className="text-xs text-slate-500">
        Por segurança, após 5 tentativas erradas o acesso fica bloqueado por um tempo.
      </p>
    </form>
  );
}

export function SetPinForm({ code, hasPin }: { code: string; hasPin: boolean }) {
  const [state, action] = useActionState(setPinAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <PinFields state={state} label={hasPin ? "Novo PIN (6 números)" : "Crie um PIN de 6 números"} />
      <SubmitButton variant="secondary" pendingText="Salvando…">{hasPin ? "Trocar PIN" : "Salvar PIN"}</SubmitButton>
    </form>
  );
}
