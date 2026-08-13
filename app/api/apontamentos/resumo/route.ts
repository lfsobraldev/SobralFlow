import { NextResponse } from 'next/server';
import { obterSessaoAtual } from '@/lib/auth';
import { contarPorStatus } from '@/services/apontamentoService';

// GET /api/apontamentos/resumo — contadores do topo da "Fila de Apontamentos"
// (🔴 Novos / 🟡 Em andamento / 🟢 Concluídos hoje).
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const resumo = await contarPorStatus(sessao.empresaId);
  return NextResponse.json({ resumo });
}
