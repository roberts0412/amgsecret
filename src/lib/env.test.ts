import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvCache } from "./env";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
  resetEnvCache();
});

describe("env", () => {
  it("aceita configuração válida", () => {
    expect(getEnv().APP_SECRET.length).toBeGreaterThanOrEqual(43);
  });

  it("recusa APP_SECRET curto ou ausente", () => {
    process.env.APP_SECRET = "curto";
    expect(() => getEnv()).toThrow(/APP_SECRET/);
    resetEnvCache();
    delete process.env.APP_SECRET;
    expect(() => getEnv()).toThrow(/APP_SECRET/);
  });

  it("recusa DATABASE_URL que não é Postgres", () => {
    process.env.DATABASE_URL = "mysql://x";
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });
});
