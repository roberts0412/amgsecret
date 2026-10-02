/**
 * Páginas de ideias de presente por faixa de preço (SEO + links de afiliado).
 * As ideias apontam para BUSCAS na Amazon (com limite de preço), não para
 * produtos específicos: buscas não saem de linha nem mudam de preço.
 * Mesmas regras das páginas de SEO: título ≤ 60, descrição 110–160.
 */

export interface GiftIdea {
  name: string;
  /** Por que é um bom presente (uma frase). */
  note: string;
  /** Termo buscado na Amazon. */
  query: string;
}

export interface GiftGroup {
  heading: string;
  ideas: GiftIdea[];
}

export interface GiftPage {
  slug: string;
  maxReais: number;
  keyword: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  groups: GiftGroup[];
  faq: { q: string; a: string }[];
}

const funny: GiftGroup = {
  heading: "Para o amigo da onça 🐆",
  ideas: [
    { name: "Meias com estampa engraçada", note: "Garantia de risada na hora de abrir.", query: "meias divertidas estampa engraçada" },
    { name: "Caneca com frase divertida", note: "Engraçada e ainda útil no dia a dia.", query: "caneca frase engraçada" },
    { name: "Almofada de pum", note: "Clássico do presente de brincadeira.", query: "almofada pum" },
  ],
};

