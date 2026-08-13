import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { atualizarStatusApontamentoSchema } from '@/lib/validacao';
import { atualizarStatusApontamento } from '@/services/apontamentoService';

// PATCH /api/apontamentos/:id — usado pela tela "Fila de Apontamentos" para
// mover um registro entre NOVO → EM_ANDAMENTO → CONCLUÍDO.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = atualizarStatusApontamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    );
  }

  try {
    const apontamento = await atualizarStatusApontamento(
      sessao.empresaId,
      params.id,
      parsed.data.status
    );
    return NextResponse.json({ apontamento });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : 'Erro ao atualizar apontamento' },
      { status: 400 }
    );
  }
}
