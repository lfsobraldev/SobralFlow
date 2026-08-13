'use client';

import { forwardRef, useEffect, useState, type KeyboardEvent } from 'react';
import type { ProdutoResumo } from '@/types';

interface BuscaProdutoProps {
  termo: string;
  onTermoChange: (v: string) => void;
  resultados: ProdutoResumo[];
  onSelecionar: (produto: ProdutoResumo) => void;
  carregando?: boolean;
  onAbrirScanner?: () => void;
}

export const BuscaProduto = forwardRef<HTMLInputElement, BuscaProdutoProps>(
  ({ termo, onTermoChange, resultados, onSelecionar, carregando, onAbrirScanner }, ref) => {
    const [indiceAtivo, setIndiceAtivo] = useState(0);

    useEffect(() => {
      setIndiceAtivo(0);
    }, [resultados]);

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      // Leitores de código de barras USB digitam o texto e disparam "Enter" automaticamente:
      // se houver exatamente um resultado, Enter já seleciona — zero cliques extras.
      if (e.key === 'Enter') {
        e.preventDefault();
        const alvo = resultados[indiceAtivo];
        if (alvo) onSelecionar(alvo);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndiceAtivo((i) => Math.min(i + 1, resultados.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndiceAtivo((i) => Math.max(i - 1, 0));
      }
    }

    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={ref}
            type="text"
            value={termo}
            onChange={(e) => onTermoChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bipar código de barras, digitar código ou descrição..."
            className="h-touch w-full rounded-xl border border-base-200 bg-surface px-5 text-xl outline-none focus:border-action"
            autoComplete="off"
          />

          {termo && resultados.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-base-200 bg-surface shadow-panel">
              {resultados.map((produto, i) => (
                <li key={produto.id}>
                  <button
                    onClick={() => onSelecionar(produto)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                      i === indiceAtivo ? 'bg-base-100' : 'hover:bg-base-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-base-950">
                        {produto.descricao}
                      </p>
                      <p className="font-mono text-xs text-base-800/60">{produto.codigo}</p>
                    </div>
                    <span className="shrink-0 tabular text-sm font-medium text-base-800">
                      {produto.saldo} {produto.unidade}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {termo && !carregando && resultados.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-base-200 bg-surface px-4 py-3 text-base-800/60 shadow-panel">
              Nenhum produto encontrado
            </div>
          )}
        </div>

        {onAbrirScanner && (
          <button
            type="button"
            onClick={onAbrirScanner}
            title="Escanear com a câmera"
            className="flex h-touch w-touch shrink-0 items-center justify-center rounded-xl border border-base-200 bg-surface text-2xl hover:bg-base-100"
          >
            📷
          </button>
        )}
      </div>
    );
  }
);

BuscaProduto.displayName = 'BuscaProduto';
