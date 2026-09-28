import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// A CLI do Prisma não carrega .env sozinha; o Next.js carrega em runtime.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Opcional aqui: `prisma generate` (postinstall) não precisa de banco.
  // Comandos de migração falham com erro claro se DATABASE_URL faltar.
  datasource: { url: process.env.DATABASE_URL },
});
