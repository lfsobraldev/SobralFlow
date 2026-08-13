import { getPrismaEmpresa } from '@/lib/prisma-empresa';

// Todas as consultas abaixo são somente leitura — nenhuma regra de negócio
// (cálculo de saldo, validação de movimentação etc.) é duplicada aqui; os
// relatórios apenas agregam dados que já são gravados pelos serviços de
// contagem/movimentação/produto existentes.

export async function relatorioValorizacaoEstoque(empresaId: string, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const produtos = await db.produto.findMany({
    where: pedidoId ? { pedidoId } : {},
    orderBy: { descricao: 'asc' },
    select: {
      id: true,
      codigo: true,
      descricao: true,
      categoria: true,
      unidade: true,
      saldo: true,
      custoUnitario: true,
      estoqueMinimo: true,
    },
  });

  const linhas = produtos.map((p) => ({
    ...p,
    valorTotal: p.custoUnitario != null ? Math.round(p.saldo * p.custoUnitario * 100) / 100 : null,
  }));

  const valorTotalGeral = linhas.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);

  return { linhas, valorTotalGeral };
}

export async function relatorioMovimentacoesPorPeriodo(empresaId: string, dataInicio: Date, dataFim: Date, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const movimentacoes = await db.movimentacao.findMany({
    where: {
      criadoEm: { gte: dataInicio, lte: dataFim },
      ...(pedidoId ? { produto: { pedidoId } } : {}),
    },
    include: {
      produto: { select: { codigo: true, descricao: true, unidade: true } },
      usuario: { select: { nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });

  const porTipo = movimentacoes.reduce<Record<string, { quantidade: number; total: number }>>((acc, m) => {
    acc[m.tipo] = acc[m.tipo] ?? { quantidade: 0, total: 0 };
    acc[m.tipo].quantidade += 1;
    acc[m.tipo].total += Math.abs(m.valor);
    return acc;
  }, {});

  return { movimentacoes, porTipo, total: movimentacoes.length };
}

export async function relatorioTopProdutosMovimentados(empresaId: string, dataInicio: Date, dataFim: Date, limite = 10, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const movimentacoes = await db.movimentacao.findMany({
    where: {
      criadoEm: { gte: dataInicio, lte: dataFim },
      ...(pedidoId ? { produto: { pedidoId } } : {}),
    },
    select: { produtoId: true, valor: true, produto: { select: { codigo: true, descricao: true, unidade: true } } },
  });

  const mapa = new Map<string, { codigo: string; descricao: string; unidade: string; movimentos: number; volume: number }>();
  for (const m of movimentacoes) {
    const atual = mapa.get(m.produtoId) ?? {
      codigo: m.produto.codigo,
      descricao: m.produto.descricao,
      unidade: m.produto.unidade,
      movimentos: 0,
      volume: 0,
    };
    atual.movimentos += 1;
    atual.volume += Math.abs(m.valor);
    mapa.set(m.produtoId, atual);
  }

  return Array.from(mapa.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limite);
}

export async function relatorioEstoqueBaixo(empresaId: string, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const produtos = await db.produto.findMany({
    where: { estoqueMinimo: { not: null }, ...(pedidoId ? { pedidoId } : {}) },
    orderBy: { saldo: 'asc' },
  });
  return produtos.filter((p) => p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo);
}
