# Changelog — Transformação para ERP Corporativo

Este documento resume a reestruturação de interface/arquitetura aplicada sobre
o `estoque-system-v3`. **Nenhuma regra de negócio existente foi alterada** —
toda a lógica de cálculo de saldo, contagem, movimentação, auditoria e
importação/exportação permanece exatamente como estava. As mudanças abaixo
são de camada de apresentação, mais duas extensões aditivas de dados
(perfil "Encarregado" e campo de custo unitário) necessárias para atender
aos KPIs financeiros pedidos.

## 1. Design system (tema escuro premium)
- `tailwind.config.ts`: os tokens de cor já usados no projeto (`base-*`,
  `action`, `positive`, `warning`, `critical`) foram **redefinidos** para uma
  paleta corporativa dark — sem precisar tocar em cada `className` do app
  (mais de 2.500 usos herdaram o novo visual automaticamente).
- Novos tokens: `surface` (cards), `sidebar`, `accent`, `chart-1..6`.
- `app/globals.css`: fundo com gradiente sutil, scrollbar customizada,
  seleção de texto com cor de marca, utilitário `.skeleton` para loading.
- Todas as ocorrências de `bg-white` foram migradas para `bg-surface`.

## 2. Nova arquitetura de layout
- `components/layout/Sidebar.tsx` — navegação lateral com ícones, seções e
  filtragem automática por permissão do usuário logado.
- `components/layout/Topbar.tsx` — cabeçalho com breadcrumb da página e menu
  do usuário (perfil / logout).
- `components/layout/MobileSidebar.tsx` — drawer para telas pequenas.
- `components/layout/AppShell.tsx` — compõe os três acima; substitui a antiga
  `NavBar.tsx` (removida, para não haver duplicação).

## 3. Novos componentes de UI reutilizáveis (`components/ui/`)
- `Card.tsx`, `CardHeader.tsx` — painéis padrão.
- `Badge.tsx` — status pills (perfis, situação, ações de auditoria).
- `PageHeader.tsx` — cabeçalho de página padronizado.
- `DataTable.tsx` — tabela genérica com **busca, ordenação por coluna e
  paginação** (client-side ou server-side).
- `charts.tsx` — `BarChart`, `LineChart`, `DonutChart` em SVG puro (sem
  dependências novas, zero risco de build).
- `Button.tsx` foi aprimorado (tamanhos, ícone, estado de carregamento) **sem
  quebrar a API `variante` já usada em todo o app**.

## 4. Dashboard executivo (`/dashboard`, agora a tela inicial)
- KPIs: estoque total, valor do estoque, entradas/saídas (7 dias), itens
  críticos, divergentes, pedidos ativos, custo médio unitário.
- Gráficos: entradas x saídas (linha), movimentos por dia (barras),
  distribuição por categoria (rosca).
- `services/dashboardService.ts` ganhou funções aditivas (nenhuma função
  existente foi alterada): `obterIndicadoresFinanceiros`,
  `obterResumoMovimentacoes`, `obterDistribuicaoPorCategoria`,
  `contarPedidosAtivos`.

## 5. Nova área de Relatórios (`/relatorios`)
- `services/relatorioService.ts`, `app/api/relatorios/route.ts` e
  `app/api/relatorios/exportar/route.ts` (Excel/CSV).
- Relatórios: valorização de estoque, movimentações por período/tipo, top
  produtos movimentados, itens em estoque crítico.
- Protegida pela nova permissão `verRelatorios`.

## 6. Controle de acesso por perfil (4 perfis)
- `prisma/schema.prisma`: enum `PerfilUsuario` passou de
  `ADMINISTRADOR | SUPERVISOR | OPERADOR` para
  `ADMINISTRADOR | GERENTE | ENCARREGADO | OPERADOR`.
  - `SUPERVISOR` foi renomeado para `GERENTE` (mesmo nível de acesso).
  - `ENCARREGADO` é um novo perfil intermediário: opera contagem,
    movimentação e relatórios, mas não edita cadastro nem gerencia usuários.
  - Como o projeto usa `prisma db push` no build (não migrations manuais),
    isso é aplicado automaticamente no próximo deploy/`npm run build`.
- `types/index.ts`: matriz `PERMISSOES` atualizada para os 4 perfis, com a
  nova permissão `verRelatorios`.
- Propagado para: rotas de API de usuários, `FormularioNovoUsuario`,
  `UsuariosClient`, página de perfil, `scripts/create-user.ts`, `prisma/seed.ts`.

## 7. Cálculos automáticos de valor de estoque
- Novo campo `Produto.custoUnitario` (opcional, não quebra produtos
  existentes que não o possuem).
- `Valor do produto = saldo × custoUnitario`, calculado em tempo real (não
  persistido), usado no Dashboard, em Relatórios e na coluna "Valor" da
  tabela de Produtos.
- Campo editável no formulário de produto; incluído nos exports (Excel/CSV).

## 8. Telas existentes — restilizadas, lógica preservada
Produtos, Histórico, Movimentação, Contagem, Auditoria, Usuários, Perfil,
Login e Relatório de Inventário passaram a usar os novos componentes
(`Card`, `PageHeader`, `Badge`, `DataTable`) e o novo `AppShell`. Os hooks e
chamadas de API (`useProdutos`, `useHistorico`, `useContagem`,
`useEntradaSaida`, `useModoInventario`, `useGestaoUsuarios` etc.) **não
foram alterados**.

## 9. Navegação
- A página inicial (`/`) e o pós-login agora levam ao `/dashboard` (antes
  era `/contagem`), coerente com o pedido de um dashboard executivo como
  centro do sistema. A tela de Contagem continua acessível pela sidebar.

## Para colocar no ar
```bash
npm install                # também roda `prisma generate` (postinstall)
npm run build               # roda `prisma db push` e aplica o novo schema
npm run user:create         # opcional: criar usuário Gerente/Encarregado
npm run dev                 # ambiente local
```
Nenhuma variável de ambiente nova foi adicionada.
