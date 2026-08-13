import { getPrismaEmpresa } from '@/lib/prisma-empresa';
import { RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';

export interface FiltrosProdutos {
  termo?: string;
  categoria?: string;
  pedidoId?: string;
  apenasCriticos?: boolean;
  apenasDivergentes?: boolean;
  pagina: number;
  porPagina: number;
}

export async function listarProdutos(empresaId: string, filtros: FiltrosProdutos) {
  const db = getPrismaEmpresa(empresaId);
  const condicoes: any[] = [];

  if (filtros.termo) {
    condicoes.push({
      OR: [
        { codigo: { contains: filtros.termo, mode: 'insensitive' } },
        { descricao: { contains: filtros.termo, mode: 'insensitive' } },
        { codigoBarras: { contains: filtros.termo, mode: 'insensitive' } },
      ],
    });
  }

  if (filtros.categoria) {
    condicoes.push({ categoria: filtros.categoria });
  }

  if (filtros.pedidoId) {
    condicoes.push({ pedidoId: filtros.pedidoId });
  }

  const where = condicoes.length > 0 ? { AND: condicoes } : {};

  const [todos, total] = await Promise.all([
    db.produto.findMany({
      where,
      include: { pedido: { select: { nome: true } } },
      orderBy: { descricao: 'asc' },
      skip: (filtros.pagina - 1) * filtros.porPagina,
      take: filtros.porPagina,
    }),
    db.produto.count({ where }),
  ]);

  // Estoque crítico e divergência dependem de comparação entre 2 campos do mesmo registro,
  // o que o SQLite via Prisma não filtra nativamente — aplicado em memória após a paginação.
  const itens = todos.filter((p: any) => {
    if (filtros.apenasCriticos && !(p.estoqueMinimo != null && p.saldo <= p.estoqueMinimo)) {
      return false;
    }
    if (filtros.apenasDivergentes && !(p.contagem != null && p.contagem !== p.saldo)) {
      return false;
    }
    return true;
  });

  return { itens, total, totalPaginas: Math.ceil(total / filtros.porPagina) };
}

// Gera um código sequencial automático (ex: PRD-000123). Tenta algumas vezes
// em caso de colisão de concorrência (dois cadastros no mesmíssimo instante).
// Escopado por empresa: cada empresa tem sua própria sequência.
async function gerarCodigoAutomatico(empresaId: string): Promise<string> {
  const db = getPrismaEmpresa(empresaId);
  const total = await db.produto.count();
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const numero = total + 1 + tentativa;
    const codigo = `PRD-${String(numero).padStart(6, '0')}`;
    const existente = await db.produto.findUnique({ where: { codigo } });
    if (!existente) return codigo;
  }
  // Fallback extremamente improvável (só se muitos cadastros simultâneos colidirem
  // repetidamente): garante um código único baseado em timestamp.
  return `PRD-${Date.now().toString(36).toUpperCase()}`;
}

export async function criarProduto(
  empresaId: string,
  dados: {
    codigo?: string;
    descricao: string;
    unidade?: string;
    saldo: number;
    localizacao?: string;
    categoria?: string;
    observacoes?: string;
    codigoBarras?: string;
    estoqueMinimo?: number;
    custoUnitario?: number;
    pedidoId?: string;
    fatorConversao?: number;
    unidadeConversao?: string;
  },
  usuarioId: string
) {
  const db = getPrismaEmpresa(empresaId);
  const codigo = dados.codigo?.trim() || (await gerarCodigoAutomatico(empresaId));
  const unidade = dados.unidade?.trim() || 'UN';

  const produto = await db.produto.create({ data: { ...dados, codigo, unidade } });

  await db.logAuditoria.create({
    data: {
      usuarioId,
      produtoId: produto.id,
      acao: 'PRODUTO_CRIADO',
    },
  });

  return produto;
}

export async function atualizarProduto(
  empresaId: string,
  id: string,
  dados: Partial<{
    descricao: string;
    unidade: string;
    saldo: number;
    localizacao: string | null;
    categoria: string | null;
    observacoes: string | null;
    codigoBarras: string | null;
    estoqueMinimo: number | null;
    custoUnitario: number | null;
    pedidoId: string | null;
    fatorConversao: number | null;
    unidadeConversao: string | null;
  }>,
  usuarioId: string
) {
  const db = getPrismaEmpresa(empresaId);

  // Busca escopada: se o produto existir mas pertencer a outra empresa,
  // `anterior` vem null aqui — o comportamento é idêntico a "não existe".
  const anterior = await db.produto.findUnique({ where: { id } });
  if (!anterior) throw new Error('Produto não encontrado');

  let produto;
  try {
    produto = await db.produto.update({ where: { id }, data: dados });
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      throw new Error('Produto não encontrado');
    }
    throw e;
  }

  // Auditoria campo a campo: só registra o que realmente mudou.
  const registros = Object.entries(dados)
    .filter(([campo, valor]) => (anterior as any)[campo] !== valor)
    .map(([campo, valor]) => ({
      usuarioId,
      produtoId: id,
      acao: 'PRODUTO_EDITADO',
      campoAlterado: campo,
      valorAntigo: String((anterior as any)[campo] ?? ''),
      valorNovo: String(valor ?? ''),
    }));

  if (registros.length > 0) {
    await db.logAuditoria.createMany({ data: registros });
  }

  return produto;
}

export async function excluirProduto(empresaId: string, id: string, usuarioId: string) {
  const db = getPrismaEmpresa(empresaId);

  const produto = await db.produto.findUnique({ where: { id } });
  if (!produto) throw new Error('Produto não encontrado');

  const temMovimentacoes = await db.movimentacao.count({ where: { produtoId: id } });
  if (temMovimentacoes > 0) {
    throw new Error(
      'Este produto já possui movimentações registradas e não pode ser excluído (integridade do histórico). Desative-o ou zere o saldo em vez disso.'
    );
  }

  await db.logAuditoria.create({
    data: { usuarioId, produtoId: id, acao: 'PRODUTO_EXCLUIDO' },
  });

  try {
    await db.produto.delete({ where: { id } });
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      throw new Error('Produto não encontrado');
    }
    throw e;
  }
}

export async function listarCategorias(empresaId: string) {
  const db = getPrismaEmpresa(empresaId);
  const resultado = await db.produto.findMany({
    where: { categoria: { not: null } },
    select: { categoria: true },
    distinct: ['categoria'],
  });
  return resultado.map((r: any) => r.categoria).filter(Boolean) as string[];
}
