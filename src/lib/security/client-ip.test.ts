import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "./client-ip";

describe("clientIpFromHeaders", () => {
  const h = (o: Record<string, string>) => new Headers(o);

  it("ignora cabeçalhos de proxy quando não confiamos no proxy", () => {
    expect(clientIpFromHeaders(h({ "x-forwarded-for": "1.2.3.4" }), false)).toBe("direct");
  });

  it("usa X-Real-IP, depois o primeiro do X-Forwarded-For", () => {
    expect(clientIpFromHeaders(h({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.2.3.4" }), true)).toBe("9.9.9.9");
    expect(clientIpFromHeaders(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }), true)).toBe("1.2.3.4");
    expect(clientIpFromHeaders(h({ "x-forwarded-for": "2001:db8::1" }), true)).toBe("2001:db8::1");
  });

  it("descarta valores que não são IP", () => {
    expect(clientIpFromHeaders(h({ "x-forwarded-for": "<script>, 1.2.3.4" }), true)).toBe("direct");
    expect(clientIpFromHeaders(h({ "x-real-ip": "lixo" }), true)).toBe("direct");
  });
});
