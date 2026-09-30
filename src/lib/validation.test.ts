import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import {
  createGroupSchema,
  echoableValues,
  formatCents,
  joinGroupSchema,
  parseBRLToCents,
  parseInput,
  normalizeProductUrl,
  recoverAccessSchema,
  secretMessageSchema,
  wallPostSchema,
  wishSchema,
  todayInEventTz,
} from "./validation";

describe("parseBRLToCents", () => {
  it.each([
    ["150", 15000],
    ["150,5", 15050],
    ["150,50", 15050],
    ["R$ 150,50", 15050],
    ["r$150", 15000],
    ["1.500", 150000],
    ["1.500,00", 150000],
    ["1.234.567,89", 123456789],
    ["1500.5", 150050],
    ["0", 0],
    ["0,99", 99],
  ])("%s -> %i", (input, cents) => {
    expect(parseBRLToCents(input)).toBe(cents);
  });

  it.each(["abc", "-10", "10,999", "1,2,3", "1.50,00", "12.34.56", "1e5", "", "R$", "9999999999"])(
    "recusa %j",
    (input) => {
      expect(parseBRLToCents(input)).toBeNull();
    },
  );

  it("formata em reais", () => {
    expect(formatCents(15050).replace(/\s/g, " ")).toBe("R$ 150,50");
  });
});

describe("createGroupSchema", () => {
  const now = new Date("2026-09-28T15:00:00Z");
  const base = { name: "Natal da Família", organizerName: "Robert", pin: "482915", pinConfirm: "482915" };

  it("aceita o mínimo e transforma vazios em undefined", () => {
    const r = parseInput(createGroupSchema(now), { ...base, description: "  ", eventDate: "", giftValue: "" });
    expect(r).toEqual({
      name: "Natal da Família", organizerName: "Robert", pin: "482915", pinConfirm: "482915", gameKind: "secreto",
    });
  });

  it("nome da brincadeira: aceita os conhecidos, recusa o resto", () => {
    expect(parseInput(createGroupSchema(now), { ...base, gameKind: "oculto" }).gameKind).toBe("oculto");
    expect(parseInput(createGroupSchema(now), { ...base, gameKind: "onca" }).gameKind).toBe("onca");
    expect(errorsOf({ ...base, gameKind: "<b>x</b>" }).gameKind).toMatch(/brincadeira/);
  });

  it("limpa textos e converte valor", () => {
    const r = parseInput(createGroupSchema(now), {
      ...base,
      name: "  Natal   da Família ",
      eventDate: "2026-12-24",
      eventTime: "20:30",
      location: " Casa da vó ",
      giftValue: "R$ 100,00",
      description: "Linha 1\r\n\r\n\r\nLinha 2",
    });
    expect(r).toMatchObject({
      name: "Natal da Família",
      eventDate: "2026-12-24",
      eventTime: "20:30",
      location: "Casa da vó",
      giftValue: 10000,
      description: "Linha 1\n\nLinha 2",
    });
  });

  function errorsOf(data: object): Record<string, string> {
    try {
      parseInput(createGroupSchema(now), data);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      return (e as AppError).fieldErrors ?? {};
    }
    throw new Error("deveria falhar");
  }

  it("aponta erros por campo", () => {
    const errs = errorsOf({
      ...base,
      name: "ab",
      organizerName: " ",
      eventDate: "2026-02-30",
      eventTime: "25:00",
      giftValue: "muito",
    });
    expect(Object.keys(errs).sort()).toEqual(["eventDate", "eventTime", "giftValue", "name", "organizerName"]);
    expect(errs.eventDate).toBe("Data inválida.");
    expect(errs.giftValue).toMatch(/Valor inválido/);
  });

  it("campo obrigatório ausente", () => {
    expect(errorsOf({ name: "Grupo", pin: "482915", pinConfirm: "482915" }).organizerName).toBe("Informe o nome.");
  });

  it("data no passado ou muito distante", () => {
    expect(errorsOf({ ...base, eventDate: "2026-09-01" }).eventDate).toMatch(/já passou/);
    expect(errorsOf({ ...base, eventDate: "2030-01-01" }).eventDate).toMatch(/distante/);
    // ontem é tolerado (fuso/virada de dia)
    expect(() => parseInput(createGroupSchema(now), { ...base, eventDate: "2026-09-27" })).not.toThrow();
  });

  it("limites de tamanho", () => {
    expect(errorsOf({ ...base, name: "x".repeat(81) }).name).toMatch(/no máximo 80/);
    expect(errorsOf({ ...base, description: "x".repeat(501) }).description).toMatch(/500/);
    expect(errorsOf({ ...base, giftValue: "200.000,00" }).giftValue).toMatch(/alto/);
  });

  it("ignora campos extras (não deixa o cliente injetar status/plan)", () => {
    const r = parseInput(createGroupSchema(now), { ...base, status: "DRAWN", plan: "PREMIUM" });
    expect(r).not.toHaveProperty("status");
    expect(r).not.toHaveProperty("plan");
  });
});

