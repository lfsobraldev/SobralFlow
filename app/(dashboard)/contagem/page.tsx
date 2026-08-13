'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { useContagem } from '@/features/contagem/useContagem';
import { useModoInventario } from '@/hooks/useModoInventario';
import { BuscaProduto } from '@/components/contagem/BuscaProduto';
import { CartaoProduto } from '@/components/contagem/CartaoProduto';
import { TecladoNumerico } from '@/components/contagem/TecladoNumerico';
import { BarraModoInventario } from '@/components/contagem/BarraModoInventario';
import { ScannerCamera } from '@/components/contagem/ScannerCamera';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ContagemPage() {
  const router = useRouter();
  const modoInventario = useModoInventario();
  const [scannerAberto, setScannerAberto] = useState(false);

  const {
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
  } = useContagem(modoInventario.sessaoId);

  useEffect(() => {
    focarBusca();
  }, [focarBusca]);

  // Cada movimentação bem-sucedida durante o Modo Inventário conta para o relatório de fechamento.
  useEffect(() => {
    if (modoInventario.ativo && feedback?.tipo === 'sucesso') {
      modoInventario.registrarItemContado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  async function handleFinalizarInventario() {
    const idFinalizado = await modoInventario.finalizar();
    if (idFinalizado) router.push(`/inventario/${idFinalizado}`);
  }

  function handleCodigoEscaneado(codigo: string) {
    setScannerAberto(false);
    setTermo(codigo);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 animate-in">
      <PageHeader icon={ClipboardList} title="Tela de contagem" />

      <BarraModoInventario
        ativo={modoInventario.ativo}
        tempoDecorrido={modoInventario.tempoDecorrido}
        itensNestaSessao={modoInventario.itensNestaSessao}
        carregando={modoInventario.carregandoAcao}
        onIniciar={modoInventario.iniciar}
        onFinalizar={handleFinalizarInventario}
      />

      <ScannerCamera
        aberto={scannerAberto}
        onFechar={() => setScannerAberto(false)}
        onDetectado={handleCodigoEscaneado}
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
          <CartaoProduto produto={produtoSelecionado} valorDigitado={valorDigitadoFormatado} />

          {feedback?.tipo === 'erro' && (
            <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm font-medium text-critical">
              {feedback.mensagem}
            </div>
          )}

          <TecladoNumerico
            onDigito={digitar}
            onVirgula={digitarVirgula}
            onPreset={aplicarPreset}
            onLimpar={limpar}
            onConfirmar={confirmarDigitado}
            onCancelar={cancelar}
            desabilitado={enviando}
          />
        </div>
      )}
    </div>
  );
}
