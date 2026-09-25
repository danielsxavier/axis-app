import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminConfig } from '@/types/api';

/** Ambiente da API (sandbox/produção). Buscado uma vez por sessão do painel. */
export function useAdminConfig() {
  return useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => (await api.get<AdminConfig>('/admin/config')).data,
    staleTime: Infinity,
  });
}

/** Só true com confirmação explícita da API: na dúvida (carregando/erro), esconde as ferramentas de teste. */
export function useIsSandbox(): boolean {
  return useAdminConfig().data?.environment === 'sandbox';
}
