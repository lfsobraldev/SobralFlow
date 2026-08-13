'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  GitCompareArrows,
  Wallet,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import { CartaoMetrica } from '@/components/dashboard/CartaoMetrica';
import { formatarDataHora, formatarMoeda, formatarNumero } from '@/lib/formatacao';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart, LineChart, DonutChart } from '@/components/ui/charts';
import type { LucideIcon } from 'lucide-react';

interface ProdutoResumo {
  id: string;
  codigo: string;
  descricao: string;
  saldo: number;
  contagem: number | null;
  estoqueMinimo: number | null;
  unidade: string;
}

interface Pedido {
  id: string;
  nome: string;
}

interface DadosDashboard {
  metricas: {
    totalItens: number;
    itensConferidos: number;
    itensPendentes: number;
    movimentacoesHoje: number;
    estoqueCritico: number;
    produtosDivergentes: number;
    ultimaAtualizacao: string | null;
  };
  criticos: ProdutoResumo[];
  divergentes: ProdutoResumo[];
  financeiro: { valorEstoque: number; custoMedio: number; produtosComCusto: number; totalProdutos: number };
  movimentacoes: {
    serie: { rotulo: string; entradas: number; saidas: number; movimentos: number }[];
    entradasPeriodo: number;
    saidasPeriodo: number;
    totalMovimentos: number;
  };
  movimentacoesMensal: {
    serie: { rotulo: string; entradas: number; saidas: number; movimentos: number }[];
  };
  categorias: { categoria: string; saldo: number }[];
  pedidosAtivos: number;
}

export default function DashboardPage() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoId, setPedidoId] = useState('');

  useEffect(() => {
    fetch('/api/pedidos')
      .then((r) => r.json())
      .then((d) => setPedidos(d.pedidos ?? []));
  }, []);

  useEffect(() => {
    setDados(null);
    const params = pedidoId ? `?pedidoId=${pedidoId}` : '';
    fetch(`/api/dashboard${params}`)
      .then((r) => r.json())
      .then(setDados);
  }, [pedidoId]);

  if (!dados) {
    return (
      <div className="flex flex-col gap-5">
        <div className="skeleton h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  const { metricas, criticos, divergentes, financeiro, movimentacoes, movimentacoesMensal, categorias, pedidosAtivos } = dados;

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard executivo"
        subtitle={`Atualizado em ${metricas.ultimaAtualizacao ? formatarDataHora(metricas.ultimaAtualizacao) : '—'}`}
        actions={
          <select
            value={pedidoId}
            onChange={(e) => setPedidoId(e.target.value)}
            className="h-10 rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
          >
            <option value="">Todos os pedidos</option>
            {pedidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        }
      />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CartaoMetrica titulo="Estoque total" valor={formatarNumero(metricas.totalItens)} icone={Package} />
        <CartaoMetrica
          titulo="Valor do estoque"
          valor={formatarMoeda(financeiro.valorEstoque)}
          destaque="positiva"
          icone={Wallet}
        />
        <CartaoMetrica titulo="Entradas (7 dias)" valor={formatarNumero(movimentacoes.entradasPeriodo)} destaque="positiva" icone={TrendingUp} />
        <CartaoMetrica titulo="Saídas (7 dias)" valor={formatarNumero(movimentacoes.saidasPeriodo)} icone={TrendingDown} />
        <CartaoMetrica
          titulo="Itens críticos"
          valor={metricas.estoqueCritico}
          destaque={metricas.estoqueCritico > 0 ? 'critica' : 'neutra'}
          icone={AlertTriangle}
        />
        <CartaoMetrica
          titulo="Divergentes"
          valor={metricas.produtosDivergentes}
          destaque={metricas.produtosDivergentes > 0 ? 'critica' : 'neutra'}
          icone={GitCompareArrows}
        />
        <CartaoMetrica titulo="Pedidos ativos" valor={pedidosAtivos} icone={ClipboardList} />
        <CartaoMetrica titulo="Custo médio unit." valor={formatarMoeda(financeiro.custoMedio)} icone={Activity} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="none" className="lg:col-span-2">
          <CardHeader title="Movimentações — últimos 7 dias" subtitle="Volume diário de entradas e saídas" icon={Activity} />
          <div className="p-4">
            <LineChart
              series={[
                { nome: 'Entradas', cor: '#22C55E', pontos: movimentacoes.serie.map((d) => ({ rotulo: d.rotulo, valor: d.entradas })) },
                { nome: 'Saídas', cor: '#EF4444', pontos: movimentacoes.serie.map((d) => ({ rotulo: d.rotulo, valor: d.saidas })) },
              ]}
            />
          </div>
        </Card>

        <Card padding="none">
          <CardHeader title="Estoque por categoria" icon={Package} />
          <div className="flex items-center justify-center p-4">
            {categorias.length > 0 ? (
              <DonutChart dados={categorias.map((c) => ({ rotulo: c.categoria, valor: Math.round(c.saldo) }))} />
            ) : (
              <p className="py-8 text-sm text-base-800/50">Sem dados de categoria.</p>
            )}
          </div>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader title="Volume de movimentos por mês" icon={Activity} />
        <div className="p-4">
          <BarChart dados={movimentacoesMensal.serie.map((d) => ({ rotulo: d.rotulo, valor: d.movimentos }))} corBarra="#3B82F6" />
        </div>
      </Card>

      {/* Painéis de itens críticos e divergentes */}
      <div className="grid gap-4 md:grid-cols-2">
        <PainelLista titulo="Estoque crítico" itens={criticos} tipo="critico" icon={AlertTriangle} />
        <PainelLista titulo="Produtos divergentes" itens={divergentes} tipo="divergente" icon={GitCompareArrows} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-base-800/50 md:grid-cols-4">
        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-positive" /> {metricas.itensConferidos} conferidos</span>
        <span className="flex items-center gap-1.5"><Clock size={13} /> {metricas.itensPendentes} pendentes</span>
        <span className="flex items-center gap-1.5"><Activity size={13} /> {metricas.movimentacoesHoje} movimentações hoje</span>
        <span className="flex items-center gap-1.5"><Wallet size={13} /> {financeiro.produtosComCusto}/{financeiro.totalProdutos} com custo cadastrado</span>
      </div>
    </div>
  );
}

function PainelLista({
  titulo,
  itens,
  tipo,
  icon: Icon,
}: {
  titulo: string;
  itens: ProdutoResumo[];
  tipo: 'critico' | 'divergente';
  icon: LucideIcon;
}) {
  return (
    <Card padding="none">
      <CardHeader title={titulo} subtitle={`${itens.length} item(ns)`} icon={Icon} />
      <ul className="divide-y divide-base-100">
        {itens.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-surface-hover">
            <div className="min-w-0">
              <p className="truncate font-medium text-base-950">{p.descricao}</p>
              <p className="font-mono text-xs text-base-800/50">{p.codigo}</p>
            </div>
            <Badge tom="critico">
              {tipo === 'critico'
                ? `${p.saldo} ${p.unidade}`
                : `${(p.contagem ?? 0) - p.saldo > 0 ? '+' : ''}${(p.contagem ?? 0) - p.saldo}`}
            </Badge>
          </li>
        ))}
        {itens.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-base-800/50">Nenhum item nessa condição no momento.</li>
        )}
      </ul>
    </Card>
  );
}
