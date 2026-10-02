import { describe, expect, it } from "vitest";
import { affiliateLink, amazonSearchLink, giftIdeasLink } from "./affiliate";

describe("links de afiliado", () => {
  it("sem tag, nada muda", () => {
    const url = "https://www.amazon.com.br/dp/B0TESTE";
    expect(affiliateLink(url, undefined)).toEqual({ href: url, affiliate: false });
    expect(giftIdeasLink(undefined, 5000)).toBeNull();
  });

  it("adiciona a tag em links da Amazon Brasil", () => {
    const r = affiliateLink("https://www.amazon.com.br/dp/B0TESTE?th=1", "loja-20");
    expect(r.affiliate).toBe(true);
    const u = new URL(r.href);
    expect(u.hostname).toBe("www.amazon.com.br");
    expect(u.searchParams.get("tag")).toBe("loja-20");
    expect(u.searchParams.get("th")).toBe("1");
  });

  it("troca uma tag existente em vez de duplicar", () => {
    const r = affiliateLink("https://amazon.com.br/dp/X?tag=outra-20", "loja-20");
    expect(new URL(r.href).searchParams.getAll("tag")).toEqual(["loja-20"]);
  });

  it("não mexe em outros sites, http, encurtadores ou domínios parecidos", () => {
    for (const url of [
      "https://www.mercadolivre.com.br/produto",
      "http://www.amazon.com.br/dp/X",
      "https://amzn.to/abc",
      "https://amazon.com.br.golpe.com/dp/X",
      "https://www.amazon.com/dp/X",
      "não é url",
    ]) {
      expect(affiliateLink(url, "loja-20")).toEqual({ href: url, affiliate: false });
    }
  });

  it("ideias de presente respeitam o valor do grupo", () => {
    const u = new URL(giftIdeasLink("loja-20", 4990)!);
    expect(u.hostname).toBe("www.amazon.com.br");
    expect(u.searchParams.get("k")).toBe("presente amigo secreto até 50 reais");
    expect(u.searchParams.get("rh")).toBe("p_36:-5000");
    expect(u.searchParams.get("tag")).toBe("loja-20");
    const semValor = new URL(giftIdeasLink("loja-20", null)!);
    expect(semValor.searchParams.get("k")).toBe("presente amigo secreto");
    expect(semValor.searchParams.has("rh")).toBe(false);
  });

  it("busca de ideias: com e sem tag, com limite de preço", () => {
    const sem = amazonSearchLink("garrafa térmica", 50, undefined);
    expect(sem.affiliate).toBe(false);
    expect(new URL(sem.href).searchParams.get("rh")).toBe("p_36:-5000");
    expect(new URL(sem.href).searchParams.has("tag")).toBe(false);
    const com = amazonSearchLink("garrafa térmica", null, "loja-20");
    expect(com.affiliate).toBe(true);
    expect(new URL(com.href).searchParams.get("k")).toBe("garrafa térmica");
    expect(new URL(com.href).searchParams.has("rh")).toBe(false);
    expect(new URL(com.href).searchParams.get("tag")).toBe("loja-20");
  });
});
