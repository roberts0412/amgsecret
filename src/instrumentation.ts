/**
 * Executado uma vez quando o servidor inicia. Valida a configuração e
 * impede a subida com mensagem clara se algo essencial faltar — melhor não
 * subir do que subir quebrado (ex.: sem APP_SECRET os resultados não
 * poderiam ser lidos).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getEnv } = await import("@/lib/env");
  let env;
  try {
    env = getEnv();
  } catch (e) {
    throw new Error(`[config] ${(e as Error).message} — veja .env.example e docs/DEPLOY.md.`);
  }
  if (env.NODE_ENV === "production" && !env.APP_URL.startsWith("https://")) {
    console.warn(`[config] APP_URL=${env.APP_URL} não usa https. Em produção use o domínio com https.`);
  }
}
