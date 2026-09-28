import type { Browser, BrowserContext, Page } from "@playwright/test";
import { expect, newPhoneContext, test } from "./fixtures";

/**
 * Fluxo real no navegador, cada pessoa num "celular" (contexto) diferente:
 * organizador cria → convidados entram/confirmam → organizador acompanha e remove.
 */

async function newPhone(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await newPhoneContext(browser, { permissions: ["clipboard-read", "clipboard-write"] });
  return { ctx, page: await ctx.newPage() };
}

const PIN = "730164";

async function fillPin(page: Page, pin = PIN) {
  await page.getByLabel(/Crie um PIN/).fill(pin);
  await page.getByLabel("Repita o PIN").fill(pin);
}

async function createGroup(page: Page, name = "Natal da Família") {
  await page.goto("/");
  await page.getByRole("link", { name: "Criar amigo secreto" }).click();
  await page.getByLabel("Nome do amigo secreto").fill(name);
  await page.getByLabel("Horário").fill("20:00");
  await page.getByLabel("Local").fill("Casa da vó");
  await page.getByLabel("Valor do presente (R$)").fill("100,00");
  await page.getByLabel("Seu nome").fill("Robert");
  await fillPin(page, "905527");
  await page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(page).toHaveURL(/\/grupo\/[A-Z2-9]{6}\?novo=1$/);
  return new URL(page.url()).pathname.split("/")[2]!;
}

/** Em produção o cookie usa o prefixo __Host- (exige Secure e Path=/). */
function sessionCookie(cookies: { name: string; value: string }[], code: string) {
  return cookies.find((c) => c.name === `__Host-as_${code}` || c.name === `as_${code}`);
}

async function join(page: Page, code: string, name: string) {
  await page.goto(`/grupo/${code}`);
  await page.getByLabel("Seu nome").fill(name);
  await fillPin(page);
  await page.getByRole("button", { name: "Entrar no grupo" }).click();
  await expect(page.getByRole("heading", { name: `Olá, ${name}!` })).toBeVisible();
}

test("fluxo completo: criar, entrar, confirmar, acompanhar e remover", async ({ browser }) => {
  const org = await newPhone(browser);
  const code = await createGroup(org.page);

  await expect(org.page.getByText("Grupo criado!")).toBeVisible();
  await expect(org.page.getByRole("heading", { name: "Natal da Família" })).toBeVisible();
  await expect(org.page.getByText("Presente de até R$ 100,00")).toBeVisible();

  // botão do WhatsApp com mensagem e link do grupo
  const wa = await org.page.getByRole("link", { name: "Compartilhar no WhatsApp" }).getAttribute("href");
  const waText = decodeURIComponent(new URL(wa!).searchParams.get("text")!);
  expect(waText).toContain("*Natal da Família*");
  expect(waText).toContain(`http://localhost:3200/grupo/${code}`);

  // cookie de sessão: httpOnly e SameSite=Lax; invisível ao JavaScript
  const session = (await org.ctx.cookies()).find((c) => c.name === `__Host-as_${code}`)!;
  expect(session.secure).toBe(true);
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Lax");
  expect(await org.page.evaluate(() => document.cookie)).not.toContain(session.value);

  // Maria entra e confirma
  const maria = await newPhone(browser);
  await join(maria.page, code, "Maria");
  await expect(maria.page.getByText("Você entrou no grupo!")).toBeVisible();
  await maria.page.getByRole("button", { name: "Confirmar minha participação" }).click();
  await expect(maria.page.getByText("Sua participação está confirmada ✓")).toBeVisible();
  await expect(maria.page.getByRole("button", { name: "Confirmar minha participação" })).toHaveCount(0);

  // João entra e não confirma
  const joao = await newPhone(browser);
  await join(joao.page, code, "João");

  // nome repetido (caixa/acento diferentes): erro e valor preservado
  const outra = await newPhone(browser);
  await outra.page.goto(`/grupo/${code}`);
  await outra.page.getByLabel("Seu nome").fill("maria");
  await fillPin(outra.page);
  await outra.page.getByRole("button", { name: "Entrar no grupo" }).click();
  await expect(outra.page.getByText(/Já existe alguém chamado "maria"/)).toBeVisible();
  await expect(outra.page.getByLabel("Seu nome")).toHaveValue("maria");

  // a página do grupo mostra só nomes + status, e nenhum token de ninguém
  await org.page.reload();
  const items = org.page.getByRole("listitem").filter({ hasText: /confirmado|aguardando/ });
  await expect(items).toHaveText([/Robert.*confirmado/, /Maria.*confirmado/, /João.*aguardando/]);
  const mariaToken = sessionCookie(await maria.ctx.cookies(), code)!.value;
  expect(await org.page.content()).not.toContain(mariaToken);
  expect(await joao.page.content()).not.toContain(mariaToken);

  // membro não acessa o painel do organizador
  await maria.page.goto(`/grupo/${code}/admin`);
  await expect(maria.page).toHaveURL(new RegExp(`/grupo/${code}$`));

  // organizador remove João
  await org.page.getByRole("link", { name: /Painel do organizador/ }).click();
  await expect(org.page.getByRole("heading", { name: "Painel do organizador" })).toBeVisible();
  await expect(org.page.getByText("2 confirmados · 1 aguardando")).toBeVisible();
  org.page.once("dialog", (d) => d.accept());
  await org.page.getByRole("listitem").filter({ hasText: "João" }).getByRole("button", { name: "Remover" }).click();
  await expect(org.page.getByRole("listitem").filter({ hasText: "João" })).toHaveCount(0);

  // a sessão do João deixou de valer: volta a ver o formulário de entrada
  await joao.page.reload();
  await expect(joao.page.getByRole("button", { name: "Entrar no grupo" })).toBeVisible();

  for (const p of [org, maria, joao, outra]) await p.ctx.close();
});

