# Sistema de Controle de Estoque — Etapa 1: Base do projeto

Esta etapa entrega: setup do projeto, banco de dados (Prisma + SQLite), autenticação por sessão
(cookie assinado) e o script de criação de usuários.

## Como rodar (localmente, com Node.js instalado)

Este projeto usa PostgreSQL. Para rodar local, crie um banco gratuito em https://neon.tech
(1 minuto, sem cartão) e cole a connection string no `.env`.

```bash
npm install
cp .env.example .env      # depois edite o .env com sua DATABASE_URL do Neon e um SESSION_SECRET
npx prisma db push   # cria as tabelas no banco
npx prisma db seed   # cria o usuário admin/admin e os produtos de demonstração
npm run dev
```

Acesse `http://localhost:3000`. Você será redirecionado para `/login`.

## Como colocar no ar sem instalar nada (deploy gratuito)

Veja o passo a passo completo em `DEPLOY.md` (Neon + Vercel, tudo pelo navegador).

- **Usuário:** `admin`
- **Senha:** `admin`

> ⚠️ Troque a senha do admin em produção (crie um novo usuário administrador e desative este,
> assim que o módulo de gestão de usuários da próxima etapa estiver pronto — ou já use o script
> abaixo para criar o seu próprio admin com outra senha).

## Criando outros usuários (atalho via terminal)

Não é necessário abrir o sistema para cadastrar um novo operador ou supervisor:

```bash
npm run user:create -- --nome "João Silva" --login joao --senha 123456 --perfil OPERADOR
```

Perfis aceitos: `ADMINISTRADOR`, `SUPERVISOR`, `OPERADOR`.

Ou rode sem argumentos para modo interativo (o terminal pergunta cada campo):

```bash
npm run user:create
```

## O que já existe nesta etapa

- Estrutura de pastas escalável (`app`, `components`, `features`, `services`, `lib`, `types`, `scripts`)
- Schema completo do banco: `Produto`, `Movimentacao` (histórico imutável), `Usuario`,
  `LogAuditoria` e `SessaoInventario` (para o futuro Modo Inventário)
- Autenticação: login/logout via API, sessão em cookie httpOnly assinado (JWT via `jose`),
  middleware protegendo todas as rotas exceto `/login`
- Permissões centralizadas por perfil em `types/index.ts` (`PERMISSOES`), prontas para uso em
  qualquer rota ou componente da próxima etapa
- Tela de login funcional, alto contraste, campos grandes

## Etapa 2 (concluída): Tela de Contagem

A tela principal do sistema, em `/contagem` — é para onde a raiz (`/`) e o login redirecionam.

**Fluxo pensado para o menor número de cliques possível:**

1. A tela abre com o campo de busca já em foco.
2. Bipar o código de barras (ou digitar código/descrição) já filtra instantaneamente
   (debounce de 150ms). Um leitor USB que já manda "Enter" seleciona o produto sozinho
   quando há um único resultado.
3. Com o produto aberto, aparecem só 3 números: **Saldo** (referência/livro), **Contagem**
   (o que está sendo ajustado agora) e **Diferença** (Contagem − Saldo).
4. Tocar em um botão de ajuste rápido (`+0,5`, `−1` etc.) já registra o movimento **na hora**,
   sem precisar de "Confirmar" — e a tela volta sozinha para a busca, pronta para o próximo item.
5. Para um valor customizado (ex: 3,25), digite os números, use `+`/`−` do teclado físico para
   definir o sinal, e toque em **Confirmar**.
6. **Cancelar** volta para a busca sem gravar nada. **Limpar** só apaga o valor digitado.

**Importante sobre o modelo de dados:** o *Saldo* é o estoque de referência e só muda quando um
Supervisor/Administrador fecha a contagem (próxima etapa, junto com o Modo Inventário). A
*Contagem* é o valor que os operadores ajustam durante a conferência — é isso que garante a
comparação (Diferença) que aparece nesta tela e vai alimentar o Dashboard.

