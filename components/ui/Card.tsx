import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';


interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-base-200 bg-surface shadow-panel',
        hover && 'transition-all duration-200 hover:border-action/40 hover:shadow-elevated',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-3.5 md:px-5">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-action-soft text-action">
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-base-950">{title}</h2>
          {subtitle && <p className="truncate text-xs text-base-800/60">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
