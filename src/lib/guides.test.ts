import { describe, expect, it } from "vitest";
import { formatGuideDate, getGuide, GUIDES, GUIDES_HUB } from "./guides";

const words = (g: (typeof GUIDES)[number]) =>
  [g.intro, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])].join(" ").split(/\s+/).length;

describe("guias", () => {
  it.each(GUIDES.map((g) => [g.slug, g] as const))("%s: metadados bem formados e texto substancial", (_, g) => {
    expect(g.title.length).toBeLessThanOrEqual(60);
    expect(g.description.length).toBeGreaterThanOrEqual(110);
    expect(g.description.length).toBeLessThanOrEqual(160);
    expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(g.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(g.sections.length).toBeGreaterThanOrEqual(4);
    expect(words(g)).toBeGreaterThanOrEqual(300);
  });

  it("slugs, títulos e descrições são únicos", () => {
    for (const key of ["slug", "title", "description", "h1"] as const) {
      expect(new Set(GUIDES.map((g) => g[key])).size).toBe(GUIDES.length);
    }
  });

  it("hub e helpers", () => {
    expect(GUIDES_HUB.title.length).toBeLessThanOrEqual(60);
    expect(getGuide("regras-do-amigo-secreto")?.emoji).toBe("📋");
    expect(getGuide("nao-existe")).toBeUndefined();
    expect(formatGuideDate("2026-10-13")).toBe("13/10/2026");
  });
});
