import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { listarProdutos, criarProduto } from '@/services/produtoCrudService';
import { criarProdutoSchema } from '@/lib/validacao';
import { temPermissao } from '@/types';
import { getPrismaEmpresa } from '@/lib/prisma-empresa';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('porPagina') ?? '20', 10) || 20));

  const resultado = await listarProdutos(sessao.empresaId, {
    termo: searchParams.get('termo') ?? undefined,
    categoria: searchParams.get('categoria') ?? undefined,
    pedidoId: searchParams.get('pedidoId') ?? undefined,
    apenasCriticos: searchParams.get('criticos') === '1',
    apenasDivergentes: searchParams.get('divergentes') === '1',
    pagina,
    porPagina,
  });

  return NextResponse.json(resultado);
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'editarProdutos')) {
    return NextResponse.json({ erro: 'Sem permissão para cadastrar produtos' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = criarProdutoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  if (parsed.data.codigo) {
    const db = getPrismaEmpresa(sessao.empresaId);
    const existente = await db.produto.findUnique({ where: { codigo: parsed.data.codigo } });
    if (existente) {
      return NextResponse.json({ erro: 'Já existe um produto com esse código' }, { status: 409 });
    }
  }

  try {
    const produto = await criarProduto(sessao.empresaId, parsed.data, sessao.id);
    return NextResponse.json({ produto });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : 'Erro ao criar produto' },
      { status: 400 }
    );
  }
}
