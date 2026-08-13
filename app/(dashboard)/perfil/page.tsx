'use client';

import { useState, type FormEvent } from 'react';
import { KeyRound, UserCircle2 } from 'lucide-react';
import { useSessao } from '@/hooks/useSessao';
import { ROTULO_PERFIL, DESCRICAO_PERFIL } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, TOM_POR_PERFIL } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Botao } from '@/components/ui/Button';

export default function PerfilPage() {
  const { sessao } = useSessao();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMensagem(null);

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'A confirmação não bate com a nova senha' });
      return;
    }

    setEnviando(true);
    const res = await fetch('/api/auth/trocar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    const data = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setMensagem({ tipo: 'erro', texto: data.erro ?? 'Erro ao trocar senha' });
      return;
    }

    setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso' });
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 animate-in">
      <PageHeader icon={UserCircle2} title="Meu perfil" subtitle="Dados da conta e segurança de acesso" />

      {sessao && (
        <Card padding="none">
          <CardHeader title={sessao.nome} subtitle={`@${sessao.login}`} icon={UserCircle2} />
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-800/60">Perfil de acesso</span>
              <Badge tom={TOM_POR_PERFIL[sessao.perfil] ?? 'neutro'}>{ROTULO_PERFIL[sessao.perfil]}</Badge>
            </div>
            <p className="rounded-lg bg-surface-raised px-3 py-2.5 text-xs text-base-800/70">
              {DESCRICAO_PERFIL[sessao.perfil]}
            </p>
          </div>
        </Card>
      )}

      <Card padding="none">
        <CardHeader title="Trocar senha" icon={KeyRound} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={4}
              className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-base-800/70">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={4}
              className="h-11 w-full rounded-lg border border-base-200 bg-surface-raised px-3 text-sm outline-none focus:border-action"
            />
          </div>

          {mensagem && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                mensagem.tipo === 'sucesso' ? 'bg-positive-bg text-positive' : 'bg-critical-bg text-critical'
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <Botao type="submit" variante="primaria" disabled={enviando} className="w-full">
            {enviando ? 'Salvando...' : 'Trocar senha'}
          </Botao>
        </form>
      </Card>
    </div>
  );
}
