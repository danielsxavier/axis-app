import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button, Card, ErrorText, Field, Input, Loading, PageHeader, QueryError } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, todayKey } from '@/lib/format';
import type { Plan, Product } from '@/types/api';
import { useProducts } from './useProducts';

export function ProductsPage() {
  const products = useProducts();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Produtos e Planos"
        description="Produtos SaaS geridos pela Axis e seus planos."
        actions={
          !creating && <Button onClick={() => setCreating(true)}>Novo produto</Button>
        }
      />

      {creating && <NewProductForm onDone={() => setCreating(false)} />}

      {products.isLoading && <Loading />}
      {products.isError && <QueryError />}
      {products.data?.length === 0 && !creating && (
        <Card>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Nenhum produto cadastrado ainda.</p>
        </Card>
      )}

      <div className="space-y-4">
        {products.data?.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [addingPlan, setAddingPlan] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {product.name} <span className="font-mono text-sm font-normal text-slate-500">{product.slug}</span>
          </h2>
          <p className="break-all text-xs text-slate-500 dark:text-neutral-400">Webhook: {product.webhookUrl}</p>
          <p className="break-all text-xs text-slate-500 dark:text-neutral-400">ID: {product.id}</p>
        </div>
        {!addingPlan && (
          <Button variant="secondary" onClick={() => setAddingPlan(true)}>
            Novo plano
          </Button>
        )}
      </div>

      <div className="mt-4">
        {product.plans.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-neutral-400">Nenhum plano.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {product.plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </ul>
        )}
      </div>

      {addingPlan && <NewPlanForm productId={product.id} onDone={() => setAddingPlan(false)} />}
    </Card>
  );
}

const MONEY_PATTERN = '\\d+([.,]\\d{1,2})?';

/** "49,90" ou "49.90" -> 49.9 */
function parseMoney(value: string): number {
  return Number(value.replace(',', '.'));
}

