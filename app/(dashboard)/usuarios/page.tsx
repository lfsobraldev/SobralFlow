import { redirect } from 'next/navigation';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import { UsuariosClient } from '@/components/usuarios/UsuariosClient';

export default async function UsuariosPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect('/login');
  if (!temPermissao(sessao.perfil, 'gerenciarUsuarios')) {
    redirect('/dashboard');
  }

  return <UsuariosClient />;
}
