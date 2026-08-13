'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { formatarDataHora } from '@/lib/formatacao';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ItemAuditoria {
  id: string;
  acao: string;
  campoAlterado: string | null;
  valorAntigo: string | null;
  valorNovo: string | null;
  criadoEm: string;
  usuario: { nome: string };
  produto: { codigo: string; descricao: string } | null;
}

const ROTULO_ACAO: Record<string, string> = {
  PRODUTO_CRIADO: 'Produto criado',
  PRODUTO_EDITADO: 'Campo editado',
  PRODUTO_EXCLUIDO: 'Produto excluído',
  PRODUTO_IMPORTADO_CRIADO: 'Criado via importação',
  PRODUTO_IMPORTADO_ATUALIZADO: 'Atualizado via importação',
};

const TOM_ACAO: Record<string, 'positivo' | 'acao' | 'critico'> = {
  PRODUTO_CRIADO: 'positivo',
  PRODUTO_EDITADO: 'acao',
  PRODUTO_EXCLUIDO: 'critico',
  PRODUTO_IMPORTADO_CRIADO: 'positivo',
  PRODUTO_IMPORTADO_ATUALIZADO: 'acao',
};

export function AuditoriaClient() {
  const [itens, setItens] = useState<ItemAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [produtoTermo, setProdutoTermo] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    const params = new URLSearchParams({ pagina: String(pagina), porPagina: '20' });
    if (produtoTermo) params.set('produto', produtoTermo);

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/auditoria?${params.toString()}`);
      const data = await res.json();
      setItens(data.itens ?? []);
      setTotal(data.total ?? 0);
      setTotalPaginas(data.totalPaginas ?? 1);
      setCarregando(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [produtoTermo, pagina]);

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader icon={ShieldCheck} title="Auditoria" subtitle="Trilha completa de criações, edições e exclusões do cadastro" />

      <Card className="flex items-center gap-2">
        <Search size={16} className="text-base-800/50" />
        <input
          value={produtoTermo}
          onChange={(e) => {
            setProdutoTermo(e.target.value);
            setPagina(1);
          }}
          placeholder="Filtrar por código ou descrição do produto..."
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-base-800/40"
        />
      </Card>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Alteração</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-surface-border transition-colors last:border-0 hover:bg-surface-hover">
                <td className="whitespace-nowrap px-4 py-3 tabular">
                  {formatarDataHora(item.criadoEm)}
                </td>
                <td className="px-4 py-3">
                  {item.produto ? (
                    <>
                      <p className="font-medium text-base-950">{item.produto.descricao}</p>
                      <p className="font-mono text-xs text-base-800/50">{item.produto.codigo}</p>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">{item.usuario.nome}</td>
                <td className="px-4 py-3">
                  <Badge tom={TOM_ACAO[item.acao] ?? 'neutro'}>{ROTULO_ACAO[item.acao] ?? item.acao}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-base-800/70">
                  {item.campoAlterado ? (
                    <>
                      <span className="font-mono font-semibold">{item.campoAlterado}</span>:{' '}
                      <span className="text-critical line-through">{item.valorAntigo || '—'}</span>{' '}
                      → <span className="text-positive">{item.valorNovo || '—'}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}

            {!carregando && itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-base-800/50">
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm text-base-800/70">
        <span>{total} registros no total</span>
        <div className="flex items-center gap-2">
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
            className="rounded-lg border border-base-200 px-3 py-1.5 transition-colors hover:bg-surface-hover disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(pagina + 1)}
            className="rounded-lg border border-base-200 px-3 py-1.5 transition-colors hover:bg-surface-hover disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
