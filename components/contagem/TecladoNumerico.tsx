import { Botao } from '@/components/ui/Button';

const PRESETS_POSITIVOS = [0.5, 1, 1.5, 2];
const PRESETS_NEGATIVOS = [-0.5, -1, -1.5, -2];

function formatarPreset(v: number) {
  const sinal = v > 0 ? '+' : '−';
  return `${sinal}${Math.abs(v).toString().replace('.', ',')}`;
}

interface TecladoNumericoProps {
  onDigito: (d: string) => void;
  onVirgula: () => void;
  onPreset: (valor: number) => void;
  onLimpar: () => void;
  onConfirmar: () => void;
  onCancelar: () => void;
  desabilitado?: boolean;
}

export function TecladoNumerico({
  onDigito,
  onVirgula,
  onPreset,
  onLimpar,
  onConfirmar,
  onCancelar,
  desabilitado,
}: TecladoNumericoProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Ajustes rápidos: um único toque aplica e confirma o ajuste imediatamente */}
      {PRESETS_POSITIVOS.map((v) => (
        <Botao
          key={v}
          variante="positiva"
          disabled={desabilitado}
          onClick={() => onPreset(v)}
        >
          {formatarPreset(v)}
        </Botao>
      ))}
      {PRESETS_NEGATIVOS.map((v) => (
        <Botao
          key={v}
          variante="critica"
          disabled={desabilitado}
          onClick={() => onPreset(v)}
        >
          {formatarPreset(v)}
        </Botao>
      ))}

      {/* Dígitos para valores customizados (ex: 3,25) */}
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => (
        <Botao
          key={d}
          variante="neutra"
          disabled={desabilitado}
          onClick={() => onDigito(d)}
          className="col-span-1"
        >
          {d}
        </Botao>
      ))}

      <Botao variante="neutra" disabled={desabilitado} onClick={() => onDigito('0')}>
        0
      </Botao>
      <Botao variante="neutra" disabled={desabilitado} onClick={onVirgula}>
        ,
      </Botao>
      <Botao variante="fantasma" disabled={desabilitado} onClick={onLimpar} className="col-span-2">
        Limpar
      </Botao>

      <Botao
        variante="neutra"
        disabled={desabilitado}
        onClick={onCancelar}
        className="col-span-2 bg-base-100"
      >
        Cancelar
      </Botao>
      <Botao
        variante="primaria"
        disabled={desabilitado}
        onClick={onConfirmar}
        className="col-span-2"
      >
        Confirmar
      </Botao>
    </div>
  );
}
