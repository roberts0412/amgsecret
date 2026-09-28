import type { Metadata } from "next";
import { CreateGroupForm } from "@/components/forms";
import { Card, PageShell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Criar amigo secreto",
  description: "Crie seu amigo secreto em menos de um minuto e convide pelo WhatsApp.",
};

export default function CreatePage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight">Criar amigo secreto</h1>
      <Card>
        <CreateGroupForm />
      </Card>
    </PageShell>
  );
}
