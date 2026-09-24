import axios from 'axios';

/**
 * Origem do token é plugada pela store de auth (evita import circular
 * store <-> api: a store consome `api`, então `api` não pode importar a store).
 */
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => undefined;

export function configureApiAuth(config: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}): void {
  getToken = config.getToken;
  onUnauthorized = config.onUnauthorized;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.data) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message[0] : message;
  }
  return fallback;
}
