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

describe("resolveAppUrl", () => {
  it("APP_URL > URL da Vercel > localhost", async () => {
    const { resolveAppUrl } = await import("./env");
    expect(resolveAppUrl({ APP_URL: "https://meu.com.br", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" } as never)).toBe("https://meu.com.br");
    expect(resolveAppUrl({ VERCEL_PROJECT_PRODUCTION_URL: "amgsecret.vercel.app" } as never)).toBe("https://amgsecret.vercel.app");
    expect(resolveAppUrl({} as never)).toBe("http://localhost:3000");
  });

  it("Netlify: usa URL (endereço principal) só se for https e só na Netlify", async () => {
    const { resolveAppUrl } = await import("./env");
    expect(resolveAppUrl({ NETLIFY: "true", URL: "https://amigosecretofacil.com.br" } as never)).toBe("https://amigosecretofacil.com.br");
    expect(resolveAppUrl({ NETLIFY: "true", URL: "http://inseguro" } as never)).toBe("http://localhost:3000");
    expect(resolveAppUrl({ URL: "https://outra.coisa" } as never)).toBe("http://localhost:3000");
    expect(resolveAppUrl({ APP_URL: "https://meu.com.br", NETLIFY: "true", URL: "https://x.netlify.app" } as never)).toBe("https://meu.com.br");
  });

  it("getEnv usa a URL da Vercel quando APP_URL não existe", () => {
    delete process.env.APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "amgsecret.vercel.app";
    expect(getEnv().APP_URL).toBe("https://amgsecret.vercel.app");
  });
});
