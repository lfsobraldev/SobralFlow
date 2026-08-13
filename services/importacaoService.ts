import { getPrismaEmpresa } from '@/lib/prisma-empresa';

// Reconhecimento automático de colunas: aceita variações comuns de nome de cabeçalho
// (com/sem acento, maiúsculas/minúsculas, em português ou inglês) vindas de planilhas
// que os operadores já usam hoje.
const MAPA_CABECALHOS: Record<string, string> = {
  codigo: 'codigo',
  código: 'codigo',
  code: 'codigo',
  sku: 'codigo',
  descricao: 'descricao',
  descrição: 'descricao',
  description: 'descricao',
  produto: 'descricao',
  unidade: 'unidade',
  un: 'unidade',
  unit: 'unidade',
  saldo: 'saldo',
  estoque: 'saldo',
  quantidade: 'saldo',
  qtd: 'saldo',
  localizacao: 'localizacao',
  localização: 'localizacao',
  local: 'localizacao',
  location: 'localizacao',
  categoria: 'categoria',
  category: 'categoria',
  observacoes: 'observacoes',
  observações: 'observacoes',
  obs: 'observacoes',
  notes: 'observacoes',
  codigodebarras: 'codigoBarras',
  'código de barras': 'codigoBarras',
  barcode: 'codigoBarras',
  ean: 'codigoBarras',
  estoqueminimo: 'estoqueMinimo',
  'estoque mínimo': 'estoqueMinimo',
  minimo: 'estoqueMinimo',
};

function normalizarChave(chave: string) {
  return chave
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos para bater com o mapa
}

export interface LinhaPlanilha {
  [coluna: string]: string | number | undefined;
}

/**
 * Recebe as linhas brutas da planilha (cabeçalhos livres) e devolve os campos
 * já mapeados para o formato interno do sistema, prontos para pré-visualização.
 */
export function reconhecerColunas(linhas: LinhaPlanilha[]) {
  return linhas.map((linha) => {
    const mapeada: Record<string, string | number | undefined> = {};
    for (const [chaveOriginal, valor] of Object.entries(linha)) {
      const chaveNormalizada = normalizarChave(chaveOriginal);
      const campoInterno = MAPA_CABECALHOS[chaveNormalizada];
      if (campoInterno) mapeada[campoInterno] = valor;
    }
    return mapeada;
  });
}

export interface ResultadoImportacao {
  criados: number;
  atualizados: number;
  erros: { linha: number; motivo: string }[];
}

export async function importarProdutos(
  empresaId: string,
  linhasMapeadas: Record<string, string | number | undefined>[],
  usuarioId: string
): Promise<ResultadoImportacao> {
  const db = getPrismaEmpresa(empresaId);
  const resultado: ResultadoImportacao = { criados: 0, atualizados: 0, erros: [] };

  for (let i = 0; i < linhasMapeadas.length; i++) {
    const linha = linhasMapeadas[i];
    const numeroLinha = i + 2; // +1 pelo cabeçalho, +1 porque planilha começa em 1

    if (!linha) {
      resultado.erros.push({ linha: numeroLinha, motivo: 'Linha vazia' });
      continue;
    }

    const codigo = String(linha.codigo ?? '').trim();
    const descricao = String(linha.descricao ?? '').trim();

    if (!codigo || !descricao) {
      resultado.erros.push({ linha: numeroLinha, motivo: 'Código ou descrição ausente' });
      continue;
    }

    const saldo = linha.saldo !== undefined && linha.saldo !== '' ? Number(linha.saldo) : 0;
    if (Number.isNaN(saldo)) {
      resultado.erros.push({ linha: numeroLinha, motivo: `Saldo inválido: "${linha.saldo}"` });
      continue;
    }

    const dadosComuns = {
      descricao,
      unidade: String(linha.unidade ?? 'UN').trim() || 'UN',
      saldo,
      localizacao: linha.localizacao ? String(linha.localizacao).trim() : null,
      categoria: linha.categoria ? String(linha.categoria).trim() : null,
      observacoes: linha.observacoes ? String(linha.observacoes).trim() : null,
      codigoBarras: linha.codigoBarras ? String(linha.codigoBarras).trim() : null,
      estoqueMinimo:
        linha.estoqueMinimo !== undefined && linha.estoqueMinimo !== ''
          ? Number(linha.estoqueMinimo)
          : null,
    };

    try {
      const existente = await db.produto.findUnique({ where: { codigo } });

      if (existente) {
        await db.produto.update({ where: { codigo }, data: dadosComuns });
        await db.logAuditoria.create({
          data: { usuarioId, produtoId: existente.id, acao: 'PRODUTO_IMPORTADO_ATUALIZADO' },
        });
        resultado.atualizados++;
      } else {
        const criado = await db.produto.create({ data: { codigo, ...dadosComuns } });
        await db.logAuditoria.create({
          data: { usuarioId, produtoId: criado.id, acao: 'PRODUTO_IMPORTADO_CRIADO' },
        });
        resultado.criados++;
      }
    } catch (e) {
      resultado.erros.push({
        linha: numeroLinha,
        motivo: e instanceof Error ? e.message : 'Erro desconhecido ao salvar',
      });
    }
  }

  return resultado;
}
