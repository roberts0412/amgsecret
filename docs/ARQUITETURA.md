# Amigo Secreto — Arquitetura e Plano

## 1. Análise do projeto

O repositório estava **vazio** (sem commits, sem código, sem banco). Não há stack
herdada a respeitar, então a stack abaixo foi escolhida para o caso de uso:
acesso via link do WhatsApp no celular, páginas rápidas, SEO forte e backend
com controle de acesso rígido.

## 2. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript (strict) | Tipos no domínio crítico (sorteio, autorização) |
| Web | Next.js (App Router) | SSR para SEO e para *nunca* mandar dados secretos a JS público; Server Actions com checagem de origem (CSRF) |
| Banco | PostgreSQL em dev, testes e produção | Transações ACID para salvar o sorteio de forma atômica; mesmas migrações em todo lugar (sem divergência SQLite↔Postgres) |
| ORM | Prisma 7 (driver adapter `pg`) | Consultas parametrizadas (sem SQL injection), migrações versionadas |
| Validação | Zod | Validação de toda entrada no servidor |
| Estilo | Tailwind CSS | Mobile-first, CSS pequeno, sem framework pesado |
| Testes | Vitest (+ Playwright para E2E) | Rápido; Chromium já disponível |

## 3. Arquitetura

```
src/
  app/                    # rotas Next.js (páginas + server actions)
  lib/
    draw/                 # núcleo puro do sorteio (sem I/O)  ✅ Etapa 1
    security/             # tokens, hash, rate limit, cripto  ✅ tokens
    db/                   # cliente Prisma
    services/             # regras de negócio (grupo, participante, sorteio...)
    auth/                 # sessão do participante/organizador
    plans/                # recursos por plano (free/premium) — monetização
prisma/schema.prisma
```

Regra de camadas: **páginas → services → db**. Toda checagem de permissão fica
nos services, que recebem o participante já autenticado — nunca um ID vindo do
cliente.

## 4. Modelo de dados

Fonte da verdade: `prisma/schema.prisma` + `prisma/migrations/`.

```
Group
  id · code (único, público) · name · description · eventDate "YYYY-MM-DD"
  eventTime "HH:MM" · location · giftValueCents · status (OPEN | DRAWN | ARCHIVED)
  plan (FREE | PREMIUM) · theme · creatorId → Participant · createdAt · updatedAt

Participant
  id · groupId · name · nameKey (nome normalizado) · nickname? · email? · phone?
  role (ORGANIZER | MEMBER) · status (INVITED | CONFIRMED | REMOVED)
  tokenHash (sha256, único) · tokenIssuedAt · lastSeenAt · confirmedAt · removedAt
  @@unique(groupId, nameKey)   -- "José" e "jose " são a mesma pessoa

Exclusion      participantId · excludedParticipantId (FKs compostas com groupId)
Draw           groupId · status (ACTIVE | INVALIDATED) · invalidatedAt
DrawPair       drawId · giverId · receiverEnc (AES-256-GCM) · receiverLookup (HMAC)
WishlistItem   participantId · product · description · approxPriceCents · url · note
SecretMessage  drawId · recipientId · senderLookup (HMAC — sem remetente em claro) · body
WallPost       groupId · authorId (mesmo grupo) · body · hiddenAt (moderação)
```

Decisões:
- **Data do evento como texto** `YYYY-MM-DD`: é data de calendário; `DateTime`
  mudaria de dia conforme o fuso.
- **Valores em centavos** (inteiros): sem erro de arredondamento.
- **Pares cifrados**: `receiverEnc` usa AES-256-GCM com AAD = (drawId, giverId),
  então copiar o texto cifrado para outra linha não funciona. `receiverLookup`
  (HMAC) responde "quem me tirou?" sem decifrar tudo. Chaves derivadas de
  `APP_SECRET` via HKDF, uma por finalidade.
- **Mensagem secreta sem remetente em claro**: se gravássemos `senderId` e
  `recipientId`, a tabela de mensagens revelaria os pares. O remetente é só
  um HMAC.

