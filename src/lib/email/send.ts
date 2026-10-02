import "server-only";
import { getEnv } from "@/lib/env";
import { SITE_NAME } from "@/lib/brand";
import type { EmailContent } from "./templates";

export interface OutgoingEmail extends EmailContent {
  to: string;
  unsubUrl: string;
}

export function emailEnabled(): boolean {
  return !!getEnv().RESEND_API_KEY;
}

function sender(): string {
  const env = getEnv();
  return env.EMAIL_FROM ?? `${SITE_NAME} <avisos@${new URL(env.APP_URL).hostname}>`;
}

/**
 * Envia pelo Resend em lotes de até 100. Nunca lança erro: um problema no
 * e-mail não pode desfazer um sorteio. Devolve quantos foram aceitos.
 */
export async function sendEmails(messages: OutgoingEmail[], fetchImpl: typeof fetch = fetch): Promise<number> {
  const key = getEnv().RESEND_API_KEY;
  if (!key || messages.length === 0) return 0;
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetchImpl("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          chunk.map((m) => ({
            from: sender(),
            to: [m.to],
            subject: m.subject,
            html: m.html,
            text: m.text,
            headers: { "List-Unsubscribe": `<${m.unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          })),
        ),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) sent += chunk.length;
      else console.error(`[email] Resend respondeu ${res.status}`);
    } catch (e) {
      console.error("[email] falha ao enviar", e instanceof Error ? e.message : e);
    }
  }
  return sent;
}
