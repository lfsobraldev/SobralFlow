'use client';

import { useCallback, useState } from 'react';
import { SITUACOES_APONTAMENTO } from '@/types';

type Feedback = { tipo: 'sucesso' | 'erro'; mensagem: string } | null;

const VALOR_INICIAL = {
  numeroOF: '',
  numeroOperacao: '',
  peca: '',
  quantidade: '',
  situacao: SITUACOES_APONTAMENTO[0] as string,
  motivo: '',
  observacao: '',
};

export function useApontamento() {
  const [form, setForm] = useState(VALOR_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function atualizarCampo<K extends keyof typeof VALOR_INICIAL>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    if (feedback) setFeedback(null);
  }

  const definirOFEscaneada = useCallback((codigo: string) => {
    setForm((atual) => ({ ...atual, numeroOF: codigo }));
    setFeedback(null);
  }, []);

  function limparFormulario() {
    setForm(VALOR_INICIAL);
  }

  async function enviar() {
    if (enviando) return;

    if (!form.numeroOF.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Escaneie ou informe o número da OF' });
      return;
    }
    if (!form.numeroOperacao.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe o número da operação' });
      return;
    }
    if (!form.peca.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe a peça' });
      return;
    }
    const quantidadeNumero = parseFloat(form.quantidade.replace(',', '.'));
    if (!form.quantidade || Number.isNaN(quantidadeNumero) || quantidadeNumero <= 0) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe uma quantidade válida' });
      return;
    }
    if (form.situacao !== 'OK' && !form.motivo.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe o motivo da falta/problema' });
      return;
    }

    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/apontamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroOF: form.numeroOF.trim(),
          numeroOperacao: form.numeroOperacao.trim(),
          peca: form.peca.trim(),
          quantidade: quantidadeNumero,
          situacao: form.situacao,
          motivo: form.motivo.trim() || undefined,
          observacao: form.observacao.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ tipo: 'erro', mensagem: data.erro ?? 'Erro ao enviar apontamento' });
        setEnviando(false);
        return;
      }

      setFeedback({ tipo: 'sucesso', mensagem: 'Apontamento enviado para a fila!' });
      limparFormulario();
    } catch {
      setFeedback({ tipo: 'erro', mensagem: 'Falha de conexão. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return {
    form,
    atualizarCampo,
    definirOFEscaneada,
    enviando,
    feedback,
    enviar,
  };
}
