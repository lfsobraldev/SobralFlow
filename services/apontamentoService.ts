import { getPrismaEmpresa, RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';
import type { StatusApontamento } from '@prisma/client';
import type { ApontamentoResumo, CriarApontamentoInput } from '@/types';

// Fila de Apontamentos de Produção.
//
// Fluxo: o operador escaneia a OF pelo celular (Produção → Apontamento) e
// envia o registro; ele nasce com status NOVO e aparece automaticamente na
// tela "Fila de Apontamentos" do PC (via polling — ver
// features/producao/useFilaApontamentos.ts). No PC, o encarregado copia os
// dados para o sistema oficial (isso já move o registro para EM_ANDAMENTO) e,
// depois de lançar, marca como CONCLUÍDO. Nada disso mexe no saldo de
// estoque — é só uma fila de trabalho para não perder apontamentos feitos no
// chão de fábrica.

function paraResumo(registro: {
  id: string;
  numeroOF: string;
  numeroOperacao: string;
  peca: string;
  quantidade: number;
  situacao: string;
  motivo: string | null;
  observacao: string | null;
  status: StatusApontamento;
  criadoEm: Date;
  atualizadoEm: Date;
  concluidoEm: Date | null;
  usuario: { nome: string };
}): ApontamentoResumo {
  return {
    id: registro.id,
    numeroOF: registro.numeroOF,
    numeroOperacao: registro.numeroOperacao,
    peca: registro.peca,
    quantidade: registro.quantidade,
    situacao: registro.situacao,
    motivo: registro.motivo,
    observacao: registro.observacao,
    status: registro.status,
    usuarioNome: registro.usuario.nome,
    criadoEm: registro.criadoEm.toISOString(),
    atualizadoEm: registro.atualizadoEm.toISOString(),
    concluidoEm: registro.concluidoEm ? registro.concluidoEm.toISOString() : null,
  };
}

export async function criarApontamento(
  empresaId: string,
  input: CriarApontamentoInput & { usuarioId: string }
): Promise<ApontamentoResumo> {
  const db = getPrismaEmpresa(empresaId);
  const registro = await db.apontamento.create({
    data: {
      numeroOF: input.numeroOF,
      numeroOperacao: input.numeroOperacao,
      peca: input.peca,
      quantidade: input.quantidade,
      situacao: input.situacao,
      motivo: input.motivo || null,
      observacao: input.observacao || null,
      status: 'NOVO',
      usuarioId: input.usuarioId,
    },
    include: { usuario: { select: { nome: true } } },
  });

  return paraResumo(registro);
}

export interface FiltrosApontamento {
  status?: StatusApontamento;
  numeroOF?: string;
  data?: string; // YYYY-MM-DD
  desde?: string; // ISO — só retorna alterados depois desse instante
}

export async function listarApontamentos(
  empresaId: string,
  filtros: FiltrosApontamento
): Promise<ApontamentoResumo[]> {
  const db = getPrismaEmpresa(empresaId);
  const where: Record<string, unknown> = {};

  if (filtros.status) where.status = filtros.status;
  if (filtros.numeroOF) where.numeroOF = { contains: filtros.numeroOF, mode: 'insensitive' };

  if (filtros.data) {
    const inicio = new Date(`${filtros.data}T00:00:00`);
    const fim = new Date(`${filtros.data}T23:59:59.999`);
    where.criadoEm = { gte: inicio, lte: fim };
  }

  if (filtros.desde) {
    const desde = new Date(filtros.desde);
    if (!Number.isNaN(desde.getTime())) {
      where.atualizadoEm = { gt: desde };
    }
  }

  const registros = await db.apontamento.findMany({
    where,
    include: { usuario: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 300,
  });

  return registros.map(paraResumo);
}

export async function contarPorStatus(empresaId: string) {
  const db = getPrismaEmpresa(empresaId);
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const [novos, emAndamento, concluidosHoje] = await Promise.all([
    db.apontamento.count({ where: { status: 'NOVO' } }),
    db.apontamento.count({ where: { status: 'EM_ANDAMENTO' } }),
    db.apontamento.count({
      where: { status: 'CONCLUIDO', concluidoEm: { gte: inicioHoje } },
    }),
  ]);

  return { novos, emAndamento, concluidosHoje };
}

export async function atualizarStatusApontamento(
  empresaId: string,
  id: string,
  status: StatusApontamento
): Promise<ApontamentoResumo> {
  const db = getPrismaEmpresa(empresaId);
  try {
    const registro = await db.apontamento.update({
      where: { id },
      data: {
        status,
        concluidoEm: status === 'CONCLUIDO' ? new Date() : null,
      },
      include: { usuario: { select: { nome: true } } },
    });
    return paraResumo(registro);
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      throw new Error('Apontamento não encontrado');
    }
    throw e;
  }
}