describe("todayInEventTz", () => {
  it("usa o fuso de São Paulo (23h UTC-3 ainda é o mesmo dia)", () => {
    expect(todayInEventTz(new Date("2026-12-25T02:30:00Z"))).toBe("2026-12-24");
  });
});

describe("joinGroupSchema", () => {
  it("normaliza e-mail e telefone", () => {
    const pin = { pin: "482915", pinConfirm: "482915" };
    const r = parseInput(joinGroupSchema, { name: "Maria", email: " Maria@Email.COM ", phone: "(11) 98765-4321", ...pin });
    expect(r).toEqual({ name: "Maria", email: "maria@email.com", phone: "11987654321", ...pin });
    expect(parseInput(joinGroupSchema, { name: "Jo", phone: "+55 11 98765-4321", ...pin }).phone).toBe("+5511987654321");
  });

  it("recusa contato inválido e nome curto", () => {
    expect(() => parseInput(joinGroupSchema, { name: "M" })).toThrow(AppError);
    expect(() => parseInput(joinGroupSchema, { name: "Maria", email: "x@" })).toThrow(AppError);
    expect(() => parseInput(joinGroupSchema, { name: "Maria", phone: "123" })).toThrow(AppError);
  });

  it("nome com caracteres invisíveis não burla o mínimo", () => {
    expect(() => parseInput(joinGroupSchema, { name: "​​A" })).toThrow(AppError);
  });
});

describe("mensagens de campo obrigatório", () => {
  it("vazio diz 'Informe', curto diz 'pelo menos'", () => {
    const err = (name: string) => {
      try {
        parseInput(joinGroupSchema, { name, pin: "482915", pinConfirm: "482915" });
      } catch (e) {
        return (e as AppError).fieldErrors?.name;
      }
    };
    expect(err("")).toBe("Informe o nome.");
    expect(err("   ")).toBe("Informe o nome.");
    expect(err("A")).toBe("O nome precisa ter pelo menos 2 caracteres.");
  });
});

describe("PIN nos formulários", () => {
  const fieldErrors = (data: object) => {
    try {
      parseInput(joinGroupSchema, { name: "Maria", ...data });
    } catch (e) {
      return (e as AppError).fieldErrors ?? {};
    }
    return {};
  };

  it("obrigatório, 6 números, não óbvio e confirmado", () => {
    expect(fieldErrors({}).pin).toMatch(/Crie um PIN/);
    expect(fieldErrors({ pin: "1234", pinConfirm: "1234" }).pin).toMatch(/exatamente 6/);
    expect(fieldErrors({ pin: "123456", pinConfirm: "123456" }).pin).toMatch(/fácil demais/);
    expect(fieldErrors({ pin: "482915", pinConfirm: "482916" }).pinConfirm).toBe("Os PINs não são iguais.");
    expect(fieldErrors({ pin: "482 915", pinConfirm: "482915" })).toEqual({}); // espaços ignorados
  });

  it("recuperação só checa o formato", () => {
    expect(parseInput(recoverAccessSchema, { name: " maria ", pin: "123456" })).toEqual({ name: "maria", pin: "123456" });
    expect(() => parseInput(recoverAccessSchema, { name: "Maria", pin: "12a456" })).toThrow(AppError);
  });
});

describe("normalizeProductUrl", () => {
  it.each([
    ["https://loja.com/fone", "https://loja.com/fone"],
    ["http://loja.com.br/x?y=1", "http://loja.com.br/x?y=1"],
    ["www.loja.com/fone", "https://www.loja.com/fone"],
    ["  https://LOJA.com  ", "https://loja.com/"],
  ])("%s -> %s", (input, out) => expect(normalizeProductUrl(input)).toBe(out));

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "vbscript:msgbox",
    "https://user:senha@loja.com",
    "https://localhost/x",
    "https://loja .com",
    "",
    `https://loja.com/${"a".repeat(2050)}`,
  ])("recusa %j", (input) => expect(normalizeProductUrl(input)).toBeNull());
});

describe("wishSchema / mensagens", () => {
  it("desejo mínimo e completo", () => {
    expect(parseInput(wishSchema, { product: "Fone Bluetooth" })).toEqual({ product: "Fone Bluetooth" });
    expect(
      parseInput(wishSchema, { product: " Fone ", approxPrice: "R$ 150", url: "loja.com/fone", note: "preto", description: "" }),
    ).toEqual({ product: "Fone", approxPrice: 15000, url: "https://loja.com/fone", note: "preto" });
  });

  it("recusa link perigoso com mensagem no campo", () => {
    try {
      parseInput(wishSchema, { product: "X Y", url: "javascript:alert(1)" });
      throw new Error("deveria falhar");
    } catch (e) {
      expect((e as AppError).fieldErrors?.url).toMatch(/Link inválido/);
    }
  });

  it("mensagens: vazias recusadas, limites de tamanho", () => {
    expect(() => parseInput(secretMessageSchema, { body: " \n " })).toThrow(AppError);
    expect(parseInput(secretMessageSchema, { body: " Oi!\n\n\n\nTudo bem? " }).body).toBe("Oi!\n\nTudo bem?");
    expect(() => parseInput(wallPostSchema, { body: "x".repeat(501) })).toThrow(AppError);
  });
});
