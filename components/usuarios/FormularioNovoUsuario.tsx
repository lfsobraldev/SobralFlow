'use client';

import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { ROTULO_PERFIL } from '@/types';

interface FormularioNovoUsuarioProps {
  onCriar: (dados: { nome: string; login: string; senha: string; perfil: string }) => Promise<boolean>;
}

const PERFIS_DISPONIVEIS = ['OPERADOR', 'ENCARREGADO', 'GERENTE', 'ADMINISTRADOR'] as const;

export function FormularioNovoUsuario({ onCriar }: FormularioNovoUsuarioProps) {
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('OPERADOR');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const ok = await onCriar({ nome, login, senha, perfil });
    setEnviando(false);
    if (ok) {
      setNome('');
      setLogin('');
      setSenha('');
      setPerfil('OPERADOR');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 md:grid-cols-5 md:items-end"
    >
      <div className="col-span-2 md:col-span-1">
        <label className="mb-1 block text-xs font-medium text-base-800/70">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none transition-colors focus:border-action"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-base-800/70">Login</label>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none transition-colors focus:border-action"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-base-800/70">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none transition-colors focus:border-action"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-base-800/70">Perfil</label>
        <select
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none transition-colors focus:border-action"
        >
          {PERFIS_DISPONIVEIS.map((p) => (
            <option key={p} value={p}>
              {ROTULO_PERFIL[p]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-action px-4 text-sm font-semibold text-action-contrast transition-all hover:bg-action-hover active:scale-[0.98] disabled:opacity-60"
      >
        <UserPlus size={16} />
        {enviando ? 'Criando...' : 'Criar usuário'}
      </button>
    </form>
  );
}
