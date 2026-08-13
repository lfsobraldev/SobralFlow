'use client';

import { Users, UserPlus } from 'lucide-react';
import { useGestaoUsuarios } from '@/features/usuarios/useGestaoUsuarios';
import { FormularioNovoUsuario } from '@/components/usuarios/FormularioNovoUsuario';
import { formatarData } from '@/lib/formatacao';
import { ROTULO_PERFIL } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, TOM_POR_PERFIL } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export function UsuariosClient() {
  const { usuarios, carregando, erro, criarUsuario, alternarAtivo } = useGestaoUsuarios();

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader
        icon={Users}
        title="Gestão de usuários"
        subtitle="Controle de acesso por perfil — Administrador, Gerente, Encarregado e Operador."
      />

      <Card padding="none">
        <CardHeader title="Novo usuário" subtitle="Cadastre um novo colaborador e defina seu nível de acesso" icon={UserPlus} />
        <div className="p-4 md:p-5">
          <FormularioNovoUsuario onCriar={criarUsuario} />
        </div>
      </Card>

      {erro && (
        <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm font-medium text-critical">
          {erro}
        </div>
      )}

      <Card padding="none">
        <CardHeader title="Usuários cadastrados" subtitle={`${usuarios.length} usuário(s)`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Login</th>
                <th className="px-5 py-3">Perfil</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0 transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium text-base-950">{u.nome}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-base-800/70">{u.login}</td>
                  <td className="px-5 py-3.5">
                    <Badge tom={TOM_POR_PERFIL[u.perfil] ?? 'neutro'}>{ROTULO_PERFIL[u.perfil as keyof typeof ROTULO_PERFIL] ?? u.perfil}</Badge>
                  </td>
                  <td className="px-5 py-3.5 tabular text-base-800/70">{formatarData(u.criadoEm)}</td>
                  <td className="px-5 py-3.5">
                    <Badge tom={u.ativo ? 'positivo' : 'neutro'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => alternarAtivo(u.id, !u.ativo)}
                      className="text-xs font-medium text-action hover:underline"
                    >
                      {u.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}

              {!carregando && usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-base-800/50">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-base-800/50">
        Dica: para criar usuários sem abrir o sistema, use o atalho de terminal{' '}
        <code className="font-mono">npm run user:create</code>.
      </p>
    </div>
  );
}