Teclado físico já funciona: dígitos, `,`/`.`, `+`/`-`, `Enter` (Confirmar), `Backspace`
(apaga o último dígito), `Esc` (Cancelar).

O seed já cria 5 produtos de exemplo para você testar sem precisar importar planilha nenhuma.

## Etapa 3 (concluída): Histórico

Tela em `/historico`, com uma barra de navegação (`NavBar`) agora compartilhada entre todas as
telas internas via `app/(dashboard)/layout.tsx`.

- Filtros: produto (código/descrição), usuário, período (de/até).
- Paginação (20 por página).
- Nunca apaga nada — é só leitura da tabela `Movimentacao`, que já vem sendo alimentada
  desde a Etapa 2.
- Cada linha mostra: data/hora, produto, usuário, tipo de movimento, valor do ajuste,
  saldo anterior, saldo novo e IP de origem — exatamente os campos pedidos.

## Etapa 4 (concluída): Gestão de usuários

Tela em `/usuarios`, acessível apenas para Administradores (checagem no servidor: qualquer
outro perfil é redirecionado de volta para `/contagem` antes mesmo de a página renderizar).

- Formulário para criar usuário (nome, login, senha, perfil) sem sair do sistema.
- Lista com todos os usuários (ativos e inativos), com opção de desativar/reativar.
- Um administrador não consegue desativar a si mesmo (trava de segurança para não ficar
  trancado para fora do sistema).
- O atalho de terminal da Etapa 1 (`npm run user:create`) continua funcionando normalmente
  para quem preferir criar usuários sem abrir o navegador.

As permissões usadas aqui já existiam desde a Etapa 1 (`PERMISSOES` em `types/index.ts`) —
esta etapa só adicionou a interface visual por cima delas.

## Etapa 5 (concluída): Cadastro de Produtos

Tela em `/produtos` — CRUD completo com busca instantânea, filtros ("só estoque crítico",
"só divergentes"), paginação, e **Importação/Exportação de Excel**:

- **Exportar**: botões para baixar todos os produtos em `.xlsx` ou `.csv`.
- **Importar**: escolha o arquivo, veja uma pré-visualização das primeiras linhas e das
  colunas reconhecidas automaticamente (aceita cabeçalhos como "Código", "codigo", "SKU",
  "Descrição", "Saldo", "Estoque", "Local", etc. — com ou sem acento), depois confirme.
  Produtos com código já existente são **atualizados**; códigos novos são **criados**.
  Linhas com erro (código/descrição ausente, saldo inválido) aparecem listadas, sem travar
  o resto da importação.
- Excluir um produto é bloqueado se ele já tiver movimentações (protege o histórico);
  nesses casos, a orientação é desativar ou zerar o saldo em vez de excluir.
- Toda criação/edição gera registro em `LogAuditoria` automaticamente.

## Etapa 6 (concluída): Dashboard

Tela em `/dashboard` com os 7 indicadores pedidos: quantidade total de itens, itens
conferidos, itens pendentes, movimentações do dia, estoque crítico, produtos divergentes
e última atualização — além de duas listas (estoque crítico e divergências) para ir direto
ao ponto sem precisar abrir o cadastro.

## Etapa 7 (concluída): Scanner por câmera

Na Tela de Contagem, o botão 📷 ao lado da busca ativa a câmera do dispositivo e lê
automaticamente códigos de barras (EAN-13/8, Code 128/39, UPC) e QR Code usando a
`BarcodeDetector` nativa do navegador (suportada em Chrome/Edge/Android). Em navegadores
sem suporte (ex: Safari mais antigo), aparece um aviso e o operador continua podendo digitar
o código manualmente ou usar um leitor USB — que já funcionava desde a Etapa 2.

## Etapa 8 (concluída): Modo Inventário 🎯

A funcionalidade extra sugerida: na Tela de Contagem, o botão **"▶ Iniciar Modo Inventário"**
abre uma sessão (`SessaoInventario`) que:

- Mostra um cronômetro ao vivo e a contagem de itens conferidos durante a sessão.
- Vincula cada movimentação registrada nesse período à sessão (`sessaoInventarioId`).
- Ao tocar em **Finalizar**, gera automaticamente o relatório de fechamento em
  `/inventario/[id]` com: itens conferidos, total de movimentações, divergências
  encontradas (contagem final vs. saldo de livro) e tempo total gasto na conferência.
- A sessão sobrevive a um recarregamento acidental da página (guardada no `localStorage`
  do navegador), então o operador não perde o progresso se a aba fechar sem querer.

## Etapa 9 (concluída): Pedidos/Projetos, conversão de unidade e Entrada/Saída

Com base na planilha real do usuário (madeireira com múltiplas espécies e projetos em
paralelo), três funcionalidades foram adicionadas:

**Pedidos/Projetos**
- Novo modelo `Pedido` (ex: "TETTO 5900", "TETTO 2950"). Produtos podem ser vinculados a um
  pedido opcionalmente.
- Filtro por Pedido no Dashboard e na tela de Produtos.
- Criação rápida de pedido direto na tela de Produtos (botão "+ Pedido"), sem precisar de
  uma tela própria.

**Conversão automática de unidade**
- Cada produto pode ter um `fatorConversao` e uma `unidadeConversao` (ex: 1 caixa = 0,0951 m³).
- O valor convertido aparece automaticamente ao lado do saldo na Tela de Contagem e na
  listagem de Produtos — sem precisar calcular na mão.

**Tela de Entrada/Saída** (`/movimentacao`)
- Separada da Tela de Contagem: aqui a movimentação atualiza o **Saldo real** na hora
  (diferente do Ajuste de Contagem, que só mexe na Contagem até o fechamento).
- Busca de produto + botão Entrada/Saída + quantidade — mesmo padrão de poucos cliques do
  resto do sistema.
- Também tem leitor de código de barras/QR por câmera.
- Uma saída que deixaria o saldo negativo é bloqueada com aviso claro.

## Etapa 10 (concluída): Estética renovada

- Navegação com ícones reais (biblioteca `lucide-react`), indicador de aba ativa mais
  discreto (linha inferior ao invés de fundo cheio), marca "● ESTOQUE" fixa no topo.
- Cards de métrica do Dashboard com uma barra lateral colorida indicando o status
  (crítico/positivo/neutro) — leitura mais rápida que só cor de texto.
- Tabela de Produtos com indicador visual (ícone + borda lateral) para itens críticos e
  divergentes.
- Leitor de código de barras/QR por câmera agora também disponível no cadastro de
  produtos (para já registrar o código de barras direto na criação/edição), além da Tela
  de Contagem e da tela de Entrada/Saída.
- Layout testado para notebook (navegação expandida, tabelas em largura maior) e celular
  (ícones sem texto, colunas essenciais).

## Status do projeto

Todos os módulos do pedido original — mais os adicionados a partir da planilha real do
usuário — estão implementados: Dashboard (com filtro por Pedido), Cadastro de Produtos
(com Pedido e conversão de unidade), Tela de Contagem, Entrada/Saída, Teclado numérico,
Pesquisa + Scanner (leitor USB e câmera, tanto na Contagem quanto no cadastro), Histórico,
Auditoria, Login com perfis e permissões, Perfil com troca de senha, Importação/Exportação,
e o Modo Inventário. Veja `DEPLOY.md` para colocar tudo no ar gratuitamente (Neon + Vercel).

## Etapa 11 (concluída): Auditoria e Perfil

- **Tela de Auditoria** (`/auditoria`, visível só para quem tem a permissão `verAuditoria`
  — Administrador e Supervisor): lista filtrável de tudo que foi criado/editado/excluído
  no cadastro de produtos, mostrando usuário, campo alterado, valor antigo → novo.
- **Tela de Perfil** (`/perfil`, acessível a todos clicando no próprio nome na navegação):
  mostra os dados do usuário logado e permite trocar a própria senha (exige a senha atual).

### O que ainda vale considerar (melhorias futuras, não bloqueiam o uso diário)
- Testes automatizados.
