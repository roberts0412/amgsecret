import { formatCents } from "@/lib/validation";
import { formatWhen } from "@/lib/format";

/**
 * Textos dos e-mails. NUNCA incluem quem a pessoa tirou: o resultado só
 * aparece no site, para quem está conectado ou recupera o acesso com o PIN.
 */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(paragraphs: string[], button: { label: string; url: string }, footer: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#fff1f2;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;padding:24px">
${paragraphs.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${p}</p>`).join("")}
<p style="margin:22px 0"><a href="${esc(button.url)}" style="background:#e11d48;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:bold;display:inline-block">${esc(button.label)}</a></p>
<p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">${footer}</p>
</div></body></html>`;
}

function footerFor(groupName: string, unsubUrl: string) {
  return {
    html: `Você recebeu este aviso porque informou este e-mail ao entrar no grupo &quot;${esc(groupName)}&quot;. <a href="${esc(unsubUrl)}" style="color:#64748b">Não quero mais receber</a>.`,
    text: `Você recebeu este aviso porque informou este e-mail ao entrar no grupo "${groupName}". Para não receber mais: ${unsubUrl}`,
  };
}

export function drawDoneEmail(p: { term: string; groupName: string; groupUrl: string; unsubUrl: string; name: string }): EmailContent {
  const f = footerFor(p.groupName, p.unsubUrl);
  const first = p.name.split(" ")[0] ?? p.name;
  return {
    subject: `🎉 O sorteio do ${p.term} "${p.groupName}" foi feito!`,
    html: layout(
      [
        `Oi, ${esc(first)}!`,
        `O sorteio do ${esc(p.term)} <strong>${esc(p.groupName)}</strong> foi feito. 🎁`,
        "Abra o grupo e toque em <strong>Revelar</strong> para ver quem você tirou. Se o site não reconhecer você neste aparelho, use <strong>Recuperar meu acesso</strong> com seu nome e PIN.",
      ],
      { label: "Ver quem eu tirei", url: p.groupUrl },
      f.html,
    ),
    text: `Oi, ${first}!\n\nO sorteio do ${p.term} "${p.groupName}" foi feito.\nAbra o grupo e toque em "Revelar" para ver quem você tirou: ${p.groupUrl}\nSe o site não reconhecer você, use "Recuperar meu acesso" com seu nome e PIN.\n\n${f.text}`,
  };
}

export function reminderEmail(p: {
  term: string; groupName: string; groupUrl: string; unsubUrl: string; name: string;
  eventDate: string; eventTime: string | null; location: string | null; giftValueCents: number | null;
}): EmailContent {
  const f = footerFor(p.groupName, p.unsubUrl);
  const first = p.name.split(" ")[0] ?? p.name;
  const when = formatWhen(p.eventDate, p.eventTime)!;
  const details = [
    `📅 ${when}`,
    ...(p.location ? [`📍 ${p.location}`] : []),
    ...(p.giftValueCents !== null ? [`💰 Presente de até ${formatCents(p.giftValueCents)}`] : []),
  ];
  return {
    subject: `⏰ Faltam 3 dias para o ${p.term} "${p.groupName}"`,
    html: layout(
      [
        `Oi, ${esc(first)}! Falta pouco para o ${esc(p.term)} <strong>${esc(p.groupName)}</strong>. 🎁`,
        details.map(esc).join("<br>"),
        "Já comprou o presente? No grupo você vê a lista de desejos de quem você tirou e pode mandar mensagens anônimas.",
      ],
      { label: "Abrir o grupo", url: p.groupUrl },
      f.html,
    ),
    text: `Oi, ${first}! Falta pouco para o ${p.term} "${p.groupName}".\n\n${details.join("\n")}\n\nNo grupo você vê a lista de desejos de quem você tirou: ${p.groupUrl}\n\n${f.text}`,
  };
}
