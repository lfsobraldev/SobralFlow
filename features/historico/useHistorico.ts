'use client';

import { useEffect, useState } from 'react';

export interface ItemHistorico {
  id: string;
  tipo: string;
  valor: number;
  saldoAnterior: number;
  saldoNovo: number;
  ip: string | null;
  criadoEm: string;
  produto: { codigo: string; descricao: string; unidade: string };
  usuario: { nome: string; login: string };
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  login: string;
  perfil: string;
}

const POR_PAGINA = 20;

export function useHistorico() {
  const [itens, setItens] = useState<ItemHistorico[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const [produtoTermo, setProdutoTermo] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);

  function paraInputDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  // Atalhos "Esta semana" / "Este mês" — só preenchem os campos de data que já
  // existiam (dataInicio/dataFim), sem criar um mecanismo de filtro novo.
  function filtrarEstaSemana() {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // 0 = domingo
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - diaDaSemana);
    setDataInicio(paraInputDate(inicio));
    setDataFim(paraInputDate(hoje));
    setPagina(1);
  }

  function filtrarEsteMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setDataInicio(paraInputDate(inicio));
    setDataFim(paraInputDate(hoje));
    setPagina(1);
  }

  function limparPeriodo() {
    setDataInicio('');
    setDataFim('');
    setPagina(1);
  }

  useEffect(() => {
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then((d) => setUsuarios(d.usuarios ?? []));
  }, []);

  useEffect(() => {
    setCarregando(true);
    const params = new URLSearchParams({
      pagina: String(pagina),
      porPagina: String(POR_PAGINA),
    });
    if (produtoTermo) params.set('produto', produtoTermo);
    if (usuarioId) params.set('usuarioId', usuarioId);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/movimentacoes/historico?${params.toString()}`);
      const data = await res.json();
      setItens(data.itens ?? []);
      setTotalPaginas(data.totalPaginas ?? 1);
      setTotal(data.total ?? 0);
      setCarregando(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [produtoTermo, usuarioId, dataInicio, dataFim, pagina]);

  // qualquer mudança de filtro volta para a página 1
  function aplicarFiltro(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPagina(1);
    };
  }

  return {
    itens,
    total,
    totalPaginas,
    pagina,
    setPagina,
    carregando,
    usuarios,
    produtoTermo,
    setProdutoTermo: aplicarFiltro(setProdutoTermo),
    usuarioId,
    setUsuarioId: aplicarFiltro(setUsuarioId),
    dataInicio,
    setDataInicio: aplicarFiltro(setDataInicio),
    dataFim,
    setDataFim: aplicarFiltro(setDataFim),
    filtrarEstaSemana,
    filtrarEsteMes,
    limparPeriodo,
  };
}
