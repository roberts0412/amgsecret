import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, type ScryptOptions, timingSafeEqual } from "node:crypto";
import { deriveKey } from "./keys";

/**
 * PIN de recuperação (6 dígitos).
 *
 * Um PIN de 6 dígitos tem só 10^6 possibilidades: com sal + scrypt apenas,
 * quem obtivesse uma cópia do banco testaria todos em horas. Por isso o PIN
 * passa antes por um HMAC com uma chave que existe só no servidor ("pepper"):
 * sem APP_SECRET, o hash guardado não serve para ataque offline.
 * Online, o ataque é contido por bloqueio progressivo + rate limit por IP.
 *
 * Formato guardado: scrypt$v1$<N>$<r>$<p>$<sal b64url>$<hash b64url>
 */

export { checkPin, PIN_LENGTH, type PinProblem } from "@/lib/pin-rules";

const PARAMS = { N: 2 ** 14, r: 8, p: 1 } as const; // ~16 MB, dezenas de ms
const KEY_LEN = 32;

function scrypt(password: Buffer, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

function pepper(pin: string): Buffer {
  return createHmac("sha256", deriveKey("pin-pepper")).update(pin, "utf8").digest();
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pepper(pin), salt, KEY_LEN, { ...PARAMS, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", "v1", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

/** Hash fixo para gastar o mesmo tempo quando o participante não existe. */
let dummyHash: Promise<string> | undefined;

export async function verifyPin(pin: string, stored: string | null): Promise<boolean> {
  // sem hash (participante inexistente/sem PIN): compara com um hash qualquer
  // para que a resposta leve o mesmo tempo e não revele quem existe
  const target = stored ?? (await (dummyHash ??= hashPin("000000")));
  const parts = target.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== "v1") return false;
  const [N, r, p] = parts.slice(2, 5).map(Number) as [number, number, number];
  const salt = Buffer.from(parts[5]!, "base64url");
  const expected = Buffer.from(parts[6]!, "base64url");
  const actual = await scrypt(pepper(pin), salt, expected.length, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return stored !== null && actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Bloqueio progressivo: a cada 5 erros seguidos, 15 min × 2^(rodada-1), até 24 h. */
export const PIN_MAX_ATTEMPTS = 5;

export function lockDurationMs(failedAttempts: number): number {
  if (failedAttempts < PIN_MAX_ATTEMPTS || failedAttempts % PIN_MAX_ATTEMPTS !== 0) return 0;
  const round = failedAttempts / PIN_MAX_ATTEMPTS;
  return Math.min(15 * 60_000 * 2 ** (round - 1), 24 * 60 * 60_000);
}