test("link privado abre a conta em outro aparelho (com confirmação)", async ({ browser }) => {
  const org = await newPhone(browser);
  const code = await createGroup(org.page, "Firma");
  await org.page.getByRole("button", { name: "Copiar meu link privado" }).click();
  await expect(org.page.getByRole("button", { name: "Copiado! ✓" })).toBeVisible();
  const privateUrl = await org.page.evaluate(() => navigator.clipboard.readText());
  expect(privateUrl).toMatch(/^http:\/\/localhost:3200\/acesso\/[A-Za-z0-9_-]{43}$/);

  const other = await newPhone(browser);
  const res = await other.page.goto(privateUrl);
  expect(res!.headers()["referrer-policy"]).toBe("no-referrer");
  expect(res!.headers()["x-robots-tag"]).toContain("noindex");
  // abrir o link NÃO loga sozinho (pré-visualização/CSRF): precisa do clique
  expect(sessionCookie(await other.ctx.cookies(), code)).toBeUndefined();
  await other.page.getByRole("button", { name: /Entrar como Robert/ }).click();
  await expect(other.page).toHaveURL(new RegExp(`/grupo/${code}$`));
  await expect(other.page.getByRole("link", { name: /Painel do organizador/ })).toBeVisible();

  // sair deste aparelho
  await other.page.getByRole("button", { name: "Sair deste aparelho" }).click();
  await expect(other.page.getByRole("button", { name: "Entrar no grupo" })).toBeVisible();

  await other.page.goto("/acesso/" + "x".repeat(43));
  await expect(other.page.getByRole("heading", { name: "Link inválido" })).toBeVisible();

  await org.ctx.close();
  await other.ctx.close();
});

test("validação no servidor: erros por campo e valores preservados", async ({ page }) => {
  await page.goto("/criar");
  await page.getByLabel("Nome do amigo secreto").fill("ab");
  await page.getByLabel("Valor do presente (R$)").fill("muito");
  await page.getByLabel("Local").fill("Salão <b>de festas</b>");
  await fillPin(page, "250813");
  await page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(page.getByText("Confira os campos destacados.")).toBeVisible();
  await expect(page.getByText(/precisa ter pelo menos 3 caracteres/)).toBeVisible();
  await expect(page.getByText(/Valor inválido/)).toBeVisible();
  await expect(page.getByText("Informe o nome.")).toBeVisible();
  await expect(page.getByLabel("Local")).toHaveValue("Salão <b>de festas</b>");
  await expect(page).toHaveURL(/\/criar$/);
  // o PIN digitado NÃO volta para a página (nem no HTML nem no payload)
  await expect(page.getByLabel(/Crie um PIN/)).toHaveValue("");
  expect(await page.content()).not.toContain("250813");
});

test("HTML digitado é exibido como texto (sem XSS)", async ({ page }) => {
  let alerted = false;
  page.on("dialog", (d) => {
    alerted = true;
    void d.dismiss();
  });
  const code = await createGroup(page, `<img src=x onerror=alert(1)>`);
  await expect(page.getByRole("heading", { name: "<img src=x onerror=alert(1)>" })).toBeVisible();
  expect(await page.locator("img").count()).toBe(0);
  expect(alerted).toBe(false);
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
});

test("entrar pelo código na tela inicial (aceita minúsculas e link colado)", async ({ browser }) => {
  const org = await newPhone(browser);
  const code = await createGroup(org.page, "Escola");

  const guest = await newPhone(browser);
  await guest.page.goto("/");
  await guest.page.getByLabel("Código ou link do grupo").fill(code.toLowerCase());
  await guest.page.getByRole("button", { name: "Entrar em um grupo" }).click();
  await expect(guest.page).toHaveURL(new RegExp(`/grupo/${code}$`));

  await guest.page.goto("/");
  await guest.page.getByLabel("Código ou link do grupo").fill(`Olha o link: http://localhost:3200/grupo/${code}?x=1`);
  await guest.page.getByRole("button", { name: "Entrar em um grupo" }).click();
  await expect(guest.page).toHaveURL(new RegExp(`/grupo/${code}$`));

  await guest.page.goto("/");
  await guest.page.getByLabel("Código ou link do grupo").fill("ZZZZZZ");
  await guest.page.getByRole("button", { name: "Entrar em um grupo" }).click();
  await expect(guest.page.getByText("Nenhum grupo com esse código.")).toBeVisible();

  // URL em minúsculas redireciona para a canônica
  await guest.page.goto(`/grupo/${code.toLowerCase()}`);
  await expect(guest.page).toHaveURL(new RegExp(`/grupo/${code}$`));

  await org.ctx.close();
  await guest.ctx.close();
});

