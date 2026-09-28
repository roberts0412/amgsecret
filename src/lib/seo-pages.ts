/**
 * Conteúdo das páginas de SEO (uma rota por intenção de busca).
 * Regras: título ≤ 60 caracteres, descrição ≤ 160, texto útil de verdade
 * (sem repetição forçada de palavra-chave), FAQ que responde dúvidas reais.
 */

export interface SeoSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoPage {
  slug: string;
  /** Palavra-chave principal (deve aparecer no título e no H1). */
  keyword: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faq: SeoFaq[];
}

/** Passo a passo comum, exibido em todas as páginas. */
export const HOW_IT_WORKS = [
  { title: "Crie o grupo", text: "Dê um nome, escolha a data e o valor do presente. Leva menos de um minuto." },
  { title: "Convide pelo WhatsApp", text: "Envie o link. Cada pessoa entra com o próprio nome e confirma a participação." },
  { title: "Faça o sorteio", text: "Com todos confirmados, o organizador sorteia com um toque." },
  { title: "Cada um vê só o seu", text: "Cada participante descobre apenas quem tirou — nem o organizador vê os pares." },
];

export const SEO_PAGES: readonly SeoPage[] = [
  {
    slug: "amigo-secreto-online",
    keyword: "amigo secreto online",
    title: "Amigo Secreto Online: sorteio pelo celular em 1 minuto",
    description:
      "Faça seu amigo secreto online sem papelzinho: crie o grupo, convide pelo WhatsApp e cada pessoa vê só quem tirou. Grátis e sem cadastro.",
    h1: "Amigo secreto online, direto do celular",
    intro:
      "Chega de juntar todo mundo para tirar papelzinho — ou de refazer o sorteio porque alguém tirou o próprio nome. Com o amigo secreto online, o grupo inteiro participa pelo celular, cada um no seu tempo, e o resultado chega só para quem precisa saber.",
    sections: [
      {
        heading: "Ideal para família, firma e amigos à distância",
        paragraphs: [
          "Parentes em outras cidades, colegas em home office ou a turma que nunca consegue se reunir antes da festa: todo mundo entra pelo mesmo link e confirma a participação quando puder.",
          "O organizador acompanha quem já confirmou e quem ainda falta, e pode mandar um lembrete pronto pelo WhatsApp.",
        ],
      },
      {
        heading: "O segredo continua secreto",
        paragraphs: [
          "Cada participante recebe um link privado e só consegue ver o próprio resultado. Nem o organizador tem acesso à lista de pares, e os resultados ficam guardados de forma cifrada.",
        ],
      },
      {
        heading: "Mais que um sorteio",
        paragraphs: ["Depois do sorteio, o grupo ainda conta com recursos que facilitam a troca de presentes:"],
        bullets: [
          "Lista de desejos opcional, visível só para quem te tirou",
          "Mensagens anônimas para o seu amigo secreto",
          "Mural do grupo para combinar a festa",
          "Regras como \"casais não se tiram\"",
        ],
      },
    ],
    faq: [
      { q: "Preciso baixar algum aplicativo?", a: "Não. Tudo funciona no navegador do celular ou do computador — basta abrir o link." },
      { q: "Os participantes precisam de e-mail ou cadastro?", a: "Não. Cada pessoa entra só com o nome e cria um PIN para recuperar o acesso se perder o link." },
      { q: "Dá para fazer com pessoas em cidades diferentes?", a: "Sim. Cada um entra pelo link quando puder; não é preciso estar junto na hora do sorteio." },
      { q: "Quantas pessoas podem participar?", a: "A partir de 3 pessoas. A versão grátis aceita até 50 participantes por grupo." },
    ],
  },
  {
    slug: "sorteio-amigo-secreto",
    keyword: "sorteio de amigo secreto",
    title: "Sorteio de Amigo Secreto justo e sem repetição",
    description:
      "Sorteio de amigo secreto que nunca deixa alguém tirar a si mesmo, respeita exclusões (como casais) e só conclui se houver combinação válida.",
    h1: "Sorteio de amigo secreto sem erro",
    intro:
      "Um bom sorteio de amigo secreto precisa de três garantias: ninguém tira a si mesmo, todo mundo tira exatamente uma pessoa e todo mundo é tirado exatamente uma vez. Aqui, essas regras são verificadas antes de qualquer resultado ser salvo.",
    sections: [
      {
        heading: "Como o sorteio funciona",
        paragraphs: [
          "Participam do sorteio apenas as pessoas que confirmaram presença. O sistema gera uma combinação aleatória e confere, par a par, se todas as regras foram respeitadas. Só então o resultado é gravado — de uma vez só, nunca pela metade.",
        ],
      },
      {
        heading: "Exclusões: quem não pode tirar quem",
        paragraphs: [
          "Quer evitar que marido e mulher se tirem, ou que irmãos troquem presentes entre si? O organizador cadastra exclusões antes do sorteio, em um sentido ou nos dois.",
          "Se as regras deixarem o sorteio impossível, você é avisado na hora, com a mensagem clara de que é preciso remover ou alterar alguma exclusão — e nada é sorteado.",
        ],
      },
      {
        heading: "Precisa refazer?",
        paragraphs: [
          "O organizador pode refazer o sorteio depois de uma confirmação. O resultado anterior é invalidado por completo, e cada pessoa passa a ver apenas o novo resultado.",
        ],
      },
    ],
    faq: [
      { q: "Alguém pode tirar o próprio nome?", a: "Não. O sorteio é validado antes de ser salvo e nunca permite que alguém tire a si mesmo." },
      { q: "O sorteio é realmente aleatório?", a: "Sim. Usamos um gerador de números aleatórios criptograficamente seguro, e todas as combinações válidas têm a mesma chance." },
      { q: "E se ninguém puder tirar determinada pessoa por causa das exclusões?", a: "O sistema detecta que não existe combinação possível e avisa antes de sortear, sem gravar nada." },
      { q: "O organizador consegue ver quem tirou quem?", a: "Não. O organizador vê apenas quantas pessoas já viram o resultado, nunca os pares." },
    ],
  },
  {
    slug: "amigo-secreto-gratis",
    keyword: "amigo secreto grátis",
    title: "Amigo Secreto Grátis: crie o seu sem pagar nada",
    description:
      "Organize seu amigo secreto grátis: sorteio, convite pelo WhatsApp, lista de desejos e mensagens anônimas. Sem cadastro e sem cartão de crédito.",
    h1: "Amigo secreto grátis, completo e sem cadastro",
    intro:
      "Organizar o amigo secreto não precisa custar nada. Você cria o grupo, convida quem quiser e faz o sorteio sem informar cartão de crédito e sem criar conta.",
    sections: [
      {
        heading: "O que está incluído de graça",
        paragraphs: ["Tudo o que um amigo secreto precisa:"],
        bullets: [
          "Sorteio automático com exclusões",
          "Convite e lembretes pelo WhatsApp",
          "Lista de desejos opcional para cada participante",
          "Mensagens anônimas entre amigos secretos",
          "Mural do grupo",
          "Até 50 participantes por grupo",
        ],
      },
      {
        heading: "Como mantemos o site grátis",
        paragraphs: [
          "O site exibe um anúncio discreto em algumas páginas públicas. Páginas com informações privadas — como o seu resultado e o seu link — nunca têm anúncios.",
        ],
      },
      {
        heading: "Sem cadastro, com segurança",
        paragraphs: [
          "Em vez de e-mail e senha, cada participante recebe um link privado e cria um PIN de 6 números para recuperar o acesso caso troque de celular.",
        ],
      },
    ],
    faq: [
      { q: "É grátis mesmo?", a: "Sim. Criar o grupo, convidar, sortear e usar a lista de desejos e as mensagens não custa nada." },
      { q: "Preciso colocar cartão de crédito?", a: "Não. Não pedimos nenhum dado de pagamento." },
      { q: "Existe limite de participantes?", a: "Na versão grátis, até 50 pessoas por grupo — suficiente para a maioria das famílias e empresas." },
      { q: "Meus dados são vendidos?", a: "Não. Guardamos apenas o necessário para o sorteio funcionar; contatos são opcionais e não aparecem para o grupo." },
    ],
  },
  {
    slug: "sorteador-amigo-secreto",
    keyword: "sorteador de amigo secreto",
    title: "Sorteador de Amigo Secreto online e automático",
    description:
      "Sorteador de amigo secreto automático: cadastre os participantes pelo link, defina exclusões e sorteie com um toque. Resultado individual e secreto.",
    h1: "Sorteador de amigo secreto automático",
    intro:
      "Um sorteador de amigo secreto resolve o trabalho chato: embaralhar os nomes, conferir se ninguém tirou a si mesmo e avisar cada pessoa sem que o resto do grupo descubra. Aqui tudo isso acontece automaticamente.",
    sections: [
      {
        heading: "Os próprios participantes se cadastram",
        paragraphs: [
          "Em vez de digitar nome por nome, o organizador envia um link e cada pessoa entra com o próprio nome. O sorteador evita nomes repetidos, mesmo com diferença de acentos ou letras maiúsculas.",
        ],
      },
      {
        heading: "Sorteio em um toque",
        paragraphs: [
          "Quando todos confirmarem, basta tocar em \"Realizar sorteio\". O painel mostra antes se falta alguém confirmar e se as exclusões permitem o sorteio.",
        ],
      },
      {
        heading: "Resultado entregue a cada pessoa",
        paragraphs: [
          "Ninguém precisa mandar mensagem individual para avisar os pares: cada participante abre o próprio link e toca em \"Revelar\" quando estiver sozinho.",
        ],
      },
    ],
    faq: [
      { q: "Posso sortear sem que todos estejam presentes?", a: "Sim. Cada pessoa vê o resultado no próprio celular, quando quiser." },
      { q: "Quem não confirmou entra no sorteio?", a: "Não. Apenas participantes confirmados são sorteados; o painel avisa quem ainda falta." },
      { q: "Dá para impedir que duas pessoas se tirem?", a: "Sim, com as exclusões — por exemplo, para casais ou irmãos." },
      { q: "E se alguém sair do grupo depois do sorteio?", a: "O organizador pode reabrir o grupo, ajustar os participantes e sortear novamente." },
    ],
  },
  {
    slug: "amigo-secreto-com-lista-de-desejos",
    keyword: "amigo secreto com lista de desejos",
    title: "Amigo Secreto com Lista de Desejos: acerte no presente",
    description:
      "Amigo secreto com lista de desejos: cada pessoa indica produtos, preços e links, e só quem a tirou vê. Mais fácil acertar no presente.",
    h1: "Amigo secreto com lista de desejos",
    intro:
      "Nada de presente que vai direto para o fundo do armário. Com a lista de desejos, cada participante indica o que gostaria de ganhar — e só quem o tirou consegue ver.",
    sections: [
      {
        heading: "O que dá para colocar na lista",
        paragraphs: ["Cada desejo pode ter:"],
        bullets: [
          "Nome do produto",
          "Preço aproximado",
          "Link da loja",
          "Detalhes como tamanho, cor ou modelo",
          "Uma observação (\"qualquer cor, menos rosa\")",
        ],
      },
      {
        heading: "Privada até o sorteio",
        paragraphs: [
          "Antes do sorteio, só você vê a sua lista. Depois, apenas a pessoa que te tirou tem acesso — o restante do grupo não vê seus desejos.",
          "A lista é opcional: quem preferir surpresa pode deixar em branco.",
        ],
      },
      {
        heading: "Ficou em dúvida? Pergunte em segredo",
        paragraphs: [
          "Se a lista estiver vazia, você pode mandar uma mensagem anônima para o seu amigo secreto — ele responde sem saber quem perguntou.",
        ],
      },
    ],
    faq: [
      { q: "Todo mundo vê a minha lista de desejos?", a: "Não. Só a pessoa que te tirou, e apenas depois do sorteio." },
      { q: "A lista é obrigatória?", a: "Não. É opcional; quem não quiser pode deixar em branco." },
      { q: "Posso mudar a lista depois do sorteio?", a: "Sim. Você pode adicionar ou remover desejos a qualquer momento." },
      { q: "Posso colocar links de lojas?", a: "Sim. Os links aparecem com o nome do site, para quem te tirou saber para onde está indo." },
    ],
  },
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.slug === slug);
}

/** JSON-LD seguro para embutir em <script> (escapa "<" contra quebra de tag). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
