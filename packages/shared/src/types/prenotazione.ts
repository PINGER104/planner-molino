import type { StatoPrenotazione, TipologiaPrenotazione } from '../constants/stati';

export interface Prenotazione {
  id: number;
  codice_prenotazione: string;
  tipologia: TipologiaPrenotazione;
  cliente_id: number;
  trasportatore_id: number | null;
  data_pianificata: string;
  ora_inizio_prevista: string;
  ora_fine_prevista: string | null;
  durata_prevista_minuti: number | null;
  prodotto_codice: string | null;
  prodotto_descrizione: string | null;
  categoria_prodotto: 'rinfusa' | 'confezionato_silos' | 'confezionato_sacco' | null;
  specifica_w: number | null;
  specifica_w_tolleranza: number | null;
  specifica_pl: number | null;
  specifica_pl_tolleranza: number | null;
  altre_specifiche: Record<string, unknown> | null;
  quantita_prevista: number | null;
  unita_misura: 'kg' | 'ton' | 'sacchi' | 'pallet' | null;
  quantita_kg: number | null;
  lotto_previsto: string | null;
  lotto_scadenza: string | null;
  origine_materiale: 'silos' | 'sacco' | 'big_bag' | null;
  silos_origine: string | null;
  linea_produzione: string | null;
  prenotazione_consegna_collegata: number | null;
  prenotazione_produzione_collegata: number | null;
  tipologia_carico: 'big_bag' | 'sacchi' | 'cisterna' | 'pallet' | null;
  ordine_riferimento: string | null;
  ddt_riferimento: string | null;
  stato: StatoPrenotazione;
  priorita: number;
  note: string | null;
  created_by: string | null; // UUID
  created_at: string;
  updated_at: string;
}

export interface StoricoStato {
  id: number;
  prenotazione_id: number;
  stato_precedente: string | null;
  stato_nuovo: string;
  timestamp_cambio: string;
  utente_id: string | null; // UUID
  note: string | null;
}

export interface PrenotazioneView extends Prenotazione {
  cliente_ragione_sociale: string;
  trasportatore_ragione_sociale: string | null;
}