test("recuperar acesso com nome + PIN em outro celular", async ({ browser }) => {
  const org = await newPhone(browser);
  const code = await createGroup(org.page, "Recuperação");
  const velho = await newPhone(browser);
  await join(velho.page, code, "Maria Souza");

  // celular novo: PIN errado → mensagem genérica
  const novo = await newPhone(browser);
  await novo.page.goto(`/grupo/${code}`);
  await novo.page.getByRole("link", { name: "Recuperar meu acesso" }).click();
  await novo.page.getByLabel("Seu nome no grupo").fill("maria souza");
  await novo.page.getByLabel("Seu PIN").fill("482915");
  await novo.page.getByRole("button", { name: "Recuperar meu acesso" }).click();
  await expect(novo.page.getByText("Nome ou PIN incorretos.")).toBeVisible();
  await expect(novo.page.getByLabel("Seu PIN")).toHaveValue("");

  // PIN certo → entra, com aviso de link novo
  await novo.page.getByLabel("Seu PIN").fill(PIN);
  await novo.page.getByRole("button", { name: "Recuperar meu acesso" }).click();
  await expect(novo.page.getByText(/Acesso recuperado!/)).toBeVisible();
  await expect(novo.page.getByRole("heading", { name: "Olá, Maria Souza!" })).toBeVisible();

  // o celular antigo perdeu o acesso
  await velho.page.reload();
  await expect(velho.page.getByRole("button", { name: "Entrar no grupo" })).toBeVisible();

  // botão de salvar o link no WhatsApp leva o link privado novo
  const href = await novo.page.getByRole("link", { name: "Salvar no meu WhatsApp" }).getAttribute("href");
  expect(decodeURIComponent(href!)).toMatch(/\/acesso\/[A-Za-z0-9_-]{43}/);

  for (const p of [org, velho, novo]) await p.ctx.close();
});

/**
 * Reenvia o formulário real de /criar (campos ocultos da Server Action + dados)
 * com um Origin escolhido. Usamos a API de requests porque o Chromium ignora a
 * troca do cabeçalho Origin em requisições interceptadas.
 */
async function postCreateForm(page: Page, origin: string, groupName: string) {
  await page.goto("/criar");
  const hidden = await page
    .locator('form input[type="hidden"]')
    .evaluateAll((els) => els.map((e) => [(e as HTMLInputElement).name, (e as HTMLInputElement).value] as const));
  const multipart: Record<string, string> = Object.fromEntries(hidden);
  Object.assign(multipart, { name: groupName, organizerName: "Vítima", pin: "905527", pinConfirm: "905527" });
  return page.request.post("/criar", { headers: { origin }, multipart, maxRedirects: 0 });
}

test("CSRF: Server Action enviada de outra origem é recusada", async ({ page }) => {
  // controle: a mesma requisição com a origem certa funciona (303 para o grupo)
  const legit = await postCreateForm(page, "http://localhost:3200", "Grupo Legítimo");
  expect(legit.status()).toBe(303);
  expect(legit.headers()["location"]).toMatch(/\/grupo\/[A-Z2-9]{6}\?novo=1$/);

  // ataque: origem de outro site é recusada e nada é criado
  const attack = await postCreateForm(page, "https://site-malicioso.example", "Grupo CSRF");
  expect(attack.status()).toBeGreaterThanOrEqual(400);
  expect(attack.headers()["location"]).toBeUndefined();
});

test("páginas privadas não são cacheadas", async ({ page }) => {
  const code = await createGroup(page, "Cache");
  const res = await page.request.get(`/grupo/${code}`);
  expect(res.headers()["cache-control"]).toMatch(/no-store/);
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

// por último: esgota a cota de buscas deste IP
test("rate limiting: muitas buscas de código são bloqueadas", async ({ page }) => {
  await page.goto("/");
  let blocked = false;
  for (let i = 0; i < 70 && !blocked; i++) {
    await page.getByLabel("Código ou link do grupo").fill("ZZZZZZ");
    await page.getByRole("button", { name: "Entrar em um grupo" }).click();
    // (o Next também tem um role=alert: o anunciador de rotas; pegamos o do <main>)
    const alert = page.locator("main [role=alert]");
    await expect(alert).toBeVisible();
    blocked = (await alert.textContent())!.includes("Muitas tentativas");
  }
  expect(blocked).toBe(true);
});
