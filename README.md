# Amigo Secreto

Plataforma de amigo secreto simples, rápida e segura — mobile-first, pensada para ser compartilhada pelo WhatsApp.

Arquitetura, modelo de dados, rotas e plano de etapas: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuração

```bash
cp .env.example .env
# preencha APP_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

npm install            # também gera o cliente Prisma
npm run db:deploy      # aplica as migrações em DATABASE_URL
npm run dev            # http://localhost:3000
```

> ⚠️ `APP_SECRET` cifra os resultados dos sorteios. Se ele for perdido ou trocado,
> os sorteios existentes ficam ilegíveis.

## Testes

```bash
npm test          # unitários (sorteio, tokens, cifragem, texto)
npm run test:db   # integração com Postgres real (TEST_DATABASE_URL, nome terminando em _test)
npm run test:all  # tudo
npm run test:e2e  # build + navegador real (Playwright), banco E2E_DATABASE_URL (_e2e)
npm run typecheck
npm run build
```

## Publicar grátis (Vercel + Neon)

Passo a passo em **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)** — sem servidor, em ~15 minutos.

## Publicar grátis com anúncios (Netlify + Neon)

Passo a passo em **[docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md)** — plano grátis que permite anúncios e afiliados, sem cartão (limite mensal de créditos).

## Publicar grátis com anúncios (Oracle Cloud)

Passo a passo em **[docs/DEPLOY-ORACLE.md](docs/DEPLOY-ORACLE.md)** — servidor grátis para sempre; único custo é o domínio.

## Publicar (independente)

Guia completo em **[docs/DEPLOY.md](docs/DEPLOY.md)**. Resumo, num servidor com Docker:

```bash
cp docker.env.example .env   # preencha domínio e segredos
docker compose up -d --build # banco + migrações + site + HTTPS automático
```
