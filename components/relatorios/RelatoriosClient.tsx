'use client';

import { useEffect, useState } from 'react';
import { FileBarChart2, Download, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Botao } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Coluna } from '@/components/ui/DataTable';
import { BarChart } from '@/components/ui/charts';
import { formatarMoeda, formatarNumero, formatarDataHora } from '@/lib/formatacao';

interface LinhaValorizacao {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string | null;
  unidade: string;
  saldo: number;
  custoUnitario: number | null;
  estoqueMinimo: number | null;
  valorTotal: number | null;
}

interface TopProduto {
  codigo: string;
  descricao: string;
  unidade: string;
  movimentos: number;
  volume: number;
}

interface DadosRelatorio {
  periodo: { inicio: string; fim: string };
  valorizacao: { linhas: LinhaValorizacao[]; valorTotalGeral: number };
  movimentacoes: { total: number; porTipo: Record<string, { quantidade: number; total: number }> };
  topProdutos: TopProduto[];
  estoqueBaixo: LinhaValorizacao[];
}

const ROTULO_TIPO: Record<string, string> = {
  ENTRADA: 'Entradas',
  SAIDA: 'Saídas',
  AJUSTE_CONTAGEM: 'Ajustes de contagem',
  CORRECAO_MANUAL: 'Correções manuais',
};

export function RelatoriosClient() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const params = new URLSearchParams({ dataInicio, dataFim });
    fetch(`/api/relatorios?${params.toString()}`)
      .then((r) => r.json())
      .then(setDados);
  }, [dataInicio, dataFim]);

  const colunasValorizacao: Coluna<LinhaValorizacao>[] = [
    { chave: 'codigo', cabecalho: 'Código', ordenar: (p) => p.codigo, render: (p) => <span className="font-mono text-xs text-base-800/70">{p.codigo}</span> },
    {
      chave: 'descricao',
      cabecalho: 'Descrição',
      ordenar: (p) => p.descricao,
      render: (p) => (
        <div>
          <p className="font-medium text-base-950">{p.descricao}</p>
          {p.categoria && <p className="text-xs text-base-800/50">{p.categoria}</p>}
        </div>
      ),
    },
    { chave: 'saldo', cabecalho: 'Saldo', alinhar: 'direita', ordenar: (p) => p.saldo, render: (p) => <span className="tabular">{formatarNumero(p.saldo)} {p.unidade}</span> },
    { chave: 'custo', cabecalho: 'Custo unit.', alinhar: 'direita', ordenar: (p) => p.custoUnitario ?? 0, render: (p) => <span className="tabular text-base-800/70">{p.custoUnitario != null ? formatarMoeda(p.custoUnitario) : '—'}</span> },
    { chave: 'valor', cabecalho: 'Valor total', alinhar: 'direita', ordenar: (p) => p.valorTotal ?? 0, render: (p) => <span className="tabular font-semibold text-base-950">{p.valorTotal != null ? formatarMoeda(p.valorTotal) : '—'}</span> },
  ];

  const colunasTop: Coluna<TopProduto>[] = [
    { chave: 'codigo', cabecalho: 'Código', render: (p) => <span className="font-mono text-xs text-base-800/70">{p.codigo}</span> },
    { chave: 'descricao', cabecalho: 'Descrição', render: (p) => <span className="font-medium text-base-950">{p.descricao}</span> },
    { chave: 'movimentos', cabecalho: 'Movimentos', alinhar: 'direita', ordenar: (p) => p.movimentos, render: (p) => <span className="tabular">{p.movimentos}</span> },
    { chave: 'volume', cabecalho: 'Volume', alinhar: 'direita', ordenar: (p) => p.volume, render: (p) => <span className="tabular font-semibold">{formatarNumero(p.volume)} {p.unidade}</span> },
  ];

  const colunasCriticos: Coluna<LinhaValorizacao>[] = [
    { chave: 'codigo', cabecalho: 'Código', render: (p) => <span className="font-mono text-xs text-base-800/70">{p.codigo}</span> },
    { chave: 'descricao', cabecalho: 'Descrição', render: (p) => <span className="font-medium text-base-950">{p.descricao}</span> },
    { chave: 'saldo', cabecalho: 'Saldo', alinhar: 'direita', render: (p) => <Badge tom="critico">{formatarNumero(p.saldo)} {p.unidade}</Badge> },
    { chave: 'minimo', cabecalho: 'Mínimo', alinhar: 'direita', render: (p) => <span className="tabular text-base-800/70">{p.estoqueMinimo}</span> },
  ];

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader
        icon={FileBarChart2}
        title="Relatórios gerenciais"
        subtitle="Valorização de estoque, movimentações do período e itens críticos"
        actions={
          <>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-10 rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action" />
            <span className="text-xs text-base-800/50">até</span>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-10 rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action" />
            <a href="/api/relatorios/exportar?formato=xlsx" target="_blank" rel="noreferrer">
              <Botao variante="contorno" tamanho="md" icone={Download}>Exportar</Botao>
            </a>
          </>
        }
      />

      {!dados ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-action-soft text-action"><Wallet size={18} /></span>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-800/60">Valor total do estoque</p>
                <p className="text-lg font-bold tabular text-base-950">{formatarMoeda(dados.valorizacao.valorTotalGeral)}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive-bg text-positive"><TrendingUp size={18} /></span>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-800/60">Movimentações no período</p>
                <p className="text-lg font-bold tabular text-base-950">{dados.movimentacoes.total}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-critical-bg text-critical"><AlertTriangle size={18} /></span>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-800/60">Itens em estoque crítico</p>
                <p className="text-lg font-bold tabular text-base-950">{dados.estoqueBaixo.length}</p>
              </div>
            </Card>
          </div>

          <Card padding="none">
            <CardHeader title="Movimentações por tipo" subtitle={`${formatarDataHora(dados.periodo.inicio)} — ${formatarDataHora(dados.periodo.fim)}`} />
            <div className="p-4">
              <BarChart
                dados={Object.entries(dados.movimentacoes.porTipo).map(([tipo, v]) => ({ rotulo: ROTULO_TIPO[tipo] ?? tipo, valor: v.total }))}
                corBarra="#8B5CF6"
              />
            </div>
          </Card>

          <Card padding="none">
            <CardHeader title="Valorização de estoque" subtitle="Saldo atual × custo unitário cadastrado" icon={Wallet} />
            <div className="p-4">
              <DataTable colunas={colunasValorizacao} dados={dados.valorizacao.linhas} chaveLinha={(p) => p.id} tamanhoPagina={8} mensagemVazio="Nenhum produto cadastrado." />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="none">
              <CardHeader title="Top produtos movimentados" subtitle="Maior volume no período" icon={TrendingUp} />
              <div className="p-4">
                <DataTable colunas={colunasTop} dados={dados.topProdutos} chaveLinha={(p) => p.codigo} tamanhoPagina={10} mensagemVazio="Sem movimentações no período." />
              </div>
            </Card>

            <Card padding="none">
              <CardHeader title="Itens em estoque crítico" icon={AlertTriangle} />
              <div className="p-4">
                <DataTable colunas={colunasCriticos} dados={dados.estoqueBaixo} chaveLinha={(p) => p.id} tamanhoPagina={10} mensagemVazio="Nenhum item crítico. 🎉" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
