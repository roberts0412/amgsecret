import { z } from "zod";
import { AppError } from "@/lib/errors";
import { cleanLine, cleanMultiline } from "@/lib/text";

/**
 * Validação de toda entrada vinda de formulários/Server Actions.
 * Regras: limpar texto, limitar tamanho, converter formatos (dinheiro em
 * centavos, data de calendário) e transformar "" em null.
 */

const EVENT_TIMEZONE = "America/Sao_Paulo";
export const MAX_GIFT_CENTS = 100_000_00; // R$ 100.000,00

/** "" / só espaços -> undefined, para campos opcionais de FormData. */
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const line = (min: number, max: number, label: string) =>
  z
    .string({ error: `Informe ${label}.` })
    .transform(cleanLine)
    .pipe(
      z
        .string()
        .min(1, `Informe ${label}.`) // vazio: mensagem mais clara que "pelo menos N"
        .min(min, `${capitalize(label)} precisa ter pelo menos ${min} caracteres.`)
        .max(max, `${capitalize(label)} pode ter no máximo ${max} caracteres.`),
    );

const optionalLine = (max: number, label: string) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform(cleanLine)
      .pipe(z.string().max(max, `${capitalize(label)} pode ter no máximo ${max} caracteres.`))
      .optional(),
  );

const optionalMultiline = (max: number, label: string) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform(cleanMultiline)
      .pipe(z.string().max(max, `${capitalize(label)} pode ter no máximo ${max} caracteres.`))
      .optional(),
  );

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Dinheiro
// ---------------------------------------------------------------------------

/**
 * Converte texto em reais para centavos, sem usar float.
 * Aceita: "150", "150,5", "150,50", "R$ 1.500,00", "1500.50", "1.500".
 * Retorna null se o formato for inválido.
 */
export function parseBRLToCents(input: string): number | null {
  let s = input.replace(/\s/g, "").replace(/^R\$/i, "");
  if (s === "") return null;
  if (s.includes(",")) {
    // formato brasileiro: ponto = milhar, vírgula = decimal
    if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(s)) return null;
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.500" = mil e quinhentos
  }
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const reais = m[1]!;
  if (reais.length > 9) return null;
  return Number(reais) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const optionalMoney = z.preprocess(
  blankToUndefined,
  z
    .string()
    .transform((v, ctx) => {
      const cents = parseBRLToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Exemplo: 100 ou 99,90." });
        return z.NEVER;
      }
      return cents;
    })
    .pipe(z.number().int().min(0).max(MAX_GIFT_CENTS, "Valor muito alto."))
    .optional(),
);

// ---------------------------------------------------------------------------
// Data e hora do evento
// ---------------------------------------------------------------------------

/** "YYYY-MM-DD" de hoje no fuso do evento. */
export function todayInEventTz(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Data do evento: real, não no passado (tolerância de 1 dia) e até 2 anos à frente. */
export const eventDateSchema = (now = new Date()) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .refine(isRealDate, "Data inválida.")
      .refine((d) => d >= addDays(todayInEventTz(now), -1), "A data do evento já passou.")
      .refine((d) => d <= addDays(todayInEventTz(now), 730), "Data muito distante.")
      .optional(),
  );

const optionalTime = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido. Use HH:MM.")
    .optional(),
);

// ---------------------------------------------------------------------------
// Contato
// ---------------------------------------------------------------------------

const optionalEmail = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "E-mail muito longo.")
    .pipe(z.email("E-mail inválido."))
    .optional(),
);

/** Telefone: mantém só dígitos (e "+" inicial); 10 a 15 dígitos. */
const optionalPhone = z.preprocess(
  blankToUndefined,
  z
    .string()
    .transform((v) => {
      const plus = v.trim().startsWith("+") ? "+" : "";
      return plus + v.replace(/\D/g, "");
    })
    .pipe(z.string().regex(/^\+?\d{10,15}$/, "Telefone inválido. Inclua o DDD."))
    .optional(),
);

// ---------------------------------------------------------------------------
// Schemas dos formulários
// ---------------------------------------------------------------------------

export const personNameSchema = line(2, 60, "o nome");

export const groupDetailsSchema = (now = new Date()) =>
  z.object({
    name: line(3, 80, "o nome do grupo"),
    description: optionalMultiline(500, "a descrição"),
    eventDate: eventDateSchema(now),
    eventTime: optionalTime,
    location: optionalLine(120, "o local"),
    giftValue: optionalMoney,
  });

export const createGroupSchema = (now = new Date()) =>
  groupDetailsSchema(now).extend({ organizerName: personNameSchema });

export const joinGroupSchema = z.object({
  name: personNameSchema,
  nickname: optionalLine(40, "o apelido"),
  email: optionalEmail,
  phone: optionalPhone,
});

export type GroupDetailsInput = z.infer<ReturnType<typeof groupDetailsSchema>>;
export type CreateGroupInput = z.infer<ReturnType<typeof createGroupSchema>>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

/** Converte FormData em objeto (só campos de texto; ignora arquivos). */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** Valida; em caso de erro lança AppError com a 1ª mensagem de cada campo. */
export function parseInput<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? "_");
    fieldErrors[key] ??= issue.message;
  }
  throw new AppError("VALIDATION", "Confira os campos destacados.", fieldErrors);
}
