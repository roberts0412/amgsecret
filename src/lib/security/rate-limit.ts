/**
 * Rate limiting por janela deslizante (aproximada com duas janelas fixas).
 *
 * A implementação em memória serve para um único processo. Em produção com
 * várias instâncias, troque por um store compartilhado (Redis/Upstash)
 * implementando a mesma interface `RateLimitStore`.
 */

export interface RateLimitRule {
  /** Máximo de ações na janela. */
  limit: number;
  /** Tamanho da janela em segundos. */
  windowSec: number;
}

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSec: number };

export interface RateLimitStore {
  consume(key: string, rule: RateLimitRule): RateLimitResult;
}

/** Regras centrais, por ação. Chave final = ação + IP (ou participante). */
export const RATE_LIMITS = {
  createGroup: { limit: 10, windowSec: 60 * 60 },
  joinGroup: { limit: 30, windowSec: 60 * 60 },
  tokenAccess: { limit: 20, windowSec: 10 * 60 },
  // por IP; além disso cada participante tem bloqueio próprio (5 erros)
  recoverAccess: { limit: 10, windowSec: 10 * 60 },
  lookupGroup: { limit: 60, windowSec: 10 * 60 },
  organizerAction: { limit: 120, windowSec: 10 * 60 },
  participantAction: { limit: 60, windowSec: 10 * 60 },
  sendMessage: { limit: 30, windowSec: 10 * 60 },
  wallPost: { limit: 20, windowSec: 10 * 60 },
  // painel do dono: tentativas de senha por IP
  ownerPanel: { limit: 10, windowSec: 10 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface Bucket {
  windowStart: number;
  current: number;
  previous: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 50_000,
  ) {}

  consume(key: string, rule: RateLimitRule): RateLimitResult {
    const windowMs = rule.windowSec * 1000;
    const t = this.now();
    const windowStart = Math.floor(t / windowMs) * windowMs;

    let b = this.buckets.get(key);
    if (!b) {
      b = { windowStart, current: 0, previous: 0 };
    } else if (b.windowStart !== windowStart) {
      // avançou uma janela: a atual vira a anterior; se pulou mais, zera
      b.previous = windowStart - b.windowStart === windowMs ? b.current : 0;
      b.current = 0;
      b.windowStart = windowStart;
    }

    // peso da janela anterior que ainda "cai" dentro da janela deslizante
    const elapsed = (t - windowStart) / windowMs;
    const estimated = b.previous * (1 - elapsed) + b.current;

    if (estimated + 1 > rule.limit) {
      this.buckets.set(key, b);
      const retryAfterSec = Math.max(1, Math.ceil((windowStart + windowMs - t) / 1000));
      return { ok: false, retryAfterSec };
    }

    b.current += 1;
    this.buckets.set(key, b);
    if (this.buckets.size > this.maxKeys) this.sweep(t);
    return { ok: true, remaining: Math.max(0, Math.floor(rule.limit - estimated - 1)) };
  }

  /** Remove chaves inativas há mais de 2 janelas (limite de memória). */
  private sweep(t: number) {
    const maxWindowMs = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowSec)) * 1000;
    for (const [k, b] of this.buckets) {
      if (t - b.windowStart > 2 * maxWindowMs) this.buckets.delete(k);
    }
    // se ainda estiver cheio (ataque com muitas chaves), descarta as mais antigas
    if (this.buckets.size > this.maxKeys) {
      const excess = this.buckets.size - this.maxKeys;
      let i = 0;
      for (const k of this.buckets.keys()) {
        if (i++ >= excess) break;
        this.buckets.delete(k);
      }
    }
  }

  get size() {
    return this.buckets.size;
  }
}

const globalForRl = globalThis as unknown as { rateLimitStore?: RateLimitStore };

export function getRateLimitStore(): RateLimitStore {
  globalForRl.rateLimitStore ??= new MemoryRateLimitStore();
  return globalForRl.rateLimitStore;
}
