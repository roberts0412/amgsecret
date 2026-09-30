import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgresql://amigo:amigo@localhost:5432/amigo_e2e";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"], // mobile-first: o uso principal é pelo celular
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    trace: "retain-on-failure",
  },
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    // usa o build de produção (rode `npm run build` antes)
    // E2E_STANDALONE=1 testa o pacote autocontido (o mesmo do Docker)
    command: process.env.E2E_STANDALONE ? "node .next/standalone/server.js" : `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { PORT: String(PORT), DATABASE_URL: E2E_DB, APP_URL: `http://localhost:${PORT}`, TRUST_PROXY: "true", AMAZON_ASSOCIATE_TAG: "e2eteste-20" },
  },
});
