import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { PaymentStatusBadge } from '@/components/StatusBadge';
import { Card, Loading, PageHeader, QueryError, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { AccountsReceivableResponse } from '@/types/api';
import { useProducts } from '../products/useProducts';

export function ReceivablesPage() {
  const [productSlug, setProductSlug] = useState('');
  const products = useProducts();
  const receivables = useQuery({
    queryKey: ['metrics', 'accounts-receivable', productSlug],
    queryFn: async () =>
      (
        await api.get<AccountsReceivableResponse>('/admin/metrics/accounts-receivable', {
          params: { productSlug: productSlug || undefined },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  // Atrasados primeiro; dentro de cada grupo, por vencimento (a API já ordena por dueDate).
  const items = useMemo(() => {
    const list = receivables.data?.items ?? [];
    return [...list.filter((i) => i.status === 'OVERDUE'), ...list.filter((i) => i.status !== 'OVERDUE')];
  }, [receivables.data]);

  const data = receivables.data;

  return (
    <>
      <PageHeader
        title="Contas a Receber"
        description="Cobranças pendentes e atrasadas."
        actions={
          <Select
            aria-label="Filtrar por produto"
            className="w-auto min-w-44"
            value={productSlug}
            onChange={(e) => setProductSlug(e.target.value)}
          >
            <option value="">Todos os produtos</option>
            {products.data?.map((product) => (
              <option key={product.id} value={product.slug}>
                {product.name}
              </option>
            ))}
          </Select>
        }
      />

      {receivables.isError && <QueryError />}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Total a receber</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{data ? formatCurrency(data.total) : '—'}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{data ? `${data.count} cobrança(s)` : ' '}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Pendente</p>
          <p className="mt-2 text-2xl font-semibold">{data ? formatCurrency(data.pendingTotal) : '—'}</p>
        </Card>
        <Card className={clsx(data && data.overdueTotal > 0 && 'border-red-200 dark:border-red-900')}>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Atrasado</p>
          <p
            className={clsx(
              'mt-2 text-2xl font-semibold',
              data && data.overdueTotal > 0 && 'text-red-700 dark:text-red-400',
            )}
          >
            {data ? formatCurrency(data.overdueTotal) : '—'}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        {receivables.isLoading && <Loading />}
        {data && items.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nada a receber no momento.</p>
        )}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {items.map((item) => {
                  const overdue = item.status === 'OVERDUE';
                  return (
                    <tr key={item.id} className={clsx(overdue && 'bg-red-50/70 dark:bg-red-950/30')}>
                      <td className={clsx('tabular px-4 py-3', overdue && 'font-medium text-red-700 dark:text-red-400')}>
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="px-4 py-3">{item.customerName}</td>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={item.status} />
                      </td>
                      <td className="tabular px-4 py-3 text-right font-medium">{formatCurrency(item.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
