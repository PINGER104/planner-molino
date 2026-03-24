import { api } from './api';
import type { ConfigurazioneTempiCiclo, DashboardStats } from '@planner-molino/shared';

interface CalcoloDurataRequest {
  categoria: string;
  quantita_kg: number;
  cambio_prodotto?: boolean;
}

interface CalcoloDurataResponse {
  durata_minuti: number;
}

export const configurazioneService = {
  getTempiCiclo: () =>
    api.get<ConfigurazioneTempiCiclo[]>('/configurazione/tempi-ciclo'),
  updateTempiCiclo: (categoria: string, data: Partial<ConfigurazioneTempiCiclo>) =>
    api.put<ConfigurazioneTempiCiclo>(`/configurazione/tempi-ciclo/${categoria}`, data),
  calcolaDurata: (data: CalcoloDurataRequest) =>
    api.post<CalcoloDurataResponse>('/configurazione/calcola-durata', data),
  getDashboardStats: () =>
    api.get<DashboardStats>('/configurazione/dashboard-stats'),
};
