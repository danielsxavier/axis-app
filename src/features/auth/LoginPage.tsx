import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, ErrorText, Field, Input } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function LoginPage() {
  const { token, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith('/dashboard') ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível entrar. Verifique a conexão com a API.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-2">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white">
            A
          </div>
          <h1 className="text-xl font-semibold">Axis</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Painel de assinaturas</p>
        </div>

        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <ErrorText>{error}</ErrorText>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
