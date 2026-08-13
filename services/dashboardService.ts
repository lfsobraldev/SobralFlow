import { getPrismaEmpresa } from '@/lib/prisma-empresa';

export async function obterMetricasDashboard(empresaId: string, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const filtroPedido = pedidoId ? { pedidoId } : {};

  const [totalItens, itensConferidos, movimentacoesHoje, ultimaMovimentacao, todosOsProdutos] =
    await Promise.all([
      db.produto.count({ where: filtroPedido }),
      db.produto.count({ where: { ...filtroPedido, NOT: { contagem: null } } }),
      db.movimentacao.count({
        where: {
          criadoEm: { gte: inicioDoDia },
          ...(pedidoId ? { produto: { pedidoId } } : {}),
        },
      }),
      db.movimentacao.findFirst({
        where: pedidoId ? { produto: { pedidoId } } : {},
        orderBy: { criadoEm: 'desc' },
        select: { criadoEm: true },
      }),
      // Estoque crítico e divergência comparam 2 campos do mesmo registro — SQLite/Postgres
      // via Prisma não filtram isso nativamente em uma query simples, então trazemos os
      // campos mínimos necessários e comparamos em memória.
      db.produto.findMany({
        where: filtroPedido,
        select: { id: true, saldo: true, contagem: true, estoqueMinimo: true },
      }),
    ]);

  const itensPendentes = totalItens - itensConferidos;

  const estoqueCritico = todosOsProdutos.filter(
    (p: any) => p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo
  ).length;

  const produtosDivergentes = todosOsProdutos.filter(
    (p: any) => p.contagem != null && p.contagem !== p.saldo
  ).length;

  return {
    totalItens,
    itensConferidos,
    itensPendentes,
    movimentacoesHoje,
    estoqueCritico,
    produtosDivergentes,
    ultimaAtualizacao: ultimaMovimentacao?.criadoEm ?? null,
  };
}

export async function listarProdutosCriticos(empresaId: string, limite = 10, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const produtos = await db.produto.findMany({
    where: { estoqueMinimo: { not: null }, ...(pedidoId ? { pedidoId } : {}) },
  });
  return produtos
    .filter((p: any) => p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo)
    .sort((a: any, b: any) => a.saldo - b.saldo)
    .slice(0, limite);
}

export async function listarProdutosDivergentes(empresaId: string, limite = 10, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const produtos = await db.produto.findMany({
    where: { NOT: { contagem: null }, ...(pedidoId ? { pedidoId } : {}) },
  });
  return produtos
    .filter((p: any) => p.contagem !== p.saldo)
    .sort(
      (a: any, b: any) =>
        Math.abs((b.contagem ?? 0) - b.saldo) - Math.abs((a.contagem ?? 0) - a.saldo)
    )
    .slice(0, limite);
}

// ─────────────────────────────────────────────────────────────────────────────
// KPIs executivos adicionais (dashboard corporativo): valor de estoque, custo
// médio, entradas/saídas do período e pedidos ativos. Todas as funções abaixo
// são somente leitura e não alteram nenhuma regra de negócio existente.
// ─────────────────────────────────────────────────────────────────────────────

export async function obterIndicadoresFinanceiros(empresaId: string, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const filtroPedido = pedidoId ? { pedidoId } : {};

  const produtos = await db.produto.findMany({
    where: filtroPedido,
    select: { saldo: true, custoUnitario: true },
  });

  const comCusto = produtos.filter((p: any) => p.custoUnitario != null);
  const valorEstoque = comCusto.reduce((acc: number, p: any) => acc + p.saldo * (p.custoUnitario ?? 0), 0);
  const custoMedio = comCusto.length
    ? comCusto.reduce((acc: number, p: any) => acc + (p.custoUnitario ?? 0), 0) / comCusto.length
    : 0;

  return {
    valorEstoque,
    custoMedio,
    produtosComCusto: comCusto.length,
    totalProdutos: produtos.length,
  };
}

