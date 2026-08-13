import { formatarDuracao } from '@/hooks/useModoInventario';

interface BarraModoInventarioProps {
  ativo: boolean;
  tempoDecorrido: number;
  itensNestaSessao: number;
  carregando: boolean;
  onIniciar: () => void;
  onFinalizar: () => void;
}

export function BarraModoInventario({
  ativo,
  tempoDecorrido,
  itensNestaSessao,
  carregando,
  onIniciar,
  onFinalizar,
}: BarraModoInventarioProps) {
  if (!ativo) {
    return (
      <button
        onClick={onIniciar}
        disabled={carregando}
        className="rounded-lg border border-action/30 bg-action/5 px-4 py-2.5 text-sm font-semibold text-action hover:bg-action/10 disabled:opacity-60"
      >
        ▶ Iniciar Modo Inventário
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-action px-4 py-2.5 text-action-contrast">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-surface" />
          Inventário em andamento
        </span>
        <span className="tabular">{formatarDuracao(tempoDecorrido)}</span>
        <span>{itensNestaSessao} item(ns) contado(s)</span>
      </div>
      <button
        onClick={onFinalizar}
        disabled={carregando}
        className="rounded-md bg-surface/15 px-3 py-1.5 text-xs font-semibold hover:bg-surface/25 disabled:opacity-60"
      >
        Finalizar
      </button>
    </div>
  );
}
