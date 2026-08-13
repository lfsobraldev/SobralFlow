import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessaoAtual, hashSenha } from '@/lib/auth';
import { getPrismaEmpresa, RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';
import { temPermissao } from '@/types';

const atualizarUsuarioSchema = z.object({
  nome: z.string().min(1).optional(),
  perfil: z.enum(['ADMINISTRADOR', 'GERENTE', 'ENCARREGADO', 'OPERADOR']).optional(),
  ativo: z.boolean().optional(),
  novaSenha: z.string().min(4).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'gerenciarUsuarios')) {
    return NextResponse.json({ erro: 'Apenas administradores podem editar usuários' }, { status: 403 });
  }

  // Trava de segurança: ninguém desativa a si mesmo e fica trancado para fora do sistema.
  if (params.id === sessao.id) {
    const bodyChecagem = await request.clone().json().catch(() => ({}));
    if (bodyChecagem.ativo === false) {
      return NextResponse.json({ erro: 'Você não pode desativar seu próprio usuário' }, { status: 400 });
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = atualizarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  const { novaSenha, ...resto } = parsed.data;

  const db = getPrismaEmpresa(sessao.empresaId);

  try {
    const usuario = await db.usuario.update({
      where: { id: params.id },
      data: {
        ...resto,
        ...(novaSenha ? { senhaHash: await hashSenha(novaSenha) } : {}),
      },
      select: { id: true, nome: true, login: true, perfil: true, ativo: true, criadoEm: true },
    });

    return NextResponse.json({ usuario });
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 });
    }
    throw e;
  }
}
