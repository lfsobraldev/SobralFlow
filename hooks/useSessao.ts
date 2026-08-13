'use client';

import { useEffect, useState } from 'react';
import { temPermissao, PERMISSOES } from '@/types';
import type { SessaoUsuario } from '@/types';

export function useSessao() {
  const [sessao, setSessao] = useState<SessaoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSessao(d?.sessao ?? null))
      .finally(() => setCarregando(false));
  }, []);

  function pode(permissao: keyof (typeof PERMISSOES)['ADMINISTRADOR']) {
    return sessao ? temPermissao(sessao.perfil, permissao) : false;
  }

  return { sessao, carregando, pode };
}
