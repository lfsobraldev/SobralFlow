import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { atualizarProduto, excluirProduto } from '@/services/produtoCrudService';
import { atualizarProdutoSchema } from '@/lib/validacao';
import { temPermissao } from '@/types';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'editarProdutos')) {
    return NextResponse.json({ erro: 'Sem permissão para editar produtos' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = atualizarProdutoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  try {
    const produto = await atualizarProduto(sessao.empresaId, params.id, parsed.data, sessao.id);
    return NextResponse.json({ produto });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : 'Erro ao atualizar produto' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'excluirProdutos')) {
    return NextResponse.json({ erro: 'Sem permissão para excluir produtos' }, { status: 403 });
  }

  try {
    await excluirProduto(sessao.empresaId, params.id, sessao.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : 'Erro ao excluir produto' },
      { status: 400 }
    );
  }
}
