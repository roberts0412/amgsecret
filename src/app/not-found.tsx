import Link from "next/link";
import { btn, Card, PageShell } from "@/components/ui";

export default function NotFound() {
  return (
    <PageShell>
      <Card className="text-center">
        <p className="text-4xl" aria-hidden>🔍</p>
        <h1 className="mt-2 text-xl font-bold">Não encontramos essa página</h1>
        <p className="mt-2 text-slate-600">Confira se o link do grupo foi copiado inteiro.</p>
        <Link href="/" className={`${btn.secondary} mt-4`}>
          Ir para o início
        </Link>
      </Card>
    </PageShell>
  );
}
