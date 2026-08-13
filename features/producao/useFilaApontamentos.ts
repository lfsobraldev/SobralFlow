'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApontamentoResumo, StatusApontamento } from '@/types';

const INTERVALO_POLLING_MS = 4000;

type FiltroStatus = 'TODOS' | StatusApontamento;

export function useFilaApontamentos() {
  const [itens, setItens] = useState<ApontamentoResumo[]>([]);
  const [resumo, setResumo] = useState({ novos: 0, emAndamento: 0, concluidosHoje: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [idsAtualizando, setIdsAtualizando] = useState<Set<string>>(new Set());
  const [idCopiado, setIdCopiado] = useState<string | null>(null);

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS');
  const [filtroOF, setFiltroOF] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Guarda os filtros em uma ref para o polling sempre usar o valor mais
  // recente sem precisar recriar o setInterval a cada tecla digitada.
  const filtrosRef = useRef({ filtroStatus, filtroOF, filtroData });
  filtrosRef.current = { filtroStatus, filtroOF, filtroData };

  const buscar = useCallback(async (mostrarCarregando: boolean) => {
    const { filtroStatus, filtroOF, filtroData } = filtrosRef.current;
    if (mostrarCarregando) setCarregando(true);

    const params = new URLSearchParams();
    if (filtroStatus !== 'TODOS') params.set('status', filtroStatus);
    if (filtroOF.trim()) params.set('numeroOF', filtroOF.trim());
    if (filtroData) params.set('data', filtroData);

    try {
      const [resItens, resResumo] = await Promise.all([
        fetch(`/api/apontamentos?${params.toString()}`),
        fetch('/api/apontamentos/resumo'),
      ]);

      if (resItens.ok) {
        const data = await resItens.json();
        setItens(data.apontamentos ?? []);
        setErro(null);
      } else {
        setErro('Não foi possível atualizar a fila.');
      }

      if (resResumo.ok) {
        const data = await resResumo.json();
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Falha de conexão ao atualizar a fila.');
    } finally {
      if (mostrarCarregando) setCarregando(false);
    }
  }, []);

  // Primeira carga + toda vez que um filtro muda.
  useEffect(() => {
    buscar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroOF, filtroData]);

  // Polling: mantém a fila "em tempo real" sem precisar atualizar a página
  // manualmente. Um novo apontamento enviado pelo celular aparece aqui em
  // até INTERVALO_POLLING_MS.
  useEffect(() => {
    const intervalo = setInterval(() => buscar(false), INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [buscar]);

  async function atualizarStatus(id: string, status: StatusApontamento) {
    setIdsAtualizando((atual) => new Set(atual).add(id));
    try {
      const res = await fetch(`/api/apontamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setItens((atual) => atual.map((item) => (item.id === id ? data.apontamento : item)));
        buscar(false); // reflete os contadores do topo imediatamente
      }
    } finally {
      setIdsAtualizando((atual) => {
        const novo = new Set(atual);
        novo.delete(id);
        return novo;
      });
    }
  }

  async function copiar(item: ApontamentoResumo) {
    const texto = [
      `OF: ${item.numeroOF}`,
      `OPERAÇÃO: ${item.numeroOperacao}`,
      `PEÇA: ${item.peca}`,
      `QUANTIDADE: ${item.quantidade}`,
      `SITUAÇÃO: ${item.situacao}`,
      item.motivo ? `MOTIVO: ${item.motivo}` : null,
      item.observacao ? `OBSERVAÇÃO: ${item.observacao}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      setIdCopiado(item.id);
      setTimeout(() => setIdCopiado((atual) => (atual === item.id ? null : atual)), 2000);
    } catch {
      setErro('Não foi possível copiar. Copie manualmente.');
    }

    // Copiar os dados é o sinal de que o apontamento está sendo lançado no
    // sistema oficial — move de NOVO para EM_ANDAMENTO automaticamente.
    if (item.status === 'NOVO') {
      atualizarStatus(item.id, 'EM_ANDAMENTO');
    }
  }

  function marcarConcluido(id: string) {
    atualizarStatus(id, 'CONCLUIDO');
  }

  function limparFiltros() {
    setFiltroStatus('TODOS');
    setFiltroOF('');
    setFiltroData('');
  }

  return {
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
    atualizarStatus,
  };
}
