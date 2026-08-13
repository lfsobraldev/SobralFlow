import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import {
  relatorioValorizacaoEstoque,
  relatorioMovimentacoesPorPeriodo,
  relatorioTopProdutosMovimentados,
  relatorioEstoqueBaixo,
} from '@/services/relatorioService';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'verRelatorios')) {
    return NextResponse.json({ erro: 'Sem permissão para ver relatórios' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pedidoId = searchParams.get('pedidoId') ?? undefined;

  const dataFim = searchParams.get('dataFim') ? new Date(searchParams.get('dataFim')!) : new Date();
  dataFim.setHours(23, 59, 59, 999);
  const dataInicio = searchParams.get('dataInicio')
    ? new Date(searchParams.get('dataInicio')!)
    : new Date(dataFim.getTime() - 29 * 86400000);
  dataInicio.setHours(0, 0, 0, 0);

  const [valorizacao, movimentacoes, topProdutos, estoqueBaixo] = await Promise.all([
    relatorioValorizacaoEstoque(sessao.empresaId, pedidoId),
    relatorioMovimentacoesPorPeriodo(sessao.empresaId, dataInicio, dataFim, pedidoId),
    relatorioTopProdutosMovimentados(sessao.empresaId, dataInicio, dataFim, 10, pedidoId),
    relatorioEstoqueBaixo(sessao.empresaId, pedidoId),
  ]);

  return NextResponse.json({
    periodo: { inicio: dataInicio, fim: dataFim },
    valorizacao,
    movimentacoes,
    topProdutos,
    estoqueBaixo,
  });
}
