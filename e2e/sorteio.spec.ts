import type { Browser, BrowserContext, Page } from "@playwright/test";
import { expect, newPhoneContext, test } from "./fixtures";

/**
 * Sorteio de ponta a ponta: 4 pessoas em 4 "celulares", exclusão, sorteio,
 * revelação individual e refazer. Confere as regras no resultado real.
 */

const PIN = "730164";
const REDO_TEXT = "Alguns participantes podem já ter visto seus resultados. Tem certeza que deseja refazer o sorteio?";

async function phone(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await newPhoneContext(browser);
  return { ctx, page: await ctx.newPage() };
}

async function fillPin(page: Page) {
  await page.getByLabel(/Crie um PIN/).fill(PIN);
  await page.getByLabel("Repita o PIN").fill(PIN);
}

async function createGroup(page: Page) {
  await page.goto("/criar");
  await page.getByLabel("Nome do amigo secreto").fill("Sorteio E2E");
  await page.getByLabel("Seu nome").fill("Robert");
  await fillPin(page);
  await page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(page).toHaveURL(/\/grupo\/[A-Z2-9]{6}\?novo=1$/);
  return new URL(page.url()).pathname.split("/")[2]!;
}

async function joinAndConfirm(page: Page, code: string, name: string) {
  await page.goto(`/grupo/${code}`);
  await page.getByLabel("Seu nome").fill(name);
  await fillPin(page);
  await page.getByRole("button", { name: "Entrar no grupo" }).click();
  await page.getByRole("button", { name: "Confirmar minha participação" }).click();
  await expect(page.getByText("Sua participação está confirmada ✓")).toBeVisible();
}

