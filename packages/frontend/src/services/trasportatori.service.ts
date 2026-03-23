import { api } from './api';
import type { Trasportatore } from '@planner-molino/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DropdownItem {
  id: number;
  codice: string;
  ragione_sociale: string;
}

export const trasportatoriService = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Trasportatore>>(`/trasportatori${query}`);
  },
  dropdown: () => api.get<DropdownItem[]>('/trasportatori/dropdown'),
  getById: (id: number) => api.get<Trasportatore>(`/trasportatori/${id}`),
  create: (data: Partial<Trasportatore>) => api.post<Trasportatore>('/trasportatori', data),
  update: (id: number, data: Partial<Trasportatore>) => api.put<Trasportatore>(`/trasportatori/${id}`, data),
  remove: (id: number, hard = false) => api.delete<void>(`/trasportatori/${id}${hard ? '?hard=true' : ''}`),
};
