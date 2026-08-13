'use client';

import { History } from 'lucide-react';
import { useHistorico } from '@/features/historico/useHistorico';
import { formatarDataHora } from '@/lib/formatacao';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const ROTULO_TIPO: Record<string, string> = {
  AJUSTE_CONTAGEM: 'Ajuste (contagem)',
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  CORRECAO_MANUAL: 'Correção manual',
};

export default function HistoricoPage() {
  const {
    itens,
    total,
    totalPaginas,
    pagina,
    setPagina,
    carregando,
    usuarios,
    produtoTermo,
    setProdutoTermo,
    usuarioId,
    setUsuarioId,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    filtrarEstaSemana,
    filtrarEsteMes,
    limparPeriodo,
  } = useHistorico();

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader icon={History} title="Histórico de movimentações" subtitle="Registro imutável de toda a movimentação de estoque" />

      <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <label className="mb-1 block text-xs font-medium text-base-800/70">Produto</label>
          <input
            value={produtoTermo}
            onChange={(e) => setProdutoTermo(e.target.value)}
            placeholder="Código ou descrição"
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Usuário</label>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          />
        </div>

        <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-4">
          <span className="text-xs font-medium text-base-800/70">Período rápido:</span>
          <button
            type="button"
            onClick={filtrarEstaSemana}
            className="rounded-lg border border-base-200 px-3 py-1.5 text-xs font-medium text-base-800 transition-colors hover:bg-surface-hover"
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={filtrarEsteMes}
            className="rounded-lg border border-base-200 px-3 py-1.5 text-xs font-medium text-base-800 transition-colors hover:bg-surface-hover"
          >
            Este mês
          </button>
          {(dataInicio || dataFim) && (
            <button
              type="button"
              onClick={limparPeriodo}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-action hover:underline"
            >
              Limpar período
            </button>
          )}
        </div>
      </Card>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Movimento</th>
              <th className="px-4 py-3 text-right">Anterior</th>
              <th className="px-4 py-3 text-right">Novo</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-surface-border transition-colors last:border-0 hover:bg-surface-hover">
                <td className="whitespace-nowrap px-4 py-3 tabular">
                  {formatarDataHora(item.criadoEm)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-base-950">{item.produto.descricao}</p>
                  <p className="font-mono text-xs text-base-800/60">{item.produto.codigo}</p>
                </td>
                <td className="px-4 py-3">{item.usuario.nome}</td>
                <td className="px-4 py-3"><Badge tom="neutro">{ROTULO_TIPO[item.tipo] ?? item.tipo}</Badge></td>
                <td
                  className={`px-4 py-3 text-right tabular font-semibold ${
                    item.valor > 0 ? 'text-positive' : 'text-critical'
                  }`}
                >
                  {item.valor > 0 ? '+' : ''}
                  {item.valor}
                </td>
                <td className="px-4 py-3 text-right tabular text-base-800/70">
                  {item.saldoAnterior}
                </td>
                <td className="px-4 py-3 text-right tabular font-medium">{item.saldoNovo}</td>
                <td className="px-4 py-3 font-mono text-xs text-base-800/50">{item.ip ?? '—'}</td>
              </tr>
            ))}

            {!carregando && itens.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-base-800/50">
                  Nenhuma movimentação encontrada para esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm text-base-800/70">
        <span>{total} movimentações no total</span>
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
