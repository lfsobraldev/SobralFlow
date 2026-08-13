'use client';

import { useEffect, useState } from 'react';

export interface ProdutoCompleto {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  saldo: number;
  contagem: number | null;
  localizacao: string | null;
  categoria: string | null;
  observacoes: string | null;
  codigoBarras: string | null;
  estoqueMinimo: number | null;
  custoUnitario: number | null;
  pedidoId: string | null;
  pedido?: { nome: string } | null;
  fatorConversao: number | null;
  unidadeConversao: string | null;
}

const POR_PAGINA = 20;

export function useProdutos() {
  const [itens, setItens] = useState<ProdutoCompleto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [termo, setTermoState] = useState('');
  const [apenasCriticos, setApenasCriticosState] = useState(false);
  const [apenasDivergentes, setApenasDivergentesState] = useState(false);
  const [pedidoId, setPedidoIdState] = useState('');

  function comResetDePagina<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPagina(1);
    };
  }
  const setTermo = comResetDePagina(setTermoState);
  const setApenasCriticos = comResetDePagina(setApenasCriticosState);
  const setApenasDivergentes = comResetDePagina(setApenasDivergentesState);
  const setPedidoId = comResetDePagina(setPedidoIdState);

  async function recarregar() {
    setCarregando(true);
    const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
    if (termo) params.set('termo', termo);
    if (apenasCriticos) params.set('criticos', '1');
    if (apenasDivergentes) params.set('divergentes', '1');
    if (pedidoId) params.set('pedidoId', pedidoId);

    const res = await fetch(`/api/produtos?${params.toString()}`);
    const data = await res.json();
    setItens(data.itens ?? []);
    setTotal(data.total ?? 0);
    setTotalPaginas(data.totalPaginas ?? 1);
    setCarregando(false);
  }

  useEffect(() => {
    const timeout = setTimeout(recarregar, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo, apenasCriticos, apenasDivergentes, pedidoId, pagina]);

  async function criar(dados: Record<string, unknown>) {
    setErro(null);
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.erro ?? 'Erro ao criar produto');
      return false;
    }
    await recarregar();
    return true;
  }

  async function editar(id: string, dados: Record<string, unknown>) {
    setErro(null);
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.erro ?? 'Erro ao editar produto');
      return false;
    }
    await recarregar();
    return true;
  }

  async function excluir(id: string) {
    setErro(null);
    const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(data.erro ?? 'Erro ao excluir produto');
      return false;
    }
    await recarregar();
    return true;
  }

  return {
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
    recarregar,
  };
}
