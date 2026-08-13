# Migration "contract" — NÃO mover para `prisma/migrations/` ainda

Esta migration (`20260811000002_multiempresa_contract`) torna `empresaId`
**obrigatório** em todas as tabelas e troca constraints únicas globais
(login, código de produto, código de barras, nome de pedido) por constraints
únicas **por empresa**.

Ela só pode ser aplicada **depois** que `scripts/migrar-empresa-famossul.ts`
já tiver associado todos os registros existentes a uma empresa — caso
contrário o banco vai ter linhas com `empresaId` nulo, e o `ALTER COLUMN ...
SET NOT NULL` vai falhar (o que é o comportamento correto: o Postgres
recusa, em vez de aplicar silenciosamente e corromper dados).

Por isso ela fica **fora** de `prisma/migrations/` propositalmente: se
estivesse na pasta normal, `prisma migrate deploy` tentaria aplicá-la
imediatamente após a migration "expand", na mesma execução, antes de haver
qualquer chance de rodar o script de backfill entre as duas.

## Como aplicar (nesta ordem, sempre)

```bash
# 1. Migration expand (aditiva, segura)
npx prisma migrate deploy

# 2. Backfill — associa os dados existentes à empresa Famossul
npx tsx scripts/migrar-empresa-famossul.ts

# 3. SÓ ENTÃO mover esta migration para o lugar certo e aplicá-la
mv prisma/migrations-contract-pendente/20260811000002_multiempresa_contract prisma/migrations/
npx prisma migrate deploy
```

Depois do passo 3, esta pasta (`migrations-contract-pendente`) fica vazia e
pode ser removida do repositório.
