/**
 * Atalho (hk) para criar usuários direto pelo terminal, sem precisar abrir o sistema.
 *
 * Uso:
 *   npm run user:create -- --nome "João Silva" --login joao --senha 123456 --perfil OPERADOR --empresaId <id-da-empresa>
 *
 * Perfis aceitos: ADMINISTRADOR | GERENTE | ENCARREGADO | OPERADOR (padrão: OPERADOR)
 *
 * Também funciona em modo interativo, sem argumentos:
 *   npm run user:create
 */
import { createInterface } from 'node:readline/promises';
import { PrismaClient, PerfilUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const map: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith('--')) {
      const chave = args[i]!.replace('--', '');
      map[chave] = args[i + 1] ?? '';
      i++;
    }
  }
  return map;
}

async function perguntarFaltantes(dados: Record<string, string>) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  if (!dados.nome) dados.nome = await rl.question('Nome completo: ');
  if (!dados.login) dados.login = await rl.question('Login (usuário): ');
  if (!dados.senha) dados.senha = await rl.question('Senha: ');
  if (!dados.perfil) {
    dados.perfil =
      (await rl.question('Perfil [ADMINISTRADOR/GERENTE/ENCARREGADO/OPERADOR] (padrão OPERADOR): ')) ||
      'OPERADOR';
  }
  if (!dados.empresaId) {
    const empresas = await prisma.empresa.findMany({
      select: { id: true, razaoSocial: true, nomeFantasia: true },
    });
    if (empresas.length === 0) {
      console.error('❌ Nenhuma empresa cadastrada no banco. Crie uma empresa antes de criar o usuário.');
      process.exit(1);
    }
    console.log('\nEmpresas encontradas:');
    empresas.forEach((e) => console.log(`   ${e.id}  -  ${e.razaoSocial} (${e.nomeFantasia})`));
    dados.empresaId = await rl.question('\nID da empresa: ');
  }

  rl.close();
  return dados;
}

async function main() {
  let dados = parseArgs();
  dados = await perguntarFaltantes(dados);

  const perfil = dados.perfil.toUpperCase();
  if (!Object.values(PerfilUsuario).includes(perfil as PerfilUsuario)) {
    console.error(`❌ Perfil inválido: "${dados.perfil}". Use ADMINISTRADOR, GERENTE, ENCARREGADO ou OPERADOR.`);
    process.exit(1);
  }

  if (!dados.nome || !dados.login || !dados.senha || !dados.empresaId) {
    console.error('❌ Nome, login, senha e empresaId são obrigatórios.');
    process.exit(1);
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: dados.empresaId } });
  if (!empresa) {
    console.error(`❌ Empresa com id "${dados.empresaId}" não encontrada.`);
    process.exit(1);
  }

  const jaExiste = await prisma.usuario.findFirst({
    where: { login: dados.login, empresaId: dados.empresaId },
  });
  if (jaExiste) {
    console.error(`❌ Já existe um usuário com o login "${dados.login}" nessa empresa.`);
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      login: dados.login,
      senhaHash,
      perfil: perfil as PerfilUsuario,
      empresa: {
        connect: { id: dados.empresaId },
      },
    },
  });

  console.log('\n✅ Usuário criado com sucesso:');
  console.log(`   Nome:    ${usuario.nome}`);
  console.log(`   Login:   ${usuario.login}`);
  console.log(`   Perfil:  ${usuario.perfil}`);
  console.log(`   Empresa: ${empresa.razaoSocial}`);
}

main()
  .catch((e) => {
    console.error('Erro ao criar usuário:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
