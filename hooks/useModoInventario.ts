'use client';

import { useEffect, useState } from 'react';

const CHAVE_STORAGE = 'estoque_sessao_inventario_ativa';

export function useModoInventario() {
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [iniciadaEm, setIniciadaEm] = useState<number | null>(null);
  const [itensNestaSessao, setItensNestaSessao] = useState(0);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Retoma uma sessão em andamento se a página for recarregada no meio do inventário.
  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) {
      const { id, inicio } = JSON.parse(salvo);
      setSessaoId(id);
      setIniciadaEm(inicio);
    }
  }, []);

  useEffect(() => {
    if (!iniciadaEm) return;
    const intervalo = setInterval(() => {
      setTempoDecorrido(Date.now() - iniciadaEm);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [iniciadaEm]);

  async function iniciar() {
    setCarregandoAcao(true);
    const res = await fetch('/api/inventario/iniciar', { method: 'POST' });
    const data = await res.json();
    setCarregandoAcao(false);
    if (!res.ok) return;

    const inicio = Date.now();
    setSessaoId(data.sessaoInventario.id);
    setIniciadaEm(inicio);
    setItensNestaSessao(0);
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify({ id: data.sessaoInventario.id, inicio }));
  }

  function registrarItemContado() {
    setItensNestaSessao((n) => n + 1);
  }

  async function finalizar() {
    if (!sessaoId) return null;
    setCarregandoAcao(true);
    const res = await fetch(`/api/inventario/${sessaoId}/finalizar`, { method: 'POST' });
    const data = await res.json();
    setCarregandoAcao(false);
    if (!res.ok) return null;

    localStorage.removeItem(CHAVE_STORAGE);
    const idFinalizado = sessaoId;
    setSessaoId(null);
    setIniciadaEm(null);
    setItensNestaSessao(0);
    return idFinalizado;
  }

  return {
    sessaoId,
    ativo: Boolean(sessaoId),
    tempoDecorrido,
    itensNestaSessao,
    carregandoAcao,
    iniciar,
    finalizar,
    registrarItemContado,
  };
}

export function formatarDuracao(ms: number) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return [horas, minutos, segundos]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}
