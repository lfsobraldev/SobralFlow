-- ============================================================================
-- MIGRATION 2/2 - CONTRACT
-- SÓ APLICAR DEPOIS de confirmar que scripts/migrar-empresa-famossul.ts
-- rodou com sucesso e não sobrou nenhuma linha com empresaId NULL.
-- Esta migration torna empresaId obrigatório e troca as constraints únicas
-- globais por constraints compostas (empresaId + campo).
-- ============================================================================

-- 1. Tornar empresaId obrigatório (NOT NULL).
--    Só funciona se TODAS as linhas já tiverem empresaId preenchido —
--    caso contrário o Postgres rejeita o comando e nada é alterado.
ALTER TABLE "usuarios"           ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "pedidos"            ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "produtos"           ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "movimentacoes"      ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "logs_auditoria"     ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "sessoes_inventario" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "apontamentos"       ALTER COLUMN "empresaId" SET NOT NULL;

-- 2. Trocar constraints únicas globais por compostas (por empresa).
--    Login, código de produto, código de barras e nome de pedido passam a
--    ser únicos DENTRO da empresa, não mais no banco inteiro.

-- usuarios.login
DROP INDEX IF EXISTS "usuarios_login_key";
CREATE UNIQUE INDEX "usuarios_empresaId_login_key" ON "usuarios"("empresaId", "login");

-- produtos.codigo
DROP INDEX IF EXISTS "produtos_codigo_key";
CREATE UNIQUE INDEX "produtos_empresaId_codigo_key" ON "produtos"("empresaId", "codigo");

-- produtos.codigoBarras
DROP INDEX IF EXISTS "produtos_codigoBarras_key";
CREATE UNIQUE INDEX "produtos_empresaId_codigoBarras_key" ON "produtos"("empresaId", "codigoBarras");

-- pedidos.nome
DROP INDEX IF EXISTS "pedidos_nome_key";
CREATE UNIQUE INDEX "pedidos_empresaId_nome_key" ON "pedidos"("empresaId", "nome");
