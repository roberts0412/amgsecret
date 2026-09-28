import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SendToFriendForm } from "@/components/social-forms";
import { Conversation, WishList } from "@/components/social-views";
import { Card, CardTitle, PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { revealMyResult } from "@/lib/services/draws";
import { conversationWithFriend, getFriendWishes } from "@/lib/services/social";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { todayInEventTz } from "@/lib/validation";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Meu amigo secreto", robots: { index: false, follow: false } };

/**
 * Quem EU tirei: nome, lista de desejos e conversa anônima. Abrir esta
 * página é um ato deliberado (equivale a "revelar"). Sem anúncios.
 * Não recebe id nenhum na URL: tudo vem da sessão.
 */
export default async function FriendPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = normalizeGroupCode(rawCode);
  if (!code) notFound();
  if (rawCode !== code) redirect(`/grupo/${code}/eu/amigo`);

  const me = await getSession(code);
  if (!me) redirect(`/grupo/${code}`);
  const db = getDb();
  let friend;
  try {
    friend = await revealMyResult(db, me); // também registra que a pessoa viu
  } catch {
    redirect(`/grupo/${code}/eu`); // sem sorteio ou fora dele
  }
  const [wishes, conversation] = await Promise.all([getFriendWishes(db, me), conversationWithFriend(db, me)]);
  const first = friend.name.split(" ")[0];

  return (
    <PageShell>
      <Link href={`/grupo/${code}/eu`} className="text-sm text-brand underline">
        ← Minha área
      </Link>
      <Card className="text-center">
        <p className="text-sm text-slate-600">Você tirou</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand">{friend.name}</h1>
        {friend.nickname && <p className="text-slate-600">({friend.nickname})</p>}
        <p className="mt-1 text-sm text-slate-600">🤫 Guarde segredo!</p>
      </Card>

      <Card>
        <CardTitle>📝 Lista de desejos de {first}</CardTitle>
        {wishes && wishes.length > 0 ? (
          <WishList wishes={wishes} code={code} editable={false} />
        ) : (
          <p className="text-sm text-slate-600">
            {first} ainda não adicionou desejos. Que tal perguntar, em segredo, pela mensagem anônima abaixo? 😉
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>💌 Mensagem anônima para {first}</CardTitle>
        <p className="mb-3 text-sm text-slate-600">{first} recebe a mensagem, mas não sabe que foi você.</p>
        <div className="flex flex-col gap-4">
          <Conversation messages={conversation} today={todayInEventTz()} otherLabel={first!}
            empty="Nenhuma mensagem ainda." />
          <SendToFriendForm code={code} />
        </div>
      </Card>
    </PageShell>
  );
}
