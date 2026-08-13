'use client';

import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, GitCompareArrows, Package } from 'lucide-react';
import { useProdutos, type ProdutoCompleto } from '@/features/produtos/useProdutos';
import { useSessao } from '@/hooks/useSessao';
import { FormularioProduto } from '@/components/produtos/FormularioProduto';
import { ImportarExportar } from '@/components/produtos/ImportarExportar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Botao } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Coluna } from '@/components/ui/DataTable';
import { formatarMoeda } from '@/lib/formatacao';

interface Pedido {
  id: string;
  nome: string;
}

export default function ProdutosPage() {
  const {
    itens,
    total,
    totalPaginas,
    pagina,
    setPagina,
    carregando,
    erro,
    termo,
    setTermo,
    apenasCriticos,
    setApenasCriticos,
    apenasDivergentes,
    setApenasDivergentes,
    pedidoId,
    setPedidoId,
    criar,
    editar,
    excluir,
    recarregar: recarregarProdutos,
  } = useProdutos();

  const { pode } = useSessao();
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<ProdutoCompleto | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    fetch('/api/pedidos')
      .then((r) => r.json())
      .then((d) => setPedidos(d.pedidos ?? []));
  }, []);

  function abrirNovo() {
    setProdutoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(produto: ProdutoCompleto) {
    setProdutoEmEdicao(produto);
    setModalAberto(true);
  }

  async function handleSalvar(dados: Record<string, unknown>) {
    if (produtoEmEdicao) return editar(produtoEmEdicao.id, dados);
    return criar(dados);
  }

  async function handleExcluir(produto: ProdutoCompleto) {
    if (!confirm(`Excluir "${produto.descricao}"? Essa ação não pode ser desfeita.`)) return;
    await excluir(produto.id);
  }

  const colunas: Coluna<ProdutoCompleto>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      ordenar: (p) => p.codigo,
      render: (p) => <span className="font-mono text-xs text-base-800/70">{p.codigo}</span>,
    },
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
    {
      chave: 'pedido',
      cabecalho: 'Pedido',
      render: (p) => <span className="text-base-800/70">{p.pedido?.nome ?? '—'}</span>,
    },
    {
      chave: 'localizacao',
      cabecalho: 'Local',
      render: (p) => <span className="text-base-800/70">{p.localizacao ?? '—'}</span>,
    },
    {
      chave: 'saldo',
      cabecalho: 'Saldo',
      alinhar: 'direita',
      ordenar: (p) => p.saldo,
      render: (p) => {
        const critico = p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo;
        const conversao =
          p.fatorConversao != null && p.unidadeConversao
            ? `${(p.saldo * p.fatorConversao).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${p.unidadeConversao}`
            : null;
        return (
          <div>
            <div className={`flex items-center justify-end gap-1 tabular font-medium ${critico ? 'text-critical' : 'text-base-950'}`}>
              {critico && <AlertTriangle size={13} />}
              {p.saldo} {p.unidade}
            </div>
            {conversao && <p className="text-xs font-normal text-base-800/50">≈ {conversao}</p>}
          </div>
        );
      },
    },
    {
      chave: 'valor',
      cabecalho: 'Valor',
      alinhar: 'direita',
      ordenar: (p) => p.saldo * (p.custoUnitario ?? 0),
      render: (p) => (
        <span className="tabular text-base-800/70">
          {p.custoUnitario != null ? formatarMoeda(p.saldo * p.custoUnitario) : '—'}
        </span>
      ),
    },
    {
      chave: 'contagem',
      cabecalho: 'Contagem',
      alinhar: 'direita',
      ordenar: (p) => p.contagem ?? -Infinity,
      render: (p) => {
        const divergente = p.contagem != null && p.contagem !== p.saldo;
        return (
          <div className={`flex items-center justify-end gap-1 tabular ${divergente ? 'font-semibold text-warning' : 'text-base-800/50'}`}>
            {divergente && <GitCompareArrows size={13} />}
            {p.contagem ?? '—'}
          </div>
        );
      },
    },
    ...(pode('editarProdutos')
      ? [
          {
            chave: 'acoes',
            cabecalho: 'Ações',
            alinhar: 'direita' as const,
            render: (p: ProdutoCompleto) => (
              <div className="flex justify-end gap-3">
                <button onClick={() => abrirEdicao(p)} className="text-xs font-medium text-action hover:underline">
                  Editar
                </button>
                {pode('excluirProdutos') && (
                  <button onClick={() => handleExcluir(p)} className="text-xs font-medium text-critical hover:underline">
                    Excluir
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5 animate-in">
      <PageHeader
        icon={Package}
        title="Cadastro de produtos"
        subtitle={`${total} produto(s) cadastrado(s)`}
        actions={
          <>
            {pode('importarExportar') && <ImportarExportar onImportado={recarregarProdutos} />}
            {pode('editarProdutos') && (
              <Botao variante="primaria" tamanho="md" icone={Plus} onClick={abrirNovo}>
                Novo produto
              </Botao>
            )}
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-3">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por código, descrição ou código de barras..."
          className="h-11 min-w-[220px] flex-1 rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
        />
        <select
          value={pedidoId}
          onChange={(e) => setPedidoId(e.target.value)}
          className="h-11 rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
        >
          <option value="">Todos os pedidos</option>
          {pedidos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        {pode('editarProdutos') && (
          <button
            type="button"
            onClick={async () => {
              const nome = window.prompt('Nome do novo pedido/projeto (ex: TETTO 5900):');
              if (!nome?.trim()) return;
              const res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome.trim() }),
              });
              const data = await res.json();
              if (res.ok) setPedidos((atual) => [...atual, data.pedido]);
              else alert(data.erro ?? 'Erro ao criar pedido');
            }}
            className="h-11 rounded-lg border border-dashed border-base-200 px-3 text-sm font-medium text-base-800/70 transition-colors hover:bg-surface-hover"
          >
            + Pedido
          </button>
        )}
        <label className="flex items-center gap-2 text-sm text-base-800">
          <input type="checkbox" checked={apenasCriticos} onChange={(e) => setApenasCriticos(e.target.checked)} />
          Só estoque crítico
        </label>
        <label className="flex items-center gap-2 text-sm text-base-800">
          <input type="checkbox" checked={apenasDivergentes} onChange={(e) => setApenasDivergentes(e.target.checked)} />
          Só divergentes
        </label>
      </Card>

      {erro && (
        <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm font-medium text-critical">{erro}</div>
      )}

      <DataTable
        colunas={colunas}
        dados={itens}
        chaveLinha={(p) => p.id}
        carregando={carregando}
        mensagemVazio="Nenhum produto encontrado para esses filtros."
        linhaClassName={(p) => (p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo ? 'border-l-2 border-l-critical' : '')}
        paginacaoServidor={{ pagina, totalPaginas, total, onMudarPagina: setPagina }}
      />

      <FormularioProduto
        produto={produtoEmEdicao}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={handleSalvar}
      />
    </div>
  );
}
