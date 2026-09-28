/**
 * Erro de regra de negócio com mensagem segura para mostrar ao usuário.
 * Qualquer outro erro é tratado como interno e vira mensagem genérica
 * (nunca vazamos stack/SQL para o cliente).
 */
export type AppErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "GROUP_LOCKED"
  | "LIMIT_REACHED"
  | "RATE_LIMITED";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    /** Erros por campo do formulário, quando for erro de validação. */
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const GENERIC_ERROR = "Algo deu errado. Tente novamente em instantes.";
