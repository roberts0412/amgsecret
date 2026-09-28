#!/usr/bin/env node
/**
 * Teste de carga realista do Amigo Secreto.
 *
 * Cada "pessoa virtual" faz o que o navegador faz: abre a página, lê o
 * formulário (Server Action) e envia o POST — passando por PIN (scrypt),
 * travas do banco, cifragem e rate limit. Cada uma usa um IP próprio
 * (X-Real-IP), então o servidor deve rodar com TRUST_PROXY=true.
 *
 * Fases (os picos reais de um amigo secreto):
 *   1. criar grupos
 *   2. "link no WhatsApp": muita gente abrindo a página do grupo ao mesmo tempo
 *   3. entrada em massa (entrar + PIN)
 *   4. confirmar presença
 *   5. sortear (todos os grupos ao mesmo tempo)
 *   6. todo mundo revela ao mesmo tempo
 *
 * Uso:
 *   node scripts/loadtest.mjs --base http://localhost:3000 --groups 20 --members 25 --concurrency 100
 * NUNCA rode contra produção com dados reais: cria grupos de teste.
 */

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const BASE = args.base ?? "http://localhost:3000";
const GROUPS = Number(args.groups ?? 10);
const MEMBERS = Number(args.members ?? 20); // além do organizador
const CONC = Number(args.concurrency ?? 50);
const VIEWS = Number(args.views ?? 2000);
const ORIGIN = new URL(BASE).origin;

let ipCounter = 0;
const newIp = () => {
  ipCounter++;
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
};

// ---------------------------------------------------------------------------
// HTTP + métricas
// ---------------------------------------------------------------------------

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Campos ocultos da Server Action do formulário que contém `marker`. */
function actionFields(html, marker) {
  const forms = html.split("<form").slice(1).map((f) => f.split("</form>")[0]);
  const form = forms.find((f) => f.includes(marker));
  if (!form) throw new Error(`formulário com "${marker}" não encontrado`);
  const fields = {};
  for (const m of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = m[0].match(/name="([^"]*)"/)?.[1];
    const value = m[0].match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) fields[decode(name)] = decode(value);
  }
  return fields;
}

async function request(path, { ip, cookie, form } = {}) {
  const headers = { "x-real-ip": ip ?? newIp() };
  if (cookie) headers.cookie = cookie;
  let body;
  if (form) {
    body = new FormData();
    for (const [k, v] of Object.entries(form)) body.append(k, v);
    headers.origin = ORIGIN;
  }
  const t0 = performance.now();
  const res = await fetch(BASE + path, { method: form ? "POST" : "GET", headers, body, redirect: "manual" });
  const text = await res.text();
  return { res, text, ms: performance.now() - t0 };
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONC, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

function report(name, samples, wallMs) {
  const ok = samples.filter((s) => s.ok);
  const lat = ok.map((s) => s.ms).sort((a, b) => a - b);
  const p = (q) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor(q * lat.length))].toFixed(0) : "-");
  const errors = samples.length - ok.length;
  const byStatus = {};
  for (const s of samples.filter((s) => !s.ok)) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  console.log(
    `${name.padEnd(34)} ${String(samples.length).padStart(5)} req  ` +
      `${(samples.length / (wallMs / 1000)).toFixed(0).padStart(4)} req/s  ` +
      `p50 ${p(0.5).padStart(5)}ms  p95 ${p(0.95).padStart(5)}ms  p99 ${p(0.99).padStart(5)}ms  ` +
      `erros ${errors}${errors ? " " + JSON.stringify(byStatus) : ""}`,
  );
  return errors;
}

async function phase(name, items, fn) {
  const t0 = performance.now();
  const samples = await pool(items, async (item, i) => {
    try {
      const r = await fn(item, i);
      return { ok: r.ok, ms: r.ms, status: r.status };
    } catch (e) {
      return { ok: false, ms: 0, status: String(e.message).slice(0, 40) };
    }
  });
  return report(name, samples, performance.now() - t0);
}

const sessionCookie = (res) => {
  const set = res.headers.getSetCookie?.() ?? [];
  const c = set.find((x) => /(^|__Host-)as_[A-Z2-9]{6}=/.test(x));
  return c ? c.split(";")[0] : null;
};

// ---------------------------------------------------------------------------
// Cenário
// ---------------------------------------------------------------------------

const PIN = "730164";
const groups = []; // { code, org: {ip, cookie}, members: [{ip, cookie}] }

