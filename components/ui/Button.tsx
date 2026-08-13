import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type Variante = 'primaria' | 'positiva' | 'critica' | 'neutra' | 'fantasma' | 'contorno';
type Tamanho = 'touch' | 'md' | 'sm';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: LucideIcon;
}

// Variante mantém o mesmo contrato usado em todo o app (Contagem, Movimentação,
// Produtos, Perfil etc.) — apenas os tons foram atualizados para o tema escuro.
const estilosPorVariante: Record<Variante, string> = {
  primaria: 'bg-action text-action-contrast hover:bg-action-hover shadow-sm hover:shadow-glow',
  positiva: 'bg-positive text-white hover:brightness-110',
  critica: 'bg-critical text-white hover:brightness-110',
  neutra: 'bg-surface-raised text-base-950 border border-base-200 hover:bg-surface-hover',
  fantasma: 'bg-transparent text-base-800 hover:bg-surface-hover hover:text-base-950',
  contorno: 'bg-transparent border border-action/40 text-action hover:bg-action-soft',
};

const estilosPorTamanho: Record<Tamanho, string> = {
  touch: 'h-touch text-key font-semibold px-5',
  md: 'h-11 text-sm font-semibold px-4 gap-2',
  sm: 'h-9 text-xs font-medium px-3 gap-1.5',
};

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(
  ({ variante = 'neutra', tamanho = 'touch', carregando, icone: Icone, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || carregando}
        className={clsx(
          'flex items-center justify-center rounded-lg',
          'transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
          estilosPorVariante[variante],
          estilosPorTamanho[tamanho],
          className
        )}
        {...props}
      >
        {carregando ? <Loader2 size={16} className="animate-spin" /> : Icone && <Icone size={16} className={children ? 'mr-1.5' : ''} />}
        {children}
      </button>
    );
  }
);

Botao.displayName = 'Botao';
