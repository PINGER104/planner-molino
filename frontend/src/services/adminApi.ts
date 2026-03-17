import { supabase } from '../lib/supabase';
import type { User, PaginatedResponse } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
    const res = await fetch(`${BASE_URL}/utenti?${qs}`, { headers });
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
    const res = await fetch(`${BASE_URL}/utenti`, {
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
    const res = await fetch(`${BASE_URL}/utenti/${id}`, {
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
    const res = await fetch(`${BASE_URL}/utenti/${id}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ newPassword }),
    });
    await handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/utenti/${id}`, {
      method: 'DELETE',
      headers,
    });
    await handleResponse(res);
  },
};
