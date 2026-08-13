import { NextResponse } from 'next/server';
import { obterSessaoMasterAtual, removerCookieSessaoMaster } from '@/lib/auth';
import { logSegurancaMaster } from '@/lib/log-master';

export async function POST() {
  const sessao = await obterSessaoMasterAtual();
  await removerCookieSessaoMaster();
  if (sessao) {
    logSegurancaMaster({ acao: 'LOGOUT', email: sessao.email });
  }
  return NextResponse.json({ ok: true });
}
