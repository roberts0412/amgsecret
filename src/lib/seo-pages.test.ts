import { describe, expect, it } from "vitest";
import { getSeoPage, jsonLdScript, SEO_PAGES } from "./seo-pages";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

describe("páginas de SEO", () => {
  it("cobre as 5 intenções de busca pedidas", () => {
    expect(SEO_PAGES.map((p) => p.slug).sort()).toEqual([
      "amigo-secreto-com-lista-de-desejos",
      "amigo-secreto-gratis",
      "amigo-secreto-online",
      "sorteador-amigo-secreto",
      "sorteio-amigo-secreto",
    ]);
  });

  it.each(SEO_PAGES.map((p) => [p.slug, p] as const))("%s: título, descrição e H1 bem formados", (_, p) => {
    expect(p.title.length).toBeLessThanOrEqual(60);
    expect(p.description.length).toBeGreaterThanOrEqual(110);
    expect(p.description.length).toBeLessThanOrEqual(160);
    expect(norm(p.title)).toContain(norm(p.keyword));
    expect(norm(p.h1)).toContain(norm(p.keyword));
    expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(p.faq.length).toBeGreaterThanOrEqual(3);
    expect(p.sections.length).toBeGreaterThanOrEqual(2);
  });

  it("títulos e descrições são únicos (sem conteúdo duplicado)", () => {
    expect(new Set(SEO_PAGES.map((p) => p.title)).size).toBe(SEO_PAGES.length);
    expect(new Set(SEO_PAGES.map((p) => p.description)).size).toBe(SEO_PAGES.length);
    expect(new Set(SEO_PAGES.map((p) => p.h1)).size).toBe(SEO_PAGES.length);
  });

  it("getSeoPage", () => {
    expect(getSeoPage("amigo-secreto-gratis")?.keyword).toBe("amigo secreto grátis");
    expect(getSeoPage("nao-existe")).toBeUndefined();
  });

  it("JSON-LD não permite fechar a tag <script>", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
