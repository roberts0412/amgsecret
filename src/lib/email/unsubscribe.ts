import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { deriveKey } from "@/lib/security/keys";

/**
 * Link de descadastro sem login: id do participante + HMAC. Quem tem o link
 * só consegue uma coisa: apagar o e-mail daquele participante.
 */
function sign(participantId: string): string {
  return createHmac("sha256", deriveKey("email-unsubscribe")).update(participantId).digest("base64url").slice(0, 32);
}

export function unsubscribeUrl(participantId: string): string {
  const url = new URL("/api/email/sair", getEnv().APP_URL);
  url.searchParams.set("p", participantId);
  url.searchParams.set("s", sign(participantId));
  return url.toString();
}

export function verifyUnsubscribe(participantId: unknown, signature: unknown): participantId is string {
  if (typeof participantId !== "string" || typeof signature !== "string") return false;
  if (!/^[a-z0-9]{20,40}$/.test(participantId) || signature.length !== 32) return false;
  return timingSafeEqual(Buffer.from(sign(participantId)), Buffer.from(signature));
}
