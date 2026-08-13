import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessaoAtual, hashSenha } from '@/lib/auth';
import { getPrismaEmpresa } from '@/lib/prisma-empresa';
import { temPermissao } from '@/types';

const criarUsuarioSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  login: z.string().min(3, 'Login deve ter pelo menos 3 caracteres'),
  senha: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
  perfil: z.enum(['ADMINISTRADOR', 'GERENTE', 'ENCARREGADO', 'OPERADOR']),
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'gerenciarUsuarios')) {
    return NextResponse.json({ erro: 'Apenas administradores podem criar usuários' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = criarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  const db = getPrismaEmpresa(sessao.empresaId);

  const existente = await db.usuario.findUnique({ where: { login: parsed.data.login } });
  if (existente) {
    return NextResponse.json({ erro: 'Já existe um usuário com esse login' }, { status: 409 });
  }

  const senhaHash = await hashSenha(parsed.data.senha);
  const usuario = await db.usuario.create({
    data: {
      nome: parsed.data.nome,
      login: parsed.data.login,
      senhaHash,
      perfil: parsed.data.perfil,
    },
    select: { id: true, nome: true, login: true, perfil: true, ativo: true, criadoEm: true },
  });

  return NextResponse.json({ usuario });
}
