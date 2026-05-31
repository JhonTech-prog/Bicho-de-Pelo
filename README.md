# Bicho de Pelo

Sistema local/web de caixa e emissao NFC-e para o petshop Bicho de Pelo.

## Estrutura

```text
.
├── index.tsx                # frontend React/Vite
├── index.html
├── components/              # componentes visuais
├── services/                # servicos auxiliares do frontend
├── server/                  # backend Express/SEFAZ
│   ├── index.ts             # API HTTP
│   ├── nfceService.ts       # montagem, assinatura e emissao NFC-e
│   ├── sefazService.ts      # comunicacao SVRS/SEFAZ
│   ├── certificateService.ts
│   ├── fiscalConfigService.ts
│   ├── storage.ts
│   ├── xmlSigner.ts
│   ├── package.json
│   └── .env.example
├── deploy/
│   └── nginx-bicho-de-pelo.conf
├── ecosystem.config.cjs     # PM2
├── .env.example             # variaveis do frontend
├── package.json             # frontend + scripts locais
└── data/                    # NAO versionar: certificado, configs e XMLs
```

## Seguranca

A pasta `data/` fica fora do Git e deve ser protegida. Ela pode conter:

- certificado A1
- senha fiscal local
- configuracao fiscal real
- XMLs emitidos

Nunca envie `data/`, `.env`, certificados ou XMLs fiscais para GitHub.

## Variaveis de ambiente

Frontend: copie `.env.example` para `.env` quando precisar configurar API externa.

```bash
cp .env.example .env
```

Exemplo:

```env
VITE_API_URL=https://app.seudominio.com/api
```

Em desenvolvimento local, pode deixar `VITE_API_URL` vazio. O Vite usa proxy para `/api`.

Backend: copie `server/.env.example` para `server/.env`.

```bash
cp server/.env.example server/.env
```

Configure no servidor:

```env
BACKEND_PORT=3333
DATA_DIR=data
ALLOWED_ORIGINS=http://localhost:3000,https://app.seudominio.com
```

Os dados fiscais tambem podem ser preenchidos pela tela `Configuracao Fiscal`.

## Instalar e rodar em desenvolvimento

Na raiz do projeto:

```bash
npm install
npm run dev:all
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:3333/api/health
```

Rodar apenas frontend:

```bash
npm run dev
```

Rodar apenas backend pela raiz:

```bash
npm run start
```

Rodar backend pela pasta `server/`:

```bash
cd server
npm install
npm run dev
npm start
```

## Build do frontend

```bash
npm run build
```

O build fica em:

```text
dist/
```

## Deploy simples com dominio

Arquitetura recomendada:

```text
Internet -> Dominio -> Nginx HTTPS -> frontend dist/
                               └── /api -> backend Node na porta 3333
```

### 1. Preparar servidor/VPS

Instale Node.js LTS, Git, Nginx, PM2 e Certbot.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Baixar projeto

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/JhonTech-prog/Bicho-de-Pelo.git bicho-de-pelo
cd bicho-de-pelo
npm install
```

### 3. Configurar ambiente

```bash
cp .env.example .env
cp server/.env.example server/.env
```

No `.env`:

```env
VITE_API_URL=https://app.seudominio.com/api
```

No `server/.env`:

```env
BACKEND_PORT=3333
DATA_DIR=data
ALLOWED_ORIGINS=https://app.seudominio.com
```

### 4. Build frontend

```bash
npm run build
```

### 5. Subir backend com PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 6. Configurar Nginx

Copie o exemplo:

```bash
sudo cp deploy/nginx-bicho-de-pelo.conf /etc/nginx/sites-available/bicho-de-pelo
sudo nano /etc/nginx/sites-available/bicho-de-pelo
```

Troque `app.seudominio.com` pelo dominio real.

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/bicho-de-pelo /etc/nginx/sites-enabled/bicho-de-pelo
sudo nginx -t
sudo systemctl reload nginx
```

### 7. HTTPS com Certbot

```bash
sudo certbot --nginx -d app.seudominio.com
```

### 8. DNS do dominio

No painel do dominio, crie um registro:

```text
Tipo: A
Nome: app
Valor: IP_PUBLICO_DO_SERVIDOR
```

Ou use o dominio raiz:

```text
Tipo: A
Nome: @
Valor: IP_PUBLICO_DO_SERVIDOR
```

## Computador local como servidor

Se o backend rodar em um computador local e voce quiser acesso externo pelo dominio, use uma destas opcoes:

- redirecionamento de portas no roteador para o computador servidor
- IP fixo ou DDNS
- proxy/tunel seguro como Cloudflare Tunnel, Tailscale Funnel ou similar

Opcao mais simples e segura para loja: VPS pequena com Nginx + PM2 + HTTPS.

## GitHub

Primeiro envio:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Atualizacoes:

```bash
git status
git add .
git commit -m "descreva a alteracao"
git push
```

## NFC-e e produtos

Produtos cadastrados atualmente:

- Produtos de banho pet: NCM `33079000`, CFOP `5102`
- Produtos banho e tosa pet: NCM `33079000`, CFOP `5102`
- Shampoo/condicionador pet: NCM `33079000`, CFOP `5102`
- Hidratacao de pelagem pet: NCM `33079000`, CFOP `5102`
- Colonia pos-banho pet: NCM `33079000`, CFOP `5102`
- Racao caes/gatos 1kg: NCM `23091000`, CFOP `5102`
- Racao caes/gatos 10kg: NCM `23091000`, CFOP `5102`
- Racao Golden 15kg: NCM `23091000`, CFOP `5102`

Em `producao`, uma NFC-e autorizada pela SEFAZ e documento fiscal real.