export async function obterResumoMovimentacoes(empresaId: string, dias = 7, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));

  const movimentacoes = await db.movimentacao.findMany({
    where: {
      criadoEm: { gte: inicio },
      ...(pedidoId ? { produto: { pedidoId } } : {}),
    },
    select: { tipo: true, valor: true, criadoEm: true },
  });

  // Série diária para o gráfico de barras/linha do dashboard.
  const serie: {
    data: Date;
    rotulo: string;
    entradas: number;
    saidas: number;
    movimentos: number;
  }[] = [];
  for (let i = 0; i < dias; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    serie.push({
      data,
      rotulo: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      entradas: 0,
      saidas: 0,
      movimentos: 0,
    });
  }

  let entradasPeriodo = 0;
  let saidasPeriodo = 0;

  for (const mov of movimentacoes) {
    const idx = Math.floor((mov.criadoEm.getTime() - inicio.getTime()) / 86400000);
    const dia = serie[idx];
    const positivo = mov.valor > 0;
    if (
      mov.tipo === 'ENTRADA' ||
      (mov.tipo === 'AJUSTE_CONTAGEM' && positivo) ||
      (mov.tipo === 'CORRECAO_MANUAL' && positivo)
    ) {
      entradasPeriodo += Math.abs(mov.valor);
      if (dia) dia.entradas += Math.abs(mov.valor);
    } else {
      saidasPeriodo += Math.abs(mov.valor);
      if (dia) dia.saidas += Math.abs(mov.valor);
    }
    if (dia) dia.movimentos += 1;
  }

  return { serie, entradasPeriodo, saidasPeriodo, totalMovimentos: movimentacoes.length };
}

export async function obterResumoMovimentacoesMensal(empresaId: string, meses = 6, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1), 1);

  const movimentacoes = await db.movimentacao.findMany({
    where: {
      criadoEm: { gte: inicio },
      ...(pedidoId ? { produto: { pedidoId } } : {}),
    },
    select: { tipo: true, valor: true, criadoEm: true },
  });

  const serie: {
    rotulo: string;
    ano: number;
    mes: number;
    entradas: number;
    saidas: number;
    movimentos: number;
  }[] = [];
  for (let i = 0; i < meses; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1) + i, 1);
    serie.push({
      rotulo: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
      ano: data.getFullYear(),
      mes: data.getMonth(),
      entradas: 0,
      saidas: 0,
      movimentos: 0,
    });
  }

  for (const mov of movimentacoes) {
    const idx = serie.findIndex(
      (m) => m.ano === mov.criadoEm.getFullYear() && m.mes === mov.criadoEm.getMonth()
    );
    const item = serie[idx];
    if (!item) continue;
    const positivo = mov.valor > 0;
    if (
      mov.tipo === 'ENTRADA' ||
      (mov.tipo === 'AJUSTE_CONTAGEM' && positivo) ||
      (mov.tipo === 'CORRECAO_MANUAL' && positivo)
    ) {
      item.entradas += Math.abs(mov.valor);
    } else {
      item.saidas += Math.abs(mov.valor);
    }
    item.movimentos += 1;
  }

  return {
    serie: serie.map(({ rotulo, entradas, saidas, movimentos }) => ({
      rotulo,
      entradas,
      saidas,
      movimentos,
    })),
  };
}

export async function obterDistribuicaoPorCategoria(empresaId: string, pedidoId?: string) {
  const db = getPrismaEmpresa(empresaId);
  const produtos = await db.produto.findMany({
    where: pedidoId ? { pedidoId } : {},
    select: { categoria: true, saldo: true },
  });

  const mapa = new Map<string, number>();
  for (const p of produtos) {
    const chave = p.categoria?.trim() || 'Sem categoria';
    mapa.set(chave, (mapa.get(chave) ?? 0) + p.saldo);
  }

  return Array.from(mapa.entries())
    .map(([categoria, saldo]) => ({ categoria, saldo: Math.round(saldo * 100) / 100 }))
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 6);
}

export async function contarPedidosAtivos(empresaId: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.pedido.count({ where: { ativo: true } });
}