/** 49.9 -> "49,90" (valor inicial dos campos de preço) */
function toMoneyInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/** "YYYY-MM-DD" (data local) de um ISO. */
function toDateKey(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Válido até 30/09": o desconto vale até o fim do dia escolhido, no fuso local. */
function endOfDayIso(dateKey: string): string {
  return new Date(`${dateKey}T23:59:59.999`).toISOString();
}

type PlanAction = 'edit-price' | 'promotion' | 'remove-promotion' | null;

function PlanRow({ plan }: { plan: Plan }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<PlanAction>(null);
  const toggle = useMutation({
    mutationFn: () => api.patch(`/products/${plan.productId}/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
  const switchTo = (next: PlanAction) => setAction(action === next ? null : next);

  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-medium">{plan.name}</span>
          {!plan.isActive && (
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
              inativo
            </span>
          )}
          <PlanPrice plan={plan} />
          <p className="font-mono text-xs text-slate-400">{plan.id}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" onClick={() => switchTo('edit-price')}>
            Editar preço
          </Button>
          <Button variant="ghost" onClick={() => switchTo('promotion')}>
            {plan.hasActivePromotion ? 'Editar desconto' : 'Aplicar desconto'}
          </Button>
          {plan.hasActivePromotion && (
            <Button variant="ghost" onClick={() => switchTo('remove-promotion')}>
              Remover desconto agora
            </Button>
          )}
          <Button variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
            {plan.isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </div>

      {action === 'edit-price' && <EditPriceForm plan={plan} onDone={() => setAction(null)} />}
      {action === 'promotion' && <PromotionForm plan={plan} onDone={() => setAction(null)} />}
      {action === 'remove-promotion' && <RemovePromotionConfirm plan={plan} onDone={() => setAction(null)} />}
    </li>
  );
}

function PlanPrice({ plan }: { plan: Plan }) {
  if (!plan.hasActivePromotion || plan.promotionalPrice === null) {
    return <p className="tabular mt-0.5 text-slate-600 dark:text-neutral-300">{formatCurrency(plan.price)}/mês</p>;
  }
  return (
    <p className="tabular mt-0.5">
      <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(plan.effectivePrice)}/mês</span>{' '}
      <span className="text-slate-500 dark:text-neutral-400">
        de <s>{formatCurrency(plan.price)}</s>
      </span>{' '}
      <span className="text-xs text-slate-500 dark:text-neutral-400">
        Válido até {formatDate(plan.promotionalPriceExpiresAt)}
      </span>
    </p>
  );
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  };
}

const inlineFormClass = 'mt-3 space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-neutral-800/50';

function EditPriceForm({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const invalidate = useInvalidateProducts();
  const [price, setPrice] = useState(toMoneyInput(plan.price));
  const mutation = useMutation({
    mutationFn: () => api.patch(`/products/${plan.productId}/plans/${plan.id}`, { price: parseMoney(price) }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className={inlineFormClass}>
      <Field label="Novo preço mensal (R$)" htmlFor={`edit-price-${plan.id}`}>
        <Input
          id={`edit-price-${plan.id}`}
          required
          autoFocus
          inputMode="decimal"
          pattern={MONEY_PATTERN}
          title="Ex: 49,90"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-36"
        />
      </Field>
      <p className="text-xs text-slate-500 dark:text-neutral-400">
        Vale na hora para os trials que converterem daqui em diante. Assinaturas já ativas não mudam.
      </p>
      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível salvar o preço.')}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar preço'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PromotionForm({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const invalidate = useInvalidateProducts();
  const editing = plan.hasActivePromotion && plan.promotionalPrice !== null && plan.promotionalPriceExpiresAt !== null;
  const [promotionalPrice, setPromotionalPrice] = useState(editing ? toMoneyInput(plan.promotionalPrice!) : '');
  const [expiresOn, setExpiresOn] = useState(editing ? toDateKey(plan.promotionalPriceExpiresAt!) : '');

  const value = parseMoney(promotionalPrice);
  const validValue = new RegExp(`^${MONEY_PATTERN}$`).test(promotionalPrice) && value > 0;
  const notADiscount = validValue && value >= plan.price;

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/products/${plan.productId}/plans/${plan.id}/promotion`, {
        promotionalPrice: value,
        promotionalPriceExpiresAt: endOfDayIso(expiresOn),
      }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (notADiscount) return;
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className={inlineFormClass}>
      <div className="flex flex-wrap gap-4">
        <Field label="Preço promocional (R$)" htmlFor={`promo-price-${plan.id}`}>
          <Input
            id={`promo-price-${plan.id}`}
            required
            autoFocus
            inputMode="decimal"
            pattern={MONEY_PATTERN}
            title="Ex: 29,90"
            placeholder="29,90"
            value={promotionalPrice}
            onChange={(e) => setPromotionalPrice(e.target.value)}
            className="w-36"
          />
        </Field>
        <Field label="Válido até" htmlFor={`promo-expires-${plan.id}`}>
          <Input
            id={`promo-expires-${plan.id}`}
            type="date"
            required
            min={todayKey()}
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            className="w-44"
          />
        </Field>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-xs text-slate-500 dark:text-neutral-400">Como vai aparecer:</p>
        <p className="mt-0.5 font-medium">
          De {formatCurrency(plan.price)} por {validValue ? formatCurrency(value) : 'R$ —'}
          {' — '}oferta válida até {expiresOn ? formatDate(expiresOn) : '—'}
        </p>
      </div>

      <p className="text-xs text-slate-500 dark:text-neutral-400">
        Vale para os trials que converterem até o fim do dia escolhido; depois volta sozinho ao preço normal.
        Assinaturas já ativas não mudam.
      </p>
      <ErrorText>
        {notADiscount
          ? `O preço promocional deve ser menor que ${formatCurrency(plan.price)}.`
          : mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível salvar o desconto.')}
      </ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending || notADiscount}>
          {mutation.isPending ? 'Salvando...' : editing ? 'Salvar desconto' : 'Aplicar desconto'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function RemovePromotionConfirm({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const invalidate = useInvalidateProducts();
  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/products/${plan.productId}/plans/${plan.id}/promotion`, {
        promotionalPrice: null,
        promotionalPriceExpiresAt: null,
      }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
  });

  return (
    <div className={inlineFormClass}>
      <p>
        Remover o desconto agora? O plano volta a custar <strong>{formatCurrency(plan.price)}/mês</strong> para os
        próximos trials convertidos.
      </p>
      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível remover o desconto.')}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Removendo...' : 'Sim, remover desconto'}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function NewProductForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const mutation = useMutation({
    mutationFn: () => api.post('/products', { name, slug, webhookUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-base font-semibold">Novo produto</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="product-name">
            <Input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Menupi" />
          </Field>
          <Field label="Slug" htmlFor="product-slug">
            <Input
              id="product-slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Letras minúsculas, números e hífens"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="menupi"
            />
          </Field>
        </div>
        <Field label="URL de webhook" htmlFor="product-webhook">
          <Input
            id="product-webhook"
            type="url"
            required
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://api-painel.menupi.com.br/internal/subscription-status"
          />
        </Field>
        <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível criar o produto.')}</ErrorText>
        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Criar produto'}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NewPlanForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/products/${productId}/plans`, { name, price: parseMoney(price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-neutral-800/50">
      <div className="flex flex-wrap gap-3">
        <Field label="Nome do plano" htmlFor={`plan-name-${productId}`}>
          <Input
            id={`plan-name-${productId}`}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Menupi Básico"
          />
        </Field>
        <Field label="Preço mensal (R$)" htmlFor={`plan-price-${productId}`}>
          <Input
            id={`plan-price-${productId}`}
            required
            inputMode="decimal"
            pattern={MONEY_PATTERN}
            title="Ex: 49,90"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="49,00"
            className="w-36"
          />
        </Field>
      </div>
      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível criar o plano.')}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Criar plano'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
