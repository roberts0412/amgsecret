import { getDb } from "@/lib/db/client";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { effectiveTheme } from "@/lib/themes";

/** Aplica o tema do grupo a todas as páginas /grupo/<código>/*. */
export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const code = normalizeGroupCode((await params).code);
  const group = code
    ? await getDb().group.findUnique({ where: { code }, select: { theme: true, plan: true } })
    : null;
  const theme = group ? effectiveTheme(group.theme, group.plan) : "classico";
  return (
    <div data-theme={theme} className="min-h-dvh bg-page">
      {children}
    </div>
  );
}