export const GIFT_PAGES: readonly GiftPage[] = [
  {
    slug: "ate-30-reais",
    maxReais: 30,
    keyword: "presente de amigo secreto até 30 reais",
    title: "Presente de amigo secreto até 30 reais: 14 ideias",
    description:
      "Ideias de presente de amigo secreto até 30 reais: lembrancinhas úteis, gostosas e divertidas, com links para comparar preços. Inclui opções de amigo da onça.",
    h1: "Presente de amigo secreto até 30 reais",
    intro:
      "Valor baixo não precisa virar presente sem graça. Separamos ideias que cabem em até R$ 30 e mostram que você pensou na pessoa.",
    groups: [
      {
        heading: "Úteis no dia a dia",
        ideas: [
          { name: "Garrafinha de água", note: "Todo mundo usa, no trabalho ou na academia.", query: "garrafa de água reutilizável" },
          { name: "Suporte de celular de mesa", note: "Prático para vídeo e receitas na cozinha.", query: "suporte celular mesa" },
          { name: "Caderno ou bloco de anotações", note: "Bonito e sempre bem-vindo.", query: "caderno capa dura" },
          { name: "Luminária LED pequena", note: "Decora e ilumina a mesa de cabeceira.", query: "luminária led pequena" },
        ],
      },
      {
        heading: "Para se cuidar",
        ideas: [
          { name: "Vela aromática", note: "Deixa a casa cheirosa e aconchegante.", query: "vela aromática" },
          { name: "Kit de hidratante para mãos", note: "Agrada quase todo mundo.", query: "kit hidratante mãos" },
          { name: "Máscara de dormir", note: "Para quem ama um cochilo.", query: "máscara de dormir" },
        ],
      },
      {
        heading: "Gostosos 🍫",
        ideas: [
          { name: "Chocolate gourmet", note: "Presente que nunca erra.", query: "chocolate gourmet" },
          { name: "Caixa de bombons", note: "Ótimo também para o amigo chocolate.", query: "caixa de bombons" },
        ],
      },
      {
        heading: "Divertidos",
        ideas: [
          { name: "Jogo de cartas rápido", note: "Para animar a família depois da ceia.", query: "jogo de cartas" },
          { name: "Quebra-cabeça", note: "Passatempo para todas as idades.", query: "quebra-cabeça 500 peças" },
        ],
      },
      funny,
    ],
    faq: [
      { q: "Dá para dar um bom presente com 30 reais?", a: "Sim. Itens úteis, chocolates e lembrancinhas de cuidado pessoal cabem nesse valor e costumam agradar." },
      { q: "Como saber o que a pessoa quer?", a: "No Amigo Secreto Fácil, cada participante pode montar uma lista de desejos, que só quem a tirou consegue ver." },
      { q: "E se eu não conhecer bem a pessoa?", a: "Prefira itens úteis e neutros, como garrafinha, caderno ou chocolate. Ou pergunte em segredo pela mensagem anônima." },
    ],
  },
  {
    slug: "ate-50-reais",
    maxReais: 50,
    keyword: "presente de amigo secreto até 50 reais",
    title: "Presente de amigo secreto até 50 reais: 16 ideias",
    description:
      "Veja ideias de presente de amigo secreto até 50 reais para família, trabalho e amigos: úteis, criativas e gostosas, com links para comparar preços.",
    h1: "Presente de amigo secreto até 50 reais",
    intro:
      "R$ 50 é o valor mais comum no amigo secreto, e dá para acertar bonito. Veja ideias para todos os gostos, do prático ao divertido.",
    groups: [
      {
        heading: "Úteis e práticos",
        ideas: [
          { name: "Garrafa térmica", note: "Mantém café ou água na temperatura certa.", query: "garrafa térmica" },
          { name: "Copo térmico com tampa", note: "Queridinho de quem trabalha fora.", query: "copo térmico com tampa" },
          { name: "Organizador de mesa", note: "Para quem vive com a mesa bagunçada.", query: "organizador de mesa escritório" },
          { name: "Mousepad grande", note: "Útil para quem trabalha no computador.", query: "mousepad grande" },
        ],
      },
      {
        heading: "Para se cuidar",
        ideas: [
          { name: "Kit de skincare", note: "Um mimo de autocuidado.", query: "kit skincare" },
          { name: "Difusor de aromas", note: "Deixa a casa cheirosa por semanas.", query: "difusor de aromas varetas" },
          { name: "Pantufa", note: "Conforto garantido no fim de ano.", query: "pantufa" },
        ],
      },
      {
        heading: "Cozinha e bebidas",
        ideas: [
          { name: "Kit de churrasco", note: "Para o churrasqueiro da família.", query: "kit churrasco" },
          { name: "Conjunto de taças", note: "Bonito para receber visitas.", query: "conjunto taças" },
          { name: "Avental divertido", note: "Útil e engraçado ao mesmo tempo.", query: "avental divertido" },
        ],
      },
      {
        heading: "Diversão e leitura",
        ideas: [
          { name: "Livro mais vendido", note: "Escolha pelo gosto da pessoa.", query: "livros mais vendidos" },
          { name: "Jogo de tabuleiro rápido", note: "Garante a diversão da turma.", query: "jogo de tabuleiro" },
          { name: "Fone de ouvido com fio", note: "Sempre faz falta um reserva.", query: "fone de ouvido" },
        ],
      },
      funny,
    ],
    faq: [
      { q: "O que dar de amigo secreto de 50 reais para homem?", a: "Kit de churrasco, garrafa térmica, copo térmico e jogos costumam agradar. A lista de desejos tira a dúvida." },
      { q: "E para mulher?", a: "Kits de skincare, difusor de aromas, livros e pantufas são escolhas populares. Mas cada pessoa é única: consulte a lista de desejos." },
      { q: "Como combinar o valor com o grupo?", a: "Ao criar o grupo no Amigo Secreto Fácil, informe o valor do presente. Ele aparece no convite e na página do grupo." },
    ],
  },
  {
    slug: "ate-100-reais",
    maxReais: 100,
    keyword: "presente de amigo secreto até 100 reais",
    title: "Presente de amigo secreto até 100 reais: 15 ideias",
    description:
      "Ideias de presente de amigo secreto até 100 reais: tecnologia, casa, bem-estar e diversão. Compare preços e acerte no presente da família ou da firma.",
    h1: "Presente de amigo secreto até 100 reais",
    intro:
      "Com até R$ 100 dá para entrar em presentes mais especiais, como pequenos eletrônicos e kits caprichados. Veja as ideias.",
    groups: [
      {
        heading: "Tecnologia",
        ideas: [
          { name: "Fone de ouvido Bluetooth", note: "Liberdade sem fios no dia a dia.", query: "fone de ouvido bluetooth" },
          { name: "Carregador portátil (power bank)", note: "Salva o dia de quem vive sem bateria.", query: "carregador portátil power bank" },
          { name: "Caixa de som Bluetooth", note: "Música em qualquer lugar.", query: "caixa de som bluetooth" },
          { name: "Luminária de mesa LED", note: "Ótima para estudar e trabalhar.", query: "luminária de mesa led" },
        ],
      },
      {
        heading: "Casa e cozinha",
        ideas: [
          { name: "Cafeteira manual", note: "Para quem leva o café a sério.", query: "cafeteira manual" },
          { name: "Jogo de facas", note: "Útil para quem ama cozinhar.", query: "jogo de facas cozinha" },
          { name: "Manta de sofá", note: "Aconchego para os dias frios.", query: "manta sofá" },
        ],
      },
      {
        heading: "Bem-estar",
        ideas: [
          { name: "Kit de perfumaria", note: "Presente caprichado e cheiroso.", query: "kit body splash" },
          { name: "Massageador portátil", note: "Alívio depois de um dia cansativo.", query: "massageador portátil" },
        ],
      },
      {
        heading: "Diversão",
        ideas: [
          { name: "Jogo de tabuleiro para família", note: "Horas de diversão com todo mundo.", query: "jogo de tabuleiro família" },
          { name: "Kit de vinho", note: "Para quem gosta de uma taça no fim de semana.", query: "kit vinho presente" },
          { name: "Mochila", note: "Útil para trabalho, escola e viagem.", query: "mochila" },
        ],
      },
      funny,
    ],
    faq: [
      { q: "100 reais é muito para amigo secreto?", a: "Depende do grupo. Na firma, R$ 50 é mais comum; em família, R$ 100 aparece bastante. O importante é todos combinarem o mesmo valor." },
      { q: "Vale dar dinheiro ou vale-presente?", a: "Funciona, mas perde a surpresa. A lista de desejos ajuda a escolher algo que a pessoa realmente quer." },
      { q: "Como evitar presentes repetidos?", a: "Cada pessoa tira só um amigo, e a lista de desejos é vista apenas por quem a tirou, então dificilmente dois presentes se repetem." },
    ],
  },
];

export function getGiftPage(slug: string): GiftPage | undefined {
  return GIFT_PAGES.find((p) => p.slug === slug);
}

export const GIFT_HUB = {
  path: "/ideias-de-presente",
  title: "Ideias de presente de amigo secreto por valor",
  description:
    "Ideias de presente de amigo secreto até 30, 50 e 100 reais: úteis, gostosas, divertidas e para o amigo da onça. Compare preços e acerte no presente.",
  h1: "Ideias de presente de amigo secreto",
};
