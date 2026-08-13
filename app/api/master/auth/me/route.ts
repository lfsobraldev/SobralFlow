import { NextResponse } from 'next/server';
import { obterSessaoMasterAtual } from '@/lib/auth';

export async function GET() {
  const sessao = await obterSessaoMasterAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  return NextResponse.json({ sessao });
}
