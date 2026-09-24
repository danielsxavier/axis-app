import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product } from '@/types/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<Product[]>('/products')).data,
  });
}
