import Link from "next/link";
import { GoToGroupForm } from "@/components/forms";
import { btn, Card, PageShell } from "@/components/ui";

export default function HomePage() {
  return (
    <PageShell>
      <div className="py-6 text-center">
        <p className="text-6xl" aria-hidden>🎁</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Amigo secreto online e grátis</h1>
        <p className="mt-2 text-slate-600">
          Crie o grupo, mande o link no WhatsApp e faça o sorteio. Cada pessoa vê só quem tirou.
        </p>
      </div>

      <Link href="/criar" className={btn.primary}>
        Criar amigo secreto
      </Link>

      <Card>
        <GoToGroupForm />
      </Card>

      <ul className="mt-2 grid gap-2 text-sm text-slate-700">
        <li>✅ Ninguém tira a si mesmo — sorteio garantido</li>
        <li>🔒 Nem o organizador vê os pares</li>
        <li>📝 Lista de desejos e mensagens anônimas</li>
        <li>📱 Feito para o celular, sem cadastro</li>
      </ul>
    </PageShell>
  );
}
