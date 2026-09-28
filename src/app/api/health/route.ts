import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** Verificação de saúde (Docker/monitoramento): app no ar + banco respondendo. */
export async function GET() {
  try {
    await getDb().$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
