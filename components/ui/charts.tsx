'use client';

import { useId, useState } from 'react';

// Componentes de gráfico 100% SVG, sem dependências externas — evita qualquer
// risco de instalação de pacote adicional e mantém o bundle enxuto.

interface SeriePonto {
  rotulo: string;
  valor: number;
}

const PALETA = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'];

// ── Gráfico de barras (ex.: movimentações por dia) ──────────────────────────
export function BarChart({
  dados,
  altura = 200,
  corBarra = '#3B82F6',
  formatoValor,
}: {
  dados: SeriePonto[];
  altura?: number;
  corBarra?: string;
  formatoValor?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const largura = Math.max(dados.length * 48, 320);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" height={altura} preserveAspectRatio="none" className="block">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={largura}
            y1={altura - 28 - f * (altura - 48)}
            y2={altura - 28 - f * (altura - 48)}
            stroke="#232935"
            strokeWidth={1}
          />
        ))}
        {dados.map((d, i) => {
          const w = (largura / dados.length) * 0.55;
          const x = (largura / dados.length) * i + (largura / dados.length - w) / 2;
          const h = (d.valor / max) * (altura - 48);
          const y = altura - 28 - h;
          const ativo = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(h, 2)}
                rx={4}
                fill={corBarra}
                opacity={ativo ? 1 : 0.75}
                className="transition-opacity duration-150"
              />
              {ativo && (
                <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight={700} fill="#F3F5F8">
                  {formatoValor ? formatoValor(d.valor) : d.valor}
                </text>
              )}
              <text
                x={x + w / 2}
                y={altura - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#8B95A7"
              >
                {d.rotulo}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Gráfico de linha/área (ex.: entradas vs saídas ao longo do tempo) ───────
export function LineChart({
  series,
  altura = 220,
}: {
  series: { nome: string; cor: string; pontos: SeriePonto[] }[];
  altura?: number;
}) {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const n = series[0]?.pontos.length ?? 0;
  const largura = Math.max(n * 46, 320);
  const max = Math.max(1, ...series.flatMap((s) => s.pontos.map((p) => p.valor)));

  function coordenadas(pontos: SeriePonto[]) {
    return pontos.map((p, i) => {
      const x = n <= 1 ? largura / 2 : (largura / (n - 1)) * i;
      const y = altura - 28 - (p.valor / max) * (altura - 48);
      return { x, y, ...p };
    });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" height={altura} preserveAspectRatio="none" className="block">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.cor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.cor} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={largura} y1={altura - 28 - f * (altura - 48)} y2={altura - 28 - f * (altura - 48)} stroke="#232935" strokeWidth={1} />
        ))}

        {series.map((s, si) => {
          const pts = coordenadas(s.pontos);
          const linha = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const area = `${linha} L ${pts[pts.length - 1]?.x ?? 0} ${altura - 28} L ${pts[0]?.x ?? 0} ${altura - 28} Z`;
          return (
            <g key={si}>
              <path d={area} fill={`url(#${gradientId}-${si})`} />
              <path d={linha} fill="none" stroke={s.cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === i ? 4 : 2.5}
                  fill={s.cor}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="cursor-pointer transition-all"
                />
              ))}
            </g>
          );
        })}

        {series[0]?.pontos.map((p, i) => (
          <text
            key={i}
            x={n <= 1 ? largura / 2 : (largura / (n - 1)) * i}
            y={altura - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#8B95A7"
          >
            {p.rotulo}
          </text>
        ))}
      </svg>

      <div className="mt-1 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.nome} className="flex items-center gap-1.5 text-xs text-base-800/70">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Gráfico de rosca (ex.: distribuição por categoria) ──────────────────────
export function DonutChart({
  dados,
  tamanho = 168,
  espessura = 22,
}: {
  dados: SeriePonto[];
  tamanho?: number;
  espessura?: number;
}) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0) || 1;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  let acumulado = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#1C212C" strokeWidth={espessura} />
          {dados.map((d, i) => {
            const fracao = d.valor / total;
            const comprimento = fracao * circunferencia;
            const offset = -acumulado * circunferencia;
            acumulado += fracao;
            return (
              <circle
                key={i}
                cx={tamanho / 2}
                cy={tamanho / 2}
                r={raio}
                fill="none"
                stroke={PALETA[i % PALETA.length]}
                strokeWidth={espessura}
                strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="20" fontWeight={700} fill="#F3F5F8">
          {total}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fontSize="10" fill="#8B95A7">
          itens
        </text>
      </svg>
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {dados.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-base-800/70">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PALETA[i % PALETA.length] }} />
              <span className="truncate">{d.rotulo}</span>
            </span>
            <span className="shrink-0 font-semibold tabular text-base-950">{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
