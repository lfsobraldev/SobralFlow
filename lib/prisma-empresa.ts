import { prisma } from './prisma';

/**
 * Prisma escopado por empresa.
 *
 * Em vez de confiar que cada uma das dezenas de queries do sistema vai
 * lembrar de filtrar por `empresaId` manualmente, todo acesso às 7 tabelas
 * multiempresa passa por AQUI. O `empresaId` é injetado automaticamente em
 * todo `where` de leitura/escrita e em todo `data` de criação — não existe
 * como uma chamada "esquecer" o filtro, porque o filtro não é opcional: ele
 * faz parte da própria função.
 *
 * IMPORTANTE: a única fonte válida de `empresaId` é a sessão autenticada
 * (`sessao.empresaId`, vinda de `obterSessaoAtual()`), nunca um valor lido
 * de query string, body ou parâmetro de rota. Quem cria o client aqui é
 * responsável por passar o `empresaId` certo — este arquivo não valida a
 * origem do valor, só garante que, uma vez definido, ele é aplicado em toda
 * operação, sem exceção.
 */

export class RegistroNaoEncontradoNaEmpresaError extends Error {
  constructor() {
    super('Registro não encontrado');
    this.name = 'RegistroNaoEncontradoNaEmpresaError';
  }
}

// Modelos que possuem empresaId e passam pelo escopo. Mantido como
// referência/documentação — a aplicação em si é genérica (funciona com
// qualquer delegate do Prisma que tenha esse campo).
export const MODELOS_COM_EMPRESA = [
  'usuario',
  'produto',
  'pedido',
  'movimentacao',
  'logAuditoria',
  'sessaoInventario',
  'apontamento',
] as const;

// Tipagem propositalmente permissiva (any) nas assinaturas internas: os
// delegates do Prisma Client têm 7 formas ligeiramente diferentes (campos
// diferentes por model) e replicar a tipagem exata aqui não traz segurança
// adicional — a segurança vem de SEMPRE aplicar o empresaId, não do tipo.
// Cada service que consome isso já tipa o retorno através do próprio uso.
type DelegatePrisma = {
  findMany: (args?: any) => Promise<any[]>;
  findFirst: (args?: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
  create: (args: any) => Promise<any>;
  createMany: (args: any) => Promise<{ count: number }>;
  updateMany: (args: any) => Promise<{ count: number }>;
  deleteMany: (args: any) => Promise<{ count: number }>;
};

function escoparWhere(where: any, empresaId: string) {
  // AND explícito preserva qualquer OR/condição complexa que já exista no
  // where original — o empresaId sempre entra como condição adicional
  // obrigatória, nunca substitui nem é substituível pelo resto do filtro.
  if (where && Object.keys(where).length > 0) {
    return { AND: [{ empresaId }, where] };
  }
  return { empresaId };
}

function criarRepositorioEscopado(delegate: DelegatePrisma, empresaId: string) {
  return {
    findMany(args: any = {}) {
      return delegate.findMany({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    findFirst(args: any = {}) {
      return delegate.findFirst({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    // findUnique() do Prisma exige um WhereUniqueInput (não aceita AND), por
    // isso é implementado com findFirst por baixo, que aceita filtro
    // composto. Comportamento externo é idêntico: registro ou null — e
    // nunca retorna um registro de outra empresa, mesmo que o `where` passado
    // (ex: { id }) exista em outra empresa.
    findUnique(args: any) {
      return delegate.findFirst({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    count(args: any = {}) {
      return delegate.count({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    create(args: any) {
      return delegate.create({ ...args, data: { ...args.data, empresaId } });
    },

    createMany(args: any) {
      const data = Array.isArray(args.data)
        ? args.data.map((item: any) => ({ ...item, empresaId }))
        : args.data;
      return delegate.createMany({ ...args, data });
    },

    // update()/delete() por id também exigem WhereUniqueInput. Resolvido em
    // duas etapas seguras: 1) updateMany/deleteMany COM o filtro composto
    // (empresaId + where original) — se o registro pertence a outra
    // empresa, `count` vem 0 e nada é alterado; 2) busca o registro
    // resultante para devolver no mesmo formato que update()/delete()
    // normalmente devolveriam.
    async update(args: any) {
      const resultado = await delegate.updateMany({
        where: escoparWhere(args.where, empresaId),
        data: args.data,
      });
      if (resultado.count === 0) throw new RegistroNaoEncontradoNaEmpresaError();
      return delegate.findFirst({
        where: escoparWhere(args.where, empresaId),
        select: args.select,
        include: args.include,
      });
    },

    updateMany(args: any = {}) {
      return delegate.updateMany({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    async delete(args: any) {
      const registro = await delegate.findFirst({ where: escoparWhere(args.where, empresaId) });
      if (!registro) throw new RegistroNaoEncontradoNaEmpresaError();
      const resultado = await delegate.deleteMany({ where: escoparWhere(args.where, empresaId) });
      if (resultado.count === 0) throw new RegistroNaoEncontradoNaEmpresaError();
      return registro;
    },

    deleteMany(args: any = {}) {
      return delegate.deleteMany({ ...args, where: escoparWhere(args.where, empresaId) });
    },

    async upsert(args: any) {
      const existente = await delegate.findFirst({ where: escoparWhere(args.where, empresaId) });
      if (existente) {
        const resultado = await delegate.updateMany({
          where: { id: existente.id, empresaId },
          data: args.update,
        });
        if (resultado.count === 0) throw new RegistroNaoEncontradoNaEmpresaError();
        return delegate.findFirst({ where: { id: existente.id, empresaId } });
      }
      return delegate.create({ data: { ...args.create, empresaId } });
    },
  };
}

/**
 * Cria um client Prisma escopado à empresa informada, usando o Prisma
 * Client global (fora de transação).
 */
export function getPrismaEmpresa(empresaId: string) {
  return getPrismaEmpresaComCliente(prisma, empresaId);
}

/**
 * Mesma coisa, mas recebendo explicitamente um client — usado dentro de
 * `prisma.$transaction(async (tx) => { ... })`, onde as operações
 * PRECISAM rodar sobre `tx`, não sobre o client global (senão saem da
 * transação).
 */
export function getPrismaEmpresaComCliente(cliente: typeof prisma, empresaId: string) {
  if (!empresaId || typeof empresaId !== 'string') {
    throw new Error(
      'getPrismaEmpresa: empresaId ausente ou inválido. Isso indica um bug — nunca deveria ser ' +
        'chamado sem um empresaId vindo da sessão autenticada.'
    );
  }

  return {
    usuario: criarRepositorioEscopado(cliente.usuario as unknown as DelegatePrisma, empresaId),
    produto: criarRepositorioEscopado(cliente.produto as unknown as DelegatePrisma, empresaId),
    pedido: criarRepositorioEscopado(cliente.pedido as unknown as DelegatePrisma, empresaId),
    movimentacao: criarRepositorioEscopado(
      cliente.movimentacao as unknown as DelegatePrisma,
      empresaId
    ),
    logAuditoria: criarRepositorioEscopado(
      cliente.logAuditoria as unknown as DelegatePrisma,
      empresaId
    ),
    sessaoInventario: criarRepositorioEscopado(
      cliente.sessaoInventario as unknown as DelegatePrisma,
      empresaId
    ),
    apontamento: criarRepositorioEscopado(
      cliente.apontamento as unknown as DelegatePrisma,
      empresaId
    ),
  };
}

export type PrismaEmpresa = ReturnType<typeof getPrismaEmpresa>;
