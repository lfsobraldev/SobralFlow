'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

interface ScannerCameraProps {
  aberto: boolean;
  onFechar: () => void;
  onDetectado: (codigo: string) => void;
}

// Leitura de código de barras/QR via câmera usando @zxing/browser.
//
// IMPORTANTE: a versão anterior deste componente usava a API nativa
// `window.BarcodeDetector`. Essa API NUNCA existiu no Safari/iOS (só é
// suportada em Chrome/Edge no desktop e Android) — ou seja, em qualquer
// iPhone o scanner simplesmente não fazia nada, silenciosamente. O ZXing é
// uma implementação 100% em JavaScript (decodifica via <canvas>), então
// funciona igual em iPhone, Android e desktop.
export function ScannerCamera({ aberto, onFechar, onDetectado }: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onDetectadoRef = useRef(onDetectado);
  const jaDetectouRef = useRef(false);

  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Mantém a referência sempre atualizada sem precisar reiniciar a câmera
  // toda vez que o componente pai recria a função onDetectado.
  useEffect(() => {
    onDetectadoRef.current = onDetectado;
  }, [onDetectado]);

  useEffect(() => {
    if (!aberto) return;

    setErroCamera(null);
    setCarregando(true);
    jaDetectouRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErroCamera('Este navegador não permite acesso à câmera nesta página (verifique se o acesso está sendo feito por HTTPS).');
      setCarregando(false);
      return;
    }

    const reader = new BrowserMultiFormatReader();
    let cancelado = false;

    async function iniciar() {
      try {
        const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices();
        // Prioriza a câmera traseira (environment) — essencial em celular; em
        // desktop, cai para a primeira câmera disponível.
        const traseira = dispositivos.find((d) => /back|traseira|rear|environment/i.test(d.label));
        const deviceId = traseira?.deviceId ?? dispositivos[0]?.deviceId;

        if (cancelado || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (resultado) => {
            if (resultado && !jaDetectouRef.current) {
              jaDetectouRef.current = true;
              onDetectadoRef.current(resultado.getText());
            }
          }
        );

        if (cancelado) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setCarregando(false);
      } catch (err) {
        if (cancelado) return;
        const nome = err instanceof Error ? err.name : '';
        if (nome === 'NotAllowedError') {
          setErroCamera('Permissão da câmera negada. Ative o acesso à câmera nas configurações do navegador/site e tente novamente.');
        } else if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
          setErroCamera('Nenhuma câmera foi encontrada neste dispositivo.');
        } else {
          setErroCamera('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        }
        setCarregando(false);
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-base-950/90 px-4">
      {!erroCamera && (
        <div className="relative w-full max-w-md">
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full rounded-xl bg-black"
            muted
            playsInline
            autoPlay
          />
          {carregando && (
            <p className="mt-3 text-center text-sm text-white/70">Abrindo câmera...</p>
          )}
          {!carregando && (
            <p className="mt-3 text-center text-sm text-white/70">
              Aponte a câmera para o código de barras ou QR Code
            </p>
          )}
        </div>
      )}

      {erroCamera && (
        <p className="max-w-sm text-center text-white">
          {erroCamera} Você também pode digitar o código manualmente.
        </p>
      )}

      <button
        onClick={onFechar}
        className="mt-6 rounded-lg bg-surface px-6 py-3 text-sm font-semibold text-base-950"
      >
        Fechar
      </button>
    </div>
  );
}
