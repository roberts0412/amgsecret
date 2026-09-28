# Publicar grátis: Vercel + Neon

Site na **Vercel** (plano Hobby, grátis) e banco PostgreSQL no **Neon**
(plano Free). Resultado: `https://<nome-do-projeto>.vercel.app`, com HTTPS.

> ⚠️ O plano Hobby da Vercel é para **uso pessoal/não comercial**. Para ligar
> anúncios (AdSense), assine o plano Pro ou migre para o servidor próprio
> (`docs/DEPLOY.md` — pode ser o Oracle Cloud Always Free). Confira os termos
> atuais de cada serviço.

## 0. No GitHub: branch principal = `main`

Em https://github.com/roberts0412/amgsecret → **Settings** → **General** →
**Default branch** → troque para **`main`**. A Vercel publica o branch principal.

## 1. Banco de dados no Neon

1. Acesse https://neon.tech e clique em **Sign up** → **Continue with GitHub**.
2. Crie um projeto:
   - **Project name:** `amigo-secreto`
   - **Region:** `AWS US East 1 (N. Virginia)` — fica perto do servidor padrão da Vercel.
3. No painel do projeto, clique em **Connect**. Você verá a *connection string*:
   - Com **Connection pooling ligado** (o endereço tem `-pooler`): copie → será o **`DATABASE_URL`**.
   - Com **Connection pooling desligado**: copie → será o **`DIRECT_DATABASE_URL`**.

   Ambos começam com `postgresql://` e terminam com `?sslmode=require`.

## 2. Gere o segredo do site

Abra https://generate-secret.vercel.app/32 e copie o texto — será o **`APP_SECRET`**.

> Guarde uma cópia em lugar seguro (gerenciador de senhas). Sem ele, os
> sorteios existentes ficam ilegíveis.

## 3. Site na Vercel

1. Acesse https://vercel.com → **Sign Up** → **Hobby** → **Continue with GitHub**.
2. **Add New…** → **Project** → em *Import Git Repository*, escolha
   **`amgsecret`** (se não aparecer, clique em *Adjust GitHub App Permissions*
   e libere o repositório).
3. **Project Name:** `amgsecret` (vira `amgsecret.vercel.app`; se já existir,
   a Vercel sugere outro). Framework: **Next.js** (automático). Não mude os
   comandos de build — o projeto já tem `vercel-build`, que aplica as
   migrações e faz o build.
4. Abra **Environment Variables** e adicione:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Neon **com** pooling |
   | `DIRECT_DATABASE_URL` | connection string do Neon **sem** pooling |
   | `APP_SECRET` | o segredo do passo 2 |
   | `TRUST_PROXY` | `true` |
   | `DATABASE_POOL_MAX` | `5` |
   | `CONTACT_EMAIL` | seu e-mail de contato (opcional, aparece na Política de Privacidade) |

   Não precisa de `APP_URL`: o site usa automaticamente o endereço `.vercel.app`.
5. Clique em **Deploy** e aguarde ~3 minutos.

## 4. Confira

- Abra `https://<seu-projeto>.vercel.app` → a página inicial deve aparecer.
- Abra `https://<seu-projeto>.vercel.app/api/health` → deve mostrar `{"ok":true}`.
- Crie um grupo de teste e convide alguém pelo WhatsApp.

Cada `git push` no `main` publica uma nova versão automaticamente (com as
migrações do banco).

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build falha com `P1001` / "Can't reach database" | URL do Neon errada | Confira `DIRECT_DATABASE_URL` (sem `-pooler`) |
| Build falha citando `APP_SECRET` ou `DATABASE_URL` | Variável faltando | Adicione em *Settings → Environment Variables* e clique em **Redeploy** |
| `/api/health` mostra `{"ok":false}` | Site não alcança o banco | Confira `DATABASE_URL` (com `-pooler`) e redeploy |
| Primeira visita lenta | Banco do plano Free "dorme" sem uso | Normal; acorda em ~1 s |

## Domínio próprio (opcional)

Na Vercel: **Settings → Domains → Add** e siga as instruções de DNS. Depois
adicione `APP_URL=https://seu-dominio` e faça **Redeploy** (o sitemap e as
URLs canônicas passam a usar o domínio).

## Limitações no plano grátis

- O limite de tentativas por IP é guardado na memória de cada instância da
  Vercel (serverless) — protege menos que no servidor próprio. O bloqueio do
  PIN (no banco) continua valendo normalmente.
- Os limites de uso gratuitos da Vercel e do Neon atendem bem grupos de
  família/firma; para tráfego alto, veja os planos pagos ou o servidor próprio.
