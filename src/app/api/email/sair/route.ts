import { getDb } from "@/lib/db/client";
import { verifyUnsubscribe } from "@/lib/email/unsubscribe";
import { unsubscribeParticipant } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

const HEADERS = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

function page(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-mails de aviso</title>
<style>body{font-family:system-ui,sans-serif;background:#fff1f2;color:#0f172a;margin:0;padding:24px}main{max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:24px}
button{background:#e11d48;color:#fff;border:0;border-radius:12px;padding:12px 18px;font-size:16px;font-weight:bold;cursor:pointer}a{color:#e11d48}</style></head>
<body><main>${body}</main></body></html>`,
    { status, headers: HEADERS },
  );
}

const INVALID = page("<h1>Link inválido</h1><p>Este link de descadastro não é válido.</p>", 400);

/**
 * GET só mostra a confirmação (leitores de e-mail abrem links sozinhos e não
 * podem descadastrar ninguém por acidente); POST apaga o e-mail. O POST também
 * atende o descadastro em 1 clique dos provedores (List-Unsubscribe-Post).
 */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const p = u.searchParams.get("p");
  const s = u.searchParams.get("s");
  if (!verifyUnsubscribe(p, s)) return INVALID;
  const action = `/api/email/sair?p=${encodeURIComponent(p)}&s=${encodeURIComponent(s!)}`;
  return page(
    `<h1>Parar de receber avisos?</h1><p>Você não vai mais receber e-mails do sorteio e de lembrete. Seu e-mail será apagado do grupo.</p>
<form method="post" action="${action}"><button type="submit">Não quero mais receber</button></form>`,
  );
}

export async function POST(request: Request) {
  const u = new URL(request.url);
  const p = u.searchParams.get("p");
  if (!verifyUnsubscribe(p, u.searchParams.get("s"))) return INVALID;
  await unsubscribeParticipant(getDb(), p);
  return page('<h1>Pronto ✅</h1><p>Você não vai mais receber nossos e-mails.</p><p><a href="/">Voltar ao site</a></p>');
}
