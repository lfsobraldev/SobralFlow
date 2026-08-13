import { redirect } from 'next/navigation';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import { RelatoriosClient } from '@/components/relatorios/RelatoriosClient';

export default async function RelatoriosPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect('/login');
  if (!temPermissao(sessao.perfil, 'verRelatorios')) {
    redirect('/dashboard');
  }

  return <RelatoriosClient />;
}
