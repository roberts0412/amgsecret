import { adsTxt } from "@/lib/ads";

export const dynamic = "force-dynamic";

/** /ads.txt — declara o vendedor autorizado de anúncios (exigido pelo AdSense). */
export function GET() {
  const body = adsTxt();
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
