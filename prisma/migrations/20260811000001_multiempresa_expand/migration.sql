-- ============================================================================
-- MIGRATION 1/2 - EXPAND (aditiva, segura, reversível)
-- Cria a estrutura multiempresa SEM tornar nada obrigatório ainda e SEM
-- remover nenhuma constraint existente. Nenhum dado é apagado ou reescrito.
-- Pode ser aplicada em produção sem downtime.
-- ============================================================================

-- 1. Enum de status da empresa
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'INATIVA');

-- 2. Tabela de administradores master (Sobral System) - totalmente nova
CREATE TABLE "administradores_master" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_master_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "administradores_master_email_key" ON "administradores_master"("email");

-- 3. Tabela de empresas - totalmente nova
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "logoUrl" TEXT,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- 4. empresaId adicionado como NULLABLE em todas as tabelas operacionais.
--    Nada quebra: linhas existentes ficam com empresa_id = NULL até o backfill.
ALTER TABLE "usuarios"           ADD COLUMN "empresaId" TEXT;
ALTER TABLE "pedidos"            ADD COLUMN "empresaId" TEXT;
ALTER TABLE "produtos"           ADD COLUMN "empresaId" TEXT;
ALTER TABLE "movimentacoes"      ADD COLUMN "empresaId" TEXT;
ALTER TABLE "logs_auditoria"     ADD COLUMN "empresaId" TEXT;
ALTER TABLE "sessoes_inventario" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "apontamentos"       ADD COLUMN "empresaId" TEXT;

-- 5. Foreign keys (nullable FK é permitido; não afeta linhas existentes)
ALTER TABLE "usuarios"           ADD CONSTRAINT "usuarios_empresaId_fkey"           FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos"            ADD CONSTRAINT "pedidos_empresaId_fkey"            FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "produtos"           ADD CONSTRAINT "produtos_empresaId_fkey"           FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimentacoes"      ADD CONSTRAINT "movimentacoes_empresaId_fkey"      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "logs_auditoria"     ADD CONSTRAINT "logs_auditoria_empresaId_fkey"     FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessoes_inventario" ADD CONSTRAINT "sessoes_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "apontamentos"       ADD CONSTRAINT "apontamentos_empresaId_fkey"       FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Índices para as novas colunas (queries por empresa vão ser o padrão)
CREATE INDEX "usuarios_empresaId_idx"           ON "usuarios"("empresaId");
CREATE INDEX "pedidos_empresaId_idx"            ON "pedidos"("empresaId");
CREATE INDEX "produtos_empresaId_idx"           ON "produtos"("empresaId");
CREATE INDEX "movimentacoes_empresaId_idx"      ON "movimentacoes"("empresaId");
CREATE INDEX "logs_auditoria_empresaId_idx"     ON "logs_auditoria"("empresaId");
CREATE INDEX "sessoes_inventario_empresaId_idx" ON "sessoes_inventario"("empresaId");
CREATE INDEX "apontamentos_empresaId_idx"       ON "apontamentos"("empresaId");

-- NOTA: as constraints antigas (usuarios.login UNIQUE, produtos.codigo UNIQUE,
-- produtos.codigoBarras UNIQUE, pedidos.nome UNIQUE) continuam intactas.
-- Serão substituídas por constraints compostas somente na migration de
-- "contract" (2/2), depois de confirmado o backfill.
