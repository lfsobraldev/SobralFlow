import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import { relatorioValorizacaoEstoque } from '@/services/relatorioService';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'verRelatorios')) {
    return NextResponse.json({ erro: 'Sem permissão para exportar relatórios' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pedidoId = searchParams.get('pedidoId') ?? undefined;
  const formato = searchParams.get('formato') === 'csv' ? 'csv' : 'xlsx';

  const { linhas, valorTotalGeral } = await relatorioValorizacaoEstoque(sessao.empresaId, pedidoId);

  const dados = linhas.map((p) => ({
    Código: p.codigo,
    Descrição: p.descricao,
    Categoria: p.categoria ?? '',
    Unidade: p.unidade,
    Saldo: p.saldo,
    'Estoque mínimo': p.estoqueMinimo ?? '',
    'Custo unitário': p.custoUnitario ?? '',
    'Valor total': p.valorTotal ?? '',
  }));
  dados.push({
    Código: '',
    Descrição: 'VALOR TOTAL DO ESTOQUE',
    Categoria: '',
    Unidade: '',
    Saldo: '' as any,
    'Estoque mínimo': '',
    'Custo unitário': '',
    'Valor total': Math.round(valorTotalGeral * 100) / 100,
  });

  const planilha = XLSX.utils.json_to_sheet(dados);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, 'Valorização de estoque');

  if (formato === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(planilha);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="relatorio-valorizacao-estoque.csv"',
      },
    });
  }

  const buffer = XLSX.write(livro, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="relatorio-valorizacao-estoque.xlsx"',
    },
  });
}
