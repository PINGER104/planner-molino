import { api } from './api';
import type { Utente } from '@planner-molino/shared';

interface PaginatedResponse {
  data: Utente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const utentiService = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse>(`/utenti${query}`);
  },
  getById: (id: string) => api.get<Utente>(`/utenti/${id}`),
  create: (data: Partial<Utente> & { password: string }) =>
    api.post<Utente>('/utenti', data),
  update: (id: string, data: Partial<Utente>) =>
    api.put<Utente>(`/utenti/${id}`, data),
  remove: (id: string) => api.delete<void>(`/utenti/${id}`),
  resetPassword: (id: string) =>
    api.post<{ message: string }>(`/utenti/${id}/reset-password`, {}),
};
