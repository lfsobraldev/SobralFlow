import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface CartaoMetricaProps {
  titulo: string;
  valor: string | number;
  destaque?: 'positiva' | 'critica' | 'neutra';
  icone?: LucideIcon;
}

export function CartaoMetrica({ titulo, valor, destaque = 'neutra', icone: Icone }: CartaoMetricaProps) {
  const cor =
    destaque === 'critica' ? 'text-critical' : destaque === 'positiva' ? 'text-positive' : 'text-base-950';

  const chip =
    destaque === 'critica' ? 'bg-critical-bg text-critical' : destaque === 'positiva' ? 'bg-positive-bg text-positive' : 'bg-action-soft text-action';

  const barra =
    destaque === 'critica' ? 'bg-critical' : destaque === 'positiva' ? 'bg-positive' : 'bg-action/40';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-base-200 bg-surface p-4 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-action/30 hover:shadow-elevated">
      <span className={clsx('absolute inset-y-0 left-0 w-1', barra)} />
      <div className="flex items-start justify-between pl-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-base-800/60">{titulo}</p>
          <p className={clsx('tabular text-display', cor)}>{valor}</p>
        </div>
        {Icone && (
          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', chip)}>
            <Icone size={17} />
          </span>
        )}
      </div>
    </div>
  );
}
