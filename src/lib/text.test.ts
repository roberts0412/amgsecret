import { describe, expect, it } from "vitest";
import { cleanLine, cleanMultiline, nameKey } from "./text";

describe("text", () => {
  it("cleanLine colapsa espaços e remove controles/invisíveis", () => {
    expect(cleanLine("  Maria \t\n da   Silva  ")).toBe("Maria da Silva");
    expect(cleanLine("Ro\u0000bert​")).toBe("Robert");
    // bidi override (usado para disfarçar texto)
    expect(cleanLine("abc‮evil")).toBe("abcevil");
  });

  it("preserva emojis compostos (ZWJ)", () => {
    expect(cleanLine("Família 👨‍👩‍👧")).toBe("Família 👨‍👩‍👧");
  });

  it("cleanMultiline mantém quebras de linha, no máximo 2 seguidas", () => {
    expect(cleanMultiline("  oi  \r\n\r\n\r\n\r\ntudo   bem? \n")).toBe("oi\n\ntudo bem?");
  });

  it("nameKey ignora acento, caixa e espaços", () => {
    expect(nameKey("  JOSÉ  da Silva ")).toBe(nameKey("jose da silva"));
    expect(nameKey("João")).toBe("joao");
    expect(nameKey("Ana")).not.toBe(nameKey("Anna"));
  });

  it("formas Unicode equivalentes (NFC/NFD) viram a mesma chave", () => {
    expect(nameKey("José")).toBe(nameKey("José"));
  });
});
