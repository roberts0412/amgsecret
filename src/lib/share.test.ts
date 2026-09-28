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

describe("mensagens do organizador", () => {
  it("lembrete lista quem falta (resumindo listas grandes)", async () => {
    const { reminderMessage } = await import("./share");
    expect(reminderMessage("Natal", ["Ana", "Bia"], "u")).toBe(
      "⏰ Lembrete do amigo secreto *Natal*!\nAinda falta confirmar: Ana, Bia.\n\nConfirme pelo link para entrar no sorteio:\nu",
    );
    const many = Array.from({ length: 11 }, (_, i) => `P${i}`);
    expect(reminderMessage("G", many, "u")).toContain("P7 e mais 3.");
  });

  it("aviso de sorteio não revela ninguém", async () => {
    const { drawDoneMessage } = await import("./share");
    const msg = drawDoneMessage("Natal", "https://x/grupo/ABC");
    expect(msg).toContain("*Natal*");
    expect(msg.endsWith("https://x/grupo/ABC")).toBe(true);
  });
});

describe("lembrete de quem não viu", () => {
  it("lista os nomes e não revela resultado", async () => {
    const { notViewedReminderMessage } = await import("./share");
    const msg = notViewedReminderMessage("Natal", ["Ana", "Bia"], "u");
    expect(msg).toContain("Ainda não viram quem tiraram: Ana, Bia.");
    expect(msg.endsWith("u")).toBe(true);
  });
});
