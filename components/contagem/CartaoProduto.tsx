import type { ProdutoResumo } from '@/types';

function formatarNumero(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

interface CartaoProdutoProps {
  produto: ProdutoResumo;
  valorDigitado: string;
}

export function CartaoProduto({ produto, valorDigitado }: CartaoProdutoProps) {
  const contagemAtual = produto.contagem ?? produto.saldo;
  const diferenca = arredondar(contagemAtual - produto.saldo);

  const corDiferenca =
    diferenca === 0
      ? 'text-base-800/60'
      : diferenca > 0
      ? 'text-positive'
      : 'text-critical';

  return (
    <div className="rounded-xl border border-base-200 bg-surface p-5 shadow-panel">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-action">{produto.codigo}</p>
          <h2 className="text-xl font-bold leading-tight text-base-950">{produto.descricao}</h2>
        </div>
        {produto.localizacao && (
          <span className="shrink-0 rounded-md bg-base-100 px-2.5 py-1 text-xs font-medium text-base-800">
            {produto.localizacao}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-surface-border pt-3">
        <Campo label="Saldo" valor={`${formatarNumero(produto.saldo)} ${produto.unidade}`} />
        <Campo label="Contagem" valor={`${formatarNumero(contagemAtual)} ${produto.unidade}`} />
        <Campo
          label="Diferença"
          valor={`${diferenca > 0 ? '+' : ''}${formatarNumero(diferenca)}`}
          className={corDiferenca}
        />
      </div>

      {produto.saldoInicialMes != null && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-surface-border pt-3">
          <Campo label="Saldo inicial (mês)" valor={`${formatarNumero(produto.saldoInicialMes)} ${produto.unidade}`} />
          <Campo
            label="Consumido no mês"
            valor={`${formatarNumero(arredondar(produto.saldoInicialMes - produto.saldo))} ${produto.unidade}`}
          />
        </div>
      )}

      {produto.fatorConversao != null && produto.unidadeConversao && (
        <p className="mt-2 text-xs text-base-800/50">
          ≈ {formatarNumero(contagemAtual * produto.fatorConversao)} {produto.unidadeConversao}
        </p>
      )}

      {valorDigitado && (
        <div className="mt-3 rounded-lg bg-base-100 px-4 py-3 text-center">
          <span className="text-xs uppercase tracking-wide text-base-800/60">Digitando</span>
          <p className="tabular text-display text-base-950">{valorDigitado}</p>
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  valor,
  className,
}: {
  label: string;
  valor: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-800/60">{label}</p>
      <p className={`tabular text-lg font-bold ${className ?? 'text-base-950'}`}>{valor}</p>
    </div>
  );
}

function arredondar(v: number) {
  return Math.round(v * 1000) / 1000;
}
