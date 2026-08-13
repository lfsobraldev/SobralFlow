import { getPrismaEmpresa } from '@/lib/prisma-empresa';

export interface FiltrosHistorico {
  produtoTermo?: string;
  usuarioId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  pagina: number;
  porPagina: number;
}

export async function buscarHistorico(empresaId: string, filtros: FiltrosHistorico) {
  const db = getPrismaEmpresa(empresaId);
  const where = {
    ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
    ...(filtros.dataInicio || filtros.dataFim
      ? {
          criadoEm: {
            ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
            ...(filtros.dataFim ? { lte: filtros.dataFim } : {}),
          },
        }
      : {}),
    ...(filtros.produtoTermo
      ? {
          produto: {
            OR: [
              { codigo: { contains: filtros.produtoTermo, mode: 'insensitive' as const } },
              { descricao: { contains: filtros.produtoTermo, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
  };

  const [itens, total] = await Promise.all([
    db.movimentacao.findMany({
      where,
      include: {
        produto: { select: { codigo: true, descricao: true, unidade: true } },
        usuario: { select: { nome: true, login: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (filtros.pagina - 1) * filtros.porPagina,
      take: filtros.porPagina,
    }),
    db.movimentacao.count({ where }),
  ]);

  return { itens, total, totalPaginas: Math.ceil(total / filtros.porPagina) };
}
