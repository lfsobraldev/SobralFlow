import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action-soft text-action">
            <Icon size={19} />
          </span>
        )}
        <div>
          <h1 className="text-lg font-bold tracking-tight text-base-950 md:text-xl">{title}</h1>
          {subtitle && <p className="text-sm text-base-800/60">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
