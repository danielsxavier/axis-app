# axis-app

Painel de uso pessoal da Axis. Vite + React 18 + TypeScript + Tailwind + TanStack Query + Recharts.

```bash
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3010
npm install
npm run dev            # http://localhost:5175
```

Rotas: `/login` e `/dashboard/*` (protegida):

- `/dashboard` — MRR total e por produto, churn do mês, previsão de 3 meses
- `/dashboard/assinaturas` — lista com filtros; detalhe com pagamentos, estender trial, conceder desconto
- `/dashboard/contas-a-receber` — pendentes/atrasados (atrasados primeiro, em vermelho), total e filtro por produto
- `/dashboard/produtos` — produtos, planos e cadastro

O token JWT fica no `localStorage` (`axis-auth`); um 401 da API faz logout automático.

(test de build)
