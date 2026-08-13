import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verificarSenha,
  criarSessaoEmpresa,
  definirCookieSessao,
  ConfiguracaoSessaoInvalidaError,
} from '@/lib/auth';

// .strict() garante que qualquer campo extra enviado pelo cliente (por
// exemplo, um "empresaId" digitado manualmente na requisição) seja
// REJEITADO aqui, e nunca silenciosamente ignorado nem usado. O empresaId
// da sessão só pode vir do registro do usuário no banco, mais abaixo.
const loginSchema = z
  .object({
    login: z.string().min(1, 'Informe o usuário'),
    senha: z.string().min(1, 'Informe a senha'),
  })
  .strict();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    );
  }

  const { login, senha } = parsed.data;

  // NOTA (transição multiempresa): `login` ainda é buscado sozinho, sem
  // pedir a empresa no formulário (decisão de produto desta etapa). A coluna
  // deixa de ser @unique globalmente no schema alvo (passa a ser única por
  // empresa), então aqui usamos findFirst em vez de findUnique. Enquanto
  // existir apenas a Famossul, o resultado é sempre correto. Se uma segunda
  // empresa cadastrar um login igual a um já existente, este findFirst pode
  // resolver para o usuário errado — risco já sinalizado na auditoria e que
  // precisa de uma decisão de produto (login+empresa, subdomínio, etc.)
  // antes de comercializar para uma segunda empresa.
  const usuario = await prisma.usuario.findFirst({
    where: { login },
    include: { empresa: true },
  });

  if (!usuario || !usuario.ativo) {
    return NextResponse.json({ erro: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  // Empresa inativa (suspensa pelo Master) não pode logar, mesmo com
  // usuário/senha corretos.
  if (!usuario.empresa || usuario.empresa.status !== 'ATIVA') {
    return NextResponse.json({ erro: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    return NextResponse.json({ erro: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  // empresaId vem EXCLUSIVAMENTE do registro do usuário retornado pelo
  // banco — nunca do body da requisição.
  let token: string;
  try {
    token = await criarSessaoEmpresa({
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId,
      empresaNome: usuario.empresa.nomeFantasia,
    });
  } catch (e) {
    if (e instanceof ConfiguracaoSessaoInvalidaError) {
      // Nunca expõe qual variável de ambiente falta — só um log técnico
      // seguro no servidor (sem valores de segredo) e uma resposta genérica.
      console.error('[login] Falha ao assinar sessão: configuração de sessão ausente/inválida.');
      return NextResponse.json({ erro: 'Serviço temporariamente indisponível' }, { status: 503 });
    }
    throw e;
  }
  await definirCookieSessao(token);

  return NextResponse.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      empresaNome: usuario.empresa.nomeFantasia,
    },
  });
}
