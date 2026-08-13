import { getPrismaEmpresa } from '@/lib/prisma-empresa';

/**
 * Calcula o "saldo inicial do mês" de um produto — o valor de referência que
 * deve permanecer visível na Tela de Contagem mesmo depois de várias
 * contagens semanais mudarem o saldo atual.
 *
 * Não precisa de nenhum campo novo no banco: o histórico de movimentações já
 * guarda saldoAnterior/saldoNovo de cada alteração, então o saldo inicial do
 * mês é simplesmente o saldo que o produto tinha um instante antes da
 * primeira movimentação registrada dentro do mês corrente. Se o produto ainda
 * não teve nenhuma movimentação neste mês, o saldo atual É o saldo inicial
 * do mês (nada mudou ainda).
 *
 * Isso nunca apaga nem reescreve histórico — é só uma leitura derivada dele.
 */
export async function obterSaldoInicialMes(
  empresaId: string,
  produtoId: string,
  saldoAtual: number,
  referencia: Date = new Date()
): Promise<number> {
  const db = getPrismaEmpresa(empresaId);
  const inicioMes = new Date(referencia.getFullYear(), referencia.getMonth(), 1);

  const primeiraMovimentacaoDoMes = await db.movimentacao.findFirst({
    where: { produtoId, criadoEm: { gte: inicioMes } },
    orderBy: { criadoEm: 'asc' },
    select: { saldoAnterior: true },
  });

  return primeiraMovimentacaoDoMes ? primeiraMovimentacaoDoMes.saldoAnterior : saldoAtual;
}

/**
 * Mesma lógica acima, mas em lote para uma lista de produtos (usado na busca
 * da Tela de Contagem, que retorna vários resultados de uma vez).
 */
export async function anexarSaldoInicialMes<T extends { id: string; saldo: number }>(
  empresaId: string,
  produtos: T[],
  referencia: Date = new Date()
): Promise<(T & { saldoInicialMes: number })[]> {
  return Promise.all(
    produtos.map(async (produto) => ({
      ...produto,
      saldoInicialMes: await obterSaldoInicialMes(empresaId, produto.id, produto.saldo, referencia),
    }))
  );
}
