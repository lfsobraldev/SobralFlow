'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';
import { formatarDataHora } from '@/lib/formatacao';
import { formatarDuracao } from '@/hooks/useModoInventario';
import { CartaoMetrica } from '@/components/dashboard/CartaoMetrica';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';

interface Relatorio {
  sessao: {
    id: string;
    usuario: { nome: string; login: string };
    iniciadaEm: string;
    finalizadaEm: string | null;
    ativa: boolean;
  };
  resumo: {
    itensConferidos: number;
    totalMovimentacoes: number;
    divergenciasEncontradas: number;
    tempoGastoMs: number;
  };
  divergencias: {
    produto: { codigo: string; descricao: string; unidade: string };
    contagemFinal: number;
    saldoLivro: number;
    diferenca: number;
  }[];
}

export default function RelatorioInventarioPage() {
  const params = useParams<{ id: string }>();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/inventario/${params.id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.erro);
        setRelatorio(data);
      })
      .catch((e) => setErro(e.message));
  }, [params.id]);

  if (erro) {
    return <div className="p-6 text-critical">{erro}</div>;
  }

  if (!relatorio) {
    return <div className="p-6 text-base-800/60">Carregando relatório...</div>;
  }

  const { sessao, resumo, divergencias } = relatorio;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 animate-in">
      <PageHeader
        icon={ClipboardCheck}
        title="Relatório de inventário"
        subtitle={`Responsável: ${sessao.usuario.nome} · Início: ${formatarDataHora(sessao.iniciadaEm)}${
          sessao.finalizadaEm ? ` · Fim: ${formatarDataHora(sessao.finalizadaEm)}` : ''
        }`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CartaoMetrica titulo="Itens conferidos" valor={resumo.itensConferidos} />
        <CartaoMetrica titulo="Movimentações" valor={resumo.totalMovimentacoes} />
        <CartaoMetrica
          titulo="Divergências"
          valor={resumo.divergenciasEncontradas}
          destaque={resumo.divergenciasEncontradas > 0 ? 'critica' : 'positiva'}
        />
        <CartaoMetrica titulo="Tempo gasto" valor={formatarDuracao(resumo.tempoGastoMs)} />
      </div>

      <Card padding="none">
        <h2 className="border-b border-surface-border px-4 py-3.5 text-sm font-semibold text-base-950">
          Divergências encontradas
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-base-800/60">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-right">Saldo (livro)</th>
              <th className="px-4 py-3 text-right">Contagem final</th>
              <th className="px-4 py-3 text-right">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {divergencias.map((d, i) => (
              <tr key={i} className="border-b border-surface-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-base-950">{d.produto.descricao}</p>
                  <p className="font-mono text-xs text-base-800/50">{d.produto.codigo}</p>
                </td>
                <td className="px-4 py-3 text-right tabular">{d.saldoLivro}</td>
                <td className="px-4 py-3 text-right tabular font-medium">{d.contagemFinal}</td>
                <td
                  className={`px-4 py-3 text-right tabular font-semibold ${
                    d.diferenca > 0 ? 'text-positive' : 'text-critical'
                  }`}
                >
                  {d.diferenca > 0 ? '+' : ''}
                  {d.diferenca}
                </td>
              </tr>
            ))}
            {divergencias.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-base-800/50">
                  Nenhuma divergência — contagem bateu certinho com o saldo 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <a href="/contagem" className="flex items-center gap-1.5 text-sm font-medium text-action hover:underline">
        <ArrowLeft size={15} /> Voltar para a Contagem
      </a>
    </div>
  );
}
