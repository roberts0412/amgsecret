#!/usr/bin/env node
/**
 * Grava clipes verticais (9:16) do site, para usar em Reels/Shorts/TikTok.
 * Rode com o site no ar localmente (npm run build && npm start, ou a porta
 * do E2E) e um banco de testes — os clipes criam grupos de demonstração.
 *
 *   node scripts/gravar-videos.mjs --base http://localhost:3200 --out ./videos
 *
 * Gera arquivos .webm 1080x1920 (abra no CapCut/InShot; se o app não aceitar .webm,
 * converta com qualquer conversor para .mp4).
 */
import { mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const BASE = args.base ?? "http://localhost:3200";
const OUT = args.out ?? "videos";
const PIN = "730164";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ["--lang=pt-BR"] });
let ip = 0;
// Tela de 1080x1920 com zoom 2x: o site se comporta como um celular de 540px
// de largura e o vídeo sai nítido, ocupando o quadro todo (9:16).
const VIEW = { width: 1080, height: 1920 };

/** Contexto "celular". Com record=true, grava a tela em 1080x1920. */
async function phone(record, storageState) {
  ip++;
  const ctx = await browser.newContext({
    storageState,
    viewport: VIEW,
    deviceScaleFactor: 1,
    locale: "pt-BR",
    extraHTTPHeaders: { "x-real-ip": `10.77.0.${ip}` },
    ...(record ? { recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } } } : {}),
  });
  await ctx.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => (document.documentElement.style.zoom = "2"));
  });
  return { ctx, page: await ctx.newPage() };
}

const pause = (p, ms) => p.waitForTimeout(ms);
const type = (loc, text) => loc.pressSequentially(text, { delay: 70 });

async function save(ctx, page, name) {
  const video = page.video();
  await ctx.close();
  if (video) renameSync(await video.path(), join(OUT, `${name}.webm`));
  console.log(`✔ ${name}.webm`);
}

async function slowScroll(page, px) {
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, px / 10);
    await pause(page, 60);
  }
}

