export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';

export interface Admin {
  id: string;
  email: string;
  name: string | null;
}

export interface LoginResponse {
  accessToken: string;
  admin: Admin;
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  price: number;
  billingInterval: 'MONTHLY' | 'ANNUAL' | 'WEEKLY';
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  webhookUrl: string;
  createdAt: string;
  plans: Plan[];
}

export interface ProductMrr {
  productId: string;
  productSlug: string;
  productName: string;
  mrr: number;
  activeSubscriptions: number;
}

export interface MrrResponse {
  total: number;
  activeSubscriptions: number;
  byProduct: ProductMrr[];
}

export interface ForecastMonth {
  month: string;
  baseMrr: number;
  newFromTrials: number;
  projectedMrr: number;
  byProduct: { productSlug: string; baseMrr: number; newFromTrials: number; projectedMrr: number }[];
}

export interface ForecastResponse {
  currentMrr: number;
  months: ForecastMonth[];
  products: { slug: string; name: string }[];
}

export interface ChurnResponse {
  from: string;
  to: string;
  canceledCount: number;
  activeAtStart: number;
  churnRate: number;
}

export interface ReceivableItem {
  id: string;
  asaasPaymentId: string;
  status: 'PENDING' | 'OVERDUE';
  value: number;
  dueDate: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  productSlug: string;
  productName: string;
}

export interface AccountsReceivableResponse {
  total: number;
  pendingTotal: number;
  overdueTotal: number;
  count: number;
  items: ReceivableItem[];
}

export interface AdminSubscription {
  id: string;
  status: SubscriptionStatus;
  customer: { id: string; name: string; email: string; externalRef: string };
  product: { id: string; slug: string; name: string };
  plan: { id: string; name: string; price: number };
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  nextBillingDate: string | null;
  asaasSubscriptionId: string | null;
  createdAt: string;
}

export interface PaginatedSubscriptions {
  items: AdminSubscription[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubscriptionPayment {
  id: string;
  asaasPaymentId: string;
  status: PaymentStatus;
  value: number;
  dueDate: string;
  paidAt: string | null;
}

export interface DiscountGrant {
  id: string;
  percentageOff: number;
  appliedUntil: string;
  createdAt: string;
}

export interface AdminSubscriptionDetail extends AdminSubscription {
  payments: SubscriptionPayment[];
  discountGrants: DiscountGrant[];
}
