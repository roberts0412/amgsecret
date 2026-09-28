import type { Page } from "@playwright/test";
import { expect, newPhoneContext, test } from "./fixtures";

/** Etapa 8: cabeçalhos, limite de acessos, páginas legais, exclusão do grupo, saúde. */

async function createGroup(page: Page, name = "Segurança E2E") {
  await page.goto("/criar");
  await page.getByLabel("Nome do amigo secreto").fill(name);
  await page.getByLabel("Seu nome").fill("Robert");
  await page.getByLabel(/Crie um PIN/).fill("730164");
  await page.getByLabel("Repita o PIN").fill("730164");
  await page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(page).toHaveURL(/novo=1/);
  return new URL(page.url()).pathname.split("/")[2]!;
}

test("cabeçalhos de segurança", async ({ page }) => {
  const res = await page.request.get("/");
  const h = res.headers();
  const csp = h["content-security-policy"]!;
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("form-action 'self'");
  expect(csp).toContain("base-uri 'self'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin-allow-popups");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("a página funciona com a CSP ativa (sem violações no console)", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  const code = await createGroup(page, "CSP E2E");
  await page.goto(`/grupo/${code}/admin`);
  await page.goto(`/grupo/${code}/eu`);
  await page.goto("/amigo-secreto-online");
  expect(violations).toEqual([]);
});

test("saúde: /api/health responde com o banco", async ({ page }) => {
  const res = await page.request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("privacidade e termos acessíveis pelo rodapé; sem AdSense não há aviso de cookies", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Aviso de cookies" })).toHaveCount(0);
  await page.getByRole("link", { name: "Privacidade" }).click();
  await expect(page.getByRole("heading", { name: "Política de Privacidade" })).toBeVisible();
  await expect(page.getByText(/LGPD/).first()).toBeVisible();
  await page.getByRole("link", { name: "Termos de uso" }).click();
  await expect(page.getByRole("heading", { name: "Termos de Uso" })).toBeVisible();
});

test("organizador exclui o grupo (com confirmação pelo código)", async ({ page }) => {
  const code = await createGroup(page, "Excluir E2E");
  await page.goto(`/grupo/${code}/admin`);
  await page.getByText("Excluir grupo", { exact: true }).click();
  await page.getByLabel(`Digite ${code} para confirmar`).fill("ERRADO");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir grupo definitivamente" }).click();
  await expect(page.getByText(`Para confirmar, digite o código do grupo: ${code}`)).toBeVisible();

  await page.getByLabel(`Digite ${code} para confirmar`).fill(code.toLowerCase());
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir grupo definitivamente" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await page.request.get(`/grupo/${code}`)).status()).toBe(404);
});

test("limite de acessos às páginas de grupo (varredura de códigos)", async ({ browser }) => {
  const ctx = await newPhoneContext(browser);
  let blocked = 0;
  for (let i = 0; i < 320 && blocked === 0; i++) {
    const r = await ctx.request.get(`/grupo/ZZZZZ${"ABCDEFGHJK"[i % 10]}`, { maxRedirects: 0 });
    if (r.status() === 429) {
      blocked = i;
      expect(r.headers()["retry-after"]).toBeTruthy();
    }
  }
  expect(blocked).toBeGreaterThanOrEqual(299);
  await ctx.close();
});
