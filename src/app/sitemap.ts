import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";
import { GIFT_HUB, GIFT_PAGES } from "@/lib/gift-ideas";
import { SEO_PAGES } from "@/lib/seo-pages";

/**
 * Só páginas públicas e úteis para busca. Grupos, links privados e áreas
 * pessoais NUNCA entram (além de terem noindex).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getEnv().APP_URL;
  const url = (path: string) => new URL(path, base).toString();
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/criar"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.3 },
    ...SEO_PAGES.map((p) => ({ url: url(`/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: url(GIFT_HUB.path), changeFrequency: "monthly", priority: 0.7 },
    ...GIFT_PAGES.map((p) => ({ url: url(`${GIFT_HUB.path}/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
