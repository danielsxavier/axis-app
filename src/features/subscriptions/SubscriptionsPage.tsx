import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SubscriptionStatusBadge } from '@/components/StatusBadge';
import { Button, Card, Loading, PageHeader, QueryError, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { SUBSCRIPTION_STATUSES, SUBSCRIPTION_STATUS_LABEL } from '@/lib/subscriptionStatus';
import type { PaginatedSubscriptions, SubscriptionStatus } from '@/types/api';
import { useProducts } from '../products/useProducts';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';

const PAGE_SIZE = 20;

export function SubscriptionsPage() {
  const [productSlug, setProductSlug] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const products = useProducts();
  const subscriptions = useQuery({
    queryKey: ['subscriptions', { productSlug, status, page }],
    queryFn: async () =>
      (
        await api.get<PaginatedSubscriptions>('/admin/subscriptions', {
          params: {
            productSlug: productSlug || undefined,
            status: status || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const totalPages = subscriptions.data ? Math.max(1, Math.ceil(subscriptions.data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader title="Assinaturas" description="Todas as assinaturas, de todos os produtos." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          aria-label="Filtrar por produto"
          className="w-auto min-w-44"
          value={productSlug}
          onChange={(e) => {
            setProductSlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os produtos</option>
          {products.data?.map((product) => (
            <option key={product.id} value={product.slug}>
              {product.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por status"
          className="w-auto min-w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriptionStatus | '');
            setPage(1);
          }}
        >
          <option value="">Todos os status</option>
          {SUBSCRIPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SUBSCRIPTION_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        {subscriptions.isLoading && <Loading />}
        {subscriptions.isError && (
          <div className="p-4">
            <QueryError />
          </div>
        )}
        {subscriptions.data && subscriptions.data.items.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma assinatura encontrada.</p>
        )}
        {subscriptions.data && subscriptions.data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Próxima cobrança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {subscriptions.data.items.map((sub) => (
                  <tr
                    key={sub.id}
                    tabIndex={0}
                    onClick={() => setSelectedId(sub.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedId(sub.id)}
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-neutral-800/60 dark:focus:bg-neutral-800/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{sub.customer.name}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">{sub.customer.email}</p>
                    </td>
                    <td className="px-4 py-3">{sub.product.name}</td>
                    <td className="px-4 py-3">
                      {sub.plan.name}
                      <span className="tabular block text-xs text-slate-500 dark:text-neutral-400">
                        {formatCurrency(sub.plan.price)}/mês
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SubscriptionStatusBadge status={sub.status} />
                    </td>
                    <td className="tabular px-4 py-3">{formatDate(sub.nextBillingDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {subscriptions.data && subscriptions.data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-neutral-400">
            Página {page} de {totalPages} · {subscriptions.data.total} assinaturas
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <SubscriptionDetailModal subscriptionId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
