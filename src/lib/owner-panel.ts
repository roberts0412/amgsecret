import { createHash, timingSafeEqual } from "node:crypto";
import { gameTitle } from "@/lib/game-kinds";
import type { SiteStats } from "@/lib/services/stats";

/**
 * Painel do dono: autenticação HTTP Basic (o navegador pede usuário e senha;
 * o usuário é ignorado) e HTML simples com números agregados.
 */
export function checkBasicAuth(header: string | null, password: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const given = decoded.slice(decoded.indexOf(":") + 1);
  // compara hashes de tamanho fixo em tempo constante
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(password).digest();
  return decoded.includes(":") && timingSafeEqual(a, b);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderPanel(s: SiteStats): string {
  const card = (label: string, value: number) =>
    `<div class="c"><div class="v">${value.toLocaleString("pt-BR")}</div><div class="l">${esc(label)}</div></div>`;
  const rows = s.daily
    .map((d) => {
      const [y, m, day] = d.day.split("-");
      return `<tr><td>${esc(`${day}/${m}/${y}`)}</td><td>${d.groups}</td><td>${d.participants}</td></tr>`;
    })
    .join("");
  const kinds = s.byKind.map((k) => `<li>${esc(gameTitle({ gameKind: k.kind }))}: <b>${k.count}</b></li>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Painel do dono</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#fff1f2;color:#0f172a;max-width:720px;margin:auto}
h1{font-size:1.4rem}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.c{background:#fff;border-radius:14px;padding:14px;box-shadow:0 0 0 1px #0f172a14}.v{font-size:1.6rem;font-weight:800;color:#e11d48}.l{font-size:.85rem;color:#475569}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}td,th{padding:8px 10px;text-align:left;border-bottom:1px solid #f1f5f9}
th{background:#f8fafc;font-size:.85rem}p.n{font-size:.8rem;color:#64748b}</style></head><body>
<h1>📊 Painel do dono</h1>
<div class="g">${card("grupos ativos", s.groups)}${card("grupos sorteados", s.groupsDrawn)}${card("participantes", s.participants)}${card("já viram o resultado", s.revealed)}${card("desejos na lista", s.wishes)}</div>
<h2>Brincadeiras</h2><ul>${kinds || "<li>—</li>"}</ul>
<h2>Últimos 30 dias</h2>
<table><thead><tr><th>Dia</th><th>Grupos criados</th><th>Pessoas que entraram</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Nenhum ainda.</td></tr>'}</tbody></table>
<p class="n">Só números. Nenhum nome, contato ou resultado de sorteio aparece aqui.</p>
</body></html>`;
}
