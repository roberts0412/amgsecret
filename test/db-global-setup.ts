import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import pg from "pg";

/**
 * Prepara o banco de TESTES: recria o schema do zero e aplica as migrações
 * reais (as mesmas de produção). Recusa rodar se o banco não terminar em
 * "_test", para nunca apagar o banco de desenvolvimento/produção por engano.
 */
export default async function setup() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Defina TEST_DATABASE_URL (veja .env.example) para rodar os testes de banco.");
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith("_test")) throw new Error(`Recusando limpar "${dbName}": o nome do banco de testes deve terminar em _test.`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await client.end();

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  process.env.DATABASE_URL = url;
}
