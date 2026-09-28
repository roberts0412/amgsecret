import { expect, test } from "./fixtures";

/** Etapa 7: páginas de SEO, sitemap, robots e noindex das áreas privadas. */

const SLUGS = [
  "amigo-secreto-online",
  "sorteio-amigo-secreto",
  "amigo-secreto-gratis",
  "sorteador-amigo-secreto",
  "amigo-secreto-com-lista-de-desejos",
];
const BASE = "http://localhost:3200";

for (const slug of SLUGS) {
  test(`SEO /${slug}`, async ({ page }) => {
    const res = await page.goto(`/${slug}`);
    expect(res!.status()).toBe(200);
    expect(res!.headers()["x-robots-tag"]).toBeUndefined();

    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThanOrEqual(60);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc!.length).toBeGreaterThan(100);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${BASE}/${slug}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0); // indexável

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Criar amigo secreto grátis" })).toHaveAttribute("href", "/criar");

    // JSON-LD válido com FAQ e breadcrumb
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    const types = ld.map((x: { "@type": string }) => x["@type"]);
    expect(types).toEqual(["FAQPage", "BreadcrumbList"]);
    expect(ld[0].mainEntity.length).toBeGreaterThanOrEqual(3);

    // FAQ abre ao tocar (details/summary acessível)
    const first = page.locator("details").first();
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", "");
  });
}

test("slug desconhecido dá 404", async ({ page }) => {
  expect((await page.goto("/amigo-secreto-pago"))!.status()).toBe(404);
});

test("sitemap só com páginas públicas", async ({ page }) => {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  for (const slug of SLUGS) expect(xml).toContain(`<loc>${BASE}/${slug}</loc>`);
  expect(xml).toContain(`<loc>${BASE}/</loc>`);
  expect(xml).toContain(`<loc>${BASE}/criar</loc>`);
  expect(xml).not.toContain("/grupo/");
  expect(xml).not.toContain("/acesso/");
});

test("robots: bloqueia links privados; grupos saem da busca por noindex", async ({ page }) => {
  const txt = await (await page.request.get("/robots.txt")).text();
  expect(txt).toContain("Disallow: /acesso/");
  expect(txt).not.toContain("Disallow: /grupo/");
  expect(txt).toContain(`Sitemap: ${BASE}/sitemap.xml`);

  // página de grupo inexistente também não é indexável
  const res = await page.request.get("/grupo/ZZZZZZ");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

test("home: canonical, JSON-LD e links para os guias", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${BASE}`);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@type"]).toBe("WebApplication");
  for (const slug of SLUGS) await expect(page.locator(`a[href="/${slug}"]`)).toHaveCount(1);
});

test("home tem imagem de prévia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});