Garantias **no banco** (defesa em profundidade, testadas em `schema.db.test.ts`):
- índice único parcial: no máximo 1 sorteio `ACTIVE` por grupo;
- 1 par por doador e 1 por sorteado em cada sorteio;
- exclusões e posts do mural só com participantes do mesmo grupo (FK composta);
- ninguém "excluído" de si mesmo; valores ≥ 0; formato de data/hora;
  textos obrigatórios não podem ser só espaços/quebras;
- cascata: apagar grupo/sorteio apaga pares e mensagens.

**Nenhuma consulta/rota lista todos os pares** — nem para o organizador.

## 5. Rotas

Páginas (URLs amigáveis):

| Rota | Quem acessa | Conteúdo |
|---|---|---|
| `/` | público | Criar amigo secreto · Entrar em um grupo |
| `/criar` | público | Formulário do grupo |
| `/grupo/[code]` | público / participante | Nome, data, valor, participantes (só nome + status), mural; formulário "entrar" |
| `/grupo/[code]/eu` | participante (cookie) | Meu amigo secreto, lista de desejos dele, minha lista, mensagens secretas |
| `/grupo/[code]/admin` | organizador (cookie) | Status, exclusões, sortear/refazer |
| `/acesso/[token]` | dono do link | Troca o token do link por cookie e redireciona (token some da URL) |
| `/amigo-secreto-online`, `/sorteio-amigo-secreto`, `/amigo-secreto-gratis`, `/sorteador-amigo-secreto`, `/amigo-secreto-com-lista-de-desejos` | público | Landing pages de SEO |
| `/sitemap.xml`, `/robots.txt` | público | SEO (grupos ficam `noindex`) |

Mutações via **Server Actions** (createGroup, joinGroup, confirm, addExclusion,
removeExclusion, runDraw, redoDraw, addWish, sendSecretMessage, postToWall...).
**Não existe** rota do tipo `/resultado?id=5`: o resultado é derivado apenas da
sessão do participante.

## 6. Autenticação e autorização (implementado na Etapa 3)

Sem cadastro/senha (atrito zero no WhatsApp):

1. **Criar grupo** → cria Group + organizador (`CONFIRMED`) numa transação, gera
   token de 256 bits, grava só o `sha256` e guarda o token num cookie
   `httpOnly; SameSite=Lax; Path=/` (em produção: `Secure` + prefixo `__Host-`),
   um cookie por grupo (`__Host-as_<CÓDIGO>`), validade de ~6 meses.
2. **Entrar** (`/grupo/ABC123`) → nome (+ apelido/e-mail/celular opcionais) →
   participante `INVITED` → botão "Confirmar" → `CONFIRMED`.
3. **Toda requisição**: cookie → `sha256` → participante; confere o código do
   grupo e `status != REMOVED`. Papel e status são relidos do banco sempre.
4. **Link privado** `/acesso/<token>`: o GET só mostra "Entrar como Fulano?";
   o login é um POST (botão). Pré-visualizações do WhatsApp e links maliciosos
   não logam ninguém. Resposta com `Referrer-Policy: no-referrer` e `noindex`.
5. **Sair deste aparelho** apaga o cookie (o link privado continua valendo).
6. **Remoção** pelo organizador (só antes do sorteio): troca o hash do token
   (sessão cai na hora), libera o nome e apaga exclusões ligadas à pessoa.
7. Trava de linha (`SELECT … FOR UPDATE`) no grupo em toda mudança estrutural:
   entradas simultâneas nunca passam do limite do plano (testado com e sem a trava).

**Server Actions** são endpoints públicos: identidade só do cookie, alvo (id)
sempre conferido contra o grupo do usuário, retorno só com mensagem/erros de
campo. CSRF: o Next compara `Origin` × `Host` (verificado em E2E com origem
forjada) + cookies `SameSite=Lax`.

