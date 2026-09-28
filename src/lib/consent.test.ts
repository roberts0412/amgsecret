import { describe, expect, it } from "vitest";
import { consentCookie, readConsent } from "./consent";

describe("consentimento", () => {
  it("lê a escolha do cookie", () => {
    expect(readConsent("")).toBeNull();
    expect(readConsent("a=1; consentimento=all")).toBe("all");
    expect(readConsent("consentimento=essential; b=2")).toBe("essential");
    expect(readConsent("consentimento=hack")).toBeNull();
    expect(readConsent("xconsentimento=all")).toBeNull();
  });
  it("gera cookie de 1 ano, Secure em https", () => {
    expect(consentCookie("all", true)).toBe("consentimento=all; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
    expect(consentCookie("essential", false)).not.toContain("Secure");
  });
});
