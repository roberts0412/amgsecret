import { describe, expect, it } from "vitest";
import { effectiveTheme, isThemeAllowed, THEMES } from "./themes";
import { PLANS } from "./plans";

describe("temas", () => {
  it("grátis só usa o clássico; premium usa todos", () => {
    expect(isThemeAllowed("classico", "FREE")).toBe(true);
    expect(isThemeAllowed("natal", "FREE")).toBe(false);
    for (const t of THEMES) expect(isThemeAllowed(t.id, "PREMIUM")).toBe(true);
  });

  it("tema desconhecido ou não permitido volta ao padrão", () => {
    expect(effectiveTheme("natal", "FREE")).toBe("classico");
    expect(effectiveTheme("<script>", "PREMIUM")).toBe("classico");
    expect(effectiveTheme(null, "PREMIUM")).toBe("classico");
    expect(effectiveTheme("neon", "PREMIUM")).toBe("neon");
  });

  it("todo tema dos planos existe na lista", () => {
    for (const plan of Object.values(PLANS)) for (const id of plan.themes) expect(THEMES.some((t) => t.id === id)).toBe(true);
  });
});
