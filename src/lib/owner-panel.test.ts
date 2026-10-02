import { describe, expect, it } from "vitest";
import { checkBasicAuth, renderPanel } from "./owner-panel";

const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
const PASS = "senha-bem-comprida-123";

describe("painel do dono", () => {
  it("aceita só a senha certa (usuário é ignorado)", () => {
    expect(checkBasicAuth(basic("dono", PASS), PASS)).toBe(true);
    expect(checkBasicAuth(basic("qualquer", PASS), PASS)).toBe(true);
    expect(checkBasicAuth(basic("dono", "errada"), PASS)).toBe(false);
    expect(checkBasicAuth(basic("dono", `${PASS}x`), PASS)).toBe(false);
    expect(checkBasicAuth(null, PASS)).toBe(false);
    expect(checkBasicAuth("Bearer abc", PASS)).toBe(false);
    expect(checkBasicAuth(`Basic ${Buffer.from(PASS).toString("base64")}`, PASS)).toBe(false); // sem ":"
  });

  it("HTML escapa conteúdo e mostra os números", () => {
    const html = renderPanel({
      groups: 1234, groupsDrawn: 2, participants: 30, revealed: 5, wishes: 7,
      byKind: [{ kind: "oculto", count: 3 }, { kind: "<script>", count: 1 }],
      daily: [{ day: "2026-10-02", groups: 4, participants: 20 }],
    });
    expect(html).toContain("1.234");
    expect(html).toContain("Amigo oculto");
    expect(html).toContain("02/10/2026");
    expect(html).not.toContain("<script>");
    expect(html).toContain('content="noindex,nofollow"');
  });
});
