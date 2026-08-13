'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Inbox } from 'lucide-react';
import clsx from 'clsx';

export interface Coluna<T> {
  chave: string;
  cabecalho: string;
  render: (item: T) => ReactNode;
  ordenar?: (item: T) => string | number;
  alinhar?: 'esquerda' | 'direita' | 'centro';
  className?: string;
}

interface PaginacaoServidor {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudarPagina: (pagina: number) => void;
}

interface DataTableProps<T> {
  colunas: Coluna<T>[];
  dados: T[];
  chaveLinha: (item: T) => string;
  carregando?: boolean;
  mensagemVazio?: string;
  busca?: { valor: string; onChange: (v: string) => void; placeholder?: string };
  paginacaoServidor?: PaginacaoServidor;
  tamanhoPagina?: number; // usado apenas quando não há paginação de servidor
  linhaClassName?: (item: T) => string;
}

export function DataTable<T>({
  colunas,
  dados,
  chaveLinha,
  carregando,
  mensagemVazio = 'Nenhum registro encontrado.',
  busca,
  paginacaoServidor,
  tamanhoPagina = 10,
  linhaClassName,
}: DataTableProps<T>) {
  const [ordenacao, setOrdenacao] = useState<{ chave: string; direcao: 'asc' | 'desc' } | null>(null);
  const [paginaLocal, setPaginaLocal] = useState(1);

  const dadosOrdenados = useMemo(() => {
    if (!ordenacao) return dados;
    const coluna = colunas.find((c) => c.chave === ordenacao.chave);
    if (!coluna?.ordenar) return dados;
    const copia = [...dados];
    copia.sort((a, b) => {
      const va = coluna.ordenar!(a);
      const vb = coluna.ordenar!(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return ordenacao.direcao === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [dados, ordenacao, colunas]);

  const totalLocal = dadosOrdenados.length;
  const totalPaginasLocal = Math.max(1, Math.ceil(totalLocal / tamanhoPagina));
  const paginaAtualLocal = Math.min(paginaLocal, totalPaginasLocal);

  const dadosVisiveis = paginacaoServidor
    ? dadosOrdenados
    : dadosOrdenados.slice((paginaAtualLocal - 1) * tamanhoPagina, paginaAtualLocal * tamanhoPagina);

  function alternarOrdenacao(chave: string) {
    setOrdenacao((atual) => {
      if (atual?.chave !== chave) return { chave, direcao: 'asc' };
      if (atual.direcao === 'asc') return { chave, direcao: 'desc' };
      return null;
    });
  }

  const pagina = paginacaoServidor?.pagina ?? paginaAtualLocal;
  const totalPaginas = paginacaoServidor?.totalPaginas ?? totalPaginasLocal;
  const total = paginacaoServidor?.total ?? totalLocal;
  const irParaPagina = paginacaoServidor?.onMudarPagina ?? setPaginaLocal;

  return (
    <div className="flex flex-col gap-3">
      {busca && (
        <div className="flex items-center gap-2 rounded-lg border border-base-200 bg-surface-raised px-3">
          <Search size={15} className="shrink-0 text-base-800/40" />
          <input
            value={busca.valor}
            onChange={(e) => busca.onChange(e.target.value)}
            placeholder={busca.placeholder ?? 'Buscar...'}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-base-800/40"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-base-200 bg-surface shadow-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
              {colunas.map((c) => (
                <th
                  key={c.chave}
                  className={clsx(
                    'px-4 py-3 select-none',
                    c.alinhar === 'direita' && 'text-right',
                    c.alinhar === 'centro' && 'text-center',
                    c.ordenar && 'cursor-pointer hover:text-base-950'
                  )}
                  onClick={() => c.ordenar && alternarOrdenacao(c.chave)}
                >
                  <span className={clsx('inline-flex items-center gap-1', c.alinhar === 'direita' && 'flex-row-reverse')}>
                    {c.cabecalho}
                    {c.ordenar &&
                      (ordenacao?.chave === c.chave ? (
                        ordenacao.direcao === 'asc' ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-30" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosVisiveis.map((item) => (
              <tr
                key={chaveLinha(item)}
                className={clsx(
                  'border-b border-surface-border transition-colors last:border-0 hover:bg-surface-hover',
                  linhaClassName?.(item)
                )}
              >
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={clsx(
                      'px-4 py-3.5',
                      c.alinhar === 'direita' && 'text-right',
                      c.alinhar === 'centro' && 'text-center',
                      c.className
                    )}
                  >
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))}

            {!carregando && dadosVisiveis.length === 0 && (
              <tr>
                <td colSpan={colunas.length} className="px-4 py-14 text-center text-base-800/50">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={22} className="opacity-40" />
                    {mensagemVazio}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-base-800/70">
        <span>{total} registro(s) no total</span>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={pagina <= 1}
              onClick={() => irParaPagina(pagina - 1)}
              className="rounded-lg border border-base-200 px-3 py-1.5 transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              disabled={pagina >= totalPaginas}
              onClick={() => irParaPagina(pagina + 1)}
              className="rounded-lg border border-base-200 px-3 py-1.5 transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
