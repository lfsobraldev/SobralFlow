'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LogOut, Menu, User, ChevronDown } from 'lucide-react';
import { useSessao } from '@/hooks/useSessao';
import { ROTULO_PERFIL } from '@/types';

const TITULOS: Record<string, string> = {
  '/dashboard': 'Dashboard executivo',
  '/contagem': 'Tela de contagem',
  '/movimentacao': 'Entrada / Saída',
  '/historico': 'Histórico de movimentações',
  '/produtos': 'Cadastro de produtos',
  '/relatorios': 'Relatórios gerenciais',
  '/auditoria': 'Auditoria',
  '/usuarios': 'Gestão de usuários',
  '/perfil': 'Meu perfil',
  '/inventario': 'Fechamento de inventário',
};

function tituloDaRota(pathname: string | null) {
  if (!pathname) return 'Estoque ERP';
  const chave = Object.keys(TITULOS).find((k) => pathname.startsWith(k));
  return chave ? TITULOS[chave] : 'Estoque ERP';
}

export function Topbar({ onAbrirMenuMobile }: { onAbrirMenuMobile: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessao } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-surface-border bg-base-50/90 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onAbrirMenuMobile}
        className="flex h-9 w-9 items-center justify-center rounded-md text-base-800/70 hover:bg-surface-hover md:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-sm font-semibold text-base-950 md:text-base">
          {tituloDaRota(pathname)}
        </h1>
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-sm font-medium text-base-950 transition-colors hover:bg-surface-hover"
        >
          <span
            className="flex h-8 w-8 items-center justify-center bg-action text-xs font-bold text-action-contrast"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
          >
            {sessao?.nome?.[0]?.toUpperCase() ?? <User size={14} />}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-xs font-semibold">{sessao?.nome ?? '—'}</span>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-base-800/50">
              {sessao ? ROTULO_PERFIL[sessao.perfil] : ''}
            </span>
          </span>
          <ChevronDown size={14} className={clsx('text-base-800/50 transition-transform', menuAberto && 'rotate-180')} />
        </button>

        {menuAberto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 animate-scale-in rounded-md border border-base-200 bg-surface-raised p-1.5 shadow-elevated">
              <Link
                href="/perfil"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-base-900 hover:bg-surface-hover"
              >
                <User size={15} /> Meu perfil
              </Link>
              <button
                onClick={sair}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-critical hover:bg-critical-bg"
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
