import { redirect } from 'next/navigation';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import { AuditoriaClient } from '@/components/auditoria/AuditoriaClient';

export default async function AuditoriaPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect('/login');
  if (!temPermissao(sessao.perfil, 'verAuditoria')) {
    redirect('/dashboard');
  }

  return <AuditoriaClient />;
}
