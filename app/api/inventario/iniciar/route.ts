import { NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { iniciarSessaoInventario } from '@/services/inventarioService';

export async function POST() {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const sessaoInventario = await iniciarSessaoInventario(sessao.empresaId, sessao.id);
  return NextResponse.json({ sessaoInventario });
}
