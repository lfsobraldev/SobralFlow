import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessaoAtual, hashSenha, verificarSenha } from '@/lib/auth';
import { getPrismaEmpresa } from '@/lib/prisma-empresa';

const schema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  novaSenha: z.string().min(4, 'A nova senha deve ter pelo menos 4 caracteres'),
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  const db = getPrismaEmpresa(sessao.empresaId);
  const usuario = await db.usuario.findUnique({ where: { id: sessao.id } });
  if (!usuario) return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 });

  const senhaValida = await verificarSenha(parsed.data.senhaAtual, usuario.senhaHash);
  if (!senhaValida) {
    return NextResponse.json({ erro: 'Senha atual incorreta' }, { status: 401 });
  }

  const senhaHash = await hashSenha(parsed.data.novaSenha);
  await db.usuario.update({ where: { id: sessao.id }, data: { senhaHash } });

  return NextResponse.json({ ok: true });
}
