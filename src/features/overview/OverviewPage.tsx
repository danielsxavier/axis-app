import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Card, Loading, PageHeader, QueryError } from '@/components/ui';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { productColorVar } from '@/lib/productColors';
import type { ChurnResponse, ForecastResponse, MrrResponse } from '@/types/api';
import { ForecastChart } from './ForecastChart';

export function OverviewPage() {
  const mrr = useQuery({
    queryKey: ['metrics', 'mrr'],
    queryFn: async () => (await api.get<MrrResponse>('/admin/metrics/mrr')).data,
  });
  const forecast = useQuery({
    queryKey: ['metrics', 'forecast'],
    queryFn: async () => (await api.get<ForecastResponse>('/admin/metrics/forecast')).data,
  });
  // Sem from/to, a API usa o mês atual.
  const churn = useQuery({
    queryKey: ['metrics', 'churn', 'current-month'],
    queryFn: async () => (await api.get<ChurnResponse>('/admin/metrics/churn')).data,
  });

  // Índice de cor fixo por produto (ordem de cadastro, vinda do /mrr).
  const productIndexBySlug = useMemo(
    () => new Map((mrr.data?.byProduct ?? []).map((p, i) => [p.productSlug, i])),
    [mrr.data],
  );

  return (
    <>
      <PageHeader title="Visão Geral" description="Receita recorrente, previsão e churn." />

      {mrr.isError && <QueryError />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">MRR total</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {mrr.data ? formatCurrency(mrr.data.total) : '—'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {mrr.data ? `${mrr.data.activeSubscriptions} assinatura(s) ativa(s)` : ' '}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Churn do mês</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {churn.data ? formatPercent(churn.data.churnRate) : '—'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {churn.data
              ? `${churn.data.canceledCount} cancelada(s) de ${churn.data.activeAtStart} no início do mês`
              : churn.isError
                ? 'Erro ao carregar'
                : ' '}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Projeção em 3 meses</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {forecast.data?.months.length
              ? formatCurrency(forecast.data.months[forecast.data.months.length - 1].projectedMrr)
              : '—'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">se os trials atuais converterem</p>
        </Card>
      </div>

      {mrr.data && mrr.data.byProduct.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-neutral-400">MRR por produto</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mrr.data.byProduct.map((product, index) => (
              <Card key={product.productId} className="p-4">
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: productColorVar(index) }}
                  />
                  {product.productName}
                </p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(product.mrr)}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {product.activeSubscriptions} ativa(s)
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card className="mt-6">
        <h2 className="text-base font-semibold">Previsão de receita</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-neutral-400">
          MRR atual mantido + trials convertendo no mês em que terminam (estimativa otimista).
        </p>
        {forecast.isLoading && <Loading />}
        {forecast.isError && <QueryError />}
        {forecast.data && <ForecastChart forecast={forecast.data} productIndexBySlug={productIndexBySlug} />}
      </Card>
    </>
  );
}
