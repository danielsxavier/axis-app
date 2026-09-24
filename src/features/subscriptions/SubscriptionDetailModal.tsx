import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PaymentStatusBadge, SubscriptionStatusBadge } from '@/components/StatusBadge';
import { Button, ErrorText, Field, Input, Loading, Modal, QueryError } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, todayKey } from '@/lib/format';
import type { AdminSubscriptionDetail } from '@/types/api';

type Action = 'extend-trial' | 'grant-discount' | null;

export function SubscriptionDetailModal({
  subscriptionId,
  onClose,
}: {
  subscriptionId: string | null;
  onClose: () => void;
}) {
  const [action, setAction] = useState<Action>(null);
  const detail = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async () => (await api.get<AdminSubscriptionDetail>(`/admin/subscriptions/${subscriptionId}`)).data,
    enabled: !!subscriptionId,
  });

  const close = () => {
    setAction(null);
    onClose();
  };

  const sub = detail.data;

  return (
    <Modal open={!!subscriptionId} title={sub ? sub.customer.name : 'Assinatura'} onClose={close} wide>
      {detail.isLoading && <Loading />}
      {detail.isError && <QueryError />}
      {sub && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Info label="Status">
              <SubscriptionStatusBadge status={sub.status} />
            </Info>
            <Info label="Produto">{sub.product.name}</Info>
            <Info label="Plano">
              {sub.plan.name} · {formatCurrency(sub.plan.price)}/mês
            </Info>
            <Info label="E-mail">{sub.customer.email}</Info>
            <Info label="Ref. no produto">
              <span className="break-all font-mono text-xs">{sub.customer.externalRef}</span>
            </Info>
            <Info label="Próxima cobrança">{formatDate(sub.nextBillingDate)}</Info>
            <Info label="Fim do trial">{formatDate(sub.trialEndsAt)}</Info>
            <Info label="Período atual até">{formatDate(sub.currentPeriodEnd)}</Info>
            {sub.canceledAt && <Info label="Cancelada em">{formatDate(sub.canceledAt)}</Info>}
          </dl>

          {sub.status !== 'CANCELED' && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-neutral-800">
              {sub.status === 'TRIALING' && (
                <Button
                  variant={action === 'extend-trial' ? 'primary' : 'secondary'}
                  onClick={() => setAction(action === 'extend-trial' ? null : 'extend-trial')}
                >
                  Estender trial
                </Button>
              )}
              <Button
                variant={action === 'grant-discount' ? 'primary' : 'secondary'}
                onClick={() => setAction(action === 'grant-discount' ? null : 'grant-discount')}
              >
                Conceder desconto
              </Button>
            </div>
          )}

          {action === 'extend-trial' && (
            <ExtendTrialForm subscription={sub} onDone={() => setAction(null)} />
          )}
          {action === 'grant-discount' && (
            <GrantDiscountForm subscription={sub} onDone={() => setAction(null)} />
          )}

          {sub.discountGrants.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Descontos concedidos</h3>
              <ul className="space-y-1 text-sm">
                {sub.discountGrants.map((grant) => (
                  <li key={grant.id} className="text-slate-600 dark:text-neutral-300">
                    {grant.percentageOff}% até {formatDate(grant.appliedUntil)}{' '}
                    <span className="text-slate-400">(concedido em {formatDate(grant.createdAt)})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold">Histórico de pagamentos</h3>
            {sub.payments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">Nenhuma cobrança gerada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tabular w-full min-w-[480px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500 dark:text-neutral-400">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Vencimento</th>
                      <th className="py-2 pr-4 font-medium">Valor</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Pago em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {sub.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-2 pr-4">{formatDate(payment.dueDate)}</td>
                        <td className="py-2 pr-4">{formatCurrency(payment.value)}</td>
                        <td className="py-2 pr-4">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="py-2">{formatDate(payment.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-neutral-400">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function useInvalidateSubscription(id: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  };
}

function ExtendTrialForm({ subscription, onDone }: { subscription: AdminSubscriptionDetail; onDone: () => void }) {
  const [date, setDate] = useState(subscription.trialEndsAt?.slice(0, 10) ?? todayKey());
  const invalidate = useInvalidateSubscription(subscription.id);
  const mutation = useMutation({
    // Fim do dia escolhido, no fuso local.
    mutationFn: () =>
      api.post(`/admin/subscriptions/${subscription.id}/extend-trial`, {
        newTrialEndsAt: new Date(`${date}T23:59:59`).toISOString(),
      }),
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
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-neutral-800/50">
      <Field label="Nova data de fim do trial" htmlFor="newTrialEndsAt">
        <Input
          id="newTrialEndsAt"
          type="date"
          required
          min={todayKey()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-48"
        />
      </Field>
      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível estender o trial.')}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function GrantDiscountForm({ subscription, onDone }: { subscription: AdminSubscriptionDetail; onDone: () => void }) {
  const [percentageOff, setPercentageOff] = useState('20');
  const [durationMonths, setDurationMonths] = useState('3');
  const invalidate = useInvalidateSubscription(subscription.id);
  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/subscriptions/${subscription.id}/grant-discount`, {
        percentageOff: Number(percentageOff),
        durationMonths: Number(durationMonths),
      }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  const alreadyBilling = subscription.status !== 'TRIALING';

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-neutral-800/50">
      <div className="flex flex-wrap gap-4">
        <Field label="Desconto (%)" htmlFor="percentageOff">
          <Input
            id="percentageOff"
            type="number"
            min={1}
            max={100}
            step={1}
            required
            value={percentageOff}
            onChange={(e) => setPercentageOff(e.target.value)}
            className="w-28"
          />
        </Field>
        <Field label="Duração (meses)" htmlFor="durationMonths">
          <Input
            id="durationMonths"
            type="number"
            min={1}
            max={36}
            step={1}
            required
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="w-28"
          />
        </Field>
      </div>
      <p className="text-xs text-slate-500 dark:text-neutral-400">
        {alreadyBilling
          ? 'Atenção: esta assinatura já está sendo cobrada na Asaas; por enquanto o desconto fica só registrado.'
          : 'O desconto é aplicado quando o trial terminar e a cobrança for criada na Asaas.'}
      </p>
      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível conceder o desconto.')}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Conceder'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
