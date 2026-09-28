import { afterEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "./env";
import { adMode, adsTxt } from "./ads";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
  resetEnvCache();
});

function env(vars: Record<string, string | undefined>) {
  Object.assign(process.env, vars);
  resetEnvCache();
}

describe("anúncios", () => {
  it("sem configuração: marcador em dev, nada em produção", () => {
    env({ NODE_ENV: "development", ADSENSE_CLIENT_ID: "", ADSENSE_SLOT_ID: "" });
    expect(adMode()).toEqual({ kind: "placeholder" });
    env({ NODE_ENV: "production" });
    expect(adMode()).toEqual({ kind: "none" });
    expect(adsTxt()).toBeNull();
  });

  it("com AdSense: exibe no plano grátis, nunca no premium", () => {
    env({ NODE_ENV: "production", ADSENSE_CLIENT_ID: "ca-pub-1234567890123456", ADSENSE_SLOT_ID: "987654321" });
    expect(adMode("FREE")).toEqual({ kind: "adsense", client: "ca-pub-1234567890123456", slot: "987654321" });
    expect(adMode("PREMIUM")).toEqual({ kind: "none" });
    expect(adsTxt()).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });

  it("recusa ID de cliente malformado (evita injetar URL no script)", () => {
    env({ ADSENSE_CLIENT_ID: "ca-pub-1&x=<script>", ADSENSE_SLOT_ID: "1" });
    expect(() => adMode()).toThrow(/ADSENSE_CLIENT_ID/);
  });
});
