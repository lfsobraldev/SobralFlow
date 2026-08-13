import { prisma } from '@/lib/prisma';
import { getPrismaEmpresaComCliente, RegistroNaoEncontradoNaEmpresaError } from '@/lib/prisma-empresa';
import type { Prisma, TipoMovimento } from '@prisma/client';

interface RegistrarMovimentoParams {
  empresaId: string;
  produtoId: string;
  valor: number;
  tipo: TipoMovimento;
  usuarioId: string;
  ip: string | null;
  sessaoInventarioId?: string;
}

/**
 * Operação central do sistema — aplica o delta informado diretamente no SALDO
 * (o número que aparece em todo o resto do sistema: lista de produtos,
 * dashboard, relatórios, KPI financeiro).
 *
 * CORREÇÃO IMPORTANTE (bug crítico corrigido em revisão anterior): antes, o
 * tipo AJUSTE_CONTAGEM (usado pela Tela de Contagem) só atualizava um campo
 * separado chamado `contagem`, na expectativa de que um Supervisor depois
 * "fechasse a contagem" e transferisse esse valor pro `saldo`. Esse passo de
 * fechamento nunca foi implementado em nenhum lugar do sistema — ou seja, a
 * contagem feita pelo operador nunca refletia no saldo real. Agora
 * AJUSTE_CONTAGEM atualiza o saldo imediatamente, igual ENTRADA/SAIDA, e
 * mantém o campo `contagem` em sincronia.
 *
 * O histórico completo (tabela Movimentacao) nunca é apagado nem sobrescrito —
 * cada chamada cria um novo registro imutável com saldoAnterior/saldoNovo,
 * então o "saldo inicial do mês" e o histórico de contagens sempre podem ser
 * reconstruídos a partir daqui (ver services/saldoService.ts).
 *
 * ISOLAMENTO: toda a transação roda sobre um client Prisma escopado por
 * empresaId (dentro de `tx`), então mesmo que alguém envie um `produtoId`
 * de outra empresa, a busca abaixo simplesmente não encontra o produto —
 * o mesmo comportamento de "produto não encontrado" de um ID inexistente.
 */
export async function registrarMovimento({
  empresaId,
  produtoId,
  valor,
  tipo,
  usuarioId,
  ip,
  sessaoInventarioId,
}: RegistrarMovimentoParams) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const dbEmpresa = getPrismaEmpresaComCliente(tx as unknown as typeof prisma, empresaId);

    const produto = await dbEmpresa.produto.findUnique({ where: { id: produtoId } });
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    const valorAnterior = produto.saldo;
    const valorNovo = arredondar(valorAnterior + valor);

    if (valorNovo < 0) {
      throw new Error('Essa operação deixaria o saldo negativo. Confira a quantidade.');
    }

    let produtoAtualizado;
    try {
      produtoAtualizado = await dbEmpresa.produto.update({
        where: { id: produtoId },
        data:
          tipo === 'AJUSTE_CONTAGEM'
            ? { saldo: valorNovo, contagem: valorNovo, conferidoEm: new Date() }
            : { saldo: valorNovo },
      });
    } catch (e) {
      if (e instanceof RegistroNaoEncontradoNaEmpresaError) {
        throw new Error('Produto não encontrado');
      }
      throw e;
    }

    // sessaoInventarioId, quando informado, também precisa pertencer à
    // mesma empresa — validamos antes de gravar a movimentação para não
    // deixar uma movimentação apontando para a sessão de outra empresa.
    if (sessaoInventarioId) {
      const sessao = await dbEmpresa.sessaoInventario.findUnique({
        where: { id: sessaoInventarioId },
      });
      if (!sessao) {
        throw new Error('Sessão de inventário não encontrada');
      }
    }

    const movimentacao = await dbEmpresa.movimentacao.create({
      data: {
        produtoId,
        usuarioId,
        tipo,
        valor,
        saldoAnterior: valorAnterior,
        saldoNovo: valorNovo,
        ip: ip ?? undefined,
        sessaoInventarioId,
      },
    });

    return { produto: produtoAtualizado, movimentacao };
  });
}

// Evita erros de ponto flutuante (ex: 0.1 + 0.2 !== 0.3) acumulando em várias contagens do dia.
function arredondar(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

export function extrairIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return headers.get('x-real-ip');
}
