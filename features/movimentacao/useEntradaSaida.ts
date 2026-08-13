'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProdutoResumo } from '@/types';

type Feedback = { tipo: 'sucesso' | 'erro'; mensagem: string } | null;
type Direcao = 'ENTRADA' | 'SAIDA';

export function useEntradaSaida() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ProdutoResumo[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResumo | null>(null);
  const [direcao, setDirecao] = useState<Direcao>('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (produtoSelecionado) return;
    if (!termo) {
      setResultados([]);
      return;
    }
    setCarregandoBusca(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/produtos/buscar?termo=${encodeURIComponent(termo)}`);
        const data = await res.json();
        setResultados(data.produtos ?? []);
      } finally {
        setCarregandoBusca(false);
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [termo, produtoSelecionado]);

  const focarBusca = useCallback(() => {
    requestAnimationFrame(() => inputBuscaRef.current?.focus());
  }, []);

  function selecionarProduto(produto: ProdutoResumo) {
    setProdutoSelecionado(produto);
    setTermo('');
    setResultados([]);
    setQuantidade('');
    setDirecao('ENTRADA');
  }

  function cancelar() {
    setProdutoSelecionado(null);
    setQuantidade('');
    setFeedback(null);
    focarBusca();
  }

  const confirmar = useCallback(async () => {
    if (!produtoSelecionado) return;
    const qtd = parseFloat(quantidade.replace(',', '.'));
    if (Number.isNaN(qtd) || qtd <= 0) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe uma quantidade válida' });
      return;
    }

    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produtoSelecionado.id,
          valor: direcao === 'ENTRADA' ? qtd : -qtd,
          tipo: direcao,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ tipo: 'erro', mensagem: data.erro ?? 'Erro ao registrar' });
        setEnviando(false);
        return;
      }

      setFeedback({
        tipo: 'sucesso',
        mensagem: `${direcao === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${qtd} registrada`,
      });
      setProdutoSelecionado(null);
      setQuantidade('');
      focarBusca();
    } catch {
      setFeedback({ tipo: 'erro', mensagem: 'Falha de conexão' });
    } finally {
      setEnviando(false);
    }
  }, [produtoSelecionado, quantidade, direcao, focarBusca]);

  return {
    inputBuscaRef,
    termo,
    setTermo,
    resultados,
    carregandoBusca,
    produtoSelecionado,
    direcao,
    setDirecao,
    quantidade,
    setQuantidade,
    enviando,
    feedback,
    selecionarProduto,
    cancelar,
    confirmar,
    focarBusca,
  };
}
