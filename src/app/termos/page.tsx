import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do Amigo Secreto: responsabilidades, conteúdo permitido e limitações do serviço.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updated="28/09/2026">
      <p>Ao usar o Amigo Secreto, você concorda com estes termos. Eles são curtos — leia com calma.</p>

      <h2>O serviço</h2>
      <p>
        Oferecemos uma ferramenta gratuita para organizar amigos secretos: criação de grupos, convites, sorteio,
        lista de desejos, mensagens anônimas e mural. O serviço pode exibir anúncios.
      </p>

      <h2>Seu link privado e seu PIN</h2>
      <p>
        O link privado e o PIN funcionam como a sua chave. Não os compartilhe. Quem tiver o seu link pode ver o seu
        resultado. Se perder o link e o PIN, não é possível recuperar o acesso — nem pelo organizador.
      </p>

      <h2>Responsabilidades do organizador</h2>
      <ul>
        <li>Convidar apenas pessoas que concordam em participar.</li>
        <li>Usar exclusões e o recurso de refazer o sorteio de boa-fé.</li>
        <li>Moderar o mural do grupo quando necessário.</li>
      </ul>

      <h2>Conteúdo proibido</h2>
      <p>
        É proibido usar o mural, as mensagens ou a lista de desejos para ofender, assediar, ameaçar, divulgar dados de
        terceiros, praticar golpes ou publicar conteúdo ilegal. Podemos remover conteúdo e grupos que violem estas
        regras.
      </p>

      <h2>Limitações</h2>
      <p>
        O serviço é oferecido &quot;como está&quot;. Fazemos o possível para mantê-lo seguro e disponível, mas não
        garantimos funcionamento ininterrupto. A compra e a troca dos presentes são de responsabilidade dos
        participantes.
      </p>

      <h2>Mudanças</h2>
      <p>Podemos atualizar estes termos; a data no topo indica a versão atual.</p>
    </LegalPage>
  );
}
