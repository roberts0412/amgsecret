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
| Banco | PostgreSQL (produção) / SQLite (dev e testes) | Transações ACID para salvar o sorteio de forma atômica |
| ORM | Prisma | Consultas parametrizadas (sem SQL injection), migrações versionadas |
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

```
Group
  id (cuid) · code (6 chars, único, público) · name · description
  eventDate · eventTime · location · giftValueCents
  creatorParticipantId · status (OPEN | DRAWN | ARCHIVED)
  plan (FREE | PREMIUM) · theme · createdAt · updatedAt

Participant
  id · groupId · name · nickname? · email? · phone?
  tokenHash (sha256 do token privado, único) · isOrganizer
  status (INVITED | CONFIRMED | REMOVED) · createdAt
  @@unique(groupId, name)  -- evita nomes duplicados no grupo

Exclusion
  id · groupId · participantId · excludedParticipantId
  @@unique(participantId, excludedParticipantId)

Draw
  id · groupId · status (ACTIVE | INVALIDATED) · createdAt · invalidatedAt?
  -- no máximo 1 ACTIVE por grupo (garantido na transação + índice parcial no Postgres)

DrawPair
  id · drawId · giverId
  receiverEnc   -- ID do sorteado CIFRADO (AES-256-GCM, chave só no servidor)
  receiverHmac  -- HMAC(drawId, receiverId) para buscar "quem me tirou" sem decifrar tudo
  @@unique(drawId, giverId) · @@unique(drawId, receiverHmac)

WishlistItem
  id · participantId · product · description? · approxPriceCents? · url? · note? · createdAt

SecretMessage
  id · drawId · senderPairId · recipientId · body · createdAt
  -- o remetente nunca é exposto ao destinatário; vinculado ao sorteio

WallPost
  id · groupId · authorId · body · createdAt   -- público no grupo, com autor
```

**Proteção do relacionamento participante→resultado:** o par nunca é gravado em
claro. Um dump do banco sozinho não revela quem tirou quem. Não existe nenhuma
consulta/rota que liste todos os pares — nem para o organizador.

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

## 6. Autenticação e autorização

Sem cadastro/senha (atrito zero no WhatsApp):

1. **Criar grupo** → servidor cria o Group + Participant organizador, gera token
   aleatório de 256 bits, grava só o `sha256` e envia o token num cookie
   `httpOnly; Secure; SameSite=Lax; Path=/grupo/<code>` + mostra um **link
   privado de recuperação** (`/acesso/<token>`) para abrir em outro aparelho.
2. **Entrar** (`/grupo/ABC123`) → informa nome → mesmo fluxo, cria participante
   `INVITED`; ao confirmar vira `CONFIRMED`.
3. Toda requisição: cookie → `sha256` → busca participante → confere
   `groupId` e `status != REMOVED`. Organizador = `isOrganizer`.
4. **Resultado**: `DrawPair` do sorteio ACTIVE onde `giverId = eu`. Refazer o
   sorteio marca o anterior como `INVALIDATED` (e apaga seus pares); resultados
   e mensagens antigas deixam de ser acessíveis.
5. Sessão expira (cookie com validade) e o organizador pode regenerar o link
   de um participante.

**Visibilidade da lista de desejos**: antes do sorteio só o dono vê; depois,
só o dono e quem o tirou (checado no servidor via `DrawPair`).

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
| 2 | Next.js + Prisma: schema, migrações, cliente, criptografia dos pares | ⏳ |
| 3 | Criar grupo, entrar, confirmar, sessão por cookie, painel do organizador, rate limit | |
| 4 | Exclusões, sortear, refazer (com confirmação), tela "meu amigo secreto" | |
| 5 | Lista de desejos, mensagens secretas, mural | |
| 6 | Design mobile-first + botão "Compartilhar no WhatsApp" | |
| 7 | SEO: landing pages, metadata, Open Graph, sitemap, robots | |
| 8 | Monetização (planos/ad slots) + revisão de segurança + E2E | |

Cada etapa termina com: testes, typecheck, correções e relatório.
