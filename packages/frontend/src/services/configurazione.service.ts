import { api } from './api';
import type { ConfigurazioneTempiCiclo } from '@planner-molino/shared';

interface DashboardStats {
  prenotazioniOggi: number;
  prenotazioniSettimana: number;
  clientiAttivi: number;
  trasportatoriAttivi: number;
}

interface CalcoloDurataRequest {
  categoria: string;
  quantita_ton: number;
}

interface CalcoloDurataResponse {
  durata_minuti: number;
  tempo_setup: number;
  tempo_lavorazione: number;
  tempo_pulizia: number;
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
