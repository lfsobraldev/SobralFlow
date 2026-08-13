import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tom = 'neutro' | 'positivo' | 'atencao' | 'critico' | 'acao' | 'roxo';

const tons: Record<Tom, string> = {
  neutro: 'bg-base-100 text-base-800',
  positivo: 'bg-positive-bg text-positive',
  atencao: 'bg-warning-bg text-warning',
  critico: 'bg-critical-bg text-critical',
  acao: 'bg-action-soft text-action',
  roxo: 'bg-accent-soft text-accent',
};

export function Badge({
  children,
  tom = 'neutro',
  icon: Icon,
  className,
}: {
  children: ReactNode;
  tom?: Tom;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        tons[tom],
        className
      )}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

// Mapeamento padrão de perfil → tom do badge, usado nas telas de usuários/perfil.
export const TOM_POR_PERFIL: Record<string, Tom> = {
  ADMINISTRADOR: 'roxo',
  GERENTE: 'acao',
  ENCARREGADO: 'atencao',
  OPERADOR: 'neutro',
};
