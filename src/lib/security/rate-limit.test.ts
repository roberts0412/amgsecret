import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore } from "./rate-limit";

const rule = { limit: 3, windowSec: 60 };

describe("MemoryRateLimitStore", () => {
  it("permite até o limite e depois bloqueia com retryAfter", () => {
    let t = 0;
    const s = new MemoryRateLimitStore(() => t);
    expect(s.consume("k", rule).ok).toBe(true);
    expect(s.consume("k", rule).ok).toBe(true);
    expect(s.consume("k", rule).ok).toBe(true);
    const r = s.consume("k", rule);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBe(60);
  });

  it("chaves são independentes", () => {
    const s = new MemoryRateLimitStore(() => 0);
    for (let i = 0; i < 3; i++) s.consume("a", rule);
    expect(s.consume("a", rule).ok).toBe(false);
    expect(s.consume("b", rule).ok).toBe(true);
  });

  it("janela deslizante: não libera tudo de uma vez na virada da janela", () => {
    let t = 59_000; // fim da 1ª janela
    const s = new MemoryRateLimitStore(() => t);
    for (let i = 0; i < 3; i++) expect(s.consume("k", rule).ok).toBe(true);
    t = 60_500; // logo após virar: a janela anterior ainda pesa ~99%
    expect(s.consume("k", rule).ok).toBe(false);
    t = 119_000; // quase fim da 2ª janela: anterior pesa ~2%
    expect(s.consume("k", rule).ok).toBe(true);
  });

  it("libera totalmente depois de 2 janelas sem uso", () => {
    let t = 0;
    const s = new MemoryRateLimitStore(() => t);
    for (let i = 0; i < 3; i++) s.consume("k", rule);
    t = 125_000;
    for (let i = 0; i < 3; i++) expect(s.consume("k", rule).ok).toBe(true);
  });

  it("bloqueios não consomem cota (tentativas negadas não prolongam o bloqueio)", () => {
    let t = 0;
    const s = new MemoryRateLimitStore(() => t);
    for (let i = 0; i < 3; i++) s.consume("k", rule);
    for (let i = 0; i < 100; i++) s.consume("k", rule);
    t = 125_000;
    expect(s.consume("k", rule).ok).toBe(true);
  });

  it("memória limitada mesmo com muitas chaves", () => {
    const s = new MemoryRateLimitStore(() => 0, 100);
    for (let i = 0; i < 1000; i++) s.consume(`k${i}`, rule);
    expect(s.size).toBeLessThanOrEqual(100);
  });
});
