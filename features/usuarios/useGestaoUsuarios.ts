'use client';

import { useEffect, useState } from 'react';

export interface UsuarioGestao {
  id: string;
  nome: string;
  login: string;
  perfil: 'ADMINISTRADOR' | 'GERENTE' | 'ENCARREGADO' | 'OPERADOR';
  ativo: boolean;
  criadoEm: string;
}

export function useGestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioGestao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    setCarregando(true);
    const res = await fetch('/api/usuarios?todos=1');
    const data = await res.json();
    setUsuarios(data.usuarios ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    recarregar();
  }, []);

  async function criarUsuario(dados: {
    nome: string;
    login: string;
    senha: string;
    perfil: string;
  }) {
    setErro(null);
    const res = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.erro ?? 'Erro ao criar usuário');
      return false;
    }
    await recarregar();
    return true;
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    setErro(null);
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.erro ?? 'Erro ao atualizar usuário');
      return false;
    }
    await recarregar();
    return true;
  }

  return { usuarios, carregando, erro, criarUsuario, alternarAtivo, recarregar };
}
