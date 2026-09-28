import { describe, expect, it } from "vitest";
import {
  draw,
  DrawError,
  DRAW_ERROR_MESSAGES,
  isDrawPossible,
  validateAssignment,
  type Assignment,
  type Exclusion,
} from "./draw";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
const ex = (a: string, b: string): Exclusion => ({ participantId: a, excludedParticipantId: b });

/** Força bruta: existe alguma permutação válida? (referência para n pequeno) */
function bruteForcePossible(people: string[], exclusions: Exclusion[]): boolean {
  const forbidden = new Set(exclusions.map((e) => `${e.participantId}>${e.excludedParticipantId}`));
  const used = new Set<string>();
  const go = (i: number): boolean => {
    if (i === people.length) return true;
    const giver = people[i]!;
    for (const r of people) {
      if (r === giver || used.has(r) || forbidden.has(`${giver}>${r}`)) continue;
      used.add(r);
      if (go(i + 1)) return true;
      used.delete(r);
    }
    return false;
  };
  return go(0);
}

function expectValid(people: string[], exclusions: Exclusion[], a: Assignment) {
  expect(validateAssignment(people, exclusions, a)).toEqual({ ok: true });
  expect(a.size).toBe(people.length);
  expect(new Set(a.values()).size).toBe(people.length);
  for (const [g, r] of a) expect(g).not.toBe(r);
}

describe("draw", () => {
  it("gera combinação válida para vários tamanhos", () => {
    for (const n of [3, 4, 5, 10, 50, 300]) {
      const people = ids(n);
      for (let k = 0; k < 20; k++) expectValid(people, [], draw(people));
    }
  });

  it("recusa menos de 3 participantes", () => {
    expect(() => draw(ids(2))).toThrow(DrawError);
    expect(() => draw([])).toThrowError(DRAW_ERROR_MESSAGES.NOT_ENOUGH_PARTICIPANTS);
  });

  it("recusa participantes duplicados e exclusões desconhecidas", () => {
    expect(() => draw(["a", "b", "a"])).toThrowError(DRAW_ERROR_MESSAGES.DUPLICATE_PARTICIPANT);
    expect(() => draw(["a", "b", "c"], [ex("a", "zz")])).toThrowError(
      DRAW_ERROR_MESSAGES.UNKNOWN_PARTICIPANT_IN_EXCLUSION,
    );
  });

  it("respeita exclusões", () => {
    const people = ["Robert", "Maria", "Joao", "Carlos"];
    const exclusions = [ex("Robert", "Maria"), ex("Maria", "Robert"), ex("Joao", "Carlos")];
    for (let k = 0; k < 200; k++) {
      const a = draw(people, exclusions);
      expectValid(people, exclusions, a);
      expect(a.get("Robert")).not.toBe("Maria");
      expect(a.get("Maria")).not.toBe("Robert");
      expect(a.get("Joao")).not.toBe("Carlos");
    }
  });

  it("encontra a única combinação possível quando as regras forçam um ciclo", () => {
    // a->b->c->d->a é a única opção
    const people = ["a", "b", "c", "d"];
    const exclusions: Exclusion[] = [];
    const only: Record<string, string> = { a: "b", b: "c", c: "d", d: "a" };
    for (const g of people) for (const r of people) if (g !== r && only[g] !== r) exclusions.push(ex(g, r));
    const a = draw(people, exclusions);
    expect(Object.fromEntries(a)).toEqual(only);
  });

  it("falha sem sortear quando não há combinação (mensagem exigida)", () => {
    // 'a' não pode tirar ninguém
    expect(() => draw(["a", "b", "c"], [ex("a", "b"), ex("a", "c")])).toThrowError(
      "Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões.",
    );
    // ninguém pode tirar 'c'
    expect(() => draw(["a", "b", "c"], [ex("a", "c"), ex("b", "c")])).toThrowError(DrawError);
    // Hall: a,b,c só podem tirar d,e (3 doadores, 2 recebedores)
    const people = ["a", "b", "c", "d", "e"];
    const exclusions = ["a", "b", "c"].flatMap((g) => ["a", "b", "c"].filter((r) => r !== g).map((r) => ex(g, r)));
    expect(() => draw(people, exclusions)).toThrowError(DrawError);
    expect(isDrawPossible(people, exclusions)).toBe(false);
  });

  it("concorda com força bruta em casos aleatórios (completude)", () => {
    let seed = 12345;
    const rnd = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % max;
    };
    let possible = 0;
    let impossible = 0;
    for (let t = 0; t < 1500; t++) {
      const people = ids(3 + rnd(4)); // 3..6
      const exclusions: Exclusion[] = [];
      for (const g of people) for (const r of people) if (g !== r && rnd(100) < 45) exclusions.push(ex(g, r));

      const expected = bruteForcePossible(people, exclusions);
      expect(isDrawPossible(people, exclusions)).toBe(expected);
      if (expected) {
        possible++;
        expectValid(people, exclusions, draw(people, exclusions));
      } else {
        impossible++;
        expect(() => draw(people, exclusions)).toThrowError(DRAW_ERROR_MESSAGES.NO_VALID_COMBINATION);
      }
    }
    // garante que o teste cobriu os dois lados
    expect(possible).toBeGreaterThan(100);
    expect(impossible).toBeGreaterThan(100);
  });

  it("caminho de fallback (sem rejeição) também é válido", () => {
    const people = ids(8);
    const exclusions = [ex("p0", "p1"), ex("p1", "p0"), ex("p2", "p3")];
    for (let k = 0; k < 100; k++) {
      expectValid(people, exclusions, draw(people, exclusions, { rejectionAttempts: 0 }));
    }
  });

  it("é aproximadamente uniforme sem exclusões (n=3 tem 2 derangements)", () => {
    const counts = new Map<string, number>();
    for (let k = 0; k < 4000; k++) {
      const key = JSON.stringify([...draw(["a", "b", "c"])]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(2);
    for (const c of counts.values()) expect(c).toBeGreaterThan(1700);
  });
});

describe("validateAssignment", () => {
  const people = ["a", "b", "c"];
  it("detecta autoatribuição, duplicidade, falta e exclusão", () => {
    expect(validateAssignment(people, [], new Map([["a", "a"], ["b", "c"], ["c", "b"]])).ok).toBe(false);
    expect(validateAssignment(people, [], new Map([["a", "b"], ["b", "a"], ["c", "a"]])).ok).toBe(false);
    expect(validateAssignment(people, [], new Map([["a", "b"], ["b", "c"]])).ok).toBe(false);
    expect(validateAssignment(people, [ex("a", "b")], new Map([["a", "b"], ["b", "c"], ["c", "a"]])).ok).toBe(false);
    expect(validateAssignment(people, [], new Map([["a", "b"], ["b", "c"], ["c", "a"]])).ok).toBe(true);
  });
});
