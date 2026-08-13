import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { registrarMovimentoSchema } from '@/lib/validacao';
import { registrarMovimento, extrairIp } from '@/services/movimentacaoService';
import { temPermissao } from '@/types';

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'registrarContagem')) {
    return NextResponse.json({ erro: 'Sem permissão para registrar contagem' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registrarMovimentoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    );
  }

  try {
    const resultado = await registrarMovimento({
      empresaId: sessao.empresaId,
      produtoId: parsed.data.produtoId,
      valor: parsed.data.valor,
      tipo: parsed.data.tipo,
      usuarioId: sessao.id,
      ip: extrairIp(request.headers),
      sessaoInventarioId: parsed.data.sessaoInventarioId,
    });

    return NextResponse.json(resultado);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao registrar movimentação';
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
