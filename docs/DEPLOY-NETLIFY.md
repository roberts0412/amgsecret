# Publicar grátis COM anúncios: Netlify + Neon

O plano **Free** da Netlify **permite uso comercial** (anúncios e links de
afiliado), não pede cartão e roda este projeto sem mudanças. O banco continua
no **Neon** (o mesmo usado na Vercel). Confira os termos atuais em
https://www.netlify.com/pricing/.

## Antes de começar: o limite de créditos

O plano Free dá **300 créditos por mês**. Se acabarem, **o site fica fora do ar
até o mês seguinte** (não há cobrança). Aproximadamente:

| Uso | Créditos |
|---|---|
| Cada publicação (deploy de produção) | 15 |
| 1 GB de tráfego | 20 |
| 10.000 acessos | 2 |
| Processamento das páginas | ~5 a cada 10.000 páginas dinâmicas |

Na prática: dezenas de milhares de páginas vistas por mês cabem. A Netlify
avisa por e-mail em 50%, 75% e 100%. Evite publicar muitas vezes por mês (cada
`git push` no `main` gasta 15). Se o site crescer (ex.: dezembro), migre para
um VPS pago (`docs/DEPLOY.md`) — os anúncios costumam cobrir o custo.

## 1. Crie a conta e importe o projeto

1. https://app.netlify.com/signup → **Sign up with GitHub** (plano **Free**).
2. **Add new project → Import an existing project → GitHub** → escolha
   **`amgsecret`** (se não aparecer, *Configure the Netlify app on GitHub* e
   libere o repositório).
3. **Branch to deploy:** `main`. Não mude o comando de build: o
   `netlify.toml` do projeto já aplica as migrações e faz o build.
4. Antes de publicar, abra **Environment variables** (ou publique e adicione
   depois em *Project configuration → Environment variables* e faça
   **Deploys → Trigger deploy**).

## 2. Variáveis de ambiente

Use **os mesmos valores da Vercel** para o banco e o segredo — assim os grupos
que já existem continuam funcionando.

| Nome | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon **com** pooling (a mesma da Vercel) |
| `DIRECT_DATABASE_URL` | connection string do Neon **sem** pooling (a mesma da Vercel) |
| `APP_SECRET` | **o mesmo** da Vercel (sem ele, os sorteios existentes ficam ilegíveis) |
| `APP_URL` | `https://amigosecretofacil.com.br` (seu domínio) |
| `TRUST_PROXY` | `true` |
| `DATABASE_POOL_MAX` | `5` |
| `CONTACT_EMAIL` | seu e-mail de contato |
| `AMAZON_ASSOCIATE_TAG` | sua ID de Associado (ex.: `meusite-20`) — opcional |
| `ADSENSE_CLIENT_ID` / `ADSENSE_SLOT_ID` | depois da aprovação do AdSense |
| `OWNER_PANEL_PASSWORD` | senha do seu painel de números em `/painel` (16+ caracteres) — opcional |

> 🔒 Endereços do banco e `APP_SECRET` são senhas: cole só no painel da
> Netlify, nunca em chats ou prints. Na Vercel, os valores ficam em
> *Settings → Environment Variables* (ícone de olho).

Marque **All scopes** em cada variável (se ficar só em *Functions*, o build não
as enxerga e falha com "datasource.url is required").

`APP_URL`, `CONTACT_EMAIL`, AdSense e `AMAZON_ASSOCIATE_TAG` (páginas de
ideias de presente) entram no build: ao mudar, faça **Trigger deploy**.

## Painel do dono

Com `OWNER_PANEL_PASSWORD` definida, `https://seu-dominio/painel` mostra
grupos criados por dia, participantes, sorteios e brincadeiras — só números,
nenhum nome ou resultado. O navegador pede usuário (qualquer um) e a senha.
Sem a variável, a página não existe.

## 3. Confira no endereço da Netlify

Após ~3 minutos, abra `https://<seu-projeto>.netlify.app/api/health` → deve
mostrar `{"ok":true}`. Os links do site ainda apontam para o domínio (por
causa do `APP_URL`) — normal.

## 4. Mude o domínio da Vercel para a Netlify

1. Na Netlify: **Domain management → Add a domain** →
   `amigosecretofacil.com.br` → confirme que é seu (**Add domain**). Adicione
   também o `www` se ela oferecer.
2. Escolha **configurar o DNS no seu provedor** (não precisa trocar os
   servidores DNS). A Netlify mostra os valores — normalmente:

   | Tipo | Nome | Valor |
   |---|---|---|
   | A | *(vazio)* | `75.2.60.5` |
   | CNAME | `www` | `<seu-projeto>.netlify.app` |

3. No Registro.br (**Configurar endereçamento**), **edite** o registro A e o
   CNAME `www` que hoje apontam para a Vercel, trocando pelos valores da
   Netlify. **Não mexa nos registros TXT** (Google Search Console).
4. Espere a Netlify mostrar o domínio como verificado e o **HTTPS** ativo
   (*Domain management → HTTPS*; o certificado é automático, pode levar até
   algumas horas depois da propagação do DNS).
5. Teste `https://amigosecretofacil.com.br/api/health`.

## 5. Desligue a Vercel

Com o domínio funcionando na Netlify: na Vercel, **Settings → Domains** →
remova o domínio; depois **Settings → Advanced → Delete Project** (assim cada
`git push` não publica em dois lugares). O banco Neon continua o mesmo.

## Anúncios

Siga a seção 6 de `docs/DEPLOY-ORACLE.md` (AdSense), colocando
`ADSENSE_CLIENT_ID` e depois `ADSENSE_SLOT_ID` nas variáveis da Netlify e
fazendo **Trigger deploy** a cada mudança.

## Limitações

- Como na Vercel, o limite de tentativas por IP fica na memória de cada
  instância (serverless). O bloqueio do PIN (no banco) vale normalmente.
- O IP do visitante vem do cabeçalho `x-nf-client-connection-ip`, o único
  confiável na Netlify (tratado automaticamente em `src/lib/security/client-ip.ts`).
