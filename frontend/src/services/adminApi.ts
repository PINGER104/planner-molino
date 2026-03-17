import { supabase } from '../lib/supabase';
import type { User, PaginatedResponse } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Timeout for backend API calls (20s — accounts for Render cold starts)
const API_TIMEOUT = 20000;

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Non autenticato');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Errore HTTP ${res.status}`);
  }
  return body.data as T;
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === 'AbortError') {
        throw new Error('Il server non risponde. Riprova tra qualche secondo.');
      }
      throw err;
    })
    .finally(() => clearTimeout(timeout));
}

export const utentiAdminApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> => {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const res = await fetchWithTimeout(`${BASE_URL}/utenti?${qs}`, { headers });
    return handleResponse<PaginatedResponse<User>>(res);
  },

  create: async (data: {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    telefono?: string;
    ruolo?: string;
    livello_accesso: string;
    sezioni_abilitate: string[];
  }): Promise<User> => {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(`${BASE_URL}/utenti`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  update: async (
    id: string,
    data: Record<string, unknown>
  ): Promise<User> => {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(`${BASE_URL}/utenti/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  resetPassword: async (
    id: string,
    newPassword: string
  ): Promise<void> => {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(`${BASE_URL}/utenti/${id}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ newPassword }),
    });
    await handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(`${BASE_URL}/utenti/${id}`, {
      method: 'DELETE',
      headers,
    });
    await handleResponse(res);
  },
};
