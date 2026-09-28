import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// A CLI do Prisma não carrega .env sozinha; o Next.js carrega em runtime.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Opcional aqui: `prisma generate` (postinstall) não precisa de banco.
  // Comandos de migração falham com erro claro se a URL faltar.
  // DIRECT_DATABASE_URL: conexão direta (sem pooler), recomendada para
  // migrações em bancos gerenciados como o Neon. Sem ela, usa DATABASE_URL.
  datasource: { url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL },
});
