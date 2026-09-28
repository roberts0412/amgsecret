import { afterEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { clearKeyCache } from "./keys";
import { checkPin, hashPin, lockDurationMs, verifyPin } from "./pin";

afterEach(() => {
  resetEnvCache();
  clearKeyCache();
});

describe("checkPin", () => {
  it.each(["482915", "730164", "905527"])("aceita %s", (pin) => expect(checkPin(pin)).toBeNull());
  it.each(["12345", "1234567", "12a456", "", " 48291", "４８２９１５"])("formato inválido %j", (pin) =>
    expect(checkPin(pin)).toBe("FORMAT"),
  );
  it.each(["000000", "111111", "123456", "654321", "890123", "123123", "121212", "112211", "100001"])(
    "fraco %s",
    (pin) => expect(checkPin(pin)).toBe("WEAK"),
  );
});

describe("hashPin / verifyPin", () => {
  it("confere o PIN certo e recusa o errado", async () => {
    const h = await hashPin("482915");
    expect(h).toMatch(/^scrypt\$v1\$16384\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(h).not.toContain("482915");
    expect(await verifyPin("482915", h)).toBe(true);
    expect(await verifyPin("482916", h)).toBe(false);
  });

  it("mesmo PIN gera hashes diferentes (sal)", async () => {
    expect(await hashPin("482915")).not.toBe(await hashPin("482915"));
  });

  it("sem hash guardado nunca confere (nem com o PIN do hash fictício)", async () => {
    expect(await verifyPin("000000", null)).toBe(false);
    expect(await verifyPin("482915", null)).toBe(false);
  });

  it("hash malformado não confere", async () => {
    expect(await verifyPin("482915", "lixo")).toBe(false);
    expect(await verifyPin("482915", "scrypt$v2$1$1$1$a$b")).toBe(false);
  });

  it("pepper: com outro APP_SECRET o mesmo hash não confere (dump do banco é inútil)", async () => {
    const h = await hashPin("482915");
    const original = process.env.APP_SECRET;
    process.env.APP_SECRET = "outro-segredo-0123456789-abcdefghijklmnopqrstuvwxyz";
    resetEnvCache();
    clearKeyCache();
    try {
      expect(await verifyPin("482915", h)).toBe(false);
    } finally {
      process.env.APP_SECRET = original;
    }
  });
});

describe("lockDurationMs", () => {
  it("bloqueia a cada 5 erros, dobrando, com teto de 24h", () => {
    expect(lockDurationMs(4)).toBe(0);
    expect(lockDurationMs(5)).toBe(15 * 60_000);
    expect(lockDurationMs(6)).toBe(0);
    expect(lockDurationMs(10)).toBe(30 * 60_000);
    expect(lockDurationMs(15)).toBe(60 * 60_000);
    expect(lockDurationMs(100)).toBe(24 * 60 * 60_000);
  });
});
