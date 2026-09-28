import "server-only";

import { z } from "zod";

/**
 * Variáveis de ambiente validadas. Lidas sob demanda (e não no import) para
 * que o build e os testes unitários puros não dependam de .env.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string({ error: "não definida (URL do PostgreSQL)" }).regex(/^postgres(ql)?:\/\//, "DATABASE_URL deve ser uma URL PostgreSQL"),
  APP_SECRET: z
    .string({ error: "não definido — gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"" })
    .min(43, "APP_SECRET precisa de pelo menos 32 bytes aleatórios (43 caracteres base64url)"),
  APP_URL: z.url(),
  /**
   * "true" só quando o app roda atrás de um proxy confiável (Vercel, Nginx...)
   * que define X-Forwarded-For/X-Real-IP. Sem proxy, esses cabeçalhos são
   * forjáveis pelo cliente e não podem ser usados no rate limiting.
   */
  /** Google AdSense (opcional). Sem estes dois, nenhum anúncio é exibido. */
  ADSENSE_CLIENT_ID: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().regex(/^ca-pub-\d{10,20}$/, "ADSENSE_CLIENT_ID deve ser como ca-pub-1234567890123456").optional(),
  ),
  ADSENSE_SLOT_ID: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().regex(/^\d{5,20}$/, "ADSENSE_SLOT_ID deve ser numérico").optional(),
  ),
  /** E-mail de contato exibido na Política de Privacidade (LGPD). */
  CONTACT_EMAIL: z.preprocess((v) => (v === "" ? undefined : v), z.email().optional()),
  /**
   * Conexões com o banco POR PROCESSO. Com APP_WORKERS processos, o total é
   * APP_WORKERS × DATABASE_POOL_MAX — mantenha abaixo do max_connections do
   * PostgreSQL (padrão 100).
   */
  DATABASE_POOL_MAX: z.coerce.number().int().min(2).max(100).default(20),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * URL pública: APP_URL; se não definida, a URL de produção que a Vercel
 * informa (VERCEL_PROJECT_PRODUCTION_URL, ex.: "amgsecret.vercel.app");
 * por fim, localhost para desenvolvimento.
 */
export function resolveAppUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.APP_URL) return env.APP_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse({ ...process.env, APP_URL: resolveAppUrl() });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuração inválida: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Só para testes. */
export function resetEnvCache(): void {
  cached = undefined;
}
