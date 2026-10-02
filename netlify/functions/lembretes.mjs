// Função agendada da Netlify: 1x por dia (12:00 UTC = 9h em Brasília) chama a
// rota de lembretes do site. Precisa de CRON_SECRET nas variáveis da Netlify.
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return new Response("CRON_SECRET/URL ausentes", { status: 200 });
  const res = await fetch(`${base}/api/cron/lembretes`, { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
  console.log("[lembretes]", res.status, await res.text());
  return new Response("ok");
};

export const config = { schedule: "0 12 * * *" };
