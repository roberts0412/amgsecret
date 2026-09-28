import "server-only";
import type { Plan } from "@/generated/prisma/enums";
import { getEnv } from "@/lib/env";
import { planFeatures } from "@/lib/plans";

/**
 * Política de anúncios (decisão de produto):
 * - no máximo UM espaço por página, discreto, no fim do conteúdo;
 * - nunca em páginas com segredo (resultado, lista do amigo, mensagens,
 *   link privado, recuperação) nem em fluxos críticos (criar, painel);
 * - grupos PREMIUM não têm anúncios.
 * Scripts de anúncio são código de terceiros com acesso à página: por isso
 * as páginas com anúncio não podem conter tokens, PINs ou pares.
 */
export type AdMode = { kind: "none" } | { kind: "placeholder" } | { kind: "adsense"; client: string; slot: string };

export function adMode(plan: Plan = "FREE"): AdMode {
  if (!planFeatures(plan).adsEnabled) return { kind: "none" };
  const env = getEnv();
  if (env.ADSENSE_CLIENT_ID && env.ADSENSE_SLOT_ID) {
    return { kind: "adsense", client: env.ADSENSE_CLIENT_ID, slot: env.ADSENSE_SLOT_ID };
  }
  // em desenvolvimento mostra onde o anúncio ficaria; em produção, nada
  return env.NODE_ENV === "production" ? { kind: "none" } : { kind: "placeholder" };
}

/** Conteúdo do /ads.txt exigido pelo AdSense. */
export function adsTxt(): string | null {
  const client = getEnv().ADSENSE_CLIENT_ID;
  if (!client) return null;
  return `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;
}
