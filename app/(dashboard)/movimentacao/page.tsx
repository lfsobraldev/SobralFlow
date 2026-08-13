'use client';

import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';
import { useEntradaSaida } from '@/features/movimentacao/useEntradaSaida';
import { BuscaProduto } from '@/components/contagem/BuscaProduto';
import { ScannerCamera } from '@/components/contagem/ScannerCamera';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MovimentacaoPage() {
  const {
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
  } = useEntradaSaida();

  const [scannerAberto, setScannerAberto] = useState(false);

  useEffect(() => {
    focarBusca();
  }, [focarBusca]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 animate-in">
      <PageHeader
        icon={ArrowLeftRight}
        title="Entrada / Saída"
        subtitle="Movimenta o Saldo real do produto (diferente da Contagem, usada na conferência)."
      />

      <ScannerCamera
        aberto={scannerAberto}
        onFechar={() => setScannerAberto(false)}
        onDetectado={(codigo) => {
          setScannerAberto(false);
          setTermo(codigo);
        }}
      />

      {!produtoSelecionado && (
        <BuscaProduto
          ref={inputBuscaRef}
          termo={termo}
          onTermoChange={setTermo}
          resultados={resultados}
          onSelecionar={selecionarProduto}
          carregando={carregandoBusca}
          onAbrirScanner={() => setScannerAberto(true)}
        />
      )}

      {feedback && !produtoSelecionado && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.tipo === 'sucesso'
              ? 'bg-positive-bg text-positive'
              : 'bg-critical-bg text-critical'
          }`}
        >
          {feedback.mensagem}
        </div>
      )}

      {produtoSelecionado && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-xl border border-base-200 bg-surface p-5 shadow-panel">
            <p className="font-mono text-sm font-semibold text-action">
              {produtoSelecionado.codigo}
            </p>
            <h2 className="text-xl font-bold leading-tight text-base-950">
              {produtoSelecionado.descricao}
            </h2>
            <p className="mt-2 text-sm text-base-800/60">
              Saldo atual:{' '}
              <span className="font-semibold text-base-950">
                {produtoSelecionado.saldo} {produtoSelecionado.unidade}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirecao('ENTRADA')}
              className={`flex h-16 items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors ${
                direcao === 'ENTRADA'
                  ? 'bg-positive text-white'
                  : 'border border-base-200 bg-surface text-base-800'
              }`}
            >
              <ArrowDownCircle size={20} /> Entrada
            </button>
            <button
              onClick={() => setDirecao('SAIDA')}
              className={`flex h-16 items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors ${
                direcao === 'SAIDA'
                  ? 'bg-critical text-white'
                  : 'border border-base-200 bg-surface text-base-800'
              }`}
            >
              <ArrowUpCircle size={20} /> Saída
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-base-800/70">
              Quantidade
            </label>
            <input
              autoFocus
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className="h-16 w-full rounded-xl border border-base-200 px-5 text-3xl font-bold tabular outline-none focus:border-action"
            />
          </div>

          {feedback?.tipo === 'erro' && (
            <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm font-medium text-critical">
              {feedback.mensagem}
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 gap-2">
            <button
              onClick={cancelar}
              disabled={enviando}
              className="h-14 rounded-xl bg-base-100 text-base font-semibold text-base-800"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={enviando}
              className={`h-14 rounded-xl text-base font-semibold text-white disabled:opacity-60 ${
                direcao === 'ENTRADA' ? 'bg-positive' : 'bg-critical'
              }`}
            >
              {enviando ? 'Registrando...' : `Confirmar ${direcao === 'ENTRADA' ? 'entrada' : 'saída'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
