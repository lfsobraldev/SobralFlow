import { z } from 'zod';

export const registrarMovimentoSchema = z.object({
  produtoId: z.string().min(1),
  valor: z
    .number()
    .refine((v) => v !== 0, 'O valor do ajuste não pode ser zero')
    .refine((v) => Math.abs(v) <= 100000, 'Valor de ajuste fora do intervalo permitido'),
  tipo: z.enum(['AJUSTE_CONTAGEM', 'ENTRADA', 'SAIDA', 'CORRECAO_MANUAL']).default('AJUSTE_CONTAGEM'),
  sessaoInventarioId: z.string().optional(),
});

// Fila de Apontamentos de Produção
export const criarApontamentoSchema = z.object({
  numeroOF: z.string().trim().min(1, 'Informe o número da OF'),
  numeroOperacao: z.string().trim().min(1, 'Informe o número da operação'),
  peca: z.string().trim().min(1, 'Informe a peça'),
  quantidade: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  situacao: z.string().trim().min(1, 'Informe a situação'),
  motivo: z.string().trim().optional(),
  observacao: z.string().trim().optional(),
});

export const listarApontamentosSchema = z.object({
  status: z.enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO']).optional(),
  numeroOF: z.string().trim().optional(),
  data: z.string().trim().optional(), // YYYY-MM-DD
  desde: z.string().trim().optional(), // ISO — usado no polling incremental
});

export const atualizarStatusApontamentoSchema = z.object({
  status: z.enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO']),
});

export const buscaProdutoSchema = z.object({
  termo: z.string().trim().default(''),
  limite: z.coerce.number().int().min(1).max(100).default(30),
});

export const criarProdutoSchema = z.object({
  // Código não é mais digitado pelo usuário — é gerado automaticamente no
  // backend (ver services/produtoCrudService.ts). Mantido aqui como opcional
  // só por compatibilidade com integrações/importação em massa que ainda
  // possam enviar um código próprio.
  codigo: z.string().optional(),
  descricao: z.string().min(1, 'Informe a descrição'),
  unidade: z.string().optional(),
  saldo: z.coerce.number().default(0),
  localizacao: z.string().optional(),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
  codigoBarras: z.string().optional(),
  estoqueMinimo: z.coerce.number().optional(),
  custoUnitario: z.coerce.number().optional(),
  pedidoId: z.string().optional(),
  fatorConversao: z.coerce.number().optional(),
  unidadeConversao: z.string().optional(),
});

export const atualizarProdutoSchema = z.object({
  descricao: z.string().min(1).optional(),
  unidade: z.string().min(1).optional(),
  saldo: z.coerce.number().optional(),
  localizacao: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  codigoBarras: z.string().nullable().optional(),
  estoqueMinimo: z.coerce.number().nullable().optional(),
  custoUnitario: z.coerce.number().nullable().optional(),
  pedidoId: z.string().nullable().optional(),
  fatorConversao: z.coerce.number().nullable().optional(),
  unidadeConversao: z.string().nullable().optional(),
});
