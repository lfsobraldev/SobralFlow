import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { obterSessaoAtual } from '@/lib/auth';
import { getPrismaEmpresa } from '@/lib/prisma-empresa';
import { temPermissao } from '@/types';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'importarExportar')) {
    return NextResponse.json({ erro: 'Sem permissão para exportar' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') === 'csv' ? 'csv' : 'xlsx';

  const db = getPrismaEmpresa(sessao.empresaId);
  const produtos = await db.produto.findMany({ orderBy: { descricao: 'asc' } });

  const linhas = produtos.map((p) => ({
    Código: p.codigo,
    Descrição: p.descricao,
    Unidade: p.unidade,
    Saldo: p.saldo,
    Contagem: p.contagem ?? '',
    Diferença: p.contagem != null ? p.contagem - p.saldo : '',
    Localização: p.localizacao ?? '',
    Categoria: p.categoria ?? '',
    'Código de barras': p.codigoBarras ?? '',
    'Estoque mínimo': p.estoqueMinimo ?? '',
    'Custo unitário': p.custoUnitario ?? '',
    'Valor total': p.custoUnitario != null ? Math.round(p.saldo * p.custoUnitario * 100) / 100 : '',
    Observações: p.observacoes ?? '',
  }));

  const planilha = XLSX.utils.json_to_sheet(linhas);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, 'Produtos');

  if (formato === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(planilha);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="produtos.csv"',
      },
    });
  }

  const buffer = XLSX.write(livro, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="produtos.xlsx"',
    },
  });
}
