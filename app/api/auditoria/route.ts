import { NextRequest, NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { buscarAuditoria } from '@/services/auditoriaService';
import { temPermissao } from '@/types';

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'verAuditoria')) {
    return NextResponse.json({ erro: 'Sem permissão para ver auditoria' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('porPagina') ?? '20', 10) || 20));

  const resultado = await buscarAuditoria(sessao.empresaId, {
    produtoTermo: searchParams.get('produto') ?? undefined,
    usuarioId: searchParams.get('usuarioId') ?? undefined,
    pagina,
    porPagina,
  });

  return NextResponse.json(resultado);
}
