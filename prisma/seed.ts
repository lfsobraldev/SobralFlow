import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// CNPJ placeholder — mesmo valor usado em scripts/migrar-empresa-famossul.ts.
// Se a Famossul já foi migrada com um CNPJ real, ajuste aqui para o mesmo valor.
const CNPJ_FAMOSSUL = '00.000.000/0001-00';

async function main() {
  // Toda tabela operacional agora exige empresaId — o seed precisa de uma
  // empresa para vincular o usuário admin e os produtos de demonstração.
  // Em produção (banco já migrado pela Famossul), isso reaproveita a
  // empresa existente em vez de criar uma segunda.
  let empresa = await prisma.empresa.findUnique({ where: { cnpj: CNPJ_FAMOSSUL } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: { razaoSocial: 'Famossul', nomeFantasia: 'Famossul', cnpj: CNPJ_FAMOSSUL, status: 'ATIVA' },
    });
    console.log(`✅ Empresa "Famossul" criada (id: ${empresa.id})`);
  }

  const existente = await prisma.usuario.findFirst({
    where: { empresaId: empresa.id, login: 'admin' },
  });

  if (existente) {
    console.log('Usuário "admin" já existe nesta empresa. Nada a fazer.');
    return;
  }

  const senhaHash = await bcrypt.hash('admin', 10);

  await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: 'Administrador',
      login: 'admin',
      senhaHash,
      perfil: 'ADMINISTRADOR',
    },
  });

  console.log('✅ Usuário admin criado com sucesso.');
  console.log('   Login: admin');
  console.log('   Senha: admin');
  console.log('   ⚠️  TROQUE ESSA SENHA IMEDIATAMENTE — "admin/admin" é um valor conhecido publicamente (está neste repositório).');

  await criarProdutosDemo(empresa.id);
}

// Produtos de exemplo, só para você já testar o sistema sem precisar importar Excel.
// Pode apagar todos depois pela tela de Cadastro ou direto no banco.
async function criarProdutosDemo(empresaId: string) {
  const jaTemProdutos = await prisma.produto.count({ where: { empresaId } });
  if (jaTemProdutos > 0) {
    console.log('Já existem produtos cadastrados nesta empresa. Pulando criação de demonstração.');
    return;
  }

  const pedido = await prisma.pedido.create({
    data: { empresaId, nome: 'TETTO 5900', descricao: 'Pedido de demonstração' },
  });

  await prisma.produto.createMany({
    data: [
      { empresaId, codigo: '1001', descricao: 'Parafuso sextavado M8x30', unidade: 'UN', saldo: 320, localizacao: 'A1-03', categoria: 'Fixação', custoUnitario: 0.35 },
      {
        empresaId,
        codigo: '1002',
        descricao: 'Painel de parede Cumaru 15x140mm',
        unidade: 'CX',
        saldo: 32,
        localizacao: 'B2-11',
        categoria: 'Madeira',
        pedidoId: pedido.id,
        fatorConversao: 0.0951,
        unidadeConversao: 'm³',
        custoUnitario: 420,
      },
      { empresaId, codigo: '1003', descricao: 'Correia dentada 12mm', unidade: 'UN', saldo: 18, localizacao: 'C3-02', categoria: 'Peças', estoqueMinimo: 20, custoUnitario: 58 },
      { empresaId, codigo: '1004', descricao: 'Luva de proteção nitrílica (par)', unidade: 'PAR', saldo: 150, localizacao: 'D1-07', categoria: 'EPI', custoUnitario: 6.9 },
      { empresaId, codigo: '1005', descricao: 'Chapa de aço inox 1000x2000mm', unidade: 'UN', saldo: 8, localizacao: 'E4-01', categoria: 'Matéria-prima', estoqueMinimo: 10, custoUnitario: 1250 },
    ],
  });

  console.log('✅ 5 produtos de demonstração criados (1 vinculado ao pedido "TETTO 5900").');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
