import { describe, expect, it } from "vitest";
import { formatEventDate, formatWhen } from "./format";
import { groupUrl, inviteMessage, whatsappShareUrl } from "./share";

describe("format", () => {
  it("data por extenso sem deslocar o dia por fuso", () => {
    expect(formatEventDate("2026-12-24")).toBe("quinta-feira, 24 de dezembro de 2026");
    expect(formatEventDate("2027-01-01")).toBe("sexta-feira, 1 de janeiro de 2027");
  });
  it("quando", () => {
    expect(formatWhen(null, null)).toBeNull();
    expect(formatWhen(null, "20:00")).toBe("às 20:00");
    expect(formatWhen("2026-12-24", "20:00")).toBe("quinta-feira, 24 de dezembro de 2026, às 20:00");
  });
});

describe("share", () => {
  const group = { name: "Natal", eventDate: "2026-12-24", eventTime: "20:00", location: "Casa da vó", giftValueCents: 10000 };

  it("monta o link a partir da URL base", () => {
    expect(groupUrl("https://amigo.app", "K7PX2M")).toBe("https://amigo.app/grupo/K7PX2M");
    expect(groupUrl("https://amigo.app/", "K7PX2M")).toBe("https://amigo.app/grupo/K7PX2M");
  });

  it("mensagem completa", () => {
    const msg = inviteMessage(group, "https://amigo.app/grupo/K7PX2M");
    expect(msg).toContain("*Natal*");
    expect(msg).toContain("📅 24/12 às 20:00");
    expect(msg).toContain("📍 Casa da vó");
    expect(msg.replace(/\s/g, " ")).toContain("R$ 100,00");
    expect(msg.endsWith("https://amigo.app/grupo/K7PX2M")).toBe(true);
  });

  it("mensagem mínima, sem linhas vazias sobrando", () => {
    const msg = inviteMessage({ name: "G", eventDate: null, eventTime: null, location: null, giftValueCents: null }, "u");
    expect(msg).toBe("🎁 Você foi convidado(a) para o amigo secreto *G*!\n\nEntre pelo link e confirme sua participação:\nu");
  });

  it("URL do WhatsApp codifica o texto", () => {
    expect(whatsappShareUrl("a & b\nc")).toBe("https://wa.me/?text=a%20%26%20b%0Ac");
  });
});

describe("formatDateTime", () => {
  it("usa o fuso de São Paulo", async () => {
    const { formatDateTime } = await import("./format");
    expect(formatDateTime(new Date("2026-12-25T02:30:00Z"))).toBe("24/12/2026 às 23:30");
  });
});
