import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type { SessaoUsuario, SessaoMaster, PerfilUsuario } from '@/types';
import { obterChaveSecreta } from '@/lib/session-secrets';

// Cookie do ERP da empresa. Nome preservado (era 'estoque_sessao' antes da
// migração multiempresa) para não exigir nenhuma mudança de infraestrutura —
// só o CONTEÚDO do JWT muda (ganha empresaId/tipo).
const COOKIE_NAME = 'estoque_sessao';

// Cookie do Painel Master (Sobral System) — completamente separado do cookie
// da empresa. Um navegador pode, em tese, ter os dois ao mesmo tempo (ex:
// suporte logado como master testando o ERP de um cliente em outra aba), sem
// que um vaze escopo para o outro.
const COOKIE_NAME_MASTER = 'sobral_master_sessao';

const DURACAO_SESSAO = '12h'; // suficiente para um turno de trabalho

// Sinal controlado de "configuração de sessão ausente/inválida" — nunca uma
// exceção genérica, para quem chama (rotas de login) poder identificar esse
// caso específico e devolver uma resposta genérica ao cliente (nunca a
// mensagem completa, que poderia sugerir qual variável de ambiente falta).
export class ConfiguracaoSessaoInvalidaError extends Error {
  constructor(nome: string) {
    super(`Configuração de sessão ausente ou inválida: ${nome}`);
    this.name = 'ConfiguracaoSessaoInvalidaError';
  }
}

function getSecretKey(): Uint8Array {
  const chave = obterChaveSecreta('SESSION_SECRET');
  if (!chave) throw new ConfiguracaoSessaoInvalidaError('SESSION_SECRET');
  return chave;
}

// Secret DEDICADO para sessões Master — propositalmente separado de
// SESSION_SECRET. O Master é a conta de maior privilégio de toda a
// plataforma (acesso a todas as empresas); usar uma chave própria limita o
// dano caso o secret do ERP das empresas seja exposto por algum bug do lado
// da aplicação-cliente: quem tiver SESSION_SECRET não consegue forjar uma
// sessão Master, e vice-versa.
function getSecretKeyMaster(): Uint8Array {
  const chave = obterChaveSecreta('MASTER_SESSION_SECRET');
  if (!chave) throw new ConfiguracaoSessaoInvalidaError('MASTER_SESSION_SECRET');
  return chave;
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// ─────────────────────────────────────────────────────────────────────────
// Sessão de EMPRESA (ERP) — sempre carrega empresaId, sempre obtido do
// registro do usuário no banco no momento do login (nunca do frontend).
// ─────────────────────────────────────────────────────────────────────────

interface DadosParaSessaoEmpresa {
  id: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  empresaId: string;
  empresaNome: string;
}

export async function criarSessaoEmpresa(usuario: DadosParaSessaoEmpresa): Promise<string> {
  return new SignJWT({
    tipo: 'EMPRESA',
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    empresaId: usuario.empresaId,
    empresaNome: usuario.empresaNome,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO)
    .sign(getSecretKey());
}

export async function definirCookieSessao(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h em segundos
  });
}

export async function removerCookieSessao() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Retorna a sessão da EMPRESA atual, ou null se não houver sessão válida.
 *
 * Trata com segurança tokens antigos (emitidos antes da migração
 * multiempresa, sem `tipo`/`empresaId` no payload): eles são considerados
 * INVÁLIDOS e descartados aqui, forçando um novo login. Isso é intencional —
 * um token sem empresaId nunca pode ser tratado como pertencente a uma
 * empresa "padrão" ou ficar sem esse dado, porque o resto do sistema (a
 * partir da Etapa 4) vai confiar neste valor para filtrar dados.
 */
export async function obterSessaoAtual(): Promise<SessaoUsuario | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (
      payload.tipo !== 'EMPRESA' ||
      typeof payload.empresaId !== 'string' ||
      payload.empresaId.length === 0 ||
      typeof payload.id !== 'string' ||
      typeof payload.login !== 'string' ||
      typeof payload.perfil !== 'string'
    ) {
      // Token antigo (pré-multiempresa) ou payload incompleto/corrompido.
      // Não tentamos "completar" ou adivinhar a empresa — tratamos como
      // sessão inexistente, o que leva o usuário de volta ao login.
      return null;
    }

    return {
      tipo: 'EMPRESA',
      id: payload.id,
      nome: payload.nome as string,
      login: payload.login,
      perfil: payload.perfil as PerfilUsuario,
      empresaId: payload.empresaId,
      empresaNome: (payload.empresaNome as string | undefined) ?? '',
    };
  } catch {
    // token expirado, assinatura inválida, etc.
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Sessão MASTER (Sobral System) — fluxo, cookie e payload totalmente
// separados da sessão de empresa. Um administrador master NUNCA herda
// automaticamente o escopo de nenhuma empresa: para atuar dentro do ERP de
// uma empresa específica (ex: suporte), a evolução futura terá que ser uma
// ação explícita e auditada — não implementada nesta etapa.
// ─────────────────────────────────────────────────────────────────────────

interface DadosParaSessaoMaster {
  id: string;
  nome: string;
  email: string;
}

export async function criarSessaoMaster(admin: DadosParaSessaoMaster): Promise<string> {
  return new SignJWT({
    tipo: 'MASTER',
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO)
    .sign(getSecretKeyMaster());
}

export async function definirCookieSessaoMaster(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME_MASTER, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function removerCookieSessaoMaster() {
  const store = await cookies();
  store.delete(COOKIE_NAME_MASTER);
}

export async function obterSessaoMasterAtual(): Promise<SessaoMaster | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME_MASTER)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKeyMaster());

    if (
      payload.tipo !== 'MASTER' ||
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return {
      tipo: 'MASTER',
      id: payload.id,
      nome: (payload.nome as string | undefined) ?? '',
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, COOKIE_NAME_MASTER };
