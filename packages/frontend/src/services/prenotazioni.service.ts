import { api } from './api';
import type {
  Prenotazione,
  DatiCarico,
  PaginatedResponse,
  CalendarEvent,
  PrenotazioneDetailResponse,
} from '@planner-molino/shared';

export const prenotazioniService = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Prenotazione>>(`/prenotazioni${query}`);
  },
  calendario: (start: string, end: string, tipologia?: string) => {
    const params = new URLSearchParams({ start, end });
    if (tipologia) params.set('tipologia', tipologia);
    return api.get<CalendarEvent[]>(`/prenotazioni/calendario?${params}`);
  },
  getById: (id: number) => api.get<PrenotazioneDetailResponse>(`/prenotazioni/${id}`),
  create: (data: unknown) => api.post<Prenotazione>('/prenotazioni', data),
  update: (id: number, data: unknown) => api.put<Prenotazione>(`/prenotazioni/${id}`, data),
  cambioStato: (id: number, stato: string, note?: string) =>
    api.patch<Prenotazione>(`/prenotazioni/${id}/stato`, { stato, note }),
  remove: (id: number) => api.delete<void>(`/prenotazioni/${id}`),
  // 1:1 relationship — returns single object or null
  getDatiCarico: (id: number) => api.get<DatiCarico | null>(`/prenotazioni/${id}/dati-carico`),
  createDatiCarico: (id: number, data: unknown) =>
    api.post<DatiCarico>(`/prenotazioni/${id}/dati-carico`, data),
  updateDatiCarico: (id: number, data: unknown) =>
    api.put<DatiCarico>(`/prenotazioni/${id}/dati-carico`, data),
};
