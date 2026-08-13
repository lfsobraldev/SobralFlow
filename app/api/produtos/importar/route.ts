import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessaoAtual } from '@/lib/auth';
import { temPermissao } from '@/types';
import { reconhecerColunas, importarProdutos } from '@/services/importacaoService';

const importarSchema = z.object({
  linhas: z.array(z.record(z.union([z.string(), z.number()]).optional())),
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  if (!temPermissao(sessao.perfil, 'importarExportar')) {
    return NextResponse.json({ erro: 'Sem permissão para importar' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }

  const linhasMapeadas = reconhecerColunas(parsed.data.linhas);
  const resultado = await importarProdutos(sessao.empresaId, linhasMapeadas, sessao.id);

  return NextResponse.json(resultado);
}
