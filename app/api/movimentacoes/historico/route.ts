import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { buscarHistorico } from '@/services/historicoService';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const produtoTermo = searchParams.get('produto') ?? undefined;
  const usuarioId = searchParams.get('usuarioId') ?? undefined;
  const dataInicioStr = searchParams.get('dataInicio');
  const dataFimStr = searchParams.get('dataFim');
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('porPagina') ?? '20', 10) || 20));

  const resultado = await buscarHistorico(sessao.empresaId, {
    produtoTermo,
    usuarioId,
    dataInicio: dataInicioStr ? new Date(dataInicioStr) : undefined,
    // fim do dia selecionado, para incluir o dia inteiro no filtro
    dataFim: dataFimStr ? new Date(`${dataFimStr}T23:59:59.999`) : undefined,
    pagina,
    porPagina,
  });

  return NextResponse.json(resultado);
}
