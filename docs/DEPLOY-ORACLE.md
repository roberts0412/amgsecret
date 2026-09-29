# Publicar grátis COM anúncios: Oracle Cloud "Always Free"

Custo total: **só o domínio** (~R$ 40/ano no registro.br). Servidor, banco e
HTTPS são grátis. Diferente do plano Hobby da Vercel, aqui anúncios são
permitidos. Usa a instalação com Docker descrita em `docs/DEPLOY.md`.

Tempo estimado: ~1 hora (a maior parte é esperar cadastro e DNS).

## 1. Compre o domínio (registro.br)

1. Acesse https://registro.br, pesquise um nome (ex.: `amigosecretoonline.com.br`)
   e compre (~R$ 40/ano).
2. Deixe a aba aberta: no passo 4 você vai apontar o domínio para o servidor.

## 2. Crie a conta na Oracle Cloud

1. Acesse https://www.oracle.com/br/cloud/free/ → **Comece gratuitamente**.
2. **Home region:** escolha **Brazil East (São Paulo)** ou **Brazil Southeast
   (Vinhedo)**. ⚠️ Não dá para trocar depois, e os recursos grátis ficam nela.
3. O cartão de crédito é pedido **só para verificação** (pode aparecer uma
   pré-autorização pequena, estornada). Contas "Always Free" não são cobradas.

## 3. Crie o servidor (VM)

1. No painel: **Menu ☰ → Compute → Instances → Create instance**.
2. **Name:** `amigo-secreto`.
3. **Image and shape → Edit:**
   - Image: **Canonical Ubuntu 24.04**.
   - Shape: **Change shape → Ampere → VM.Standard.A1.Flex** — escolha
     **2 OCPUs e 12 GB** (dentro do grátis; o limite é 4 OCPUs / 24 GB no total).
   - Se aparecer **"Out of capacity"**, tente outro *Availability domain* ou
     tente de novo mais tarde (é comum; às vezes leva algumas tentativas).
4. **Networking:** deixe criar uma VCN nova, com **Assign a public IPv4 address** marcado.
5. **Add SSH keys → Generate a key pair for me → Save private key**
   (guarde o arquivo `.key`).
6. **Create**. Quando ficar verde (RUNNING), anote o **Public IP address**.

### Libere as portas 80 e 443 (2 lugares!)

A Oracle bloqueia em **dois** lugares. Sem os dois, o site não abre.

**a) Na nuvem (Security List):**
Instância → **Subnet** (link) → **Security Lists** → *Default Security List* →
**Add Ingress Rules**, duas vezes:

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

**b) Dentro do servidor (iptables)** — no passo 5.

## 4. Aponte o domínio para o servidor

No registro.br: **seu domínio → DNS → Editar zona** (use o DNS do próprio
registro.br) → adicione:

| Tipo | Nome | Valor |
|---|---|---|
| A | *(vazio, o domínio raiz)* | IP público do servidor |
| A | `www` | IP público do servidor |

Pode levar de minutos a algumas horas para propagar.

## 5. Instale o site no servidor

Conecte por SSH. No Windows (PowerShell), com o arquivo da chave baixado:

```powershell
ssh -i C:\caminho\para\chave.key ubuntu@IP_DO_SERVIDOR
```

(Se reclamar da permissão da chave: botão direito no arquivo → Propriedades →
Segurança → deixe só o seu usuário com acesso.)

Já no servidor, copie e cole bloco por bloco:

```bash
# liberar portas 80/443 no firewall interno da imagem Ubuntu da Oracle
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# instalar Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

Conecte de novo (para o grupo `docker` valer) e:

```bash
git clone https://github.com/roberts0412/amgsecret.git
cd amgsecret
cp docker.env.example .env
nano .env
```

No `nano`, preencha (setas para andar, `Ctrl+O` Enter para salvar, `Ctrl+X` para sair):

```
DOMAIN=seudominio.com.br
APP_URL=https://seudominio.com.br
POSTGRES_PASSWORD=   ← gere com: openssl rand -hex 32
APP_SECRET=          ← gere com: openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
CONTACT_EMAIL=seu@email.com
```

Dica: para gerar, saia do nano, rode os comandos `openssl` no terminal, copie
o resultado e volte ao `nano .env`. **Guarde o `APP_SECRET`** em lugar seguro.

Suba tudo:

```bash
docker compose up -d --build
```

O primeiro build leva ~5–10 minutos. Depois:

```bash
docker compose ps                        # app deve ficar (healthy)
curl -s https://seudominio.com.br/api/health   # {"ok":true}
```

Abra `https://seudominio.com.br` no celular. 🎉

## 6. Anúncios (Google AdSense)

1. https://adsense.google.com → crie a conta e adicione o site `seudominio.com.br`.
2. Copie seu código de editor (`ca-pub-...`) e, no servidor:
   ```bash
   cd ~/amgsecret && nano .env      # ADSENSE_CLIENT_ID=ca-pub-...
   docker compose up -d --build
   ```
   Isso publica o `/ads.txt`, usado pelo Google na verificação.
3. No AdSense, peça a revisão do site e aguarde (dias a semanas).
4. Aprovado: **Anúncios → Por bloco de anúncios → Display** → crie um bloco,
   copie o número de `data-ad-slot` e:
   ```bash
   nano .env                         # ADSENSE_SLOT_ID=1234567890
   docker compose up -d --build
   ```

Aparecem um anúncio discreto por página pública e o aviso de cookies. Páginas
privadas nunca têm anúncio.

## Atualizar, backup e problemas

- **Atualizar:** `cd ~/amgsecret && git pull && docker compose up -d --build`
- **Backup:** veja `docs/DEPLOY.md` (seção Backup) — agende o `pg_dump` diário.
- **Ver erros:** `docker compose logs app --tail 50`

| Sintoma | Solução |
|---|---|
| Site não abre (tempo esgotado) | Confira as **duas** liberações de porta (Security List + iptables) |
| Erro de certificado HTTPS | DNS ainda propagando; confira o registro A e aguarde; depois `docker compose restart caddy` |
| "Out of capacity" ao criar a VM | Outro availability domain ou tentar mais tarde |
| `permission denied` no docker | Saia e entre de novo no SSH (grupo docker) |

## Depois de migrar

Quando o novo site estiver no ar, desligue o projeto na Vercel (Settings →
Advanced → Delete Project) e, se quiser, o banco do Neon — o servidor da
Oracle já tem o próprio PostgreSQL.