/** Abre "meu amigo secreto", confere que o nome não está na página e revela. */
async function reveal(page: Page, code: string, allNames: string[], me: string): Promise<string> {
  await page.goto(`/grupo/${code}`);
  await page.getByRole("link", { name: /Ver meu amigo secreto/ }).click();
  await expect(page).toHaveURL(new RegExp(`/grupo/${code}/eu$`));
  // HTML cru que o servidor entrega para /eu (com o cookie da pessoa), incluindo
  // o payload RSC: antes de revelar, nenhum outro participante aparece nele
  const res = await page.request.get(`/grupo/${code}/eu`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain("Revelar meu amigo secreto");
  for (const n of allNames) if (n !== me) expect(html).not.toContain(n);
  await page.getByRole("button", { name: "Revelar meu amigo secreto" }).click();
  const name = (await page.getByTestId("friend-name").textContent())!.trim();
  return name;
}

test("sorteio completo com exclusão, revelação individual e refazer", async ({ browser }) => {
  const names = ["Robert", "Maria", "João", "Carlos"];
  const phones: Record<string, Page> = {};
  const ctxs: BrowserContext[] = [];

  const org = await phone(browser);
  ctxs.push(org.ctx);
  phones.Robert = org.page;
  const code = await createGroup(org.page);
  for (const n of names.slice(1)) {
    const p = await phone(browser);
    ctxs.push(p.ctx);
    phones[n] = p.page;
    await joinAndConfirm(p.page, code, n);
  }

  // antes do sorteio a área do participante avisa que ainda não sorteou
  await phones.Maria!.goto(`/grupo/${code}/eu`);
  await expect(phones.Maria!.getByText("O sorteio ainda não foi feito.", { exact: false })).toBeVisible();

  // organizador: exclusão Maria <-> João
  const admin = org.page;
  await admin.goto(`/grupo/${code}/admin`);
  await admin.getByLabel("Quem").selectOption({ label: "Maria" });
  await admin.getByLabel("não pode tirar").selectOption({ label: "João" });
  await admin.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(admin.getByText("Regra adicionada.")).toBeVisible();
  await expect(admin.getByText("Maria não pode tirar João")).toBeVisible();
  await expect(admin.getByText("João não pode tirar Maria")).toBeVisible();

  // sortear (com diálogo de confirmação)
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "🎲 Realizar sorteio" }).click();
  // a página recarrega no estado "sorteado" (o botão some e vira o resumo)
  await expect(admin.getByText(/Sorteio realizado em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  await expect(admin.getByText(/0\s*de 4 já viram o resultado/)).toBeVisible();
  await expect(admin.getByRole("button", { name: /Realizar sorteio/ })).toHaveCount(0);

  // cada um revela o seu
  const result: Record<string, string> = {};
  for (const n of names) result[n] = await reveal(phones[n]!, code, names, n);
  expect(new Set(Object.values(result)).size).toBe(4); // todos tirados uma vez
  for (const n of names) {
    expect(names).toContain(result[n]);
    expect(result[n]).not.toBe(n); // ninguém tirou a si mesmo
  }
  expect(result.Maria).not.toBe("João");
  expect(result.João).not.toBe("Maria");

  // painel: conta quantos viram, sem mostrar pares
  // (a aba do organizador foi usada para revelar; volta ao painel)
  await admin.goto(`/grupo/${code}/admin`);
  await expect(admin.getByText(/4\s*de 4 já viram o resultado/)).toBeVisible();
  const adminHtml = await admin.content();
  expect(adminHtml).not.toContain("friend-name");

  // quem não participa não acessa a área de ninguém
  const visitor = await phone(browser);
  ctxs.push(visitor.ctx);
  await visitor.page.goto(`/grupo/${code}/eu`);
  await expect(visitor.page).toHaveURL(new RegExp(`/grupo/${code}$`));

  // refazer: diálogo com o texto exigido
  await admin.getByText("Precisa mudar algo?").click();
  const dialogText = new Promise<string>((resolve) =>
    admin.once("dialog", (d) => {
      resolve(d.message());
      void d.accept();
    }),
  );
  await admin.getByRole("button", { name: "Refazer sorteio" }).click();
  expect(await dialogText).toBe(REDO_TEXT);
  await expect(admin.getByText(/Novo sorteio realizado com 4 participantes/)).toBeVisible();
  await admin.reload();
  await expect(admin.getByText(/0\s*de 4 já viram o resultado/)).toBeVisible();

  // novo resultado continua válido
  const again: Record<string, string> = {};
  for (const n of names) again[n] = await reveal(phones[n]!, code, names, n);
  expect(new Set(Object.values(again)).size).toBe(4);
  for (const n of names) expect(again[n]).not.toBe(n);
  expect(again.Maria).not.toBe("João");

  for (const c of ctxs) await c.close();
});

test("cancelar no diálogo não faz nada", async ({ browser }) => {
  const org = await phone(browser);
  const code = await createGroup(org.page);
  for (const n of ["Ana", "Bia"]) {
    const p = await phone(browser);
    await joinAndConfirm(p.page, code, n);
    await p.ctx.close();
  }
  await org.page.goto(`/grupo/${code}/admin`);
  org.page.once("dialog", (d) => d.dismiss());
  await org.page.getByRole("button", { name: "🎲 Realizar sorteio" }).click();
  await org.page.waitForTimeout(500);
  await org.page.reload();
  await expect(org.page.getByRole("button", { name: "🎲 Realizar sorteio" })).toBeVisible();
  await org.ctx.close();
});

test("exclusões impossíveis bloqueiam o botão com a mensagem exigida", async ({ browser }) => {
  const org = await phone(browser);
  const code = await createGroup(org.page);
  for (const n of ["Ana", "Bia"]) {
    const p = await phone(browser);
    await joinAndConfirm(p.page, code, n);
    await p.ctx.close();
  }
  const admin = org.page;
  await admin.goto(`/grupo/${code}/admin`);
  for (const n of ["Ana", "Bia"]) {
    await admin.getByLabel("Quem").selectOption({ label: "Robert" });
    await admin.getByLabel("não pode tirar").selectOption({ label: n });
    await admin.getByLabel("Nos dois sentidos").uncheck();
    await admin.getByRole("button", { name: "Adicionar regra" }).click();
    await expect(admin.getByText(`Robert não pode tirar ${n}`)).toBeVisible();
  }
  await expect(admin.getByText(/o sorteio NÃO é possível/)).toBeVisible();
  await expect(
    admin.getByText("Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões."),
  ).toBeVisible();
  await expect(admin.getByRole("button", { name: "Realizar sorteio" })).toBeDisabled();
  await org.ctx.close();
});
