import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatCurrency, formatMonth } from '@/lib/format';
import { productColorVar } from '@/lib/productColors';
import type { ForecastResponse } from '@/types/api';

interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

const CURRENT_KEY = '__current';
const PROJECTED_KEY = '__projected';

/**
 * Previsão dos próximos meses. Um produto: linha "Projetado" vs. linha "MRR atual".
 * Vários produtos: áreas empilhadas por produto (cor fixa do produto) + linha "MRR atual".
 */
export function ForecastChart({
  forecast,
  productIndexBySlug,
}: {
  forecast: ForecastResponse;
  productIndexBySlug: Map<string, number>;
}) {
  const multiProduct = forecast.products.length > 1;

  const rows = forecast.months.map((month) => {
    const row: Record<string, number | string> = {
      month: formatMonth(month.month),
      [CURRENT_KEY]: forecast.currentMrr,
      [PROJECTED_KEY]: month.projectedMrr,
    };
    for (const product of month.byProduct) row[product.productSlug] = product.projectedMrr;
    return row;
  });

  const productSeries: SeriesDef[] = forecast.products.map((product) => ({
    key: product.slug,
    label: product.name,
    color: productColorVar(productIndexBySlug.get(product.slug) ?? 0),
  }));
  const currentSeries: SeriesDef = { key: CURRENT_KEY, label: 'MRR atual', color: 'var(--chart-muted)' };
  const projectedSeries: SeriesDef = { key: PROJECTED_KEY, label: 'Projetado', color: 'var(--series-1)' };
  const legend = multiProduct ? [...productSeries, currentSeries] : [projectedSeries, currentSeries];

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-neutral-300" aria-label="Legenda">
        {legend.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: series.color, height: 3 }} />
            {series.label}
          </li>
        ))}
      </ul>

      <div className="h-72 rounded-lg" style={{ background: 'var(--chart-surface)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 16, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
              padding={{ left: 24, right: 24 }}
            />
            <YAxis
              width={84}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
              tickFormatter={(value: number) => formatCurrency(value).replace(/,00$/, '')}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={<ForecastTooltip series={legend} />}
              cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
            />
            {multiProduct &&
              productSeries.map((series) => (
                <Area
                  key={series.key}
                  type="linear"
                  dataKey={series.key}
                  stackId="products"
                  fill={series.color}
                  fillOpacity={0.85}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            {!multiProduct && (
              <Line
                type="linear"
                dataKey={PROJECTED_KEY}
                stroke={projectedSeries.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: projectedSeries.color, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
            <Line
              type="linear"
              dataKey={CURRENT_KEY}
              stroke={currentSeries.color}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200">
          Ver tabela
        </summary>
        <table className="tabular mt-2 w-full text-left">
          <thead className="text-xs uppercase text-slate-500 dark:text-neutral-400">
            <tr>
              <th className="py-1 pr-4 font-medium">Mês</th>
              <th className="py-1 pr-4 font-medium">MRR atual</th>
              <th className="py-1 pr-4 font-medium">Novos (trials)</th>
              <th className="py-1 font-medium">Projetado</th>
            </tr>
          </thead>
          <tbody>
            {forecast.months.map((month) => (
              <tr key={month.month} className="border-t border-slate-100 dark:border-neutral-800">
                <td className="py-1 pr-4">{formatMonth(month.month)}</td>
                <td className="py-1 pr-4">{formatCurrency(month.baseMrr)}</td>
                <td className="py-1 pr-4">{formatCurrency(month.newFromTrials)}</td>
                <td className="py-1 font-medium">{formatCurrency(month.projectedMrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function ForecastTooltip({ active, payload, label, series }: TooltipProps<number, string> & { series: SeriesDef[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Record<string, number>;
  const total = row[PROJECTED_KEY];

  return (
    <div className="min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-1 font-medium">{label}</p>
      <ul className="space-y-0.5">
        {series.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="tabular">{formatCurrency(row[s.key] ?? 0)}</span>
          </li>
        ))}
      </ul>
      {series.length > 2 && (
        <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-medium dark:border-neutral-800">
          <span>Total projetado</span>
          <span className="tabular">{formatCurrency(total)}</span>
        </p>
      )}
    </div>
  );
}
