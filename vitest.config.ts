import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // "server-only" lança erro fora do React Server; nos testes vira módulo vazio.
  "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
};
// Segredo fixo só para testes (nunca usado fora deles).
const testEnv = { APP_SECRET: "test-secret-0123456789-abcdefghijklmnopqrstuvwxyz" };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
          env: { ...testEnv, DATABASE_URL: "postgresql://unused/unused" },
        },
      },
      {
        resolve: { alias },
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          globalSetup: ["test/db-global-setup.ts"],
          env: testEnv,
          // testes de banco compartilham o mesmo schema: rodar em série
          fileParallelism: false,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
