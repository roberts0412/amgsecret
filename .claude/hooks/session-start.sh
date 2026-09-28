#!/bin/bash
# Prepara o ambiente de desenvolvimento do Claude Code na web:
# PostgreSQL local ligado, bancos criados, .env, dependências e migrações.
# Idempotente: pode rodar quantas vezes for preciso.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# 1) PostgreSQL local (se instalado)
if command -v pg_ctlcluster >/dev/null 2>&1 || [ -d /usr/lib/postgresql ]; then
  if ! service postgresql status 2>/dev/null | grep -q online; then
    service postgresql start >/dev/null
  fi
  for _ in $(seq 1 20); do
    su postgres -c "psql -Atqc 'select 1'" >/dev/null 2>&1 && break
    sleep 0.5
  done
  su postgres -c "psql -Atqc \"select 1 from pg_roles where rolname='amigo'\"" | grep -q 1 \
    || su postgres -c "psql -qc \"create user amigo with password 'amigo' createdb\""
  for db in amigo amigo_test amigo_e2e; do
    su postgres -c "psql -Atqc \"select 1 from pg_database where datname='$db'\"" | grep -q 1 \
      || su postgres -c "psql -qc 'create database $db owner amigo'"
  done
fi

# 2) .env de desenvolvimento (com segredo aleatório) se não existir
if [ ! -f .env ]; then
  secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
  sed "s/^APP_SECRET=\"\"/APP_SECRET=\"$secret\"/" .env.example > .env
fi

# 3) Dependências (postinstall gera o cliente Prisma)
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm install --no-audit --no-fund
fi
[ -d src/generated/prisma ] || npx prisma generate >/dev/null

# 4) Migrações no banco de desenvolvimento
npx prisma migrate deploy >/dev/null

echo "Ambiente pronto: Postgres, .env, dependências e migrações."
