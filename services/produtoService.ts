import { getPrismaEmpresa } from '@/lib/prisma-empresa';
import { anexarSaldoInicialMes } from '@/services/saldoService';

/**
 * Busca instantânea usada na Tela de Contagem.
 * Prioriza correspondência exata de código (leitor de código de barras / QR),
 * depois prefixo de código, depois descrição — nessa ordem, para que o operador
 * usando o leitor sempre caia direto no item certo.
 */
export async function buscarProdutos(empresaId: string, termo: string, limite = 30) {
  const db = getPrismaEmpresa(empresaId);
  const termoLimpo = termo.trim();

  if (!termoLimpo) {
    const recentes = await db.produto.findMany({
      orderBy: { atualizadoEm: 'desc' },
      take: limite,
    });
    return anexarSaldoInicialMes(empresaId, recentes);
  }

  // Código de barras ou código exato: retorno imediato de um único item
  const exato = await db.produto.findFirst({
    where: {
      OR: [{ codigo: termoLimpo }, { codigoBarras: termoLimpo }],
    },
  });
  if (exato) return anexarSaldoInicialMes(empresaId, [exato]);

  const encontrados = await db.produto.findMany({
    where: {
      OR: [
        { codigo: { contains: termoLimpo, mode: 'insensitive' } },
        { descricao: { contains: termoLimpo, mode: 'insensitive' } },
        { codigoBarras: { contains: termoLimpo, mode: 'insensitive' } },
      ],
    },
    orderBy: { descricao: 'asc' },
    take: limite,
  });
  return anexarSaldoInicialMes(empresaId, encontrados);
}

export async function obterProdutoPorId(empresaId: string, id: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.produto.findUnique({ where: { id } });
}

export async function contarProdutosPendentes(empresaId: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.produto.count({ where: { contagem: null } });
}

export async function contarProdutosConferidos(empresaId: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.produto.count({ where: { NOT: { contagem: null } } });
}