console.log(`\nTeste de carga — ${BASE} — ${GROUPS} grupos × ${MEMBERS + 1} pessoas, concorrência ${CONC}\n`);
let totalErrors = 0;

// 1. criar grupos
const createForm = actionFields((await request("/criar")).text, 'name="organizerName"');
totalErrors += await phase("1. criar grupos", Array.from({ length: GROUPS }), async (_, i) => {
  const ip = newIp();
  const { res, ms } = await request("/criar", {
    ip,
    form: { ...createForm, name: `Carga ${i + 1}`, organizerName: "Organizador", pin: PIN, pinConfirm: PIN },
  });
  const loc = res.headers.get("location") ?? "";
  const code = loc.match(/\/grupo\/([A-Z2-9]{6})/)?.[1];
  const cookie = sessionCookie(res);
  if (res.status === 303 && code && cookie) groups[i] = { code, org: { ip, cookie }, members: [] };
  return { ok: !!groups[i], ms, status: res.status };
});
const live = groups.filter(Boolean);

// 2. muita gente abrindo o link do grupo
totalErrors += await phase("2. abrir link do grupo (visitantes)", Array.from({ length: VIEWS }), async (_, i) => {
  const g = live[i % live.length];
  const { res, text, ms } = await request(`/grupo/${g.code}`);
  return { ok: res.status === 200 && text.includes("Participar"), ms, status: res.status };
});

// 3. entrada em massa
const joinForm = actionFields((await request(`/grupo/${live[0].code}`)).text, 'name="pin"');
const joins = live.flatMap((g) => Array.from({ length: MEMBERS }, (_, k) => ({ g, k })));
totalErrors += await phase("3. entrar no grupo (com PIN)", joins, async ({ g, k }) => {
  const ip = newIp();
  const { res, ms } = await request(`/grupo/${g.code}`, {
    ip,
    form: { ...joinForm, code: g.code, name: `Pessoa ${k + 1}`, pin: PIN, pinConfirm: PIN },
  });
  const cookie = sessionCookie(res);
  if (res.status === 303 && cookie) g.members.push({ ip, cookie });
  return { ok: res.status === 303 && !!cookie, ms, status: res.status };
});

// 4. confirmar presença
const confirmPage = await request(`/grupo/${live[0].code}`, live[0].members[0]);
const confirmForm = actionFields(confirmPage.text, "Confirmar minha participação");
const everyone = live.flatMap((g) => g.members.map((m) => ({ g, m })));
totalErrors += await phase("4. confirmar presença", everyone, async ({ g, m }) => {
  const { res, ms } = await request(`/grupo/${g.code}`, { ...m, form: { ...confirmForm, code: g.code } });
  return { ok: res.status === 200, ms, status: res.status };
});

// 5. sortear todos os grupos ao mesmo tempo
const adminPage = await request(`/grupo/${live[0].code}/admin`, live[0].org);
const drawForm = actionFields(adminPage.text, 'name="confirm"');
totalErrors += await phase("5. sortear (todos os grupos juntos)", live, async (g) => {
  const { res, text, ms } = await request(`/grupo/${g.code}/admin`, { ...g.org, form: { ...drawForm, code: g.code, confirm: "sim" } });
  return { ok: res.status === 200 && text.includes("Sorteio realizado com"), ms, status: res.status };
});

// 6. todo mundo revela ao mesmo tempo
const reveals = live.flatMap((g) => [g.org, ...g.members].map((m) => ({ g, m })));
const seen = new Map(); // code -> nomes tirados
totalErrors += await phase("6. revelar (todos ao mesmo tempo)", reveals, async ({ g, m }) => {
  const { res, text, ms } = await request(`/grupo/${g.code}/eu/amigo`, m);
  const name = text.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1];
  if (name) seen.set(g.code, [...(seen.get(g.code) ?? []), name]);
  return { ok: res.status === 200 && !!name, ms, status: res.status };
});

// conferência: em cada grupo, cada pessoa foi tirada exatamente uma vez
let wrong = 0;
for (const g of live) {
  const names = seen.get(g.code) ?? [];
  const expected = g.members.length + 1;
  if (names.length !== expected || new Set(names).size !== expected) wrong++;
}
console.log(`\nConferência do sorteio: ${live.length - wrong}/${live.length} grupos com todos tirados exatamente uma vez`);
console.log(totalErrors + wrong === 0 ? "✅ Sem erros\n" : `‼️ ${totalErrors} erros, ${wrong} grupos inconsistentes\n`);
process.exit(totalErrors + wrong === 0 ? 0 : 1);
