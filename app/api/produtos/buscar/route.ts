import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { buscarProdutos } from '@/services/produtoService';
import { buscaProdutoSchema } from '@/lib/validacao';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = buscaProdutoSchema.safeParse({
    termo: searchParams.get('termo') ?? '',
    limite: searchParams.get('limite') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ erro: 'Parâmetros inválidos' }, { status: 400 });
  }

  const produtos = await buscarProdutos(sessao.empresaId, parsed.data.termo, parsed.data.limite);
  return NextResponse.json({ produtos });
}
