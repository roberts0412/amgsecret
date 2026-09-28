import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { effectiveTheme } from "@/lib/themes";

/**
 * Layout de /grupo/<código>/*: aplica o tema do grupo e responde 404 de
 * verdade para grupo inexistente/arquivado. A checagem precisa ficar AQUI:
 * o loading.tsx abre o streaming com status 200 antes de a página rodar,
 * então um notFound() só na página viraria um "soft 404".
 */
export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const code = normalizeGroupCode((await params).code);
  const group = code
    ? await getDb().group.findUnique({ where: { code }, select: { theme: true, plan: true, status: true } })
    : null;
  if (!group || group.status === "ARCHIVED") notFound();
  return (
    <div data-theme={effectiveTheme(group.theme, group.plan)} className="min-h-dvh bg-page">
      {children}
    </div>
  );
}
