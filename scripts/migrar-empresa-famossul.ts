/**
 * Script de migração de dados (rodar UMA VEZ, depois da migration "expand"
 * e ANTES da migration "contract").
 *
 * O que faz:
 * 1. Cria a empresa "Famossul" (idempotente: se já existir pelo CNPJ, reaproveita).
 * 2. Associa a ela TODOS os registros que hoje estão com empresaId = NULL,
 *    em todas as tabelas operacionais.
 * 3. Roda tudo dentro de uma única transação: ou aplica tudo, ou nada muda.
 *
 * Uso:
 *   npx tsx scripts/migrar-empresa-famossul.ts
 *
 * Seguro rodar mais de uma vez (idempotente) — na segunda execução não há
 * mais linhas com empresaId NULL, então os UPDATEs afetam 0 linhas.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// CNPJ placeholder - AJUSTAR para o CNPJ real da Famossul antes de rodar em produção.
const CNPJ_FAMOSSUL = '00.000.000/0001-00';

async function main() {
  console.log('=== Migração de dados: associando registros existentes à Famossul ===');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let empresa = await tx.empresa.findUnique({ where: { cnpj: CNPJ_FAMOSSUL } });

    if (!empresa) {
      empresa = await tx.empresa.create({
        data: {
          razaoSocial: 'Famossul',
          nomeFantasia: 'Famossul',
          cnpj: CNPJ_FAMOSSUL,
          status: 'ATIVA',
        },
      });
      console.log(`✅ Empresa "Famossul" criada (id: ${empresa.id})`);
    } else {
      console.log(`ℹ️  Empresa "Famossul" já existia (id: ${empresa.id}). Reaproveitando.`);
    }

    const resultados = {
      usuarios: await tx.usuario.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      pedidos: await tx.pedido.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      produtos: await tx.produto.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      movimentacoes: await tx.movimentacao.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      logsAuditoria: await tx.logAuditoria.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      sessoesInventario: await tx.sessaoInventario.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
      apontamentos: await tx.apontamento.updateMany({
        where: { empresaId: null as any },
        data: { empresaId: empresa.id },
      }),
    };

    console.log('Registros associados à Famossul:');
    for (const [tabela, resultado] of Object.entries(resultados)) {
      console.log(`  - ${tabela}: ${resultado.count}`);
    }

    // Verificação de segurança: se sobrar QUALQUER linha com empresaId nulo
    // em qualquer tabela, aborta a transação inteira (nada é salvo).
    const pendentes = {
      usuarios: await tx.usuario.count({ where: { empresaId: null as any } }),
      pedidos: await tx.pedido.count({ where: { empresaId: null as any } }),
      produtos: await tx.produto.count({ where: { empresaId: null as any } }),
      movimentacoes: await tx.movimentacao.count({ where: { empresaId: null as any } }),
      logsAuditoria: await tx.logAuditoria.count({ where: { empresaId: null as any } }),
      sessoesInventario: await tx.sessaoInventario.count({ where: { empresaId: null as any } }),
      apontamentos: await tx.apontamento.count({ where: { empresaId: null as any } }),
    };
    const totalPendente = Object.values(pendentes).reduce((a, b) => a + b, 0);
    if (totalPendente > 0) {
      throw new Error(
        `Abortando: ainda restam ${totalPendente} registros sem empresaId após o backfill. ` +
          `Detalhe: ${JSON.stringify(pendentes)}`
      );
    }
  });

  console.log('✅ Migração concluída com sucesso. Todos os registros existentes pertencem à Famossul.');
  console.log('   Próximo passo: rodar a migration de "contract" (NOT NULL + constraints compostas).');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
