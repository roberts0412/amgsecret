import { expect, test } from "./fixtures";

/** Ideias de presente (SEO + afiliado) e painel do dono. */

test("ideias de presente: hub, faixas, links da Amazon com tag e no sitemap", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "🎁 Ideias de presente por valor" }).click();
  await expect(page).toHaveURL(/\/ideias-de-presente$/);
  await page.getByRole("link", { name: /Até R\$ 50/ }).click();
  await expect(page).toHaveURL(/\/ideias-de-presente\/ate-50-reais$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Presente de amigo secreto até 50 reais");

  const first = page.getByRole("link", { name: "Ver opções até R$ 50 na Amazon ↗" }).first();
  const href = new URL((await first.getAttribute("href"))!);
  expect(href.hostname).toBe("www.amazon.com.br");
  expect(href.searchParams.get("tag")).toBe("e2eteste-20");
  expect(href.searchParams.get("rh")).toBe("p_36:-5000");
  await expect(first).toHaveAttribute("rel", "sponsored noopener noreferrer nofollow");
  await expect(page.getByText(/links para a Amazon são de afiliado/)).toBeVisible();

  expect((await page.request.get("/ideias-de-presente/ate-999-reais")).status()).toBe(404);
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  for (const p of ["/ideias-de-presente</loc>", "/ideias-de-presente/ate-30-reais</loc>", "/ideias-de-presente/ate-100-reais</loc>"]) {
    expect(sitemap).toContain(p);
  }
});

test("painel do dono: pede senha, recusa senha errada e mostra só números", async ({ page }) => {
  const sem = await page.request.get("/painel");
  expect(sem.status()).toBe(401);
  expect(sem.headers()["www-authenticate"]).toContain("Basic");
  expect(sem.headers()["x-robots-tag"]).toContain("noindex");

  const auth = (p: string) => ({ Authorization: `Basic ${Buffer.from(`dono:${p}`).toString("base64")}` });
  expect((await page.request.get("/painel", { headers: auth("errada") })).status()).toBe(401);

  const ok = await page.request.get("/painel", { headers: auth("senha-do-painel-e2e-123") });
  expect(ok.status()).toBe(200);
  expect(ok.headers()["cache-control"]).toContain("no-store");
  const html = await ok.text();
  expect(html).toContain("Painel do dono");
  expect(html).toContain("grupos ativos");
});

test("e-mails: descadastro com link inválido e lembretes desligados sem segredo", async ({ page }) => {
  const bad = await page.request.get("/api/email/sair?p=abcdefghijklmnopqrstuvwx&s=" + "x".repeat(32));
  expect(bad.status()).toBe(400);
  expect(await bad.text()).toContain("Link inválido");
  expect((await page.request.post("/api/email/sair?p=abc&s=def")).status()).toBe(400);
  expect((await page.request.post("/api/cron/lembretes")).status()).toBe(404);
});
