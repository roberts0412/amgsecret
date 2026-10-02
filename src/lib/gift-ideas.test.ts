import { describe, expect, it } from "vitest";
import { GIFT_HUB, GIFT_PAGES, getGiftPage } from "./gift-ideas";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

describe("páginas de ideias de presente", () => {
  it.each(GIFT_PAGES.map((p) => [p.slug, p] as const))("%s: SEO bem formado e número de ideias no título confere", (_, p) => {
    expect(p.title.length).toBeLessThanOrEqual(60);
    expect(p.description.length).toBeGreaterThanOrEqual(110);
    expect(p.description.length).toBeLessThanOrEqual(160);
    expect(norm(p.title)).toContain(norm(p.keyword));
    expect(norm(p.h1)).toContain(norm(p.keyword));
    expect(p.slug).toBe(`ate-${p.maxReais}-reais`);
    const total = p.groups.reduce((n, g) => n + g.ideas.length, 0);
    expect(p.title).toContain(`${total} ideias`);
    expect(p.faq.length).toBeGreaterThanOrEqual(3);
    // ideias sem nome repetido na mesma página
    const names = p.groups.flatMap((g) => g.ideas.map((i) => i.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it("títulos e descrições únicos; hub com SEO válido", () => {
    expect(new Set(GIFT_PAGES.map((p) => p.title)).size).toBe(GIFT_PAGES.length);
    expect(new Set(GIFT_PAGES.map((p) => p.description)).size).toBe(GIFT_PAGES.length);
    expect(GIFT_HUB.title.length).toBeLessThanOrEqual(60);
    expect(GIFT_HUB.description.length).toBeLessThanOrEqual(160);
    expect(getGiftPage("ate-50-reais")?.maxReais).toBe(50);
    expect(getGiftPage("x")).toBeUndefined();
  });
});
