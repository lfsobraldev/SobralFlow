import { getPrismaEmpresa, RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';

export async function listarPedidos(empresaId: string, apenasAtivos = false) {
  const db = getPrismaEmpresa(empresaId);
  return db.pedido.findMany({
    where: apenasAtivos ? { ativo: true } : {},
    orderBy: { nome: 'asc' },
  });
}

export async function criarPedido(empresaId: string, nome: string, descricao?: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.pedido.create({ data: { nome, descricao } });
}

export async function alternarAtivoPedido(empresaId: string, id: string, ativo: boolean) {
  const db = getPrismaEmpresa(empresaId);
  try {
    return await db.pedido.update({ where: { id }, data: { ativo } });
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      throw new Error('Pedido não encontrado');
    }
    throw e;
  }
}
