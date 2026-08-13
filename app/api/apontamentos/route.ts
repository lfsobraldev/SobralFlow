import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { criarApontamentoSchema, listarApontamentosSchema } from '@/lib/validacao';
import { criarApontamento, listarApontamentos } from '@/services/apontamentoService';

// GET /api/apontamentos — usado pela tela "Fila de Apontamentos" no PC.
// Faz polling desta rota a cada poucos segundos (ver
// features/producao/useFilaApontamentos.ts) para simular tempo real sem
// precisar de infraestrutura de WebSocket.
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = listarApontamentosSchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    numeroOF: searchParams.get('numeroOF') ?? undefined,
    data: searchParams.get('data') ?? undefined,
    desde: searchParams.get('desde') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ erro: 'Parâmetros inválidos' }, { status: 400 });
  }

  const apontamentos = await listarApontamentos(sessao.empresaId, parsed.data);
  return NextResponse.json({ apontamentos });
}

// POST /api/apontamentos — usado pelo celular (Produção → Apontamento) para
// enviar um novo registro para a fila.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = criarApontamentoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    );
  }

  try {
    const apontamento = await criarApontamento(sessao.empresaId, {
      ...parsed.data,
      usuarioId: sessao.id,
    });
    return NextResponse.json({ apontamento });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao enviar apontamento';
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
