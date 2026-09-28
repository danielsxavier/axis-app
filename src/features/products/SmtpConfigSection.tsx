import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button, ErrorText, Field, Input, Loading, QueryError } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import type { SmtpConfig, SmtpTestResult } from '@/types/api';

const sectionClass = 'mt-4 space-y-5 rounded-lg bg-slate-50 p-4 dark:bg-neutral-800/50';

function useSmtpConfig(productId: string) {
  return useQuery({
    queryKey: ['smtp-config', productId],
    // Sem configuração a API responde 200 com corpo vazio.
    queryFn: async () => (await api.get<SmtpConfig | ''>(`/products/${productId}/smtp-config`)).data || null,
  });
}

export function SmtpConfigSection({ productId }: { productId: string }) {
  const config = useSmtpConfig(productId);

  return (
    <div className={sectionClass}>
      <div>
        <h3 className="text-sm font-semibold">Configuração de E-mail (SMTP)</h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Usada pelos backends do produto para enviar e-mails transacionais (ex: redefinição de senha).
        </p>
      </div>
      {config.isLoading && <Loading />}
      {config.isError && <QueryError />}
      {config.isSuccess && (
        <>
          <SmtpConfigForm productId={productId} config={config.data} />
          <SmtpTestForm productId={productId} configured={config.data !== null} />
        </>
      )}
    </div>
  );
}

function SmtpConfigForm({ productId, config }: { productId: string; config: SmtpConfig | null }) {
  const queryClient = useQueryClient();
  const [host, setHost] = useState(config?.host ?? 'smtp.gmail.com');
  const [port, setPort] = useState(String(config?.port ?? 587));
  const [secure, setSecure] = useState(config?.secure ?? false);
  const [username, setUsername] = useState(config?.username ?? '');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState(config?.fromEmail ?? '');
  const [fromName, setFromName] = useState(config?.fromName ?? '');
  const [saved, setSaved] = useState(false);
  const id = (field: string) => `smtp-${field}-${productId}`;

  const mutation = useMutation({
    mutationFn: () =>
      api.put<SmtpConfig>(`/products/${productId}/smtp-config`, {
        host,
        port: Number(port),
        secure,
        username,
        fromEmail,
        fromName,
        // Só envia a senha quando o usuário digitou uma nova.
        ...(password ? { password } : {}),
      }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(['smtp-config', productId], data);
      setPassword('');
      setSaved(true);
    },
  });

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timeout);
  }, [saved]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Servidor" htmlFor={id('host')}>
          <Input id={id('host')} required value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" />
        </Field>
        <Field label="Porta" htmlFor={id('port')}>
          <Input
            id={id('port')}
            type="number"
            required
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={secure}
          aria-labelledby={id('secure')}
          onClick={() => setSecure(!secure)}
          className={clsx(
            'relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            secure ? 'bg-primary-600' : 'bg-slate-300 dark:bg-neutral-600',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
              secure ? 'left-[1.125rem]' : 'left-0.5',
            )}
          />
        </button>
        <div>
          <p id={id('secure')} className="text-sm font-medium text-slate-700 dark:text-neutral-300">
            Conexão segura: {secure ? 'sim' : 'não'}
          </p>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Ative para porta 465, desative para porta 587 com STARTTLS
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Usuário" htmlFor={id('username')}>
          <Input
            id={id('username')}
            required
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="contato@menupi.com.br"
          />
        </Field>
        <Field label="Senha" htmlFor={id('password')}>
          <Input
            id={id('password')}
            type="password"
            autoComplete="new-password"
            required={!config?.hasPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={config?.hasPassword ? '•••••• (já configurado)' : 'App Password do Gmail'}
          />
        </Field>
        <Field label="E-mail remetente" htmlFor={id('from-email')}>
          <Input
            id={id('from-email')}
            type="email"
            required
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="contato@menupi.com.br"
          />
        </Field>
        <Field label="Nome remetente" htmlFor={id('from-name')}>
          <Input
            id={id('from-name')}
            required
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Menupi"
          />
        </Field>
      </div>

      <ErrorText>{mutation.isError && getApiErrorMessage(mutation.error, 'Não foi possível salvar a configuração.')}</ErrorText>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar configuração'}
        </Button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Configuração salva.</span>}
      </div>
    </form>
  );
}

function SmtpTestForm({ productId, configured }: { productId: string; configured: boolean }) {
  const [testEmail, setTestEmail] = useState('');
  const mutation = useMutation({
    mutationFn: async (email: string) =>
      (await api.post<SmtpTestResult>(`/products/${productId}/smtp-config/test`, { testEmail: email })).data,
  });
  const inputId = `smtp-test-${productId}`;

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(testEmail);
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-slate-200 pt-4 dark:border-neutral-700">
      <div>
        <h3 className="text-sm font-semibold">Testar envio</h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Envia um e-mail simples usando a configuração <strong>salva</strong>. Teste aqui antes do fluxo completo.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <Field label="Enviar para" htmlFor={inputId}>
            <Input
              id={inputId}
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" disabled={!configured || mutation.isPending}>
          {mutation.isPending ? 'Enviando...' : 'Enviar teste'}
        </Button>
      </div>
      {!configured && (
        <p className="text-xs text-slate-500 dark:text-neutral-400">Salve a configuração antes de testar.</p>
      )}

      {mutation.isError && (
        <ResultBox ok={false} title="Não foi possível testar">
          {getApiErrorMessage(mutation.error, 'Falha de conexão com a Axis.')}
        </ResultBox>
      )}
      {mutation.data?.success && (
        <ResultBox ok title="E-mail enviado">
          O servidor SMTP aceitou a mensagem. Confira a caixa de entrada (e o spam) de {mutation.variables}.
        </ResultBox>
      )}
      {mutation.data && !mutation.data.success && (
        <ResultBox ok={false} title="O servidor SMTP recusou o envio">
          <code className="block whitespace-pre-wrap break-words font-mono text-xs">{mutation.data.error}</code>
        </ResultBox>
      )}
    </form>
  );
}

function ResultBox({ ok, title, children }: { ok: boolean; title: string; children: ReactNode }) {
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={clsx(
        'rounded-lg border px-3 py-2 text-sm',
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
      )}
    >
      <p className="font-medium">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
