import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, ErrorText, Field, Input, Loading, PageHeader, QueryError } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import type { MonitoredService } from '@/types/api';

const POLL_INTERVAL_MS = 10_000;
const LIST_KEY = ['monitored-services'];
const STATUS_KEY = ['monitored-services', 'status'];

export function MonitoringPage() {
  const queryClient = useQueryClient();

  // Leitura rápida do último resultado persistido: a tela já mostra algo antes da 1ª verificação.
  const list = useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => (await api.get<MonitoredService[]>('/admin/monitored-services')).data,
  });

  // Verificação de verdade. Só existe polling enquanto esta tela está montada: ao sair,
  // a query fica sem observers e o React Query para o refetchInterval sozinho.
  const status = useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => {
      const data = (await api.get<MonitoredService[]>('/admin/monitored-services/status')).data;
      queryClient.setQueryData(LIST_KEY, data);
      return data;
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 0,
  });

  const now = useNow(1_000);
  const services = list.data;

  return (
    <>
      <PageHeader
        title="Monitoramento"
        description="Health checks dos serviços cadastrados. Verificados a cada 10s enquanto esta tela está aberta."
        actions={
          <span className="text-xs text-slate-500 dark:text-neutral-400" aria-live="polite">
            {status.isFetching ? 'Verificando...' : status.isError ? 'Falha ao verificar' : ''}
          </span>
        }
      />

      <CreateServiceForm />

      <div className="mt-6">
        {list.isLoading && <Loading />}
        {list.isError && <QueryError />}
        {services && services.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-neutral-400">
            Nenhum serviço cadastrado ainda.
          </p>
        )}
        {services && services.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} now={now} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Relógio local só para re-renderizar o "há Xs" (não faz requisições). */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function formatAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  return `há ${Math.floor(minutes / 60)}h`;
}

function formatSeconds(ms: number): string {
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1).replace('.', ',')}s`;
}

function downReason(service: MonitoredService): string | null {
  if (service.lastHttpStatus !== null) return `Respondeu ${service.lastHttpStatus} (esperado ${service.expectedStatus})`;
  if (service.lastError === 'TIMEOUT') return `Timeout após ${formatSeconds(service.timeoutMs)}`;
  if (service.lastError) return `Sem resposta: ${service.lastError}`;
  return null;
}

type Indicator = { label: string; dot: string; text: string };

function indicatorFor(service: MonitoredService): Indicator {
  if (!service.isActive) {
    return { label: 'Pausado', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-neutral-400' };
  }
  if (service.lastStatus === 'UP') {
    return { label: 'Online', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400' };
  }
  if (service.lastStatus === 'DOWN') {
    return { label: 'Offline', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' };
  }
  return {
    label: 'Aguardando primeira verificação',
    dot: 'bg-slate-300 dark:bg-neutral-600',
    text: 'text-slate-500 dark:text-neutral-400',
  };
}

function useServiceMutations() {
  const queryClient = useQueryClient();
  return (update: (services: MonitoredService[]) => MonitoredService[]) => {
    queryClient.setQueryData<MonitoredService[]>(LIST_KEY, (current) => update(current ?? []));
    // Verifica de novo já, sem esperar o próximo ciclo de 10s.
    queryClient.invalidateQueries({ queryKey: STATUS_KEY, exact: true });
  };
}

function ServiceCard({ service, now }: { service: MonitoredService; now: number }) {
  const applyChange = useServiceMutations();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const indicator = indicatorFor(service);
  const isDown = service.isActive && service.lastStatus === 'DOWN';
  const reason = isDown ? downReason(service) : null;

  const toggle = useMutation({
    mutationFn: async () =>
      (await api.patch<MonitoredService>(`/admin/monitored-services/${service.id}`, { isActive: !service.isActive }))
        .data,
    onSuccess: (updated) => applyChange((all) => all.map((s) => (s.id === updated.id ? updated : s))),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/monitored-services/${service.id}`),
    onSuccess: () => applyChange((all) => all.filter((s) => s.id !== service.id)),
  });

  const error = toggle.error ?? remove.error;

  return (
    <Card
      className={clsx(
        'flex flex-col gap-4',
        isDown && 'border-2 border-red-500 dark:border-red-500',
        !service.isActive && 'opacity-70',
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate font-semibold" title={service.name}>
          {service.name}
        </h2>
        <p className="truncate font-mono text-xs text-slate-500 dark:text-neutral-400" title={service.url}>
          {service.url}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className={clsx('h-4 w-4 shrink-0 rounded-full', indicator.dot)} aria-hidden="true" />
        <span className={clsx('text-lg font-semibold', indicator.text)}>{indicator.label}</span>
      </div>

      {reason && <p className="-mt-2 text-sm font-medium text-red-700 dark:text-red-400">{reason}</p>}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-neutral-400">Latência</dt>
          <dd className="tabular">{service.lastLatencyMs !== null ? `${service.lastLatencyMs} ms` : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-neutral-400">Última verificação</dt>
          <dd title={service.lastCheckedAt ? new Date(service.lastCheckedAt).toLocaleString('pt-BR') : undefined}>
            {service.lastCheckedAt ? formatAgo(service.lastCheckedAt, now) : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-neutral-800">
        {confirmingDelete ? (
          <>
            <span className="text-sm">Excluir este serviço?</span>
            <Button
              className="bg-red-600 px-2.5 py-1 text-xs hover:bg-red-700"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              className="px-2.5 py-1 text-xs"
              onClick={() => toggle.mutate()}
              disabled={toggle.isPending}
            >
              {service.isActive ? 'Pausar' : 'Reativar'}
            </Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setConfirmingDelete(true)}>
              Excluir
            </Button>
          </>
        )}
      </div>
      <ErrorText>{error && getApiErrorMessage(error, 'Não foi possível salvar a alteração.')}</ErrorText>
    </Card>
  );
}

function CreateServiceForm() {
  const applyChange = useServiceMutations();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [expectedStatus, setExpectedStatus] = useState('200');
  const [timeoutMs, setTimeoutMs] = useState('5000');

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<MonitoredService>('/admin/monitored-services', {
          name: name.trim(),
          url: url.trim(),
          expectedStatus: Number(expectedStatus),
          timeoutMs: Number(timeoutMs),
        })
      ).data,
    onSuccess: (created) => {
      applyChange((all) => [...all, created]);
      setName('');
      setUrl('');
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-sm font-semibold">Novo serviço</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Field label="Nome" htmlFor="monitor-name">
            <Input
              id="monitor-name"
              required
              maxLength={100}
              placeholder="Menupi API"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="URL" htmlFor="monitor-url">
            <Input
              id="monitor-url"
              type="url"
              required
              placeholder="https://api.exemplo.com/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200">
            Opções avançadas
          </summary>
          <div className="mt-3 flex flex-wrap gap-4">
            <Field label="Status HTTP esperado" htmlFor="monitor-expected-status">
              <Input
                id="monitor-expected-status"
                type="number"
                min={100}
                max={599}
                step={1}
                required
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(e.target.value)}
                className="w-32"
              />
            </Field>
            <Field label="Timeout (ms)" htmlFor="monitor-timeout">
              <Input
                id="monitor-timeout"
                type="number"
                min={500}
                max={60000}
                step={100}
                required
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
                className="w-32"
              />
            </Field>
          </div>
        </details>
        <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível cadastrar o serviço.')}</ErrorText>
      </form>
    </Card>
  );
}
