import clsx from 'clsx';
import type { ReactNode } from 'react';
import { formatCurrency } from '@/lib/format';

/**
 * Preço mensal. Com desconto (effectivePrice ≠ price), mostra o valor efetivo em
 * destaque e o cheio riscado ao lado; `note` aparece depois (ex: validade).
 */
export function Price({
  price,
  effectivePrice = price,
  note,
  className,
}: {
  price: number;
  effectivePrice?: number;
  note?: ReactNode;
  className?: string;
}) {
  if (effectivePrice === price) {
    return <span className={clsx('tabular', className)}>{formatCurrency(price)}/mês</span>;
  }
  return (
    <span className={clsx('tabular', className)}>
      <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(effectivePrice)}/mês</span>{' '}
      <span className="text-slate-500 dark:text-neutral-400">
        de <s>{formatCurrency(price)}</s>
      </span>
      {note && (
        <>
          {' '}
          <span className="text-xs text-slate-500 dark:text-neutral-400">{note}</span>
        </>
      )}
    </span>
  );
}
