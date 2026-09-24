import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, configureApiAuth } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { Admin, LoginResponse } from '@/types/api';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      login: async (email, password) => {
        const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
        set({ token: data.accessToken, admin: data.admin });
      },
      logout: () => {
        set({ token: null, admin: null });
        queryClient.clear();
      },
    }),
    { name: 'axis-auth' },
  ),
);

configureApiAuth({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().logout(),
});
