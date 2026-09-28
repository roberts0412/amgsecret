// Checagem de configuração ANTES de iniciar o servidor (sem dependências).
// Se algo essencial faltar, o container encerra com erro claro em vez de
// ficar "de pé" sem funcionar.
const errors = [];
const env = process.env;

if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL ?? "")) errors.push("DATABASE_URL ausente ou inválida (postgresql://...)");
if ((env.APP_SECRET ?? "").length < 43) errors.push("APP_SECRET ausente ou curto (mínimo 32 bytes em base64url = 43 caracteres)");
try {
  const u = new URL(env.APP_URL ?? "");
  if (u.protocol !== "https:") console.warn(`[config] aviso: APP_URL=${env.APP_URL} não usa https`);
} catch {
  errors.push("APP_URL ausente ou inválida (ex.: https://seudominio.com.br)");
}

if (errors.length) {
  console.error("\n[config] Não foi possível iniciar:\n - " + errors.join("\n - ") + "\nVeja docs/DEPLOY.md\n");
  process.exit(1);
}
