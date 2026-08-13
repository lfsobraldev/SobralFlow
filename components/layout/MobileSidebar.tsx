'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { X, Boxes } from 'lucide-react';
import {
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  FileBarChart2,
  ScanLine,
  ListTodo,
} from 'lucide-react';
import { useSessao } from '@/hooks/useSessao';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissao: null },
  { href: '/contagem', label: 'Contagem', icon: ClipboardList, permissao: null },
  { href: '/movimentacao', label: 'Entrada / Saída', icon: ArrowLeftRight, permissao: null },
  { href: '/historico', label: 'Histórico', icon: History, permissao: null },
  { href: '/producao/apontamento', label: 'Apontamento', icon: ScanLine, permissao: null },
  { href: '/producao/fila', label: 'Fila de Apontamentos', icon: ListTodo, permissao: null },
  { href: '/produtos', label: 'Produtos', icon: Package, permissao: null },
  { href: '/relatorios', label: 'Relatórios', icon: FileBarChart2, permissao: 'verRelatorios' },
  { href: '/auditoria', label: 'Auditoria', icon: ShieldCheck, permissao: 'verAuditoria' },
  { href: '/usuarios', label: 'Usuários', icon: Users, permissao: 'gerenciarUsuarios' },
] as const;

export function MobileSidebar({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const pathname = usePathname();
  const { pode } = useSessao();
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onFechar} />
      <div className="absolute inset-y-0 left-0 flex w-72 animate-in flex-col bg-sidebar">
        <div className="h-1 shrink-0 bg-hazard-stripe opacity-90" />
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center bg-action text-action-contrast"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              <Boxes size={18} />
            </span>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-sidebar-text">Estoque ERP</p>
          </div>
          <button onClick={onFechar} className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {LINKS.filter((l) => !l.permissao || pode(l.permissao)).map((link) => {
            const ativo = pathname?.startsWith(link.href);
            const Icone = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onFechar}
                className={clsx(
                  'relative mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  ativo ? 'bg-sidebar-active text-sidebar-text' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                )}
              >
                {ativo && <span className="absolute -left-3 top-1/2 h-4 w-1.5 -translate-y-1/2 bg-action" />}
                <Icone size={17} className={ativo ? 'text-action' : undefined} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
