import clsx from 'clsx';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useAdminConfig } from '@/lib/useAdminConfig';

const NAV = [
  { to: '/dashboard', label: 'Visão Geral', end: true },
  { to: '/dashboard/assinaturas', label: 'Assinaturas' },
  { to: '/dashboard/contas-a-receber', label: 'Contas a Receber' },
  { to: '/dashboard/produtos', label: 'Produtos e Planos' },
  { to: '/dashboard/monitoramento', label: 'Monitoramento' },
];

export function DashboardLayout() {
  const { admin, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  // Carregado uma vez ao abrir o painel; o cache do React Query serve as outras telas.
  const isSandbox = useAdminConfig().data?.environment === 'sandbox';

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            clsx(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside
        className={clsx(
          'border-b border-slate-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r',
        )}
      >
        <div className="flex items-center justify-between md:mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">A</div>
            <span className="font-semibold">Axis</span>
            {isSandbox && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Sandbox
              </span>
            )}
          </div>
          <button
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Menu
          </button>
        </div>
        <div className={clsx('mt-3 md:mt-0 md:block md:flex-1', menuOpen ? 'block' : 'hidden')}>{nav}</div>
        <div
          className={clsx(
            'mt-4 border-t border-slate-200 pt-4 text-sm dark:border-neutral-800 md:block',
            menuOpen ? 'block' : 'hidden',
          )}
        >
          <p className="truncate text-slate-500 dark:text-neutral-400" title={admin?.email}>
            {admin?.name ?? admin?.email}
          </p>
          <button onClick={logout} className="mt-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
