'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface ResultadoImportacao {
  criados: number;
  atualizados: number;
  erros: { linha: number; motivo: string }[];
}

interface ImportarExportarProps {
  onImportado: () => void;
}

export function ImportarExportar({ onImportado }: ImportarExportarProps) {
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    setResultado(null);

    const leitor = new FileReader();
    leitor.onload = (evento) => {
      const dados = evento.target?.result;
      const livro = XLSX.read(dados, { type: 'binary' });
      const nomeDaAba = livro.SheetNames[0];
      if (!nomeDaAba) return;
      const primeiraAba = livro.Sheets[nomeDaAba];
      if (!primeiraAba) return;
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(primeiraAba);
      setLinhas(json);
    };
    leitor.readAsBinaryString(arquivo);
  }

  async function confirmarImportacao() {
    setEnviando(true);
    const res = await fetch('/api/produtos/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linhas }),
    });
    const data = await res.json();
    setEnviando(false);
    setResultado(data);
    if (res.ok) onImportado();
  }

  function fechar() {
    setAberto(false);
    setLinhas([]);
    setNomeArquivo('');
    setResultado(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const colunasReconhecidas = linhas.length > 0 ? Object.keys(linhas[0]!) : [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <a
          href="/api/produtos/exportar?formato=xlsx"
          className="rounded-lg border border-base-200 bg-surface px-4 py-2.5 text-sm font-medium text-base-800 hover:bg-base-100"
        >
          Exportar Excel
        </a>
        <a
          href="/api/produtos/exportar?formato=csv"
          className="rounded-lg border border-base-200 bg-surface px-4 py-2.5 text-sm font-medium text-base-800 hover:bg-base-100"
        >
          Exportar CSV
        </a>
        <button
          onClick={() => setAberto(true)}
          className="rounded-lg border border-base-200 bg-surface px-4 py-2.5 text-sm font-medium text-base-800 hover:bg-base-100"
        >
          Importar planilha
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-base-950/40 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-panel">
            <h2 className="mb-4 text-lg font-bold text-base-950">Importar produtos</h2>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleArquivo}
              className="mb-4 block w-full text-sm"
            />

            {nomeArquivo && linhas.length > 0 && (
              <>
                <p className="mb-2 text-sm text-base-800/70">
                  <strong>{nomeArquivo}</strong> — {linhas.length} linha(s) encontrada(s).
                  Colunas reconhecidas: {colunasReconhecidas.join(', ') || 'nenhuma'}
                </p>

                <div className="mb-4 overflow-x-auto rounded-lg border border-base-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-surface-border bg-base-50 text-left">
                        {colunasReconhecidas.map((c) => (
                          <th key={c} className="px-3 py-2">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.slice(0, 5).map((linha, i) => (
                        <tr key={i} className="border-b border-surface-border last:border-0">
                          {colunasReconhecidas.map((c) => (
                            <td key={c} className="px-3 py-2">
                              {String(linha[c] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {linhas.length > 5 && (
                  <p className="mb-4 text-xs text-base-800/50">
                    Mostrando 5 de {linhas.length} linhas.
                  </p>
                )}
              </>
            )}

            {resultado && (
              <div className="mb-4 space-y-2">
                <div className="rounded-lg bg-positive-bg px-4 py-3 text-sm font-medium text-positive">
                  {resultado.criados} criado(s), {resultado.atualizados} atualizado(s).
                </div>
                {resultado.erros.length > 0 && (
                  <div className="rounded-lg bg-critical-bg px-4 py-3 text-sm text-critical">
                    <p className="font-medium">{resultado.erros.length} linha(s) com erro:</p>
                    <ul className="mt-1 list-disc pl-5">
                      {resultado.erros.slice(0, 10).map((e, i) => (
                        <li key={i}>
                          Linha {e.linha}: {e.motivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={fechar}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-base-800 hover:bg-base-100"
              >
                Fechar
              </button>
              {linhas.length > 0 && !resultado && (
                <button
                  onClick={confirmarImportacao}
                  disabled={enviando}
                  className="rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-action-contrast hover:bg-action-hover disabled:opacity-60"
                >
                  {enviando ? 'Importando...' : `Confirmar importação (${linhas.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
