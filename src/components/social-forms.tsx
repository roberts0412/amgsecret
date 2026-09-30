"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addWishAction,
  deleteWallPostAction,
  deleteWishAction,
  postToWallAction,
  replyToSantaAction,
  sendToFriendAction,
} from "@/actions/social";
import { type ActionState, initialActionState } from "@/lib/action-state";
import { Field, FormMessage, SubmitButton } from "./form-kit";
import { btn } from "./ui";

/** Lista de desejos: formulário recolhido por padrão (é opcional). */
export function AddWishForm({ code, startOpen = false }: { code: string; startOpen?: boolean }) {
  const [state, action] = useActionState(addWishAction, initialActionState);
  const [open, setOpen] = useState(startOpen);
  const showForm = open || (!state.ok && !!state.message);
  if (!showForm) {
    return (
      <div className="flex flex-col gap-2">
        {state.ok && state.message && <FormMessage state={state} />}
        <button type="button" onClick={() => setOpen(true)} className={btn.secondary}>
          + Adicionar desejo
        </button>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <Field name="product" label="O que você quer ganhar?" state={state} required maxLength={100}
        placeholder="Ex.: Fone Bluetooth" autoComplete="off" />
      <Field name="approxPrice" label="Preço aproximado (R$)" state={state} optional inputMode="decimal"
        maxLength={20} placeholder="Ex.: 150" />
      <Field name="url" label="Link do produto" state={state} optional type="url" inputMode="url"
        maxLength={2048} placeholder="https://…" />
      <Field name="description" label="Detalhes" textarea state={state} optional maxLength={500}
        placeholder="Ex.: modelo, tamanho, cor" />
      <Field name="note" label="Observação" state={state} optional maxLength={300}
        placeholder="Ex.: qualquer cor, menos rosa" />
      <div className="flex gap-2">
        <SubmitButton pendingText="Salvando…" className="flex-1">Salvar desejo</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={`${btn.secondary} flex-1`}>Cancelar</button>
      </div>
    </form>
  );
}

function SmallDeleteForm({
  action, code, idName, id, confirmText, label = "Remover",
}: {
  action: (fd: FormData) => void; code: string; idName: string; id: string; confirmText: string; label?: string;
}) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(confirmText)) e.preventDefault(); }}>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name={idName} value={id} />
      <SubmitButton variant="danger" pendingText="…">{label}</SubmitButton>
    </form>
  );
}

export function DeleteWishButton({ code, wishId }: { code: string; wishId: string }) {
  const [, action] = useActionState(deleteWishAction, initialActionState);
  return <SmallDeleteForm action={action} code={code} idName="wishId" id={wishId} confirmText="Remover este desejo?" />;
}

export function DeleteWallPostButton({ code, postId }: { code: string; postId: string }) {
  const [, action] = useActionState(deleteWallPostAction, initialActionState);
  return <SmallDeleteForm action={action} code={code} idName="postId" id={postId} confirmText="Apagar esta mensagem do mural?" label="Apagar" />;
}

/** Caixa de texto que limpa após sucesso (e mantém o texto após erro). */
function MessageBox({
  code, action, state, label, placeholder, maxLength, submit,
}: {
  code: string; action: (fd: FormData) => void; state: ActionState; label: string;
  placeholder: string; maxLength: number; submit: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="code" value={code} />
      <FormMessage state={state} />
      <Field name="body" label={label} textarea state={state} maxLength={maxLength} placeholder={placeholder} />
      <SubmitButton pendingText="Enviando…">{submit}</SubmitButton>
    </form>
  );
}

export function SendToFriendForm({ code }: { code: string }) {
  const [state, action] = useActionState(sendToFriendAction, initialActionState);
  return (
    <MessageBox code={code} action={action} state={state} maxLength={1000} submit="Enviar em segredo 🤫"
      label="Mensagem anônima" placeholder="Ex.: Qual seu tamanho de camiseta? 😉" />
  );
}

export function ReplyToSantaForm({ code, term }: { code: string; term: string }) {
  const [state, action] = useActionState(replyToSantaAction, initialActionState);
  return (
    <MessageBox code={code} action={action} state={state} maxLength={1000} submit="Responder"
      label={`Responder ao seu ${term}`} placeholder="Ele(a) vai receber, mas você continua sem saber quem é 🙂" />
  );
}

export function WallPostForm({ code }: { code: string }) {
  const [state, action] = useActionState(postToWallAction, initialActionState);
  return (
    <MessageBox code={code} action={action} state={state} maxLength={500} submit="Publicar no mural"
      label="Escreva para o grupo (com seu nome)" placeholder="Ex.: Quem leva a sobremesa?" />
  );
}
