import type { PrenotazioneView } from './prenotazione';
import type { StoricoStato } from './prenotazione';
import type { DatiCarico } from './dati-carico';

// ─── Pagination ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Error shapes ────────────────────────────────────────────

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: string;
  code?: ApiErrorCode;
  details?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  campo: string;
  messaggio: string;
}

// ─── Dashboard ───────────────────────────────────────────────

export interface DashboardStats {
  oggi_totale: number;
  oggi_in_corso: number;
  oggi_completate: number;
  in_attesa: number;
  produzione_oggi: number;
  consegne_oggi: number;
}

// ─── Calendar ────────────────────────────────────────────────

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    stato: string;
    tipologia: string;
    cliente_ragione_sociale: string;
    prodotto_descrizione: string | null;
    quantita_prevista: number | null;
  };
}

// ─── Prenotazione detail (composite response) ────────────────

export interface PrenotazioneDetailResponse {
  prenotazione: PrenotazioneView;
  storico: StoricoStato[];
  datiCarico: DatiCarico | null;
  transizioniPossibili: string[];
}

// ─── Simple message response ─────────────────────────────────

export interface MessageResponse {
  message: string;
}
