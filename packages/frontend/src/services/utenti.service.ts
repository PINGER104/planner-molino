import { api } from './api';
import type { Utente, PaginatedResponse } from '@planner-molino/shared';

export const utentiService = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Utente>>(`/utenti${query}`);
  },
  getById: (id: string) => api.get<Utente>(`/utenti/${id}`),
  create: (data: Partial<Utente> & { password: string }) =>
    api.post<Utente>('/utenti', data),
  update: (id: string, data: Partial<Utente>) =>
    api.put<Utente>(`/utenti/${id}`, data),
  remove: (id: string) => api.delete<void>(`/utenti/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    api.post<{ message: string }>(`/utenti/${id}/reset-password`, { newPassword }),
};
