import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Etapa 6: prévia do WhatsApp, temas, mensagens prontas, manifest. */

async function createGroup(page: Page) {
  await page.goto("/criar");
  await page.getByLabel("Nome do amigo secreto").fill("Acabamento E2E");
  await page.getByLabel("Data").fill("2026-12-24");
  await page.getByLabel("Valor do presente (R$)").fill("80");
  await page.getByLabel("Seu nome").fill("Robert");
  await page.getByLabel(/Crie um PIN/).fill("730164");
  await page.getByLabel("Repita o PIN").fill("730164");
  await page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(page).toHaveURL(/novo=1/);
  return new URL(page.url()).pathname.split("/")[2]!;
}

test("prévia do WhatsApp: og:image do grupo é uma imagem PNG 1200x630", async ({ page }) => {
  const code = await createGroup(page);
  const html = await (await page.request.get(`/grupo/${code}`)).text();
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  expect(og).toBeTruthy();
  expect(og).toContain(`/grupo/${code}/opengraph-image`);
  expect(html).toContain('<meta property="og:locale" content="pt_BR"/>');
  const img = await page.request.get(new URL(og!).pathname + new URL(og!).search);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/png");
  expect((await img.body()).length).toBeGreaterThan(10_000);
});

test("tema: grátis mostra premium bloqueado; mensagem de cobrança no painel", async ({ page, browser }) => {
  const code = await createGroup(page);
  // alguém entra e não confirma
  const ctx = await browser.newContext({ extraHTTPHeaders: { "x-real-ip": "10.99.0.1" } });
  const guest = await ctx.newPage();
  await guest.goto(`/grupo/${code}`);
  await guest.getByLabel("Seu nome").fill("Pendente Silva");
  await guest.getByLabel(/Crie um PIN/).fill("730164");
  await guest.getByLabel("Repita o PIN").fill("730164");
  await guest.getByRole("button", { name: "Entrar no grupo" }).click();
  await expect(guest.getByRole("heading", { name: "Olá, Pendente Silva!" })).toBeVisible();
  await ctx.close();

  await page.goto(`/grupo/${code}/admin`);
  await expect(page.getByRole("button", { name: /Clássico/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Natal/ })).toBeDisabled();
  await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "classico");

  const href = await page.getByRole("link", { name: "Cobrar quem não confirmou (1)" }).getAttribute("href");
  const text = decodeURIComponent(new URL(href!).searchParams.get("text")!);
  expect(text).toContain("Ainda falta confirmar: Pendente Silva.");
  expect(text).toContain(`/grupo/${code}`);
});

test("manifest e ícones para 'adicionar à tela inicial'", async ({ page }) => {
  const m = await page.request.get("/manifest.webmanifest");
  expect(m.status()).toBe(200);
  const json = await m.json();
  expect(json).toMatchObject({ name: "Amigo Secreto Fácil", lang: "pt-BR", display: "standalone" });
  expect((await page.request.get("/icon.svg")).status()).toBe(200);
  expect((await page.request.get("/apple-icon")).headers()["content-type"]).toBe("image/png");
});
