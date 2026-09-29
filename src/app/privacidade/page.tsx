import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { getEnv } from "@/lib/env";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como o ${SITE_NAME} trata seus dados: o que coletamos, por quê, por quanto tempo e seus direitos (LGPD).`,
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  const contact = getEnv().CONTACT_EMAIL;
  return (
    <LegalPage title="Política de Privacidade" updated="28/09/2026">
      <p>
        Esta política explica como tratamos dados pessoais no {SITE_NAME}, de acordo com a Lei Geral de Proteção de
        Dados (LGPD — Lei 13.709/2018). Coletamos apenas o necessário para o sorteio funcionar.
      </p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li><strong>Nome</strong> (obrigatório) e <strong>apelido</strong> (opcional), visíveis para o grupo.</li>
        <li><strong>E-mail e celular</strong> (opcionais), que não aparecem para o grupo.</li>
        <li><strong>PIN de recuperação</strong>, guardado de forma irreversível (não conseguimos lê-lo).</li>
        <li><strong>Lista de desejos</strong>, <strong>mensagens secretas</strong> e <strong>posts no mural</strong>, se você usar esses recursos.</li>
        <li><strong>Dados do evento</strong> informados pelo organizador (nome, data, local, valor).</li>
        <li><strong>Endereço IP</strong>, usado apenas em memória e por poucos minutos para limitar abusos (não é gravado no banco).</li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Realizar o sorteio e mostrar a cada pessoa somente o próprio resultado.</li>
        <li>Permitir a lista de desejos, as mensagens anônimas e o mural.</li>
        <li>Proteger o serviço contra abusos e acessos indevidos.</li>
        <li>Exibir anúncios que mantêm o site grátis (somente com as regras de cookies abaixo).</li>
      </ul>
      <p>
        A base legal é a execução do serviço que você solicitou (art. 7º, V) e, para anúncios personalizados, o seu
        consentimento (art. 7º, I).
      </p>

      <h2>Sigilo do sorteio</h2>
      <p>
        O resultado do sorteio (quem tirou quem) é guardado de forma cifrada. Nem o organizador tem acesso à lista de
        pares. O remetente das mensagens anônimas também não é gravado de forma legível.
      </p>

      <h2>Cookies</h2>
      <ul>
        <li><strong>Essenciais</strong>: mantêm você conectado ao seu grupo e guardam sua escolha sobre cookies.</li>
        <li>
          <strong>Anúncios</strong> (Google AdSense): só são carregados depois da sua escolha. Se você escolher
          &quot;Só essenciais&quot;, os anúncios exibidos não são personalizados. Páginas com informações privadas
          nunca exibem anúncios.
        </li>
      </ul>
      <p>
        Você pode mudar de ideia apagando os cookies deste site no seu navegador — o aviso aparecerá de novo.
      </p>

      <h2>Com quem compartilhamos</h2>
      <p>
        Não vendemos dados. Eles ficam no provedor de hospedagem do site. Quando há anúncios, o Google recebe dados de
        navegação conforme a sua escolha de cookies e a política do próprio Google.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Pelo tempo em que o grupo estiver ativo. Participantes removidos têm o acesso revogado; ao refazer um sorteio,
        os resultados e mensagens anteriores são apagados. Você pode pedir a exclusão dos seus dados a qualquer momento.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, exclusão ou informações sobre o tratamento dos seus dados, e revogar o
        consentimento para anúncios personalizados.
        {contact ? (
          <>
            {" "}Para isso, escreva para <a href={`mailto:${contact}`} className="underline">{contact}</a>.
          </>
        ) : (
          " Para isso, fale com o responsável pelo site."
        )}
      </p>

      <h2>Crianças</h2>
      <p>
        O site pode ser usado em amigos secretos de família. Menores de idade devem participar com a supervisão de um
        responsável, que é quem aceita esta política.
      </p>
    </LegalPage>
  );
}
