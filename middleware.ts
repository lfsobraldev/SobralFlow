import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { obterChaveSecreta } from '@/lib/session-secrets';

// Cookies definidos em lib/auth.ts — repetidos aqui porque o middleware
// roda no runtime Edge e não pode importar 'next/headers' (usado em
// lib/auth.ts para ler/gravar cookies em Server Components/Route Handlers).
const COOKIE_NAME_EMPRESA = 'estoque_sessao';
const COOKIE_NAME_MASTER = 'sobral_master_sessao';

const ROTAS_PUBLICAS_EMPRESA = ['/login'];
const ROTAS_PUBLICAS_MASTER = ['/master/login'];

// Valida que o payload tem o FORMATO NOVO (com tipo + empresaId). Um token
// assinado antes da migração multiempresa passa na verificação de
// assinatura, mas não tem esses campos — aqui ele é tratado como inválido,
// nunca como "sessão de uma empresa desconhecida".
function payloadEhSessaoEmpresaValida(payload: Record<string, unknown>): boolean {
  return (
    payload.tipo === 'EMPRESA' &&
    typeof payload.empresaId === 'string' &&
    payload.empresaId.length > 0 &&
    typeof payload.id === 'string'
  );
}

function payloadEhSessaoMasterValida(payload: Record<string, unknown>): boolean {
  return (
    payload.tipo === 'MASTER' &&
    typeof payload.id === 'string' &&
    payload.id.length > 0 &&
    typeof payload.email === 'string'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ehAsset =
    pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.');
  if (ehAsset) return NextResponse.next();

  // ── Área MASTER (Sobral System) — completamente separada do ERP ──────────
  const ehAreaMaster = pathname.startsWith('/master') || pathname.startsWith('/api/master');
  if (ehAreaMaster) {
    const ehLoginMaster =
      ROTAS_PUBLICAS_MASTER.some((rota) => pathname.startsWith(rota)) ||
      pathname.startsWith('/api/master/auth');
    // Rotas públicas continuam funcionando mesmo sem MASTER_SESSION_SECRET
    // configurada — o login em si só precisa da chave no momento de ASSINAR
    // um token novo (lib/auth.ts), não para simplesmente exibir a página ou
    // aceitar a tentativa de login.
    if (ehLoginMaster) return NextResponse.next();

    const token = request.cookies.get(COOKIE_NAME_MASTER)?.value;
    if (!token) return recusarAcessoMaster(request, pathname);

    // FAIL-CLOSED: se a chave não existir/estiver vazia, a rota protegida é
    // negada imediatamente — nunca chamamos jwtVerify com uma chave nula ou
    // vazia. Log técnico sem valores de segredo, só para diagnóstico
    // operacional (diferencia "config ausente" de "token inválido").
    const chaveMaster = obterChaveSecreta('MASTER_SESSION_SECRET');
    if (!chaveMaster) {
      console.error(
        '[middleware] MASTER_SESSION_SECRET ausente ou vazia — acesso a rota Master negado por configuração inválida.'
      );
      return recusarAcessoMaster(request, pathname, 'configuracao_ausente');
    }

    try {
      const { payload } = await jwtVerify(token, chaveMaster);
      if (!payloadEhSessaoMasterValida(payload)) {
        return recusarAcessoMaster(request, pathname);
      }
      return NextResponse.next();
    } catch {
      return recusarAcessoMaster(request, pathname);
    }
  }

  // ── Área da EMPRESA (ERP) ────────────────────────────────────────────────
  const ehRotaPublica = ROTAS_PUBLICAS_EMPRESA.some((rota) => pathname.startsWith(rota));
  const ehApiAuth = pathname.startsWith('/api/auth');

  // Mesma lógica: público continua público independente da configuração de
  // secret — só é preciso a chave para rotas que de fato validam sessão.
  if (ehRotaPublica || ehApiAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME_EMPRESA)?.value;
  if (!token) {
    return recusarAcessoEmpresa(request, pathname);
  }

  const chaveEmpresa = obterChaveSecreta('SESSION_SECRET');
  if (!chaveEmpresa) {
    console.error(
      '[middleware] SESSION_SECRET ausente ou vazia — acesso ao ERP negado por configuração inválida.'
    );
    return recusarAcessoEmpresa(request, pathname, 'configuracao_ausente');
  }

  try {
    const { payload } = await jwtVerify(token, chaveEmpresa);
    if (!payloadEhSessaoEmpresaValida(payload)) {
      // Token antigo (pré-multiempresa) ou payload inválido: mesmo caminho
      // do "não autenticado" — nunca deixamos passar sem empresaId.
      return recusarAcessoEmpresa(request, pathname);
    }
    return NextResponse.next();
  } catch {
    return recusarAcessoEmpresa(request, pathname);
  }
}

function ehRotaApi(pathname: string) {
  return pathname.startsWith('/api/');
}

// Requisições de API recebem status HTTP explícito (401 para sessão
// ausente/inválida, 503 quando é a CONFIGURAÇÃO do servidor que está
// ausente — nunca a mesma mensagem que revelaria qual variável falta).
// Requisições de página continuam com o redirect para a tela de login,
// preservando a experiência atual do produto.
function recusarAcessoEmpresa(
  request: NextRequest,
  origem: string,
  motivo: 'nao_autenticado' | 'configuracao_ausente' = 'nao_autenticado'
) {
  if (ehRotaApi(origem)) {
    return motivo === 'configuracao_ausente'
      ? NextResponse.json({ erro: 'Serviço temporariamente indisponível' }, { status: 503 })
      : NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  if (origem !== '/') url.searchParams.set('redirect', origem);
  return NextResponse.redirect(url);
}

function recusarAcessoMaster(
  request: NextRequest,
  origem: string,
  motivo: 'nao_autenticado' | 'configuracao_ausente' = 'nao_autenticado'
) {
  if (ehRotaApi(origem)) {
    return motivo === 'configuracao_ausente'
      ? NextResponse.json({ erro: 'Serviço temporariamente indisponível' }, { status: 503 })
      : NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/master/login';
  if (origem !== '/master') url.searchParams.set('redirect', origem);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
