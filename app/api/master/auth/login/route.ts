import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verificarSenha,
  criarSessaoMaster,
  definirCookieSessaoMaster,
  ConfiguracaoSessaoInvalidaError,
} from '@/lib/auth';
import { logSegurancaMaster, extrairIpDaRequisicao } from '@/lib/log-master';

// Login do Administrador Master (Sobral System). Usa a tabela
// `administradores_master`, totalmente separada de `usuarios` — não tem
// relação com nenhuma empresa e não aceita empresaId em nenhuma hipótese.
const loginMasterSchema = z
  .object({
    email: z.string().email('Informe um e-mail válido'),
    senha: z.string().min(1, 'Informe a senha'),
  })
  .strict();

export async function POST(request: NextRequest) {
  const ip = extrairIpDaRequisicao(request.headers);
  const body = await request.json().catch(() => null);
  const parsed = loginMasterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    );
  }

  const { email, senha } = parsed.data;

  const admin = await prisma.administradorMaster.findUnique({ where: { email } });
  if (!admin || !admin.ativo) {
    logSegurancaMaster({ acao: 'LOGIN_FALHA', email, motivo: 'credencial_invalida', ip });
    return NextResponse.json({ erro: 'E-mail ou senha inválidos' }, { status: 401 });
  }

  const senhaValida = await verificarSenha(senha, admin.senhaHash);
  if (!senhaValida) {
    logSegurancaMaster({ acao: 'LOGIN_FALHA', email, motivo: 'credencial_invalida', ip });
    return NextResponse.json({ erro: 'E-mail ou senha inválidos' }, { status: 401 });
  }

  let token: string;
  try {
    token = await criarSessaoMaster({ id: admin.id, nome: admin.nome, email: admin.email });
  } catch (e) {
    if (e instanceof ConfiguracaoSessaoInvalidaError) {
      console.error(
        '[master-login] Falha ao assinar sessão: configuração de sessão ausente/inválida.'
      );
      logSegurancaMaster({ acao: 'LOGIN_FALHA', email, motivo: 'configuracao_ausente', ip });
      return NextResponse.json({ erro: 'Serviço temporariamente indisponível' }, { status: 503 });
    }
    throw e;
  }
  await definirCookieSessaoMaster(token);

  logSegurancaMaster({ acao: 'LOGIN_SUCESSO', email: admin.email, ip });

  return NextResponse.json({ admin: { id: admin.id, nome: admin.nome, email: admin.email } });
}
