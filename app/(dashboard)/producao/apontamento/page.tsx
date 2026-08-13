'use client';

import { useState } from 'react';
import { ScanLine, Send } from 'lucide-react';
import { useApontamento } from '@/features/producao/useApontamento';
import { ScannerCamera } from '@/components/contagem/ScannerCamera';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Botao } from '@/components/ui/Button';
import { SITUACOES_APONTAMENTO } from '@/types';

const ROTULO_SITUACAO: Record<string, string> = {
  OK: 'OK',
  FALTA: 'Falta de material/peça',
  PROBLEMA: 'Problema na operação',
  OUTRO: 'Outro',
};

const campoClasse =
  'h-12 w-full rounded-lg border border-base-200 px-3 text-base outline-none focus:border-action';

export default function ApontamentoPage() {
  const [scannerAberto, setScannerAberto] = useState(false);
  const { form, atualizarCampo, definirOFEscaneada, enviando, feedback, enviar } =
    useApontamento();

  function handleCodigoEscaneado(codigo: string) {
    setScannerAberto(false);
    definirOFEscaneada(codigo);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 animate-in">
      <PageHeader icon={ScanLine} title="Apontamento" subtitle="Produção → Apontamento" />

      <ScannerCamera
        aberto={scannerAberto}
        onFechar={() => setScannerAberto(false)}
        onDetectado={handleCodigoEscaneado}
      />

      {feedback && (
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

      <Card className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Nº da OF</label>
          <div className="flex gap-2">
            <input
              value={form.numeroOF}
              onChange={(e) => atualizarCampo('numeroOF', e.target.value)}
              placeholder="Escaneie ou digite a OF"
              className={campoClasse}
            />
            <button
              type="button"
              onClick={() => setScannerAberto(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-action text-action-contrast active:scale-95"
              aria-label="Escanear código de barras da OF"
            >
              <ScanLine size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">Operação</label>
            <input
              value={form.numeroOperacao}
              onChange={(e) => atualizarCampo('numeroOperacao', e.target.value)}
              placeholder="Ex: 020"
              className={campoClasse}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">Quantidade</label>
            <input
              value={form.quantidade}
              onChange={(e) => atualizarCampo('quantidade', e.target.value)}
              placeholder="Ex: 50"
              inputMode="decimal"
              className={campoClasse}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Peça</label>
          <input
            value={form.peca}
            onChange={(e) => atualizarCampo('peca', e.target.value)}
            placeholder="Ex: Alizar"
            className={campoClasse}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">Situação</label>
          <select
            value={form.situacao}
            onChange={(e) => atualizarCampo('situacao', e.target.value)}
            className={campoClasse}
          >
            {SITUACOES_APONTAMENTO.map((s) => (
              <option key={s} value={s}>
                {ROTULO_SITUACAO[s] ?? s}
              </option>
            ))}
          </select>
        </div>

        {form.situacao !== 'OK' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">
              Motivo <span className="text-critical">*</span>
            </label>
            <textarea
              value={form.motivo}
              onChange={(e) => atualizarCampo('motivo', e.target.value)}
              placeholder="Descreva o motivo da falta/problema"
              rows={2}
              className="w-full rounded-lg border border-base-200 px-3 py-2.5 text-base outline-none focus:border-action"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-base-800/70">
            Observação (opcional)
          </label>
          <textarea
            value={form.observacao}
            onChange={(e) => atualizarCampo('observacao', e.target.value)}
            placeholder="Alguma observação adicional"
            rows={2}
            className="w-full rounded-lg border border-base-200 px-3 py-2.5 text-base outline-none focus:border-action"
          />
        </div>

        <Botao
          variante="primaria"
          tamanho="touch"
          icone={Send}
          carregando={enviando}
          onClick={enviar}
          className="w-full"
        >
          ENVIAR PARA APONTAMENTO
        </Botao>
      </Card>
    </div>
  );
}
