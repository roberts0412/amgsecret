/**
 * Links de afiliado da Amazon (Programa de Associados).
 *
 * - Desligado enquanto AMAZON_ASSOCIATE_TAG não estiver definido.
 * - Só links da Amazon Brasil recebem a tag; qualquer outro link segue igual.
 * - Links encurtados (amzn.to) não dão para marcar sem seguir o redirecionamento
 *   (que exporia o visitante a uma requisição do servidor): ficam como estão.
 * - Nada do grupo ou da pessoa entra na URL: só a tag do site.
 */

const AMAZON_HOSTS = new Set(["amazon.com.br", "www.amazon.com.br", "m.amazon.com.br"]);

export const AFFILIATE_DISCLOSURE =
  "Alguns links para a Amazon são de afiliado: o site pode ganhar uma comissão, sem custo extra para você.";

export type OutboundLink = { href: string; affiliate: boolean };

/** Adiciona (ou troca) a tag de associado em links https da Amazon Brasil. */
export function affiliateLink(url: string, tag: string | undefined): OutboundLink {
  if (!tag) return { href: url, affiliate: false };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { href: url, affiliate: false };
  }
  if (parsed.protocol !== "https:" || !AMAZON_HOSTS.has(parsed.hostname.toLowerCase())) {
    return { href: url, affiliate: false };
  }
  parsed.searchParams.set("tag", tag);
  return { href: parsed.toString(), affiliate: true };
}

/** Busca de ideias de presente na Amazon, opcionalmente limitada ao valor do grupo. */
export function giftIdeasLink(tag: string | undefined, maxCents: number | null): string | null {
  if (!tag) return null;
  const reais = maxCents !== null && maxCents > 0 ? Math.ceil(maxCents / 100) : null;
  const url = new URL("https://www.amazon.com.br/s");
  url.searchParams.set("k", reais ? `presente amigo secreto até ${reais} reais` : "presente amigo secreto");
  if (reais) url.searchParams.set("rh", `p_36:-${reais * 100}`); // filtro de preço (centavos)
  url.searchParams.set("tag", tag);
  return url.toString();
}
