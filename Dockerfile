# syntax=docker/dockerfile:1
# Imagem de produção do Amigo Secreto (Next.js standalone).
# Uso normal: docker compose up -d --build   (ver docs/DEPLOY.md)

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependências (inclui a CLI do Prisma, usada no serviço de migração) ---
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# --- build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valores PÚBLICOS usados nas páginas estáticas (SEO, sitemap, robots).
ARG APP_URL
ARG ADSENSE_CLIENT_ID=""
ARG ADSENSE_SLOT_ID=""
ARG CONTACT_EMAIL=""
ENV APP_URL=$APP_URL ADSENSE_CLIENT_ID=$ADSENSE_CLIENT_ID ADSENSE_SLOT_ID=$ADSENSE_SLOT_ID CONTACT_EMAIL=$CONTACT_EMAIL
# Segredos reais NÃO entram no build: banco e segredo aqui são descartáveis.
RUN test -n "$APP_URL" || (echo "Defina o build arg APP_URL" && exit 1) \
 && npx prisma generate \
 && DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    APP_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")" \
    npx next build \
 && test ! -e .next/standalone/.env || (echo "ERRO: .env foi parar no pacote" && exit 1)

# --- migrações (reaproveita o estágio de build, que tem a CLI do Prisma) ---
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# --- runtime mínimo ---
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --chown=node:node docker/check-env.mjs ./check-env.mjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node check-env.mjs && exec node server.js"]
