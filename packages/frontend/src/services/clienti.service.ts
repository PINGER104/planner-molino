import { api } from './api';
import type { Cliente, PaginatedResponse } from '@planner-molino/shared';

interface DropdownItem {
  id: number;
  codice: string;
  ragione_sociale: string;
}

export const clientiService = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Cliente>>(`/clienti${query}`);
  },
  dropdown: () => api.get<DropdownItem[]>('/clienti/dropdown'),
  getById: (id: number) => api.get<Cliente>(`/clienti/${id}`),
  create: (data: Partial<Cliente>) => api.post<Cliente>('/clienti', data),
  update: (id: number, data: Partial<Cliente>) => api.put<Cliente>(`/clienti/${id}`, data),
  remove: (id: number, hard = false) => api.delete<void>(`/clienti/${id}${hard ? '?hard=true' : ''}`),
};
