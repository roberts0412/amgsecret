import type { Metadata } from "next";
import { CreateGroupForm } from "@/components/forms";
import { Card, PageShell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Criar grupo e sortear",
  description:
    "Crie seu amigo secreto, amigo oculto ou amigo da onça em menos de um minuto e convide pelo WhatsApp.",
};

export default function CreatePage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Criar grupo</h1>
        <p className="mt-1 text-sm text-slate-600">Amigo secreto, amigo oculto, amigo da onça… você escolhe.</p>
      </div>
      <Card>
        <CreateGroupForm />
      </Card>
    </PageShell>
  );
}
