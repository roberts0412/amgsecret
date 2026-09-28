import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { AppError, GENERIC_ERROR } from "@/lib/errors";

export type { ActionState };

/**
 * Executa a lógica de uma Server Action convertendo erros em estado seguro:
 * - AppError -> mensagem de negócio;
 * - redirect()/notFound() -> repassados ao Next;
 * - qualquer outro erro -> registrado no servidor, mensagem genérica ao cliente.
 */
export async function runAction(
  fn: () => Promise<ActionState | void>,
  values?: Record<string, string>,
): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof AppError) {
      return { ok: false, message: e.message, fieldErrors: e.fieldErrors, values };
    }
    console.error("[action] erro inesperado", e);
    return { ok: false, message: GENERIC_ERROR, values };
  }
}
