# Guia de Deploy Gratuito (Neon + Vercel)

Sem precisar instalar Node.js no PC da empresa. Tudo pelo navegador.

## 1. Criar o banco de dados (Neon)

1. Acesse https://neon.tech e crie uma conta gratuita (não pede cartão).
2. Crie um novo projeto (qualquer nome, ex: `estoque`).
3. Na tela do projeto, copie a **Connection String** (algo como
   `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb?sslmode=require`).
   Guarde essa string, vai usar no passo 3.

## 2. Subir o código para o GitHub

1. Acesse https://github.com e crie uma conta (se ainda não tiver).
2. Crie um repositório novo (ex: `estoque-system`), pode ser privado.
3. Na página do repositório vazio, use a opção **"uploading an existing file"**
   (ou arraste a pasta do projeto) para subir todos os arquivos direto pelo navegador —
   não precisa de Git instalado.

## 3. Deploy na Vercel

1. Acesse https://vercel.com e crie uma conta (pode entrar direto com o GitHub).
2. **Add New → Project** → selecione o repositório que você acabou de subir.
3. Antes de clicar em "Deploy", abra **Environment Variables** e adicione:
   - `DATABASE_URL` → cole a connection string do Neon (passo 1)
   - `SESSION_SECRET` → qualquer texto aleatório longo (ex: gere em
     https://generate-secret.vercel.app/32)
   - `MASTER_SESSION_SECRET` → outro texto aleatório longo, **diferente** do
     `SESSION_SECRET` acima (gere em https://generate-secret.vercel.app/32
     de novo — precisa ser um valor distinto, usado só pelo login do Painel
     Master)
4. Clique em **Deploy**. A Vercel instala tudo e gera uma URL pública (algo
   como `estoque-system.vercel.app`). O `npm run build` NÃO altera o banco
   automaticamente (isso é proposital, para não rodar nada destrutivo a
   cada deploy) — depois do primeiro deploy, rode as migrations manualmente
   (passo 3.1 abaixo).

### 3.1 Rodar as migrations (uma vez, na ordem certa)

Este projeto passou por uma migração para SaaS multiempresa em 3 etapas.
**A ordem importa — pular ou inverter passos pode deixar o banco com dados
inconsistentes.** Rode do seu terminal, com o `.env` local apontando para o
`DATABASE_URL` de produção (Neon):

```bash
npm install

# 1) Migration "expand" — aditiva, cria as tabelas novas (Empresa,
#    AdministradorMaster) e adiciona empresaId como coluna OPCIONAL em todas
#    as tabelas existentes. Não apaga nem altera nenhum dado existente.
#    (só esta migration está em prisma/migrations/ neste momento — a
#    próxima fica guardada em prisma/migrations-contract-pendente/ até
#    chegar a hora certa de aplicá-la, ver README lá dentro)
npx prisma migrate deploy

# 2) Associa TODOS os registros existentes (usuários, produtos, pedidos,
#    movimentações, etc.) à empresa "Famossul". Roda em uma única transação
#    — ou tudo é associado, ou nada muda. Seguro rodar mais de uma vez.
#    IMPORTANTE: abra scripts/migrar-empresa-famossul.ts e confira o CNPJ
#    placeholder (CNPJ_FAMOSSUL) antes de rodar — ajuste para o CNPJ real.
npx tsx scripts/migrar-empresa-famossul.ts

# 3) SÓ DEPOIS do passo 2 ter rodado com sucesso: mova a migration
#    "contract" para o lugar certo e aplique. Ela torna empresaId
#    OBRIGATÓRIO e troca constraints (login, código de produto, etc.) de
#    globais para por-empresa.
mv prisma/migrations-contract-pendente/20260811000002_multiempresa_contract prisma/migrations/
npx prisma migrate deploy
```

Se o passo 3 falhar dizendo que não pode aplicar "NOT NULL" numa coluna com
valores nulos, é sinal de que o passo 2 não rodou (ou falhou) antes — pare,
rode o passo 2, e repita o passo 3.

Depois disso, rode `npx prisma db seed` (seção 4 abaixo) para criar o
primeiro usuário admin.

## 4. Criar o usuário admin no banco em produção

Depois de rodar `npm run prisma:deploy` (passo acima), as tabelas já existem no
banco, incluindo a empresa Famossul (criada pelo script de migração de dados,
não pelo seed). O **seed** (usuário admin/admin e produtos de demonstração)
não roda sozinho em produção — rode uma vez pelo terminal do seu próprio PC
(não precisa ser o da empresa), apontando pro banco do Neon:

```bash
# na pasta do projeto, com o .env local apontando para a DATABASE_URL do Neon:
npm install
npx prisma db seed
```

O seed agora reaproveita a empresa Famossul se ela já existir (procura pelo
mesmo CNPJ usado em `scripts/migrar-empresa-famossul.ts`) — não cria uma
segunda empresa por engano. **Troque a senha "admin/admin" assim que logar
pela primeira vez** — esse valor está neste repositório, então é
publicamente conhecido.
