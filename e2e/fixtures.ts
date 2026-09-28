import { type Browser, test as base } from "@playwright/test";

/**
 * Cada "celular" dos testes tem um IP próprio (X-Real-IP), como no mundo real.
 * O servidor de E2E roda com TRUST_PROXY=true, então o rate limit é por IP e
 * um teste não esgota a cota do outro — e o caminho "atrás de proxy" é testado.
 */
let counter = 0;
export function newIp(): string {
  counter += 1;
  return `10.${(process.pid >> 8) & 255}.${(counter >> 8) & 255}.${counter & 255}`;
}

export async function newPhoneContext(browser: Browser, extra: Parameters<Browser["newContext"]>[0] = {}) {
  return browser.newContext({ ...extra, extraHTTPHeaders: { "x-real-ip": newIp() } });
}

export const test = base.extend({
  context: async ({ browser }, use) => {
    const ctx = await newPhoneContext(browser);
    await use(ctx);
    await ctx.close();
  },
});

export { expect } from "@playwright/test";
