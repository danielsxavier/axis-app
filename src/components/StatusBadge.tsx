import clsx from 'clsx';
import { SUBSCRIPTION_STATUS_CLASS, SUBSCRIPTION_STATUS_LABEL } from '@/lib/subscriptionStatus';
import type { PaymentStatus, SubscriptionStatus } from '@/types/api';

const badgeBase = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={clsx(badgeBase, SUBSCRIPTION_STATUS_CLASS[status])}>{SUBSCRIPTION_STATUS_LABEL[status]}</span>;
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Pago',
  OVERDUE: 'Atrasado',
  REFUNDED: 'Estornado',
};

const PAYMENT_CLASS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900',
  CONFIRMED: 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900',
  OVERDUE: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  REFUNDED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={clsx(badgeBase, PAYMENT_CLASS[status])}>{PAYMENT_LABEL[status]}</span>;
}
