import { describe, expect, it } from "vitest";
import { GAME_KIND_IDS, gameTerm, gameTitle } from "./game-kinds";

describe("nome da brincadeira", () => {
  it("traduz o tipo do grupo", () => {
    expect(gameTerm({ gameKind: "oculto" })).toBe("amigo oculto");
    expect(gameTitle({ gameKind: "onca" })).toBe("Amigo da onça");
    expect(gameTitle({ gameKind: "chocolate" })).toBe("Amigo chocolate");
  });

  it("\"outro\" usa o nome escrito pelo organizador", () => {
    expect(gameTerm({ gameKind: "outro", gameName: "amigo doce" })).toBe("amigo doce");
    expect(gameTitle({ gameKind: "outro", gameName: "amigo doce" })).toBe("Amigo doce");
    // sem nome, não fica em branco
    expect(gameTerm({ gameKind: "outro", gameName: "  " })).toBe("amigo secreto");
    // nome guardado só vale para "outro"
    expect(gameTerm({ gameKind: "oculto", gameName: "qualquer" })).toBe("amigo oculto");
  });

  it("valor ausente ou desconhecido vira amigo secreto", () => {
    expect(gameTerm(null)).toBe("amigo secreto");
    expect(gameTerm({})).toBe("amigo secreto");
    expect(gameTerm({ gameKind: "<script>" })).toBe("amigo secreto");
  });

  it("ids curtos (cabem na coluna do banco) e sem repetição", () => {
    expect(new Set(GAME_KIND_IDS).size).toBe(GAME_KIND_IDS.length);
    for (const id of GAME_KIND_IDS) expect(id).toMatch(/^[a-z]{1,20}$/);
  });
});
