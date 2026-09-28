import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { deriveKey, type KeyPurpose } from "./keys";

/**
 * Proteção do relacionamento participante -> resultado.
 *
 * - O sorteado é gravado cifrado com AES-256-GCM. O AAD amarra o texto cifrado
 *   ao (drawId, giverId): copiar o `receiverEnc` de uma linha para outra faz a
 *   decifragem falhar, em vez de revelar/embaralhar resultados.
 * - Lookups determinísticos (HMAC) permitem buscas como "quem me tirou?" sem
 *   gravar IDs em claro. Cada finalidade usa uma chave derivada diferente.
 * - Todas as chaves derivam de APP_SECRET via HKDF; o prefixo de versão ("v1")
 *   permite rotação futura.
 */

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

type Purpose = Extract<KeyPurpose, "pair-encryption" | "receiver-lookup" | "sender-lookup">;

const key = (purpose: Purpose) => deriveKey(purpose);

/** Codificação sem ambiguidade dos campos (IDs nunca contêm "\u0000"). */
function aad(...parts: string[]): Buffer {
  return Buffer.from(parts.join("\u0000"), "utf8");
}

export interface PairRef {
  drawId: string;
  giverId: string;
}

export function encryptReceiver(ref: PairRef, receiverId: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key("pair-encryption"), iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(aad("pair", ref.drawId, ref.giverId));
  const ct = Buffer.concat([cipher.update(receiverId, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), ct.toString("base64url"), tag.toString("base64url")].join(".");
}

export class PairDecryptionError extends Error {
  constructor() {
    super("Não foi possível ler o resultado do sorteio.");
    this.name = "PairDecryptionError";
  }
}

export function decryptReceiver(ref: PairRef, encoded: string): string {
  const parts = encoded.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new PairDecryptionError();
  const [, ivB64, ctB64, tagB64] = parts as [string, string, string, string];
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new PairDecryptionError();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key("pair-encryption"), iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(aad("pair", ref.drawId, ref.giverId));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new PairDecryptionError();
  }
}

function lookup(purpose: Purpose, drawId: string, participantId: string): string {
  return createHmac("sha256", key(purpose)).update(aad(drawId, participantId)).digest("hex");
}

/** Para DrawPair.receiverLookup — acha o par em que `receiverId` foi sorteado. */
export function receiverLookup(drawId: string, receiverId: string): string {
  return lookup("receiver-lookup", drawId, receiverId);
}

/** Para SecretMessage.senderLookup — identifica o remetente sem gravá-lo. */
export function senderLookup(drawId: string, senderId: string): string {
  return lookup("sender-lookup", drawId, senderId);
}

export function lookupEquals(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

export { clearKeyCache } from "./keys";
