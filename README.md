# Bicho de Pelo

Sistema local de caixa e emissao NFC-e para o petshop Bicho de Pelo.

## O que o sistema faz

- Roda um frontend local em `http://localhost:3000`.
- Roda um backend local em `http://localhost:3333`.
- Salva configuracao fiscal, certificado A1 e XMLs em `data/`.
- Valida certificado A1 `.pfx` ou `.p12` no upload.
- Consulta status real da SEFAZ/SVRS.
- Assina XML NFC-e.
- Envia NFC-e para autorizacao real em homologacao/producao.
- Grava XML autorizado/local em `data/nfce-<numero>.xml` e `data/nfce-<numero>-signed.xml`.

Importante: `data/` fica fora do Git porque contem certificado, senha fiscal, configuracao local e XMLs emitidos.

## Rodar localmente

Pre-requisito: Node.js instalado.

```bash
npm install
npm run dev:all
```

Abra:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:3333/api/health
```

## Configuracao fiscal

Na tela `Configuracao Fiscal`, preencha:

- Razao social
- CNPJ
- Inscricao Estadual
- Codigo IBGE do municipio
- Regime tributario
- CSC
- ID CSC
- Serie NFC-e
- Proximo numero NFC-e
- Ambiente: local, homologacao ou producao
- Certificado A1 `.pfx` ou `.p12`

O sistema valida o certificado no upload:

- Confere se o arquivo abre com a senha informada.
- Confere se existe certificado e chave privada.
- Confere se a chave privada corresponde ao certificado.
- Confere se o certificado esta dentro da validade.

## Produtos cadastrados

Os produtos do caixa ja incluem NCM, CFOP e unidade para emissao:

- Produtos de banho pet: NCM `33079000`, CFOP `5102`
- Produtos banho e tosa pet: NCM `33079000`, CFOP `5102`
- Shampoo/condicionador pet: NCM `33079000`, CFOP `5102`
- Hidratacao de pelagem pet: NCM `33079000`, CFOP `5102`
- Colonia pos-banho pet: NCM `33079000`, CFOP `5102`
- Racao caes/gatos 1kg: NCM `23091000`, CFOP `5102`
- Racao caes/gatos 10kg: NCM `23091000`, CFOP `5102`
- Racao Golden 15kg: NCM `23091000`, CFOP `5102`

## Instalar no computador servidor

Este computador sera o caixa/servidor local. Os outros computadores acessam pelo IP dele.

1. Instale o Node.js LTS:

   ```text
   https://nodejs.org/
   ```

2. Baixe o projeto:

   ```bash
   git clone https://github.com/JhonTech-prog/Bicho-de-Pelo.git
   cd Bicho-de-Pelo
   npm install
   ```

3. Inicie o sistema:

   ```bash
   npm run dev:all
   ```

4. No computador servidor, abra:

   ```text
   http://localhost:3000
   ```

5. Nos outros computadores da rede, abra usando o IP do servidor:

   ```text
   http://IP-DO-SERVIDOR:3000
   ```

   Exemplo:

   ```text
   http://192.168.1.138:3000
   ```

6. Libere as portas no Firewall do Windows, se outro computador nao conseguir acessar:

   ```powershell
   New-NetFirewallRule -DisplayName "Bicho de Pelo Frontend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   New-NetFirewallRule -DisplayName "Bicho de Pelo Backend 3333" -Direction Inbound -Protocol TCP -LocalPort 3333 -Action Allow
   ```

7. Configure a parte fiscal pela tela `Configuracao Fiscal`:

   - Preencha empresa, IE, CSC, ID CSC, serie e proximo numero.
   - Envie o certificado A1.
   - Clique em `Testar SEFAZ Real`.
   - Para emissao real, selecione `Producao`.

8. Teste uma venda pequena.

   Se a nota for autorizada, o cupom deve mostrar:

   - `AUTORIZADA`
   - Protocolo SEFAZ
   - Chave de acesso
   - QR Code da SEFAZ-PB

## Manter o servidor ligado

Para operacao diaria simples:

1. Ligue o computador servidor.
2. Abra o PowerShell na pasta do projeto.
3. Rode:

   ```bash
   npm run dev:all
   ```

4. Deixe a janela aberta enquanto o caixa estiver usando o sistema.

Para iniciar automaticamente com o Windows, crie uma tarefa no Agendador de Tarefas:

- Programa: `powershell.exe`
- Argumentos:

  ```powershell
  -NoExit -ExecutionPolicy Bypass -Command "cd 'C:\CAMINHO\Bicho-de-Pelo'; npm run dev:all"
  ```

Troque `C:\CAMINHO\Bicho-de-Pelo` pela pasta real do projeto no servidor.

## Backup

Faca backup periodico da pasta:

```text
data/
```

Ela contem:

- Certificado A1 salvo
- Senha fiscal local
- Configuracao fiscal
- XMLs das NFC-e emitidas

Nao envie essa pasta para GitHub, WhatsApp ou e-mail comum.

## Observacoes fiscais

- Em `producao`, uma NFC-e autorizada pela SEFAZ e documento fiscal real.
- O sistema usa a URL atual de QR Code da SEFAZ-PB: `http://www.sefaz.pb.gov.br/nfce`.
- Rejeicoes da SEFAZ aparecem na tela para correcao dos dados fiscais/produtos.
