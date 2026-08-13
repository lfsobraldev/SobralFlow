'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProdutoResumo } from '@/types';

type Feedback = { tipo: 'sucesso' | 'erro'; mensagem: string } | null;

export function useContagem(sessaoInventarioId?: string | null) {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ProdutoResumo[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResumo | null>(null);
  const [valorDigitado, setValorDigitado] = useState(''); // ex: "3,25"
  const [sinalDigitado, setSinalDigitado] = useState<1 | -1>(1);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Busca instantânea com debounce curto (a rede é o único gargalo real de latência aqui)
  useEffect(() => {
    if (produtoSelecionado) return; // não busca enquanto um produto está aberto
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
    setValorDigitado('');
    setSinalDigitado(1);
  }

  function cancelar() {
    setProdutoSelecionado(null);
    setValorDigitado('');
    setSinalDigitado(1);
    setFeedback(null);
    focarBusca();
  }

  function limpar() {
    setValorDigitado('');
    setSinalDigitado(1);
  }

  function digitar(d: string) {
    // evita número absurdo por dedo pesado no touchscreen (máx. 6 dígitos antes da vírgula)
    setValorDigitado((atual) => (atual.replace(',', '').length >= 6 ? atual : atual + d));
  }

  function digitarVirgula() {
    setValorDigitado((atual) => (atual.includes(',') ? atual : atual + (atual ? ',' : '0,')));
  }

  function alternarSinal(sinal: 1 | -1) {
    setSinalDigitado(sinal);
  }

  const enviarMovimento = useCallback(
    async (valor: number) => {
      if (!produtoSelecionado || valor === 0) return;
      setEnviando(true);
      setFeedback(null);
      try {
        const res = await fetch('/api/movimentacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produtoId: produtoSelecionado.id,
            valor,
            tipo: 'AJUSTE_CONTAGEM',
            ...(sessaoInventarioId ? { sessaoInventarioId } : {}),
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
          mensagem: `${valor > 0 ? '+' : ''}${valor.toString().replace('.', ',')} registrado`,
        });

        // Volta direto para a busca: o fluxo de conferência é bipar item após item sem parar.
        setProdutoSelecionado(null);
        setValorDigitado('');
        setSinalDigitado(1);
        focarBusca();
      } catch {
        setFeedback({ tipo: 'erro', mensagem: 'Falha de conexão' });
      } finally {
        setEnviando(false);
      }
    },
    [produtoSelecionado, focarBusca, sessaoInventarioId]
  );

  function aplicarPreset(valor: number) {
    // Um único toque já registra o ajuste — não exige "Confirmar" para os casos mais comuns.
    enviarMovimento(valor);
  }

  function confirmarDigitado() {
    if (!valorDigitado) return;
    const numero = parseFloat(valorDigitado.replace(',', '.'));
    if (Number.isNaN(numero)) return;
    enviarMovimento(numero * sinalDigitado);
  }

  // Suporte a teclado físico, conforme pedido: dígitos, vírgula/ponto, +/-, Enter, Backspace, Esc.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!produtoSelecionado) return;
      if (enviando) return;

      if (/^[0-9]$/.test(e.key)) {
        digitar(e.key);
        return;
      }
      if (e.key === ',' || e.key === '.') {
        digitarVirgula();
        return;
      }
      if (e.key === '+') {
        alternarSinal(1);
        return;
      }
      if (e.key === '-') {
        alternarSinal(-1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmarDigitado();
        return;
      }
      if (e.key === 'Backspace') {
        setValorDigitado((atual) => atual.slice(0, -1));
        return;
      }
      if (e.key === 'Escape') {
        cancelar();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoSelecionado, enviando, valorDigitado, sinalDigitado]);

  const valorDigitadoFormatado = valorDigitado
    ? `${sinalDigitado > 0 ? '+' : '−'}${valorDigitado}`
    : '';

  return {
    inputBuscaRef,
    termo,
    setTermo,
    resultados,
    carregandoBusca,
    produtoSelecionado,
    valorDigitadoFormatado,
    enviando,
    feedback,
    selecionarProduto,
    cancelar,
    limpar,
    digitar,
    digitarVirgula,
    aplicarPreset,
    confirmarDigitado,
    focarBusca,
  };
}
