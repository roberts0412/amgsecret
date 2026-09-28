# Publicar o Amigo Secreto

Este guia coloca o site no ar em um servidor seu, de forma **independente**:
banco de dados, migrações, site e HTTPS rodam juntos com um único comando.

## O que você precisa

1. **Um servidor Linux (VPS)** com 1 GB de RAM ou mais — ex.: Hetzner, DigitalOcean,
   Contabo, Hostinger VPS, Oracle Cloud (tem plano grátis).
2. **Um domínio** (ex.: `amigosecreto.com.br`) — Registro.br, Hostinger etc.
3. No painel do domínio, crie um registro **DNS tipo A** apontando o domínio
   (ou um subdomínio) para o **IP do servidor**.

## Passo a passo

### 1. Instale o Docker no servidor

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Baixe o projeto

```bash
git clone <URL-do-seu-repositório> amigo-secreto
cd amigo-secreto
```

### 3. Configure

```bash
cp docker.env.example .env
nano .env
```

Preencha:

| Variável | O que é | Como gerar |
|---|---|---|
| `DOMAIN` | seu domínio, sem `https://` | — |
| `APP_URL` | o mesmo domínio, com `https://` | — |
| `POSTGRES_PASSWORD` | senha do banco | `openssl rand -hex 32` |
| `APP_SECRET` | chave que cifra os resultados do sorteio | `openssl rand -base64 32 \| tr '+/' '-_' \| tr -d '='` |
| `CONTACT_EMAIL` | e-mail exibido na Política de Privacidade (recomendado) | — |
| `ADSENSE_CLIENT_ID`, `ADSENSE_SLOT_ID` | anúncios (opcional, veja abaixo) | — |

> ⚠️ **Guarde uma cópia do `APP_SECRET` em lugar seguro** (gerenciador de senhas).
> Sem ele, os sorteios existentes ficam ilegíveis — nem um backup do banco resolve.

### 4. Suba tudo

```bash
docker compose up -d --build
```

Isso:
1. cria o banco PostgreSQL (dados em volume persistente);
2. aplica as migrações;
3. constrói e inicia o site (só depois que as migrações terminarem);
4. inicia o **Caddy**, que obtém o certificado HTTPS gratuito (Let's Encrypt)
   e redireciona `http` → `https` automaticamente.

Em 1–2 minutos o site está em `https://seu-dominio`.

### 5. Confira

```bash
docker compose ps                   # app deve aparecer como (healthy)
curl https://seu-dominio/api/health # {"ok":true}
```

Se o site não subir, veja o motivo:

```bash
docker compose logs app
```

Configuração faltando ou errada aparece com mensagem clara, por exemplo:
`[config] Não foi possível iniciar: - APP_SECRET ausente ou curto`.

## Atualizar para uma nova versão

```bash
git pull
docker compose up -d --build
```

As migrações novas são aplicadas automaticamente antes de o site novo subir.
Sessões e sorteios continuam valendo.

## Backup (faça!)

Backup do banco:

```bash
docker compose exec -T db pg_dump -U amigo amigo | gzip > backup-$(date +%F).sql.gz
```

Agende diariamente com `crontab -e`:

```
0 3 * * * cd /caminho/amigo-secreto && docker compose exec -T db pg_dump -U amigo amigo | gzip > /backups/amigo-$(date +\%F).sql.gz
```

Restaurar:

```bash
gunzip -c backup-AAAA-MM-DD.sql.gz | docker compose exec -T db psql -U amigo amigo
```

Guarde os backups **fora do servidor** e, separadamente, o `APP_SECRET`.

## Anúncios (Google AdSense)

1. Crie a conta em https://adsense.google.com e cadastre o domínio.
2. O Google exige **Política de Privacidade** e **Termos** — já existem em
   `/privacidade` e `/termos`, e o `/ads.txt` é gerado automaticamente.
3. Crie um bloco de anúncio "display" e copie o `data-ad-client`
   (`ca-pub-...`) e o `data-ad-slot` (número).
4. Coloque em `ADSENSE_CLIENT_ID` e `ADSENSE_SLOT_ID` no `.env` e rode
   `docker compose up -d --build` (esses valores entram no build).

Com isso aparecem o aviso de cookies (LGPD) e um anúncio discreto por página
pública. Páginas com dados privados nunca têm anúncios.

## Como funciona por dentro

| Serviço | Função |
|---|---|
| `db` | PostgreSQL 16, dados no volume `pgdata` |
| `migrate` | aplica `prisma migrate deploy` e encerra |
| `app` | site (Next.js standalone), usuário sem privilégios, healthcheck em `/api/health` |
| `caddy` | HTTPS automático e proxy reverso; repassa o IP real (`X-Real-IP`) |

Segurança da imagem:
- nenhum `.env` ou segredo entra na imagem (o build usa valores descartáveis
  e **falha** se encontrar um `.env` no pacote);
- o site roda como usuário `node`, não root;
- o container **não sobe** com configuração inválida (checagem em
  `docker/check-env.mjs`).

## Alternativas sem servidor próprio

Também funciona em plataformas gerenciadas (Vercel, Railway, Render, Fly.io)
com um PostgreSQL gerenciado (Neon, Supabase, Railway):
- defina as mesmas variáveis (**inclusive no build**: `APP_URL`, AdSense,
  `CONTACT_EMAIL`), mais `DATABASE_URL` e `TRUST_PROXY=true`;
- rode `npm run db:deploy` a cada versão (comando de release/pre-deploy);
- o limite de tentativas é por processo: com várias instâncias, adicione
  limite também no provedor (WAF/CDN) ou troque o store por Redis
  (`src/lib/security/rate-limit.ts`, interface `RateLimitStore`).

## Limitações conhecidas

- Rate limiting em memória: ideal para **um** servidor (caso do Compose).
- Não há exclusão automática de grupos antigos; o organizador pode excluir o
  grupo no painel, e pedidos de exclusão chegam pelo `CONTACT_EMAIL`.
