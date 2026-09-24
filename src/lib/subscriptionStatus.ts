import type { SubscriptionStatus } from '@/types/api';

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Trial',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Atrasada',
  CANCELED: 'Cancelada',
};

export const SUBSCRIPTION_STATUS_CLASS: Record<SubscriptionStatus, string> = {
  TRIALING: 'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900',
  ACTIVE: 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900',
  PAST_DUE: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  CANCELED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
};

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];
