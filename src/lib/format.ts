const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatPercent(fraction: number): string {
  return percent.format(fraction);
}

/**
 * Aceita ISO completo ou "YYYY-MM-DD". Datas sem hora (inclusive vencimentos
 * serializados como meia-noite UTC) são exibidas sem ajuste de fuso.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(value)) {
    value = value.slice(0, 10);
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return new Date(value).toLocaleDateString('pt-BR');
}

/** "2026-10" -> "out/26" */
export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('. de ', '/')
    .replace(' de ', '/');
}

/** Hoje como "YYYY-MM-DD" no fuso local. */
export function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
