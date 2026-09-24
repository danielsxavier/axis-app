# Prompts — Dashboard da Axis (axis-app)

Stack: **React + Vite + TypeScript + Tailwind CSS + TanStack Query + Recharts**. Uso pessoal seu
— não é multi-usuário, não precisa de landing page nem cadastro público.

---

## Prompt 1 — Scaffold e autenticação

```
Crie um novo projeto "axis-app" com Vite + React + TypeScript + Tailwind CSS. Configure:

1. React Router com rotas: "/login" e "/dashboard/*" (protegida).
2. TanStack Query configurado.
3. Client HTTP (Axios) apontando para VITE_API_BASE_URL (a URL do axis-api), com interceptor
   de Bearer token lido de uma store simples (pode ser Zustand ou até Context, já que é uma
   aplicação pequena de uso único).
4. Tela de login simples (email + senha), consumindo POST /auth/login do axis-api.
5. <ProtectedRoute> redirecionando pra /login se não autenticado.
6. Layout do dashboard com sidebar: Visão Geral, Assinaturas, Contas a Receber, Produtos e
   Planos.
```

---

## Prompt 2 — Visão Geral (MRR, forecast, churn)

```
Implemente a rota "/dashboard" (visão geral), consumindo GET /admin/metrics/mrr,
GET /admin/metrics/forecast e GET /admin/metrics/churn do axis-api:

1. Cards de KPI no topo: MRR total, MRR por produto (um mini-card por produto, ex: "Menupi:
   R$ X"), taxa de churn do mês atual.
2. Gráfico de linha (Recharts) mostrando a previsão de receita dos próximos 3 meses
   (GET /admin/metrics/forecast), com uma linha para o MRR atual e o crescimento projetado
   conforme trials convertem.
3. Se você tiver mais de um produto cadastrado, use cores diferentes por produto nos gráficos
   para diferenciar visualmente a contribuição de cada um no MRR total.
```

---

## Prompt 3 — Lista de Assinaturas

```
Implemente a rota "/dashboard/assinaturas", consumindo GET /admin/subscriptions:

1. Tabela com filtros por produto e por status (Trial, Ativa, Atrasada, Cancelada), mostrando
   cliente, produto, plano, status (badge colorido), data da próxima cobrança.
2. Ao clicar em uma assinatura, abrir um painel/modal de detalhe com histórico de pagamentos
   dessa assinatura (se o axis-api já expuser isso — caso não exponha ainda, adicione um
   TODO e use os dados já disponíveis na listagem).
3. Botões de ação na assinatura, quando aplicável:
   - Se status = Trial: botão "Estender trial" abrindo um formulário simples de nova data,
     chamando POST /admin/subscriptions/:id/extend-trial.
   - Qualquer status: botão "Conceder desconto" abrindo formulário (% de desconto, duração em
     meses), chamando POST /admin/subscriptions/:id/grant-discount.
```

---

## Prompt 4 — Contas a Receber

```
Implemente a rota "/dashboard/contas-a-receber", consumindo GET /admin/metrics/accounts-
receivable:

1. Lista de pagamentos pendentes/atrasados, ordenados por data de vencimento (os atrasados
   primeiro, destacados em vermelho).
2. Total somado no topo.
3. Filtro por produto.
```

---

## Prompt 5 — Produtos e Planos

```
Implemente a rota "/dashboard/produtos", consumindo os endpoints de products/plans do
axis-api:

1. Lista de produtos cadastrados, cada um mostrando seus planos.
2. Formulário simples para criar um novo produto (nome, slug, URL de webhook) e novo plano
   dentro de um produto (nome, preço).

Esta tela é usada raramente (só quando você lançar um novo SaaS ou mudar de preço), pode ser bem
simples/funcional, sem necessidade de capricho visual.
```
