import { NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { obterRelatorioInventario } from '@/services/inventarioService';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  try {
    const relatorio = await obterRelatorioInventario(sessao.empresaId, params.id);
    return NextResponse.json(relatorio);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : 'Erro ao buscar relatório' },
      { status: 404 }
    );
  }
}
