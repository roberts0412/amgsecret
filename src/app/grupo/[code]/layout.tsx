import { notFound } from "next/navigation";
import { getGroupView } from "@/lib/queries";
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
  // mesma consulta (memoizada) que a página e o generateMetadata usam
  const group = await getGroupView((await params).code);
  if (!group) notFound(); // inexistente ou arquivado
  return (
    <div data-theme={effectiveTheme(group.theme, group.plan)} className="min-h-dvh bg-page">
      {children}
    </div>
  );
}
