import type { Browser, BrowserContext, Page } from "@playwright/test";
import { expect, newPhoneContext, test } from "./fixtures";

/** Lista de desejos (opcional), mensagens anônimas e mural — 4 celulares. */

const PIN = "730164";

async function phone(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await newPhoneContext(browser);
  return { ctx, page: await ctx.newPage() };
}

async function fillPin(page: Page) {
  await page.getByLabel(/Crie um PIN/).fill(PIN);
  await page.getByLabel("Repita o PIN").fill(PIN);
}

test("desejos, mensagens anônimas e mural", async ({ browser }) => {
  const names = ["Robert", "Maria", "João", "Carlos"];
  const pages: Record<string, Page> = {};
  const ctxs: BrowserContext[] = [];

  const org = await phone(browser);
  ctxs.push(org.ctx);
  pages.Robert = org.page;
  await org.page.goto("/criar");
  await org.page.getByLabel("Nome do amigo secreto").fill("Social E2E");
  await org.page.getByLabel("Seu nome").fill("Robert");
  await fillPin(org.page);
  await org.page.getByRole("button", { name: "Criar amigo secreto" }).click();
  await expect(org.page).toHaveURL(/novo=1/);
  const code = new URL(org.page.url()).pathname.split("/")[2]!;

  for (const n of names.slice(1)) {
    const p = await phone(browser);
    ctxs.push(p.ctx);
    pages[n] = p.page;
    await p.page.goto(`/grupo/${code}`);
    await p.page.getByLabel("Seu nome").fill(n);
    await fillPin(p.page);
    await p.page.getByRole("button", { name: "Entrar no grupo" }).click();
    await p.page.getByRole("button", { name: "Confirmar minha participação" }).click();
    await expect(p.page.getByText("Sua participação está confirmada ✓")).toBeVisible();
  }

  // Maria cria a lista (opcional); link perigoso é recusado
  const maria = pages.Maria!;
  await maria.goto(`/grupo/${code}/eu`);
  await expect(maria.getByText("(opcional)").first()).toBeVisible();
  await maria.getByRole("button", { name: "+ Adicionar desejo" }).click();
  await maria.getByLabel("O que você quer ganhar?").fill("Fone Bluetooth");
  await maria.getByLabel("Preço aproximado (R$)").fill("150");
  await maria.getByLabel("Link do produto").fill("javascript:alert(1)");
  await maria.getByRole("button", { name: "Salvar desejo" }).click();
  await expect(maria.getByText(/Link inválido/)).toBeVisible();
  await expect(maria.getByLabel("O que você quer ganhar?")).toHaveValue("Fone Bluetooth");
  await maria.getByLabel("Link do produto").fill("www.loja.com.br/fone");
  await maria.getByRole("button", { name: "Salvar desejo" }).click();
  await expect(maria.getByText("Desejo adicionado! 🎁")).toBeVisible();
  await expect(maria.getByText("Fone Bluetooth")).toBeVisible();
  // o formulário continua aberto para o próximo desejo
  await maria.getByLabel("O que você quer ganhar?").fill("Livro de receitas");
  await maria.getByLabel("Link do produto").fill("https://www.amazon.com.br/dp/B0LIVRO?tag=outra-20");
  await maria.getByRole("button", { name: "Salvar desejo" }).click();
  await expect(maria.getByText("Livro de receitas")).toBeVisible();

  // mural (não anônimo)
  const joao = pages.João!;
  await joao.goto(`/grupo/${code}`);
  await joao.getByLabel("Escreva para o grupo (com seu nome)").fill("Quem leva a sobremesa?");
  await joao.getByRole("button", { name: "Publicar no mural" }).click();
  await expect(joao.getByText("Publicado no mural!")).toBeVisible();
  await expect(joao.getByLabel("Escreva para o grupo (com seu nome)")).toHaveValue("");
  await maria.goto(`/grupo/${code}`);
  const post = maria.getByRole("listitem").filter({ hasText: "Quem leva a sobremesa?" });
  await expect(post).toContainText("João");
  await expect(post.getByRole("button", { name: "Apagar" })).toHaveCount(0); // não é dela

  // sorteio
  await org.page.goto(`/grupo/${code}/admin`);
  org.page.once("dialog", (d) => d.accept());
  await org.page.getByRole("button", { name: "🎲 Realizar sorteio" }).click();
  await expect(org.page.getByText(/Sorteio realizado em/)).toBeVisible();

  // cada um abre "quem eu tirei"; descobre quem tirou a Maria
  let santa = "";
  for (const n of names) {
    const p = pages[n]!;
    await p.goto(`/grupo/${code}/eu/amigo`);
    const friend = (await p.getByRole("heading", { level: 1 }).textContent())!.trim();
    expect(friend).not.toBe(n);
    // sugestões de presente (afiliado) + aviso obrigatório
    const ideas = p.getByRole("link", { name: /Ver sugestões na Amazon/ });
    await expect(ideas).toHaveAttribute("href", /^https:\/\/www\.amazon\.com\.br\/s\?.*tag=e2eteste-20/);
    await expect(p.getByText(/links para a Amazon são de afiliado/)).toBeVisible();
    if (friend === "Maria") {
      santa = n;
      const link = p.getByRole("link", { name: /Ver produto em loja\.com\.br/ });
      await expect(link).toHaveAttribute("href", "https://www.loja.com.br/fone");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
      await expect(p.getByText("≈ R$ 150,00")).toBeVisible();
      // link da Amazon ganha a tag do site (substituindo a de terceiros) e é marcado como patrocinado
      const amazon = p.getByRole("link", { name: /Ver produto em amazon\.com\.br/ });
      await expect(amazon).toHaveAttribute("href", "https://www.amazon.com.br/dp/B0LIVRO?tag=e2eteste-20");
      await expect(amazon).toHaveAttribute("rel", "sponsored noopener noreferrer nofollow");
    } else {
      await expect(p.getByText(/ainda não adicionou desejos/)).toBeVisible();
      await expect(p.getByText("Fone Bluetooth")).toHaveCount(0);
    }
  }
  expect(santa).not.toBe("");

  // amigo secreto manda mensagem anônima para a Maria
  const sp = pages[santa]!;
  await sp.goto(`/grupo/${code}/eu/amigo`);
  await sp.getByLabel("Mensagem anônima").fill("Qual sua cor favorita?");
  await sp.getByRole("button", { name: "Enviar em segredo 🤫" }).click();
  await expect(sp.getByText("Mensagem enviada em segredo 🤫")).toBeVisible();

  // Maria vê a mensagem sem saber de quem é, e responde
  await maria.goto(`/grupo/${code}/eu`);
  const inbox = maria.getByRole("listitem").filter({ hasText: "Qual sua cor favorita?" });
  await expect(inbox).toContainText("Seu amigo secreto · hoje");
  const mariaHtml = await (await maria.request.get(`/grupo/${code}/eu`)).text();
  expect(mariaHtml).toContain("Qual sua cor favorita?");
  expect(mariaHtml).not.toContain(`>${santa}<`); // o remetente não aparece
  await maria.getByLabel("Responder ao seu amigo secreto").fill("Azul! 💙");
  await maria.getByRole("button", { name: "Responder" }).click();
  await expect(maria.getByText("Resposta enviada!")).toBeVisible();

  // o amigo secreto vê a resposta
  await sp.goto(`/grupo/${code}/eu/amigo`);
  await expect(sp.getByRole("listitem").filter({ hasText: "Azul! 💙" })).toContainText("Maria · hoje");

  // páginas privadas não têm anúncio; página do grupo não tem segredos
  expect(mariaHtml).not.toContain("Publicidade");
  const groupHtml = await (await maria.request.get(`/grupo/${code}`)).text();
  expect(groupHtml).not.toContain("/acesso/");
  expect(groupHtml).not.toContain("Qual sua cor favorita?");

  for (const c of ctxs) await c.close();
});
