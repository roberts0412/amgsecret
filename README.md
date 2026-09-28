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
npm run typecheck
npm run build
```
