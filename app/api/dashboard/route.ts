import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import {
  obterMetricasDashboard,
  listarProdutosCriticos,
  listarProdutosDivergentes,
  obterIndicadoresFinanceiros,
  obterResumoMovimentacoes,
  obterResumoMovimentacoesMensal,
  obterDistribuicaoPorCategoria,
  contarPedidosAtivos,
} from '@/services/dashboardService';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const pedidoId = request.nextUrl.searchParams.get('pedidoId') ?? undefined;

  const [metricas, criticos, divergentes, financeiro, movimentacoes, movimentacoesMensal, categorias, pedidosAtivos] = await Promise.all([
    obterMetricasDashboard(sessao.empresaId, pedidoId),
    listarProdutosCriticos(sessao.empresaId, 10, pedidoId),
    listarProdutosDivergentes(sessao.empresaId, 10, pedidoId),
    obterIndicadoresFinanceiros(sessao.empresaId, pedidoId),
    obterResumoMovimentacoes(sessao.empresaId, 7, pedidoId),
    obterResumoMovimentacoesMensal(sessao.empresaId, 6, pedidoId),
    obterDistribuicaoPorCategoria(sessao.empresaId, pedidoId),
    contarPedidosAtivos(sessao.empresaId),
  ]);

  return NextResponse.json({
    metricas,
    criticos,
    divergentes,
    financeiro,
    movimentacoes,
    movimentacoesMensal,
    categorias,
    pedidosAtivos,
  });
}
