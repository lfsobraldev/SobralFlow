import type { PerfilUsuario, TipoMovimento, StatusApontamento } from '@prisma/client';

export type { PerfilUsuario, TipoMovimento, StatusApontamento };

// Sessão de um usuário comum, sempre vinculada a UMA empresa (ERP da empresa).
// `empresaId` só existe aqui porque veio do banco (usuario.empresaId) no
// momento do login — nunca é aceito vindo do frontend/cliente.
export interface SessaoUsuario {
  tipo: 'EMPRESA';
  id: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  empresaId: string;
  empresaNome: string;
}

// Sessão do Administrador Master (Sobral System) — não pertence a nenhuma
// empresa cliente, fluxo de login e cookie totalmente separados do ERP.
export interface SessaoMaster {
  tipo: 'MASTER';
  id: string;
  nome: string;
  email: string;
}

export interface ProdutoResumo {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  saldo: number;
  contagem: number | null;
  localizacao: string | null;
  categoria: string | null;
  fatorConversao?: number | null;
  unidadeConversao?: string | null;
  saldoInicialMes?: number;
}

export interface RegistrarMovimentoInput {
  produtoId: string;
  valor: number; // delta: +1, -0.5 etc.
  tipo: TipoMovimento;
  sessaoInventarioId?: string;
}

// Fila de Apontamentos (Produção → Apontamento no celular / Fila de
// Apontamentos no PC).
export interface ApontamentoResumo {
  id: string;
  numeroOF: string;
  numeroOperacao: string;
  peca: string;
  quantidade: number;
  situacao: string;
  motivo: string | null;
  observacao: string | null;
  status: StatusApontamento;
  usuarioNome: string;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm: string | null;
}

export interface CriarApontamentoInput {
  numeroOF: string;
  numeroOperacao: string;
  peca: string;
  quantidade: number;
  situacao: string;
  motivo?: string;
  observacao?: string;
}

export const ROTULO_STATUS_APONTAMENTO: Record<StatusApontamento, string> = {
  NOVO: 'Novo',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
};

export const SITUACOES_APONTAMENTO = ['OK', 'FALTA', 'PROBLEMA', 'OUTRO'] as const;

// Permissões por perfil. Centralizado aqui para nunca haver checagem divergente
// entre uma rota de API e outra.
export const PERMISSOES = {
  ADMINISTRADOR: {
    gerenciarUsuarios: true,
    editarProdutos: true,
    excluirProdutos: true,
    verAuditoria: true,
    importarExportar: true,
    registrarContagem: true,
    verRelatorios: true,
  },
  GERENTE: {
    gerenciarUsuarios: false,
    editarProdutos: true,
    excluirProdutos: false,
    verAuditoria: true,
    importarExportar: true,
    registrarContagem: true,
    verRelatorios: true,
  },
  ENCARREGADO: {
    gerenciarUsuarios: false,
    editarProdutos: false,
    excluirProdutos: false,
    verAuditoria: false,
    importarExportar: false,
    registrarContagem: true,
    verRelatorios: true,
  },
  OPERADOR: {
    gerenciarUsuarios: false,
    editarProdutos: false,
    excluirProdutos: false,
    verAuditoria: false,
    importarExportar: false,
    registrarContagem: true,
    verRelatorios: false,
  },
} as const satisfies Record<PerfilUsuario, Record<string, boolean>>;

// Rótulos e descrições exibidos na interface (gestão de usuários, badges, etc.)
export const ROTULO_PERFIL: Record<PerfilUsuario, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  ENCARREGADO: 'Encarregado',
  OPERADOR: 'Operador',
};

export const DESCRICAO_PERFIL: Record<PerfilUsuario, string> = {
  ADMINISTRADOR: 'Acesso total: usuários, cadastro, auditoria e relatórios.',
  GERENTE: 'Gestão de cadastro, importação/exportação, auditoria e relatórios.',
  ENCARREGADO: 'Operação de contagem, entrada/saída e relatórios do setor.',
  OPERADOR: 'Operação de contagem e conferência no chão de fábrica.',
};

export function temPermissao(
  perfil: PerfilUsuario,
  permissao: keyof (typeof PERMISSOES)['ADMINISTRADOR']
): boolean {
  return PERMISSOES[perfil][permissao];
}
