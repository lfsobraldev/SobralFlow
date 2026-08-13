'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  FileBarChart2,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ScanLine,
  ListTodo,
} from 'lucide-react';
import { useSessao } from '@/hooks/useSessao';
import { ROTULO_PERFIL } from '@/types';

interface LinkItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permissao: 'verAuditoria' | 'gerenciarUsuarios' | 'verRelatorios' | null;
}

const SECOES: { titulo: string; links: LinkItem[] }[] = [
  {
    titulo: 'Visão geral',
    links: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissao: null }],
  },
  {
    titulo: 'Operação',
    links: [
      { href: '/contagem', label: 'Contagem', icon: ClipboardList, permissao: null },
      { href: '/movimentacao', label: 'Entrada / Saída', icon: ArrowLeftRight, permissao: null },
      { href: '/historico', label: 'Histórico', icon: History, permissao: null },
    ],
  },
  {
    titulo: 'Produção',
    links: [
      { href: '/producao/apontamento', label: 'Apontamento', icon: ScanLine, permissao: null },
      { href: '/producao/fila', label: 'Fila de Apontamentos', icon: ListTodo, permissao: null },
    ],
  },
  {
    titulo: 'Cadastro',
    links: [{ href: '/produtos', label: 'Produtos', icon: Package, permissao: null }],
  },
  {
    titulo: 'Gestão',
    links: [
      { href: '/relatorios', label: 'Relatórios', icon: FileBarChart2, permissao: 'verRelatorios' },
      { href: '/auditoria', label: 'Auditoria', icon: ShieldCheck, permissao: 'verAuditoria' },
      { href: '/usuarios', label: 'Usuários', icon: Users, permissao: 'gerenciarUsuarios' },
    ],
  },
];

export function Sidebar({
  colapsada,
  onToggle,
}: {
  colapsada: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { sessao, pode } = useSessao();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:flex',
        colapsada ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      {/* Faixa de sinalização — assinatura visual do sistema, evoca fita de piso de depósito */}
      <div className="h-1 shrink-0 bg-hazard-stripe opacity-90" />

      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center bg-action text-action-contrast"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
        >
          <Boxes size={18} />
        </span>
        {!colapsada && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-sidebar-text">Estoque ERP</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-sidebar-muted">Gestão de Inventário</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECOES.map((secao) => {
          const linksVisiveis = secao.links.filter((l) => !l.permissao || pode(l.permissao));
          if (linksVisiveis.length === 0) return null;
          return (
            <div key={secao.titulo} className="mb-5">
              {!colapsada && (
                <p className="mb-1.5 px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {secao.titulo}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {linksVisiveis.map((link) => {
                  const ativo = pathname?.startsWith(link.href);
                  const Icone = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={colapsada ? link.label : undefined}
                      className={clsx(
                        'group relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium transition-colors',
                        ativo
                          ? 'bg-sidebar-active text-sidebar-text'
                          : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                      )}
                    >
                      {/* Entalhe de etiqueta: indica o item ativo, como um rótulo de prateleira preso à borda */}
                      {ativo && (
                        <span className="absolute -left-3 top-1/2 h-4 w-1.5 -translate-y-1/2 bg-action" />
                      )}
                      <span
                        className={clsx(
                          'flex h-5 w-5 shrink-0 items-center justify-center',
                          ativo && 'text-action'
                        )}
                      >
                        <Icone size={17} strokeWidth={ativo ? 2.4 : 2} />
                      </span>
                      {!colapsada && <span className="truncate">{link.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {!colapsada && sessao && (
          <div className="mb-2 rounded-md bg-sidebar-hover px-3 py-2">
            <p className="truncate text-xs font-semibold text-sidebar-text">{sessao.nome}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wide text-sidebar-muted">{ROTULO_PERFIL[sessao.perfil]}</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
        >
          {colapsada ? <ChevronsRight size={16} /> : (
            <>
              <ChevronsLeft size={16} /> Recolher
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
