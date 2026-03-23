import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const REQUEST_TIMEOUT = 15000;

interface ApiOptions {
  signal?: AbortSignal;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiOptions
): Promise<T> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal || controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Errore di rete' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => apiRequest<T>('GET', path, undefined, options),
  post: <T>(path: string, body: unknown, options?: ApiOptions) => apiRequest<T>('POST', path, body, options),
  put: <T>(path: string, body: unknown, options?: ApiOptions) => apiRequest<T>('PUT', path, body, options),
  patch: <T>(path: string, body: unknown, options?: ApiOptions) => apiRequest<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: ApiOptions) => apiRequest<T>('DELETE', path, undefined, options),
};
