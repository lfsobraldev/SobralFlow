'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClipboardList, Copy, Check, CircleDot } from 'lucide-react';
import { useFilaApontamentos } from '@/features/producao/useFilaApontamentos';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Botao } from '@/components/ui/Button';
import { ROTULO_STATUS_APONTAMENTO } from '@/types';
import type { StatusApontamento } from '@/types';

const TOM_STATUS: Record<StatusApontamento, 'critico' | 'atencao' | 'positivo'> = {
  NOVO: 'critico',
  EM_ANDAMENTO: 'atencao',
  CONCLUIDO: 'positivo',
};

function horario(iso: string) {
  return format(new Date(iso), 'HH:mm', { locale: ptBR });
}

export default function FilaApontamentosPage() {
  const {
    itens,
    resumo,
    carregando,
    erro,
    idsAtualizando,
    idCopiado,
    filtroStatus,
    setFiltroStatus,
    filtroOF,
    setFiltroOF,
    filtroData,
    setFiltroData,
    limparFiltros,
    copiar,
    marcarConcluido,
  } = useFilaApontamentos();

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader
        icon={ClipboardList}
        title="Fila de Apontamentos"
        subtitle="Atualiza automaticamente — mantenha esta tela aberta durante o trabalho"
      />

      {erro && (
        <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm font-medium text-critical">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex items-center gap-3">
          <CircleDot size={16} className="text-critical" />
          <div>
            <p className="text-xs text-base-800/60">Novos</p>
            <p className="text-lg font-bold tabular text-base-950">{resumo.novos}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <CircleDot size={16} className="text-warning" />
          <div>
            <p className="text-xs text-base-800/60">Em andamento</p>
            <p className="text-lg font-bold tabular text-base-950">{resumo.emAndamento}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <CircleDot size={16} className="text-positive" />
          <div>
            <p className="text-xs text-base-800/60">Concluídos hoje</p>
            <p className="text-lg font-bold tabular text-base-950">{resumo.concluidosHoje}</p>
          </div>
        </Card>
      </div>

      <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          >
            <option value="TODOS">Todos</option>
            <option value="NOVO">Novos</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDO">Concluídos</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">OF</label>
          <input
            value={filtroOF}
            onChange={(e) => setFiltroOF(e.target.value)}
            placeholder="Número da OF"
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Data</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action"
          />
        </div>
        <div className="flex items-end">
          {(filtroStatus !== 'TODOS' || filtroOF || filtroData) && (
            <button
              type="button"
              onClick={limparFiltros}
              className="h-11 rounded-lg px-3 text-xs font-medium text-action hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </Card>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
              <th className="px-4 py-3">OF</th>
              <th className="px-4 py-3">Operação</th>
              <th className="px-4 py-3">Peça</th>
              <th className="px-4 py-3 text-right">Quantidade</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr
                key={item.id}
                className="border-b border-surface-border transition-colors last:border-0 hover:bg-surface-hover"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-base-950">
                  {item.numeroOF}
                </td>
                <td className="px-4 py-3">{item.numeroOperacao}</td>
                <td className="px-4 py-3">{item.peca}</td>
                <td className="px-4 py-3 text-right tabular">{item.quantidade}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span>{item.situacao}</span>
                    {item.motivo && (
                      <span className="text-xs text-base-800/60">{item.motivo}</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular text-base-800/70">
                  {horario(item.criadoEm)}
                </td>
                <td className="px-4 py-3">
                  <Badge tom={TOM_STATUS[item.status]}>
                    {ROTULO_STATUS_APONTAMENTO[item.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Botao
                      tamanho="sm"
                      variante={idCopiado === item.id ? 'positiva' : 'contorno'}
                      icone={idCopiado === item.id ? Check : Copy}
                      onClick={() => copiar(item)}
                    >
                      {idCopiado === item.id ? 'Copiado' : 'Copiar'}
                    </Botao>
                    {item.status !== 'CONCLUIDO' && (
                      <Botao
                        tamanho="sm"
                        variante="positiva"
                        carregando={idsAtualizando.has(item.id)}
                        onClick={() => marcarConcluido(item.id)}
                      >
                        Concluir
                      </Botao>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!carregando && itens.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-base-800/50">
                  Nenhum apontamento encontrado para esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
