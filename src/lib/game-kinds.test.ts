import { describe, expect, it } from "vitest";
import { GAME_KIND_IDS, gameTerm, gameTitle } from "./game-kinds";

describe("nome da brincadeira", () => {
  it("traduz o tipo do grupo", () => {
    expect(gameTerm("oculto")).toBe("amigo oculto");
    expect(gameTitle("onca")).toBe("Amigo da onça");
    expect(gameTitle("chocolate")).toBe("Amigo chocolate");
  });

  it("valor ausente ou desconhecido vira amigo secreto", () => {
    expect(gameTerm(null)).toBe("amigo secreto");
    expect(gameTerm(undefined)).toBe("amigo secreto");
    expect(gameTerm("<script>")).toBe("amigo secreto");
  });

  it("ids curtos (cabem na coluna do banco) e sem repetição", () => {
    expect(new Set(GAME_KIND_IDS).size).toBe(GAME_KIND_IDS.length);
    for (const id of GAME_KIND_IDS) expect(id).toMatch(/^[a-z]{1,20}$/);
  });
});
