/** Estado devolvido por Server Actions aos formulários (useActionState). Compartilhado com o cliente. */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Valores enviados, para repreencher o formulário após erro. */
  values?: Record<string, string>;
}

export const initialActionState: ActionState = { ok: false };