/** Entra como `name` (nome + PIN) num contexto sem gravação e devolve a sessão. */
async function sessionOf(code, name) {
  const { ctx, page } = await phone(false);
  await page.goto(`${BASE}/grupo/${code}/recuperar`);
  await page.getByLabel("Seu nome").fill(name);
  await page.getByLabel("Seu PIN").fill(PIN);
  await page.getByRole("button", { name: "Recuperar meu acesso" }).click();
  await page.waitForURL(/\/eu\?recuperado=1/);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function joinAndConfirm(page, code, name) {
  await page.goto(`${BASE}/grupo/${code}`);
  await page.getByLabel("Seu nome").fill(name);
  await page.getByLabel(/Crie um PIN/).fill(PIN);
  await page.getByLabel("Repita o PIN").fill(PIN);
  await page.getByRole("button", { name: "Entrar no grupo" }).click();
  await page.getByRole("button", { name: "Confirmar minha participação" }).click();
  await page.getByText("Sua participação está confirmada ✓").waitFor();
}

// ---------------------------------------------------------------------------
// 1. Criar o grupo (amigo oculto) — começo de quase todo vídeo
// ---------------------------------------------------------------------------
const org = await phone(true);
{
  const p = org.page;
  await p.goto(BASE);
  await pause(p, 1800);
  await slowScroll(p, 250);
  await pause(p, 600);
  await p.getByRole("link", { name: "Criar grupo e sortear" }).click();
  await pause(p, 900);
  await p.getByRole("radio", { name: "Amigo oculto" }).check({ force: true });
  await pause(p, 700);
  await type(p.getByLabel("Nome do amigo oculto"), "Natal da Família");
  await type(p.getByLabel("Valor do presente (R$)"), "50");
  await slowScroll(p, 400);
  await type(p.getByLabel("Seu nome"), "Ana");
  await p.getByLabel(/Crie um PIN/).fill(PIN);
  await p.getByLabel("Repita o PIN").fill(PIN);
  await pause(p, 500);
  await p.getByRole("button", { name: "Criar amigo oculto" }).click();
  await p.waitForURL(/novo=1/);
  await pause(p, 1500);
  await slowScroll(p, 700);
  await pause(p, 1500);
}
const code = new URL(org.page.url()).pathname.split("/")[2];
await save(org.ctx, org.page, "1-criar-grupo");

// participantes entram (sem gravar)
const people = {};
for (const name of ["Bruno", "Carla", "Diego"]) {
  const ph = await phone(false);
  await joinAndConfirm(ph.page, code, name);
  people[name] = ph;
}

// ---------------------------------------------------------------------------
// 2. Organizador: regra "casal não se tira" + sortear
// ---------------------------------------------------------------------------
const orgRec = await phone(true, await sessionOf(code, "Ana"));
{
  const p = orgRec.page;
  await p.goto(`${BASE}/grupo/${code}/admin`);
  await pause(p, 1500);
  await p.getByLabel("Quem").selectOption({ label: "Bruno" });
  await pause(p, 500);
  await p.getByLabel("não pode tirar").selectOption({ label: "Carla" });
  await pause(p, 500);
  await p.getByRole("button", { name: "Adicionar regra" }).click();
  await p.getByText("Regra adicionada.").waitFor();
  await pause(p, 1500);
  p.once("dialog", (d) => d.accept());
  await p.getByRole("button", { name: "🎲 Realizar sorteio" }).click();
  await p.getByText(/Sorteio realizado em/).waitFor();
  await pause(p, 2500);
}
await save(orgRec.ctx, orgRec.page, "2-regra-e-sorteio");

// todos (inclusive a Ana) colocam um desejo, sem gravar, para a lista aparecer no clipe 4
{
  const anaCtx = await phone(false, await sessionOf(code, "Ana"));
  const everyone = { ...people, Ana: anaCtx };
  const items = { Ana: "Kit de skincare", Bruno: "Garrafa térmica", Carla: "Livro de receitas", Diego: "Fone de ouvido" };
  for (const [name, ph] of Object.entries(everyone)) {
    await ph.page.goto(`${BASE}/grupo/${code}/eu`);
    await ph.page.getByRole("button", { name: "+ Adicionar desejo" }).click();
    await ph.page.getByLabel("O que você quer ganhar?").fill(items[name]);
    await ph.page.getByLabel("Preço aproximado (R$)").fill("50");
    await ph.page.getByRole("button", { name: "Salvar desejo" }).click();
    await ph.page.getByText("Desejo adicionado! 🎁").waitFor();
  }
  await anaCtx.ctx.close();
}

// ---------------------------------------------------------------------------
// 3. Participante revela quem tirou
// ---------------------------------------------------------------------------
const rev = await phone(true, await sessionOf(code, "Carla"));
{
  const p = rev.page;
  await p.goto(`${BASE}/grupo/${code}/eu`);
  await pause(p, 1500);
  await p.getByRole("button", { name: "Revelar meu amigo oculto" }).click();
  await p.getByTestId("friend-name").waitFor();
  await pause(p, 3000);
}
await save(rev.ctx, rev.page, "3-revelar");

// ---------------------------------------------------------------------------
// 4. Lista de desejos + mensagem anônima
// ---------------------------------------------------------------------------
const wish = await phone(true, await sessionOf(code, "Diego"));
{
  const p = wish.page;
  await p.goto(`${BASE}/grupo/${code}/eu/amigo`);
  await pause(p, 1800);
  await slowScroll(p, 350);
  await pause(p, 1200);
  await type(p.getByLabel("Mensagem anônima"), "Qual sua cor favorita? 😉");
  await p.getByRole("button", { name: "Enviar em segredo 🤫" }).click();
  await p.getByText("Mensagem enviada em segredo 🤫").waitFor();
  await pause(p, 2200);
}
await save(wish.ctx, wish.page, "4-desejos-e-mensagem");

for (const ph of Object.values(people)) await ph.ctx.close();
await browser.close();
console.log(`\nClipes em ${OUT}/ (grupo de demonstração ${code})`);
