/**
 * Guias (artigos) do site: conteúdo editorial original para quem está
 * organizando a brincadeira. Cada guia responde uma dúvida real, com texto
 * próprio — não é variação de palavra-chave das páginas de SEO.
 * Regras: título ≤ 60 caracteres, descrição 110–160, slug em kebab-case.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  h1: string;
  /** Resumo curto mostrado na lista de guias. */
  summary: string;
  intro: string;
  /** Data da publicação/última revisão (AAAA-MM-DD). */
  updated: string;
  emoji: string;
  sections: GuideSection[];
}

export const GUIDES_HUB = {
  path: "/guias",
  title: "Guias de amigo secreto: dicas, regras e brincadeiras",
  description:
    "Guias práticos para organizar amigo secreto, amigo oculto e amigo da onça: regras, ideias de revelação, dicas para firma, família e grupos à distância.",
  h1: "Guias para organizar o seu amigo secreto",
};

export const GUIDES: readonly Guide[] = [
  {
    slug: "como-organizar-amigo-secreto",
    title: "Como organizar amigo secreto: passo a passo completo",
    description:
      "Do convite ao dia da troca: um passo a passo para organizar amigo secreto sem estresse, com data, valor, regras, sorteio e lembretes para o grupo.",
    h1: "Como organizar um amigo secreto, do convite à troca",
    summary: "O roteiro completo para quem ficou com a missão de organizar a brincadeira.",
    intro:
      "Todo grupo tem aquela pessoa que acaba organizando o amigo secreto. Se este ano é você, calma: dá para fazer tudo em poucos passos e sem virar o chato do grupo cobrando todo mundo. Este guia junta o que costuma dar certo (e o que costuma dar errado) em cada etapa.",
    updated: "2026-10-13",
    emoji: "🗓️",
    sections: [
      {
        heading: "1. Defina a data da troca antes de tudo",
        paragraphs: [
          "A data é o que mais muda a quantidade de gente que participa. Antes de abrir o convite, pergunte rapidamente no grupo quais dias funcionam. Em dezembro a agenda lota rápido: confraternização da firma, festa da escola, viagem de fim de ano.",
          "Uma regra simples: marque a troca com pelo menos duas semanas de antecedência e faça o sorteio logo depois de fechar a lista. Assim cada pessoa tem tempo de pensar no presente sem correria e sem comprar qualquer coisa na véspera.",
        ],
      },
      {
        heading: "2. Combine o valor do presente",
        paragraphs: [
          "Valor combinado evita a situação desconfortável de alguém dar um presente caro e receber uma lembrancinha. O ideal é escolher uma faixa que caiba no bolso de todo mundo do grupo, e não só da maioria.",
          "Alguns grupos preferem um valor exato (por exemplo, R$ 50); outros, um teto (até R$ 50). O teto costuma funcionar melhor, porque dá liberdade para quem encontrou algo legal por menos.",
        ],
        bullets: [
          "Grupos de trabalho: de R$ 30 a R$ 80 costuma agradar a todos",
          "Família: depende muito, mas vale perguntar antes em vez de supor",
          "Escola e turma de amigos mais jovens: até R$ 30 ou até R$ 50",
          "Amigo da onça: valor baixo, porque a graça está na criatividade",
        ],
      },
      {
        heading: "3. Monte a lista de participantes",
        paragraphs: [
          "Mande o convite com um prazo para confirmar (“quem topa responde até sexta”). Prazo claro evita aquela pessoa que só decide participar depois do sorteio feito.",
          "Se você usa um sorteador online, cada pessoa entra pelo link com o próprio nome, então você não precisa ficar digitando a lista nem corrigindo nome errado.",
        ],
      },
      {
        heading: "4. Pense nas exceções antes do sorteio",
        paragraphs: [
          "Casais que já vão se presentear, irmãos que moram juntos, pais e filhos pequenos: muitos grupos preferem que essas pessoas não se tirem. Decida isso antes de sortear. Mudar a regra depois que alguém já viu o resultado obriga a refazer tudo.",
        ],
      },
      {
        heading: "5. Faça o sorteio",
        paragraphs: [
          "No papelzinho, sempre aparece alguém que tirou o próprio nome, e aí é preciso juntar todo mundo de novo. Com o sorteio online, o sistema garante que ninguém tira a si mesmo e respeita as exceções que você cadastrou.",
          "O ponto mais importante é que cada pessoa veja só o próprio resultado. Se o organizador também participa, é melhor que nem ele consiga ver os pares, para que a brincadeira seja justa para todos.",
        ],
      },
      {
        heading: "6. Incentive a lista de desejos",
        paragraphs: [
          "A lista de desejos é o que separa um presente certeiro de um presente que vai para o fundo do armário. Não precisa ser uma lista de compras: duas ou três ideias, com tamanho ou cor quando fizer diferença, já ajudam muito.",
          "Quem prefere surpresa pode deixar em branco. Nesse caso, uma pergunta anônima (“você prefere algo útil ou algo divertido?”) costuma resolver.",
        ],
      },
      {
        heading: "7. Lembre o grupo perto da data",
        paragraphs: [
          "Uma semana antes, mande um lembrete com data, horário, local e valor. Na véspera, outro mais curto. Parece exagero, mas quase sempre tem alguém que esqueceu de comprar o presente.",
        ],
      },
      {
        heading: "8. No dia: deixe a revelação divertida",
        paragraphs: [
          "A revelação é o momento mais esperado. Em vez de simplesmente entregar o presente, cada pessoa pode descrever quem tirou sem dizer o nome, e o grupo tenta adivinhar. Temos um guia só com ideias de brincadeiras para esse momento.",
        ],
      },
    ],
  },
  {
    slug: "regras-do-amigo-secreto",
    title: "Regras do amigo secreto: o que combinar com o grupo",
    description:
      "As regras do amigo secreto que evitam confusão: valor, prazo, quem pode tirar quem, o que fazer se alguém desistir e como funciona a revelação na festa.",
    h1: "Regras do amigo secreto que todo grupo deveria combinar",
    summary: "Valor, prazos, desistências e revelação: as regras que evitam briga no fim do ano.",
    intro:
      "Amigo secreto parece simples até alguém perguntar “mas pode dar dinheiro?” ou “e se eu tirar meu marido?”. A maioria das confusões acontece porque cada pessoa imaginou uma regra diferente. Aqui estão as regras mais comuns e o que vale combinar antes do sorteio.",
    updated: "2026-10-13",
    emoji: "📋",
    sections: [
      {
        heading: "A regra básica",
        paragraphs: [
          "Cada participante tira o nome de outra pessoa do grupo e compra um presente para ela. Ninguém pode tirar a si mesmo, todo mundo tira exatamente uma pessoa e todo mundo é tirado exatamente uma vez. Até o dia da troca, ninguém conta quem tirou.",
        ],
      },
      {
        heading: "Valor do presente",
        paragraphs: [
          "Combine um teto e leve a regra a sério. Passar muito do valor deixa quem seguiu a regra sem graça; ficar muito abaixo parece descaso. Se alguém não pode gastar o valor combinado, o melhor é ajustar o valor do grupo inteiro, e não abrir exceção individual.",
        ],
      },
      {
        heading: "Pode dar dinheiro ou vale-presente?",
        paragraphs: [
          "Depende do grupo, então combine. Vale-presente é prático e evita erro de tamanho, mas tira um pouco da graça. Dinheiro em espécie costuma ser mal visto na maioria dos grupos. Uma saída que funciona é permitir vale-presente apenas quando a pessoa sorteada pedir na lista de desejos.",
        ],
      },
      {
        heading: "Quem não pode tirar quem",
        paragraphs: [
          "Casais e pessoas que moram juntas costumam ser exceção, porque já vão trocar presentes de qualquer forma. Em grupos de família, também é comum separar pais e filhos pequenos. O importante é decidir antes: as exceções precisam entrar no sorteio, não ser resolvidas trocando papelzinho escondido depois.",
        ],
      },
      {
        heading: "E se alguém desistir depois do sorteio?",
        paragraphs: [
          "É a situação mais chata, porque quebra a corrente: a pessoa que desistiu deixa alguém sem presente. Existem duas saídas justas:",
        ],
        bullets: [
          "Refazer o sorteio inteiro sem a pessoa, se ainda houver tempo",
          "Quem desistiu continua comprando o presente que devia, mesmo sem participar da festa",
          "Em último caso, o organizador cobre o presente que ficou faltando",
        ],
      },
      {
        heading: "Segredo é segredo",
        paragraphs: [
          "Contar quem tirou estraga a brincadeira para os outros. Se alguém precisar de ajuda para escolher o presente, o caminho é perguntar de forma anônima para a pessoa sorteada ou pedir dica a alguém de fora do grupo.",
        ],
      },
      {
        heading: "Como é a revelação",
        paragraphs: [
          "O formato mais comum é em roda: a primeira pessoa descreve quem tirou, o grupo adivinha, ela entrega o presente, e quem recebeu continua descrevendo quem tirou. Combine também quem começa. Muitos grupos deixam o organizador abrir a roda.",
        ],
      },
      {
        heading: "Um modelo de mensagem com as regras",
        paragraphs: [
          "Copie e adapte para o grupo do WhatsApp: “Amigo secreto da turma! Troca dia 20/12, às 19h, na casa da Ana. Valor até R$ 50. Quem tirou o par não conta pra ninguém. Casais não se tiram. Coloquem a lista de desejos até dia 10. Quem desistir depois do sorteio compra o presente mesmo assim 😄”.",
        ],
      },
    ],
  },
  {
    slug: "amigo-secreto-na-empresa",
    title: "Amigo secreto na empresa: como organizar na firma",
    description:
      "Dicas para organizar o amigo secreto da empresa: valor justo, colegas em home office, presentes neutros, horário da confraternização e como evitar saias justas.",
    h1: "Amigo secreto na empresa: como organizar sem saia justa",
    summary: "Valor justo, colegas remotos e presentes neutros para a confraternização da firma.",
    intro:
      "O amigo secreto da firma tem desafios próprios: gente de áreas diferentes que mal se conhece, salários diferentes, colegas em home office e aquela preocupação de não dar um presente constrangedor para o chefe. Com algumas combinações simples, ele vira um dos momentos mais leves do ano.",
    updated: "2026-10-13",
    emoji: "💼",
    sections: [
      {
        heading: "Participação é opcional",
        paragraphs: [
          "Deixe claro desde o convite que ninguém é obrigado a participar. Tem gente que está com o orçamento apertado, tem gente que não gosta da brincadeira. Uma participação forçada costuma render o pior presente da festa.",
        ],
      },
      {
        heading: "Valor que serve para todos",
        paragraphs: [
          "Numa empresa, o valor precisa caber no bolso de quem ganha menos. Um teto mais baixo deixa todo mundo à vontade e estimula presentes criativos. Se a equipe quiser algo mais caprichado, uma alternativa é a empresa bancar parte do valor.",
        ],
      },
      {
        heading: "Colegas em home office ou em outras cidades",
        paragraphs: [
          "Com equipes espalhadas, o sorteio online resolve: cada um entra pelo link quando puder, sem precisar estar no escritório no dia. Para a troca, há duas opções:",
        ],
        bullets: [
          "Cada pessoa envia o presente pelo correio ou por entrega de loja, direto para o endereço do colega",
          "A revelação acontece numa chamada de vídeo, com todo mundo abrindo o presente junto",
          "Em equipes híbridas, quem está remoto participa da roda pela chamada",
        ],
      },
      {
        heading: "Presentes seguros para colegas",
        paragraphs: [
          "Quando você não conhece bem a pessoa que tirou, prefira coisas úteis e neutras. Bebidas alcoólicas, roupas íntimas, perfumes fortes e presentes com piada sobre aparência ou religião costumam dar errado no ambiente de trabalho.",
        ],
        bullets: [
          "Itens de mesa: organizador, suporte de celular, luminária pequena",
          "Caneca térmica ou garrafa de água",
          "Livro de um tema que a pessoa já comentou",
          "Chocolates ou cafés especiais",
          "Plantas pequenas, como suculentas",
        ],
      },
      {
        heading: "Escolha bem o horário",
        paragraphs: [
          "Confraternização no fim do expediente esvazia rápido, porque tem gente que precisa buscar filho ou pegar condução longe. Se possível, faça a troca no horário do almoço ou no meio da tarde, quando a maioria está presente.",
        ],
      },
      {
        heading: "Lista de desejos ajuda mais do que parece",
        paragraphs: [
          "Na firma, a lista de desejos vale ouro: ninguém precisa ficar puxando assunto para descobrir o que o colega gosta. Peça para cada pessoa colocar pelo menos duas ideias dentro do valor combinado.",
        ],
      },
    ],
  },
  {
    slug: "amigo-secreto-em-familia",
    title: "Amigo secreto em família: dicas para o Natal",
    description:
      "Como organizar o amigo secreto da família no Natal: crianças, avós, parentes que moram longe, casais que não se tiram e um valor que agrade a todos.",
    h1: "Amigo secreto em família: dicas para um Natal sem confusão",
    summary: "Crianças, avós, parentes longe e casais: como fazer a troca da família funcionar.",
    intro:
      "Em família, o amigo secreto resolve um problema real: em vez de cada pessoa comprar um presente para todo mundo, cada uma compra um só, mais caprichado. Mas família junta gerações diferentes, gente que mora longe e casais. Algumas combinações deixam tudo mais fácil.",
    updated: "2026-10-13",
    emoji: "🎄",
    sections: [
      {
        heading: "Defina quem entra",
        paragraphs: [
          "Família grande costuma ter dúvida sobre namorados, cunhados e agregados. Uma regra simples é: quem vai estar na ceia, participa. Se alguém não vai poder ir, mas quer participar, combine como o presente vai chegar.",
        ],
      },
      {
        heading: "Crianças no amigo secreto",
        paragraphs: [
          "Crianças adoram participar, mas presente para criança e presente para adulto são mundos diferentes. Duas formas comuns de resolver:",
        ],
        bullets: [
          "Fazer dois sorteios separados: um só das crianças e outro dos adultos",
          "Fazer um sorteio só, mas pedir que cada criança tenha uma lista de desejos montada com ajuda dos pais",
          "Os pais ajudam a criança a escolher e pagar o presente de quem ela tirou",
        ],
      },
      {
        heading: "Avós e quem não usa muito o celular",
        paragraphs: [
          "Nem todo mundo da família se vira bem com links e aplicativos. Nesse caso, um parente pode entrar no grupo pelo celular junto com a pessoa, ou o organizador pode ajudar no dia do sorteio. O importante é que o resultado continue em segredo.",
        ],
      },
      {
        heading: "Casais e quem mora junto",
        paragraphs: [
          "Casais quase sempre ficam de fora um do outro, já que vão trocar presentes de qualquer jeito. Em algumas famílias, também é comum que pais e filhos que moram na mesma casa não se tirem. Combine isso antes e cadastre como exceção no sorteio.",
        ],
      },
      {
        heading: "Parentes que moram longe",
        paragraphs: [
          "Quem mora em outra cidade pode participar do sorteio normalmente. Se não puder ir à ceia, há duas saídas: mandar o presente pelo correio com antecedência ou entregar a outro parente que vai à festa. Uma chamada de vídeo na hora da revelação também ajuda a matar a saudade.",
        ],
      },
      {
        heading: "Valor que não pesa para ninguém",
        paragraphs: [
          "Em família, a diferença de renda costuma ser maior do que entre amigos. Pergunte o valor em particular para quem você imagina que pode ter mais dificuldade e use isso como referência. Ninguém deveria deixar de participar por causa do preço.",
        ],
      },
      {
        heading: "Uma tradição divertida",
        paragraphs: [
          "Muitas famílias fazem a revelação depois da ceia, com cada um descrevendo quem tirou. Para deixar mais divertido, combine que a descrição precisa ter uma história engraçada ou uma lembrança com a pessoa. É o momento em que surgem as melhores histórias do ano.",
        ],
      },
    ],
  },
  {
    slug: "amigo-secreto-a-distancia",
    title: "Amigo secreto à distância: como fazer online",
    description:
      "Como fazer amigo secreto à distância com amigos ou família em outras cidades: sorteio online, envio do presente, prazos de entrega e revelação por vídeo.",
    h1: "Amigo secreto à distância: como fazer com o grupo longe",
    summary: "Sorteio online, prazos de entrega e revelação por chamada de vídeo.",
    intro:
      "Amigos que se espalharam pelo país, família dividida entre cidades, equipe de trabalho remota: dá, sim, para manter o amigo secreto. A diferença é que o presente precisa viajar, então o planejamento começa um pouco mais cedo.",
    updated: "2026-10-13",
    emoji: "📦",
    sections: [
      {
        heading: "Sorteio sem ninguém junto",
        paragraphs: [
          "No formato à distância, o sorteio precisa ser feito pela internet. Cada participante entra pelo link, confirma presença e, depois do sorteio, vê apenas quem tirou. Ninguém precisa estar online ao mesmo tempo.",
        ],
      },
      {
        heading: "Endereço de entrega",
        paragraphs: [
          "Esse é o ponto que mais trava o amigo secreto à distância. Algumas formas de resolver sem expor o endereço de todo mundo no grupo:",
        ],
        bullets: [
          "Cada pessoa coloca o endereço na própria lista de desejos, que só quem a tirou vê",
          "Quem tirou a pessoa pede o endereço por mensagem anônima",
          "Comprar em loja online e mandar entregar direto no endereço do sorteado",
        ],
      },
      {
        heading: "Comece mais cedo",
        paragraphs: [
          "Entregas atrasam muito em dezembro. Faça o sorteio com pelo menos quatro semanas de antecedência e combine uma data limite para o envio, alguns dias antes da revelação. Assim ninguém fica sem presente na hora da chamada.",
        ],
      },
      {
        heading: "Como fazer a revelação por vídeo",
        paragraphs: [
          "Marque uma chamada de vídeo e peça que ninguém abra o presente antes. Na chamada, a roda funciona como na festa: a pessoa descreve quem tirou, o grupo adivinha e quem foi revelado abre o presente ao vivo.",
          "Dica: peça para cada pessoa colocar um bilhete dentro do pacote sem assinar. Quem recebe lê em voz alta e o grupo tenta adivinhar quem escreveu.",
        ],
      },
      {
        heading: "Presentes que viajam bem",
        paragraphs: [
          "Prefira itens que não quebram e não estragam: livros, acessórios, itens de papelaria, jogos de cartas e camisetas. Chocolates funcionam bem no inverno, mas no calor do fim do ano brasileiro podem chegar derretidos. Melhor evitar.",
        ],
      },
      {
        heading: "Frete entra no valor?",
        paragraphs: [
          "Combine isso antes, porque o frete pode ser quase o preço do presente. A regra mais comum é: o valor combinado é só do presente, e cada um paga o próprio envio. Se o frete pesar para alguém, o grupo pode baixar o valor do presente para compensar.",
          "Comprar em lojas online com frete grátis ou retirada perto da casa do sorteado também ajuda a manter o custo igual para todos.",
        ],
      },
      {
        heading: "Formato híbrido: parte junto, parte longe",
        paragraphs: [
          "Quando a maioria vai estar na mesma festa e só alguns estão longe, dá para misturar. Quem está longe manda o presente para alguém da festa entregar, e entra por vídeo na hora da roda. Combine quem vai segurar o celular, para que a pessoa remota veja o grupo e não só o teto da sala.",
        ],
      },
    ],
  },
  {
    slug: "brincadeiras-para-revelar-amigo-secreto",
    title: "8 brincadeiras para revelar o amigo secreto",
    description:
      "Ideias de brincadeiras para a hora da revelação do amigo secreto: mímica, charadas, desenho, música, perguntas de sim ou não e outras dinâmicas para a festa.",
    h1: "Brincadeiras para a hora de revelar o amigo secreto",
    summary: "Mímica, charadas, desenho e outras dinâmicas para animar a revelação.",
    intro:
      "A revelação é o ponto alto do amigo secreto. A forma clássica, descrever a pessoa até o grupo adivinhar, funciona bem, mas dá para variar. Aqui estão algumas dinâmicas para deixar a festa mais animada, das mais tranquilas às mais barulhentas.",
    updated: "2026-10-13",
    emoji: "🎉",
    sections: [
      {
        heading: "1. A descrição clássica",
        paragraphs: [
          "Quem vai revelar fala qualidades, manias e lembranças da pessoa que tirou, sem dizer o nome nem citar algo óbvio demais logo de cara. O grupo vai chutando até acertar. Funciona em qualquer grupo e não precisa de preparação.",
        ],
      },
      {
        heading: "2. Mímica",
        paragraphs: [
          "Sem falar nada, a pessoa imita um jeito, uma mania ou uma frase típica de quem tirou. É a dinâmica que mais rende risada, principalmente em grupos de amigos e de trabalho que se conhecem bem.",
        ],
      },
      {
        heading: "3. Desenho rápido",
        paragraphs: [
          "Com papel e caneta, a pessoa tem um minuto para desenhar quem tirou. Quanto pior o desenho, melhor a brincadeira. Funciona muito bem com crianças.",
        ],
      },
      {
        heading: "4. Perguntas de sim ou não",
        paragraphs: [
          "O grupo faz perguntas (“é homem?”, “usa óculos?”, “chegou atrasado hoje?”) e quem vai revelar só pode responder sim ou não. Ganha quem acertar com menos perguntas.",
        ],
      },
      {
        heading: "5. A música da pessoa",
        paragraphs: [
          "A pessoa toca no celular um trecho de uma música que lembra quem tirou: a que ela vive cantando, a do time dela, a de uma viagem que fizeram juntos. O grupo tenta adivinhar pela música.",
        ],
      },
      {
        heading: "6. Charada em três pistas",
        paragraphs: [
          "Três pistas, da mais difícil para a mais fácil. Se o grupo acertar já na primeira, ponto para quem adivinhou. Dá um tom de competição que anima grupos grandes.",
        ],
      },
      {
        heading: "7. Bilhete anônimo",
        paragraphs: [
          "Antes da festa, cada pessoa escreve um bilhete para quem tirou, sem assinar. Na revelação, os bilhetes são lidos em voz alta e o grupo tenta adivinhar quem escreveu para quem.",
        ],
      },
      {
        heading: "8. Amigo da onça: o presente fala por si",
        paragraphs: [
          "No amigo da onça, a revelação pode ser ao contrário: a pessoa entrega primeiro o presente engraçado, ainda embrulhado, e o grupo tenta descobrir para quem é só pelo formato do pacote.",
        ],
      },
      {
        heading: "Dica para não perder o ritmo",
        paragraphs: [
          "Em grupos grandes, a revelação pode demorar. Combine um tempo máximo por pessoa e, se o grupo não acertar em dois minutos, quem está revelando pode dar uma pista bem óbvia.",
        ],
      },
    ],
  },
  {
    slug: "como-descrever-seu-amigo-secreto",
    title: "Como descrever seu amigo secreto na revelação",
    description:
      "Dicas para descrever seu amigo secreto na revelação: como montar a descrição, o que evitar, exemplos de frases e como deixar o grupo curioso até o fim.",
    h1: "Como descrever o seu amigo secreto (sem entregar logo de cara)",
    summary: "Como montar uma boa descrição, com exemplos e o que evitar.",
    intro:
      "Muita gente trava na hora de descrever quem tirou: ou entrega o nome na primeira frase, ou fica tão vago que ninguém acerta. Uma boa descrição é como uma história curta: começa difícil e vai ficando mais fácil. Veja como montar a sua.",
    updated: "2026-10-13",
    emoji: "🗣️",
    sections: [
      {
        heading: "Comece pelo que poucas pessoas sabem",
        paragraphs: [
          "Abra com algo verdadeiro, mas pouco óbvio: um gosto, um hábito ou um talento escondido. Isso deixa o grupo curioso e faz todo mundo pensar em várias pessoas ao mesmo tempo.",
        ],
      },
      {
        heading: "Depois, uma qualidade",
        paragraphs: [
          "A revelação também é um momento de carinho. Fale de algo que você admira na pessoa: a paciência, o bom humor, a disposição para ajudar. Muita gente guarda essas palavras por mais tempo do que o próprio presente.",
        ],
      },
      {
        heading: "Termine com uma pista clara",
        paragraphs: [
          "Se ninguém acertou ainda, feche com algo que todo mundo reconhece: uma frase típica, a cor preferida, o lugar onde ela senta no escritório. Assim a revelação não se arrasta.",
        ],
      },
      {
        heading: "Exemplos de frases",
        paragraphs: ["Algumas frases para adaptar à pessoa que você tirou:"],
        bullets: [
          "“A pessoa que eu tirei acorda cedo até no domingo e não entende quem dorme até tarde.”",
          "“É aquela pessoa que sempre lembra do aniversário de todo mundo.”",
          "“Se tiver café na mesa, essa pessoa já chegou antes de você.”",
          "“Tem uma risada que dá para ouvir de outra sala.”",
          "“É a primeira a mandar mensagem quando alguém precisa de ajuda.”",
        ],
      },
      {
        heading: "O que evitar",
        paragraphs: [
          "Evite comentários sobre peso, aparência, dinheiro ou assuntos que a pessoa não gostaria de ver expostos na frente do grupo. A piada só funciona quando quem é descrito também acha graça. Na dúvida, prefira uma lembrança boa a uma zoeira.",
        ],
      },
      {
        heading: "Se você não conhece bem a pessoa",
        paragraphs: [
          "No amigo secreto da firma, é comum tirar alguém com quem você quase não conversa. Nesse caso, observe nas semanas antes da festa: o que a pessoa leva para o almoço, como ela se veste, o que ela comenta nas reuniões. A lista de desejos também dá boas pistas para a descrição.",
        ],
      },
      {
        heading: "Um roteiro pronto para usar",
        paragraphs: [
          "Se der branco na hora, siga este roteiro de quatro frases: um hábito pouco conhecido, uma qualidade, uma lembrança com a pessoa e, por fim, uma pista óbvia. Por exemplo: “A pessoa que eu tirei faz palavras cruzadas escondida no intervalo. É a pessoa mais paciente que eu conheço. Ano passado me salvou quando meu computador travou antes de uma apresentação. E ela está usando vermelho hoje.”",
          "Escreva as frases no celular antes da festa. Na hora da roda, com todo mundo olhando, é comum esquecer o que ia dizer.",
        ],
      },
    ],
  },
  {
    slug: "regras-do-amigo-da-onca",
    title: "Amigo da onça: regras e ideias de presente engraçado",
    description:
      "Como funciona o amigo da onça: regras para a brincadeira ser divertida sem ofender ninguém, ideias de presentes engraçados e baratos e como organizar a troca.",
    h1: "Amigo da onça: regras e ideias para a brincadeira dar certo",
    summary: "Presentes engraçados sem ofender ninguém: regras e ideias baratas.",
    intro:
      "No amigo da onça, a graça não está no presente caro, e sim na risada de quem abre o pacote. A brincadeira é uma das mais divertidas do fim do ano, mas precisa de alguns limites para ninguém sair chateado. Aqui vão as regras mais comuns e boas ideias de presente.",
    updated: "2026-10-13",
    emoji: "🐆",
    sections: [
      {
        heading: "Como funciona",
        paragraphs: [
          "O sorteio é igual ao do amigo secreto: cada pessoa tira alguém e compra um presente. A diferença é o tipo de presente: algo engraçado, inútil, inesperado ou propositalmente brega. Em muitos grupos, o valor é bem baixo, de R$ 10 a R$ 30.",
        ],
      },
      {
        heading: "Regras para ninguém sair chateado",
        paragraphs: ["A brincadeira só é boa quando todo mundo ri junto. Combine antes:"],
        bullets: [
          "Nada de piadas com aparência, peso, idade ou religião",
          "Nada que constranja a pessoa na frente da família ou dos colegas",
          "Nada que estrague, suje ou possa machucar",
          "Se o grupo tem crianças, os presentes precisam ser adequados para elas",
          "O valor combinado vale para todos, mesmo sendo brincadeira",
        ],
      },
      {
        heading: "Ideias de presentes engraçados",
        paragraphs: ["Clássicos que quase sempre funcionam:"],
        bullets: [
          "Meias com estampas absurdas",
          "Caneca com uma frase que tem tudo a ver com a pessoa",
          "Almofada de pum",
          "Um troféu de “melhor desculpa para chegar atrasado”",
          "Um kit de sobrevivência para segunda-feira",
          "Um pacote enorme com um presente minúsculo dentro",
        ],
      },
      {
        heading: "A embalagem é metade da graça",
        paragraphs: [
          "Caixas dentro de caixas, muito papel e muita fita deixam o momento de abrir ainda mais engraçado. Uma caixa de eletrodoméstico com um par de meias dentro sempre rende risada.",
        ],
      },
      {
        heading: "Versão mista: onça com um mimo",
        paragraphs: [
          "Alguns grupos preferem uma versão mais leve: o presente principal é engraçado, mas vem junto com uma pequena lembrança útil ou um chocolate. Assim a pessoa ri na hora e ainda leva algo para casa.",
        ],
      },
      {
        heading: "Troca com roubo de presentes",
        paragraphs: [
          "Uma variação popular é a troca com “roubo”: os presentes ficam no centro, cada pessoa escolhe um pacote ou rouba um presente já aberto de outra pessoa. Funciona melhor quando todos os presentes têm valor parecido e o grupo leva na brincadeira.",
        ],
      },
    ],
  },
  {
    slug: "amigo-secreto-na-escola",
    title: "Amigo secreto na escola: dicas para pais e professores",
    description:
      "Como organizar amigo secreto ou amigo chocolate na escola: valor acessível, lista de desejos para crianças, combinados com os pais e como fazer a troca na sala.",
    h1: "Amigo secreto na escola: um guia para professores e pais",
    summary: "Valor acessível, lista de desejos e combinados com as famílias.",
    intro:
      "Na escola, o amigo secreto e o amigo chocolate ajudam a turma a fechar o ano com um momento de carinho. Mas, com crianças, o organizador precisa pensar em detalhes que não aparecem entre adultos: todo mundo precisa receber algo, o valor precisa caber para todas as famílias e ninguém pode ficar de fora.",
    updated: "2026-10-13",
    emoji: "🏫",
    sections: [
      {
        heading: "Combine com as famílias primeiro",
        paragraphs: [
          "Antes de sortear, mande um recado para os responsáveis explicando a brincadeira, o valor e a data. Peça que avisem se a criança não puder participar. Isso evita que uma criança fique sem presente no dia por esquecimento em casa.",
        ],
      },
      {
        heading: "Valor baixo e igual para todos",
        paragraphs: [
          "Na escola, o valor precisa ser acessível para todas as famílias. Um teto baixo ou o amigo chocolate, em que todo mundo troca chocolates, são boas opções porque deixam a diferença de renda menos visível.",
        ],
      },
      {
        heading: "Lista de desejos feita com os pais",
        paragraphs: [
          "Crianças pequenas ainda não sabem dizer bem o que querem dentro de um valor. Peça que cada família ajude a montar uma lista simples com duas ou três ideias. A lista também é o lugar para avisar sobre alergias, principalmente no amigo chocolate.",
        ],
      },
      {
        heading: "Tenha um plano para quem faltar",
        paragraphs: [
          "Sempre tem alguém que falta no dia ou esquece o presente. Uma boa prática é o professor ou a comissão de pais ter dois ou três presentes reserva, para que nenhuma criança volte para casa de mãos vazias.",
        ],
      },
      {
        heading: "A revelação na sala",
        paragraphs: [
          "Com crianças, brincadeiras como desenho e mímica funcionam melhor do que descrições longas. Faça uma roda e mantenha o ritmo: em turmas grandes, um minuto por criança já é suficiente.",
        ],
      },
      {
        heading: "Sorteio online com responsáveis",
        paragraphs: [
          "Para turmas de crianças pequenas, quem entra no grupo online é o responsável, com o nome da criança. Cada família vê só quem a criança tirou, e o professor não precisa sortear papelzinho em sala, onde alguém sempre acaba vendo o papel do colega.",
        ],
      },
      {
        heading: "Ideias de presente para crianças",
        paragraphs: ["Presentes que costumam agradar em várias idades e cabem em valores baixos:"],
        bullets: [
          "Livros infantis ou gibis",
          "Kits de desenho, massinha ou adesivos",
          "Jogos de cartas simples e quebra-cabeças",
          "Garrafinha ou estojo com personagem que a criança gosta",
          "No amigo chocolate: barras e bombons sem itens que costumam causar alergia, se houver aviso",
        ],
      },
      {
        heading: "Com adolescentes, deixe eles organizarem",
        paragraphs: [
          "Nas turmas mais velhas, a brincadeira fica melhor quando os próprios alunos organizam, com o professor só acompanhando. Eles escolhem o valor, o tipo de brincadeira (amigo da onça faz muito sucesso nessa idade) e a dinâmica da revelação. O papel do adulto é garantir que ninguém fique de fora e que as piadas não passem do ponto.",
        ],
      },
    ],
  },
  {
    slug: "erros-comuns-no-amigo-secreto",
    title: "7 erros comuns no amigo secreto (e como evitar)",
    description:
      "Os erros que mais estragam o amigo secreto: sorteio cedo demais, valor sem combinar, alguém tirar o próprio nome e desistências. Veja como evitar cada um.",
    h1: "Os erros mais comuns no amigo secreto e como evitar cada um",
    summary: "Sorteio cedo demais, valor sem combinar, desistências e outras ciladas.",
    intro:
      "Quase todo mundo já viveu um amigo secreto que deu errado: alguém que não levou presente, o sorteio refeito três vezes, o presente que claramente foi comprado no caminho da festa. A boa notícia é que a maioria desses problemas tem uma causa simples e uma solução fácil.",
    updated: "2026-10-13",
    emoji: "⚠️",
    sections: [
      {
        heading: "1. Sortear antes de fechar a lista",
        paragraphs: [
          "Quando alguém entra depois do sorteio, é preciso refazer tudo, e quem já viu o resultado fica sabendo de mais coisa do que devia. Defina um prazo para confirmar e só sorteie depois dele.",
        ],
      },
      {
        heading: "2. Não combinar o valor",
        paragraphs: [
          "Sem valor combinado, cada um imagina um número diferente, e a diferença aparece na hora de abrir os presentes. Combine um teto e repita a informação no lembrete.",
        ],
      },
      {
        heading: "3. Alguém tirar o próprio nome",
        paragraphs: [
          "É o clássico do papelzinho. Quando acontece, a pessoa avisa e o grupo inteiro precisa sortear de novo, ou ela troca escondido e o segredo vai embora. Um sorteio online resolve isso de vez, porque nunca deixa alguém tirar a si mesmo.",
        ],
      },
      {
        heading: "4. O organizador saber todos os pares",
        paragraphs: [
          "Em muitos grupos, quem organiza acaba sabendo quem tirou quem, e a brincadeira perde a graça para ele. O ideal é que o sorteio seja feito de um jeito em que nem o organizador veja os pares.",
        ],
      },
      {
        heading: "5. Data muito perto",
        paragraphs: [
          "Sorteio na semana da festa obriga todo mundo a comprar correndo, e o presente sai pior. Duas semanas de antecedência é o mínimo; quatro, se houver gente recebendo presente pelo correio.",
        ],
      },
      {
        heading: "6. Ninguém saber o que dar",
        paragraphs: [
          "Sem pistas, o presente vira loteria. Peça para todos montarem uma lista de desejos curta e incentive perguntas anônimas. Também vale olhar ideias por faixa de preço para se inspirar.",
        ],
      },
      {
        heading: "7. Não ter plano para desistências",
        paragraphs: [
          "Combine desde o começo o que acontece se alguém desistir depois do sorteio. A regra mais justa é: quem desiste continua responsável pelo presente de quem tirou. Assim ninguém fica sem presente na festa.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** "2026-10-13" → "13/10/2026" */
export function formatGuideDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
