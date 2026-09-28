import "server-only";

import { z } from "zod";

/**
 * Variáveis de ambiente validadas. Lidas sob demanda (e não no import) para
 * que o build e os testes unitários puros não dependam de .env.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "DATABASE_URL deve ser uma URL PostgreSQL"),
  APP_SECRET: z
    .string()
    .min(43, "APP_SECRET precisa de pelo menos 32 bytes aleatórios (43 caracteres base64url)"),
  APP_URL: z.url().default("http://localhost:3000"),
  /**
   * "true" só quando o app roda atrás de um proxy confiável (Vercel, Nginx...)
   * que define X-Forwarded-For/X-Real-IP. Sem proxy, esses cabeçalhos são
   * forjáveis pelo cliente e não podem ser usados no rate limiting.
   */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
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
