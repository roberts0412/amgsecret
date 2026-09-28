import { execFileSync } from "node:child_process";
import pg from "pg";

/** Recria o banco de E2E do zero (recusa bancos que não terminem em _e2e). */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? "postgresql://amigo:amigo@localhost:5432/amigo_e2e";
  if (!new URL(url).pathname.endsWith("_e2e")) throw new Error("O banco de E2E deve terminar em _e2e");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await client.end();
  execFileSync("npx", ["prisma", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
}
