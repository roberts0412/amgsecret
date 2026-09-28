/**
 * Consentimento de cookies (LGPD). Guardado num cookie simples no navegador:
 * - "all": anúncios personalizados permitidos;
 * - "essential": só o necessário — anúncios NÃO personalizados.
 * Sem escolha: nenhum script de anúncio é carregado.
 */
export type Consent = "all" | "essential";
export const CONSENT_COOKIE = "consentimento";
export const CONSENT_EVENT = "consent-change";

export function readConsent(cookieString: string): Consent | null {
  const m = cookieString.match(/(?:^|;\s*)consentimento=(all|essential)(?:;|$)/);
  return (m?.[1] as Consent | undefined) ?? null;
}

export function consentCookie(value: Consent, secure: boolean): string {
  return `${CONSENT_COOKIE}=${value}; Max-Age=${365 * 24 * 60 * 60}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}
