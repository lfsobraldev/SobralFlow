import { getPrismaEmpresa, RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';

export async function iniciarSessaoInventario(empresaId: string, usuarioId: string) {
  const db = getPrismaEmpresa(empresaId);
  return db.sessaoInventario.create({ data: { usuarioId } });
}

export async function finalizarSessaoInventario(empresaId: string, id: string) {
  const db = getPrismaEmpresa(empresaId);

  const sessao = await db.sessaoInventario.findUnique({ where: { id } });
  if (!sessao) throw new Error('Sessão de inventário não encontrada');
  if (sessao.finalizadaEm) throw new Error('Sessão já foi finalizada');

  try {
    return await db.sessaoInventario.update({
      where: { id },
      data: { finalizadaEm: new Date() },
    });
  } catch (e) {
    if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
      throw new Error('Sessão de inventário não encontrada');
    }
    throw e;
  }
}

export async function obterRelatorioInventario(empresaId: string, id: string) {
  const db = getPrismaEmpresa(empresaId);

  const sessao = await db.sessaoInventario.findUnique({
    where: { id },
    include: {
      usuario: { select: { nome: true, login: true } },
      movimentacoes: {
        include: { produto: { select: { codigo: true, descricao: true, unidade: true, saldo: true } } },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });
  if (!sessao) throw new Error('Sessão de inventário não encontrada');

  // Forma exata do que a query acima retorna em `movimentacoes` — anotado
  // explicitamente porque o client escopado (lib/prisma-empresa.ts) tem
  // retorno propositalmente amplo (ver comentário no próprio arquivo), então
  // o TypeScript não consegue inferir esse shape sozinho a partir do include.
  interface MovimentacaoComProduto {
    id: string;
    produtoId: string;
    valor: number;
    saldoAnterior: number;
    saldoNovo: number;
    criadoEm: Date;
    produto: { codigo: string; descricao: string; unidade: string; saldo: number };
  }
  const movimentacoes = sessao.movimentacoes as MovimentacaoComProduto[];

  const produtosUnicos = new Map<string, MovimentacaoComProduto>();
  for (const mov of movimentacoes) {
    produtosUnicos.set(mov.produtoId, mov); // fica com a última movimentação de cada produto
  }

  const itensConferidos = produtosUnicos.size;
  const divergencias = [...produtosUnicos.values()].filter(
    (mov) => mov.saldoNovo !== mov.produto.saldo
  );

  const inicio = sessao.iniciadaEm;
  const fim = sessao.finalizadaEm ?? new Date();
  const tempoGastoMs = fim.getTime() - inicio.getTime();

  return {
    sessao: {
      id: sessao.id,
      usuario: sessao.usuario,
      iniciadaEm: sessao.iniciadaEm,
      finalizadaEm: sessao.finalizadaEm,
      ativa: !sessao.finalizadaEm,
    },
    resumo: {
      itensConferidos,
      totalMovimentacoes: movimentacoes.length,
      divergenciasEncontradas: divergencias.length,
      tempoGastoMs,
    },
    movimentacoes: movimentacoes.map((m) => ({
      id: m.id,
      produto: m.produto,
      valor: m.valor,
      saldoAnterior: m.saldoAnterior,
      saldoNovo: m.saldoNovo,
      criadoEm: m.criadoEm,
    })),
    divergencias: divergencias.map((m) => ({
      produto: m.produto,
      contagemFinal: m.saldoNovo,
      saldoLivro: m.produto.saldo,
      diferenca: m.saldoNovo - m.produto.saldo,
    })),
  };
}
