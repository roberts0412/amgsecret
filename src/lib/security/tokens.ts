import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Tokens privados (participante, organizador, resultado).
 * - 256 bits de entropia, codificados em base64url (seguros em URL).
 * - No banco guardamos SOMENTE o hash SHA-256; o token em claro só existe
 *   no link/cookie do participante. Um vazamento do banco não revela tokens.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyToken(token: string, expectedHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Sem 0/O, 1/I/L — fácil de ditar e digitar no celular. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const GROUP_CODE_LENGTH = 6;
export const GROUP_CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${GROUP_CODE_LENGTH}}$`);

/** Código público do grupo (ex.: /grupo/K7PX2M). Não dá acesso a nada privado. */
export function generateGroupCode(length = GROUP_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function normalizeGroupCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return GROUP_CODE_PATTERN.test(code) ? code : null;
}