**Rate limiting** (por IP, janela deslizante, em memória — trocar por Redis com
várias instâncias): criar grupo 10/h, entrar 30/h, link privado 20/10min,
busca de código 60/10min, ações 60–120/10min. `X-Forwarded-For` só é usado com
`TRUST_PROXY=true`.

**Pendente (decisão para a Etapa 4):** "regenerar link" de um participante que
perdeu o celular. Se o organizador puder gerar um link novo, ele poderia entrar
como a pessoa e ver o resultado dela — precisa de um desenho que não quebre o
sigilo.

## 7. Segurança

- **SQL injection**: só Prisma (queries parametrizadas), sem SQL cru.
- **XSS**: React escapa por padrão; proibido `dangerouslySetInnerHTML`; URLs da
  lista de desejos aceitas só com `http(s)`; CSP estrita + `rel="noopener noreferrer nofollow"`.
- **CSRF**: Server Actions checam `Origin`; cookies `SameSite=Lax`.
- **Rate limiting**: por IP e por ação (criar grupo, entrar, sortear, mensagens).
  Em memória no início, adaptador Redis/Upstash para produção.
- **Validação**: Zod em toda entrada, limites de tamanho, mínimo 3 participantes.
- **Tokens**: `crypto.randomBytes(32)`, comparação em tempo constante, só hash no banco.
- **Sorteio**: `crypto.randomInt` (CSPRNG). Nada de segredo em HTML público,
  bundle JS, URL previsível ou localStorage.
- **Headers**: CSP, `X-Frame-Options`, `Referrer-Policy: no-referrer` nas
  páginas privadas (evita vazar `/acesso/<token>` por Referer).

## 8. Algoritmo do sorteio (Etapa 1 — pronto)

`src/lib/draw/draw.ts`

- Problema modelado como **emparelhamento perfeito bipartido** (doador ×
  recebedor, sem si mesmo e sem exclusões).
- 1º tenta amostragem por rejeição → resultado **uniforme** entre todas as
  combinações válidas.
- Se não achar, usa **Kuhn (caminhos aumentantes)**, que é *completo*: acha
  solução se e somente se ela existe. Caso contrário lança
  `"Não foi possível realizar o sorteio com as regras atuais. Remova ou altere algumas exclusões."`
- `validateAssignment` revalida de forma independente (ninguém tira a si
  mesmo, cada um tira 1, cada um é tirado 1 vez, exclusões respeitadas) antes
  de qualquer gravação.
- Serviço de sorteio (Etapa 4) roda tudo dentro de **uma transação**:
  checa status/organizador/confirmados → sorteia → valida → grava pares → marca
  grupo `DRAWN`. Qualquer falha = rollback, nunca sorteio parcial.

## 9. Monetização (preparação)

- `Group.plan` + módulo `lib/plans` com limites/recursos por plano
  (`maxParticipants`, `themes`, `adsEnabled`...).
- Componente `<AdSlot/>` que não renderiza nada enquanto anúncios estiverem
  desligados; nunca em páginas com dado secreto.
- Sem pagamento por enquanto.

## 10. Etapas

| # | Etapa | Status |
|---|---|---|
| 1 | Núcleo: algoritmo do sorteio + tokens, com testes | ✅ |
| 2 | Next.js + Prisma: schema, migrações, cliente, criptografia dos pares | ✅ |
| 3 | Criar grupo, entrar, confirmar, sessão por cookie, painel do organizador, rate limit | ✅ |
| 4 | Exclusões, sortear, refazer (com confirmação), tela "meu amigo secreto" | ⏳ |
| 5 | Lista de desejos, mensagens secretas, mural | |
| 6 | Design mobile-first + botão "Compartilhar no WhatsApp" | |
| 7 | SEO: landing pages, metadata, Open Graph, sitemap, robots | |
| 8 | Monetização (planos/ad slots) + revisão de segurança + E2E | |

Cada etapa termina com: testes, typecheck, correções e relatório.
