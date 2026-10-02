import { describe, expect, it } from "vitest";
import { drawDoneEmail, reminderEmail } from "./templates";

const base = { term: "amigo oculto", groupName: "Natal <da> Família", groupUrl: "https://x.com.br/grupo/ABC234", unsubUrl: "https://x.com.br/api/email/sair?p=a&s=b", name: "Maria Souza" };

describe("e-mails de aviso", () => {
  it("aviso do sorteio: usa o nome da brincadeira, escapa HTML e traz descadastro", () => {
    const m = drawDoneEmail(base);
    expect(m.subject).toBe('🎉 O sorteio do amigo oculto "Natal <da> Família" foi feito!');
    expect(m.html).toContain("Natal &lt;da&gt; Família");
    expect(m.html).not.toContain("<da>");
    expect(m.html).toContain("Oi, Maria!");
    expect(m.html).toContain(base.groupUrl);
    expect(m.text).toContain(base.unsubUrl);
    expect(m.html).toContain("Não quero mais receber");
  });

  it("lembrete: data, local e valor", () => {
    const m = reminderEmail({ ...base, eventDate: "2026-12-24", eventTime: "20:00", location: "Casa da vó", giftValueCents: 5000 });
    expect(m.subject).toContain("Faltam 3 dias para o amigo oculto");
    expect(m.text).toContain("quinta-feira, 24 de dezembro de 2026, às 20:00");
    expect(m.text).toContain("📍 Casa da vó");
    expect(m.text).toMatch(/R\$\s50,00/);
  });
});
