import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { listarPedidos, criarPedido } from '@/services/pedidoService';
import { temPermissao } from '@/types';

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const pedidos = await listarPedidos(sessao.empresaId);
  return NextResponse.json({ pedidos });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'editarProdutos')) {
    return NextResponse.json({ erro: 'Sem permissão para criar pedidos' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const nome = String(body?.nome ?? '').trim();
  if (!nome) return NextResponse.json({ erro: 'Informe o nome do pedido' }, { status: 400 });

  try {
    const pedido = await criarPedido(sessao.empresaId, nome, body?.descricao);
    return NextResponse.json({ pedido });
  } catch {
    return NextResponse.json({ erro: 'Já existe um pedido com esse nome' }, { status: 409 });
  }
}
