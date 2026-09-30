import { expect, test } from "./fixtures";

/** O site serve para amigo secreto, amigo oculto, amigo da onça... */

test("grupo de amigo oculto usa esse nome no grupo e no convite; organizador pode trocar", async ({ page }) => {
  await page.goto("/criar");
  await page.getByRole("radio", { name: "Amigo oculto" }).check({ force: true });
  await expect(page.getByRole("button", { name: "Criar amigo oculto" })).toBeVisible();
  await page.getByLabel("Nome do amigo oculto").fill("Família Mineira");
  await page.getByLabel("Seu nome").fill("Robert");
  await page.getByLabel(/Crie um PIN/).fill("730164");
  await page.getByLabel("Repita o PIN").fill("730164");
  await page.getByRole("button", { name: "Criar amigo oculto" }).click();
  await expect(page).toHaveURL(/novo=1/);
  const code = new URL(page.url()).pathname.split("/")[2]!;

  await expect(page.getByText("Amigo oculto", { exact: true })).toBeVisible();
  const invite = page.getByRole("link", { name: "Compartilhar no WhatsApp" });
  const text = decodeURIComponent(new URL((await invite.getAttribute("href"))!).searchParams.get("text")!);
  expect(text).toContain("convidado(a) para o amigo oculto *Família Mineira*");
  const html = await (await page.request.get(`/grupo/${code}`)).text();
  expect(html).toContain("🎁 Amigo oculto: Família Mineira");

  await page.goto(`/grupo/${code}/eu`);
  await expect(page.getByText("🎁 Meu amigo oculto")).toBeVisible();

  // organizador troca para amigo da onça
  await page.goto(`/grupo/${code}/admin`);
  await expect(page.getByRole("radio", { name: "Amigo oculto" })).toBeChecked();
  await page.getByRole("radio", { name: "Amigo da onça" }).check({ force: true });
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Dados do grupo atualizados.")).toBeVisible();
  await page.goto(`/grupo/${code}`);
  await expect(page.getByText("Amigo da onça", { exact: true })).toBeVisible();
});

test("páginas de amigo oculto, amigo da onça e amigo chocolate", async ({ page }) => {
  for (const [slug, cta] of [
    ["amigo-oculto-online", "Criar amigo oculto grátis"],
    ["sorteio-amigo-oculto", "Fazer sorteio de amigo oculto"],
    ["amigo-da-onca", "Criar amigo da onça grátis"],
    ["amigo-chocolate", "Criar amigo chocolate grátis"],
  ] as const) {
    const res = await page.goto(`/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("link", { name: cta })).toHaveAttribute("href", "/criar");
  }
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  for (const slug of ["amigo-oculto-online", "amigo-da-onca", "amigo-chocolate"]) expect(sitemap).toContain(`/${slug}</loc>`);
  await page.goto("/");
  await expect(page.getByRole("list", { name: "Serve para" })).toContainText("Amigo da onça");
});
