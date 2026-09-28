import "server-only";
import { hkdfSync } from "node:crypto";
import { getEnv } from "@/lib/env";

/**
 * Chaves derivadas de APP_SECRET via HKDF — uma por finalidade, para que o
 * vazamento/uso indevido de uma não comprometa as outras.
 */
export type KeyPurpose = "pair-encryption" | "receiver-lookup" | "sender-lookup" | "pin-pepper";

const cache = new Map<string, Buffer>();

export function deriveKey(purpose: KeyPurpose): Buffer {
  const secret = getEnv().APP_SECRET;
  const cacheKey = `${purpose}:${secret}`;
  let k = cache.get(cacheKey);
  if (!k) {
    k = Buffer.from(hkdfSync("sha256", secret, "amigo-secreto/v1", purpose, 32));
    cache.set(cacheKey, k);
  }
  return k;
}

/** Só para testes. */
export function clearKeyCache(): void {
  cache.clear();
}
