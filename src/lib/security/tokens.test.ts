import { describe, expect, it } from "vitest";
import { generateGroupCode, generateToken, hashToken, normalizeGroupCode, verifyToken } from "./tokens";

describe("tokens", () => {
  it("gera tokens únicos, longos e seguros para URL", () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateToken()));
    expect(set.size).toBe(1000);
    for (const t of set) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("verifica pelo hash, sem guardar o token", () => {
    const t = generateToken();
    const h = hashToken(t);
    expect(h).not.toContain(t);
    expect(verifyToken(t, h)).toBe(true);
    expect(verifyToken(generateToken(), h)).toBe(false);
    expect(verifyToken(t, "abc")).toBe(false);
  });

  it("códigos de grupo usam alfabeto sem caracteres ambíguos", () => {
    for (let i = 0; i < 500; i++) {
      const c = generateGroupCode();
      expect(c).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
      expect(normalizeGroupCode(` ${c.toLowerCase()} `)).toBe(c);
    }
    expect(normalizeGroupCode("ABC10O")).toBeNull();
    expect(normalizeGroupCode("../etc")).toBeNull();
  });
});
