'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ScanLine } from 'lucide-react';
import type { ProdutoCompleto } from '@/features/produtos/useProdutos';
import { ScannerCamera } from '@/components/contagem/ScannerCamera';

interface Pedido {
  id: string;
  nome: string;
}

interface FormularioProdutoProps {
  produto?: ProdutoCompleto | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (dados: Record<string, unknown>) => Promise<boolean>;
}

const VAZIO = {
  codigo: '',
  descricao: '',
  unidade: 'UN',
  saldo: '0',
  localizacao: '',
  categoria: '',
  observacoes: '',
  codigoBarras: '',
  estoqueMinimo: '',
  custoUnitario: '',
  pedidoId: '',
  fatorConversao: '',
  unidadeConversao: '',
};

export function FormularioProduto({ produto, aberto, onFechar, onSalvar }: FormularioProdutoProps) {
  const [dados, setDados] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [scannerAberto, setScannerAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    fetch('/api/pedidos')
      .then((r) => r.json())
      .then((d) => setPedidos(d.pedidos ?? []));
  }, [aberto]);

  useEffect(() => {
    if (produto) {
      setDados({
        codigo: produto.codigo,
        descricao: produto.descricao,
        unidade: produto.unidade,
        saldo: String(produto.saldo),
        localizacao: produto.localizacao ?? '',
        categoria: produto.categoria ?? '',
        observacoes: produto.observacoes ?? '',
        codigoBarras: produto.codigoBarras ?? '',
        estoqueMinimo: produto.estoqueMinimo != null ? String(produto.estoqueMinimo) : '',
        custoUnitario: produto.custoUnitario != null ? String(produto.custoUnitario) : '',
        pedidoId: produto.pedidoId ?? '',
        fatorConversao: produto.fatorConversao != null ? String(produto.fatorConversao) : '',
        unidadeConversao: produto.unidadeConversao ?? '',
      });
    } else {
      setDados(VAZIO);
    }
  }, [produto, aberto]);

  if (!aberto) return null;

  const ehEdicao = Boolean(produto);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const payload: Record<string, unknown> = ehEdicao
      ? {
          descricao: dados.descricao,
          unidade: dados.unidade,
          saldo: Number(dados.saldo.replace(',', '.')),
          localizacao: dados.localizacao || null,
          categoria: dados.categoria || null,
          observacoes: dados.observacoes || null,
          codigoBarras: dados.codigoBarras || null,
          estoqueMinimo: dados.estoqueMinimo ? Number(dados.estoqueMinimo.replace(',', '.')) : null,
          custoUnitario: dados.custoUnitario ? Number(dados.custoUnitario.replace(',', '.')) : null,
          pedidoId: dados.pedidoId || null,
          fatorConversao: dados.fatorConversao ? Number(dados.fatorConversao.replace(',', '.')) : null,
          unidadeConversao: dados.unidadeConversao || null,
        }
      : {
          descricao: dados.descricao,
          saldo: Number(dados.saldo.replace(',', '.')),
        };

    const ok = await onSalvar(payload);
    setEnviando(false);
    if (ok) onFechar();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-base-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-6 shadow-panel">
        <h2 className="mb-4 text-lg font-bold text-base-950">
          {ehEdicao ? 'Editar produto' : 'Novo produto'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {!ehEdicao && (
            <>
              <Campo label="Descrição" obrigatorio className="col-span-2">
                <input
                  value={dados.descricao}
                  onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                  required
                  autoFocus
                  className={campoClasse}
                />
              </Campo>

              <Campo label="Saldo inicial" obrigatorio className="col-span-2">
                <input
                  value={dados.saldo}
                  onChange={(e) => setDados({ ...dados, saldo: e.target.value })}
                  required
                  inputMode="decimal"
                  className={campoClasse}
                />
              </Campo>

              <p className="col-span-2 -mt-1 text-xs text-base-800/50">
                O código do produto é gerado automaticamente. Categoria, código de barras,
                localização e demais detalhes podem ser preenchidos depois, editando o produto.
              </p>
            </>
          )}

          {ehEdicao && (
            <>
          <Campo label="Código" obrigatorio className="col-span-1">
            <input
              value={dados.codigo}
              disabled={ehEdicao}
              onChange={(e) => setDados({ ...dados, codigo: e.target.value })}
              required
              className={campoClasse}
            />
          </Campo>

          <Campo label="Unidade" obrigatorio className="col-span-1">
            <input
              value={dados.unidade}
              onChange={(e) => setDados({ ...dados, unidade: e.target.value })}
              required
              placeholder="UN, CX, PÇ, KG..."
              className={campoClasse}
            />
          </Campo>

          <Campo label="Descrição" obrigatorio className="col-span-2">
            <input
              value={dados.descricao}
              onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
              required
              className={campoClasse}
            />
          </Campo>

          <Campo label="Saldo" obrigatorio className="col-span-1">
            <input
              value={dados.saldo}
              onChange={(e) => setDados({ ...dados, saldo: e.target.value })}
              required
              className={campoClasse}
            />
          </Campo>

          <Campo label="Estoque mínimo" className="col-span-1">
            <input
              value={dados.estoqueMinimo}
              onChange={(e) => setDados({ ...dados, estoqueMinimo: e.target.value })}
              className={campoClasse}
              placeholder="Alerta de crítico"
            />
          </Campo>

          <Campo label="Custo unitário (R$)" className="col-span-1">
            <input
              value={dados.custoUnitario}
              onChange={(e) => setDados({ ...dados, custoUnitario: e.target.value })}
              className={campoClasse}
              placeholder="Ex: 12,50"
            />
          </Campo>

          <Campo label="Pedido / Projeto" className="col-span-1">
            <select
              value={dados.pedidoId}
              onChange={(e) => setDados({ ...dados, pedidoId: e.target.value })}
              className={campoClasse}
            >
              <option value="">— Nenhum —</option>
              {pedidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Fator de conversão" className="col-span-2 md:col-span-1">
            <input
              value={dados.fatorConversao}
              onChange={(e) => setDados({ ...dados, fatorConversao: e.target.value })}
              className={campoClasse}
              placeholder="Ex: 0,0951"
            />
          </Campo>

          <Campo label="Unidade de conversão" className="col-span-1">
            <input
              value={dados.unidadeConversao}
              onChange={(e) => setDados({ ...dados, unidadeConversao: e.target.value })}
              className={campoClasse}
              placeholder="Ex: m³"
            />
          </Campo>

          <Campo label="Localização" className="col-span-1">
            <input
              value={dados.localizacao}
              onChange={(e) => setDados({ ...dados, localizacao: e.target.value })}
              className={campoClasse}
            />
          </Campo>

          <Campo label="Categoria" className="col-span-1">
            <input
              value={dados.categoria}
              onChange={(e) => setDados({ ...dados, categoria: e.target.value })}
              className={campoClasse}
            />
          </Campo>

          <Campo label="Código de barras / QR Code" className="col-span-2">
            <div className="flex gap-2">
              <input
                value={dados.codigoBarras}
                onChange={(e) => setDados({ ...dados, codigoBarras: e.target.value })}
                className={campoClasse}
                placeholder="Escaneie ou digite"
              />
              <button
                type="button"
                onClick={() => setScannerAberto(true)}
                title="Escanear com a câmera"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-base-200 hover:bg-base-100"
              >
                <ScanLine size={18} />
              </button>
            </div>
          </Campo>

          <Campo label="Observações" className="col-span-2">
            <textarea
              value={dados.observacoes}
              onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
              rows={2}
              className={campoClasse}
            />
          </Campo>
            </>
          )}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-base-800 hover:bg-base-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-action-contrast hover:bg-action-hover disabled:opacity-60"
            >
              {enviando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      <ScannerCamera
        aberto={scannerAberto}
        onFechar={() => setScannerAberto(false)}
        onDetectado={(codigo) => {
          setDados((d) => ({ ...d, codigoBarras: codigo }));
          setScannerAberto(false);
        }}
      />
    </div>
  );
}

const campoClasse =
  'h-11 w-full rounded-lg border border-base-200 px-3 text-sm outline-none focus:border-action disabled:bg-base-100 disabled:text-base-800/50';

function Campo({
  label,
  obrigatorio,
  className,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-base-800/70">
        {label} {obrigatorio && <span className="text-critical">*</span>}
      </label>
      {children}
    </div>
  );
}
