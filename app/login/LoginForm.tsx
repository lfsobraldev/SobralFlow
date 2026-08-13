'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boxes, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const senhaRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro ?? 'Não foi possível entrar');
        setCarregando(false);
        return;
      }

      const destino = searchParams.get('redirect') || '/dashboard';
      router.push(destino);
      router.refresh();
    } catch {
      setErro('Falha de conexão. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-50 px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-action/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative w-full max-w-sm animate-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-4 flex h-14 w-14 items-center justify-center bg-action text-action-contrast shadow-glow"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
          >
            <Boxes size={28} />
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-base-950">Estoque ERP</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-base-800/50">Gestão de Inventário</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-md border border-base-200 bg-surface p-6 pt-7 shadow-elevated"
        >
          {/* Faixa de sinalização no topo do cartão — assinatura visual do sistema */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-hazard-stripe" />

          <div className="mb-4">
            <label htmlFor="login" className="mb-1.5 block text-sm font-medium text-base-800">
              Usuário
            </label>
            <div className="flex items-center gap-2 rounded-md border border-base-200 bg-surface-raised px-4 focus-within:border-action">
              <UserIcon size={17} className="shrink-0 text-base-800/40" />
              <input
                id="login"
                type="text"
                autoFocus
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') senhaRef.current?.focus();
                }}
                className="h-14 w-full bg-transparent text-lg outline-none"
                placeholder="Usuário"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-base-800">
              Senha
            </label>
            <div className="flex items-center gap-2 rounded-md border border-base-200 bg-surface-raised px-4 focus-within:border-action">
              <Lock size={17} className="shrink-0 text-base-800/40" />
              <input
                id="senha"
                ref={senhaRef}
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-14 w-full bg-transparent text-lg outline-none"
                placeholder="••••••"
              />
            </div>
          </div>

          {erro && (
            <div className="mb-4 rounded-md bg-critical-bg px-4 py-3 text-sm font-medium text-critical">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-md bg-action text-lg font-semibold text-action-contrast transition-all hover:bg-action-hover hover:shadow-glow active:scale-[0.99] disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
