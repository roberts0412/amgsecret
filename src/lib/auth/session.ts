import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import type { SessionParticipant } from "@/lib/services/common";
import { authenticate } from "@/lib/services/participants";
import { normalizeGroupCode } from "@/lib/security/tokens";

/**
 * Sessão = token privado do participante num cookie por grupo.
 * - httpOnly: JavaScript da página não lê (protege contra XSS roubar o token);
 * - SameSite=Lax: não vai em POSTs de outros sites (CSRF);
 * - Secure + prefixo __Host- em produção: só HTTPS, sem Domain, Path=/.
 * O banco guarda apenas o hash; o papel/status é relido do banco a cada request.
 */
const MAX_AGE_SEC = 180 * 24 * 60 * 60; // ~6 meses: cobre o período até a festa

function isSecure() {
  return getEnv().NODE_ENV === "production";
}

export function sessionCookieName(code: string): string {
  return `${isSecure() ? "__Host-" : ""}as_${code}`;
}

export async function setSessionCookie(rawCode: string, token: string): Promise<void> {
  const code = normalizeGroupCode(rawCode);
  if (!code) throw new Error("código de grupo inválido");
  (await cookies()).set(sessionCookieName(code), token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(rawCode: string): Promise<void> {
  const code = normalizeGroupCode(rawCode);
  if (!code) return;
  (await cookies()).delete({ name: sessionCookieName(code), path: "/" });
}

/** Token em claro do cookie — só para montar o link privado do próprio usuário. */
export async function getSessionToken(rawCode: string): Promise<string | null> {
  const code = normalizeGroupCode(rawCode);
  if (!code) return null;
  return (await cookies()).get(sessionCookieName(code))?.value ?? null;
}

/** Participante logado neste grupo (memoizado por request). */
export const getSession = cache(async (rawCode: string): Promise<SessionParticipant | null> => {
  const token = await getSessionToken(rawCode);
  if (!token) return null;
  return authenticate(getDb(), rawCode, token);
});
