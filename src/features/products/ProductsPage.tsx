import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button, Card, ErrorText, Field, Input, Loading, PageHeader, QueryError } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
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

function PlanRow({ plan }: { plan: Plan }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => api.patch(`/products/${plan.productId}/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <div>
        <span className="font-medium">{plan.name}</span>{' '}
        <span className="tabular text-slate-600 dark:text-neutral-300">{formatCurrency(plan.price)}/mês</span>
        {!plan.isActive && (
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
            inativo
          </span>
        )}
        <p className="font-mono text-xs text-slate-400">{plan.id}</p>
      </div>
      <Button variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
        {plan.isActive ? 'Desativar' : 'Ativar'}
      </Button>
    </li>
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
      api.post(`/products/${productId}/plans`, { name, price: Number(price.replace(',', '.')) }),
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
            pattern="\d+([.,]\d{1,2})?"
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
