import clsx from 'clsx';
import { useEffect, useState } from 'react';

const FEEDBACK_MS = 1500;

/** Copia `value` para a área de transferência; o ícone vira um check por alguns instantes. */
export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard indisponível (ex: contexto não seguro): o valor continua visível para copiar à mão.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copiado!' : label}
      aria-label={copied ? 'Copiado' : label}
      className={clsx(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition',
        copied
          ? 'text-green-600 dark:text-green-400'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
      )}
    >
      {copied ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4" aria-hidden="true">
          <rect x="7" y="3" width="10" height="12" rx="1.5" />
          <path d="M13 17H4.5A1.5 1.5 0 0 1 3 15.5V6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
