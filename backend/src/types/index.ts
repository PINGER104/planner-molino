// Enums
export type LivelloAccesso = 'visualizzazione' | 'modifica';
export type SezioneAbilitata = 'produzione' | 'consegne';
export type TipologiaPrenotazione = 'produzione' | 'consegna';
export type CategoriaProdotto = 'rinfusa' | 'confezionato_silos' | 'confezionato_sacco';
export type UnitaMisura = 'kg' | 'ton' | 'sacchi' | 'pallet';
export type TipologiaCarico = 'big_bag' | 'sacchi' | 'cisterna' | 'pallet';
export type OrigineMateriale = 'silos' | 'sacco' | 'big_bag';
export type CanalCliente = 'GDO' | 'HORECA' | 'industria' | 'dettaglio' | 'export';
export type ModalitaConsegna = 'franco_destino' | 'franco_partenza' | 'ritiro_cliente';

// Stati Produzione
export type StatoProduzione =
  | 'pianificato'
  | 'preso_in_carico'
  | 'in_produzione'
  | 'completato'
  | 'annullato';

// Stati Consegne
export type StatoConsegna =
  | 'pianificato'
  | 'preso_in_carico'
  | 'in_preparazione'
  | 'pronto_carico'
  | 'in_carico'
  | 'caricato'
  | 'partito'
  | 'annullato';

export type StatoPrenotazione = StatoProduzione | StatoConsegna;

// Interfaces
export interface Utente {
  id: number;
  username: string;
  password_hash?: string;
  nome: string;
  cognome: string;
  email: string | null;
  telefono: string | null;
  ruolo: string | null;
  livello_accesso: LivelloAccesso;
  sezioni_abilitate: SezioneAbilitata[];
  attivo: boolean;
  created_at: Date;
  ultimo_accesso: Date | null;
}

export interface UtentePublic extends Omit<Utente, 'password_hash'> {}

export interface Trasportatore {
  id: number;
  codice: string;
  ragione_sociale: string;
  partita_iva: string | null;
  indirizzo_sede: string | null;
  referente_nome: string | null;
  referente_telefono: string | null;
  referente_email: string | null;
  tipologie_mezzi: string[];
  certificazioni: string[];
  rating_puntualita: number;
  note: string | null;
  attivo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Cliente {
  id: number;
  codice: string;
  ragione_sociale: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  nazione: string;
  destinazione_diversa: boolean;
  dest_indirizzo: string | null;
  dest_cap: string | null;
  dest_citta: string | null;
  dest_provincia: string | null;
  telefono: string | null;
  email: string | null;
  referente_ordini: string | null;
  canale: CanalCliente | null;
  modalita_consegna: ModalitaConsegna | null;
  requisiti_documentali: string[];
  finestre_consegna: string | null;
  note: string | null;
  attivo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Prenotazione {
  id: number;
  codice_prenotazione: string;
  tipologia: TipologiaPrenotazione;
  cliente_id: number | null;
  trasportatore_id: number | null;
  data_pianificata: Date;
  ora_inizio_prevista: string;
  ora_fine_prevista: string | null;
  durata_prevista_minuti: number | null;
  prodotto_codice: string | null;
  prodotto_descrizione: string | null;
  categoria_prodotto: CategoriaProdotto | null;
  specifica_w: number | null;
  specifica_w_tolleranza: number | null;
  specifica_pl: number | null;
  specifica_pl_tolleranza: number | null;
  altre_specifiche: Record<string, unknown> | null;
  quantita_prevista: number | null;
  unita_misura: UnitaMisura | null;
  quantita_kg: number | null;
  lotto_previsto: string | null;
  lotto_scadenza: Date | null;
  origine_materiale: OrigineMateriale | null;
  silos_origine: string | null;
  linea_produzione: string | null;
  prenotazione_consegna_collegata: number | null;
  tipologia_carico: TipologiaCarico | null;
  ordine_riferimento: string | null;
  ddt_riferimento: string | null;
  prenotazione_produzione_collegata: number | null;
  stato: StatoPrenotazione;
  priorita: number;
  note: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  cliente?: Cliente;
  trasportatore?: Trasportatore;
}

export interface StoricoStato {
  id: number;
  prenotazione_id: number;
  stato_precedente: string | null;
  stato_nuovo: string;
  timestamp_cambio: Date;
  utente_id: number | null;
  note: string | null;
  utente?: UtentePublic;
}

export interface DatiCarico {
  id: number;
  prenotazione_id: number;
  data_carico: Date;
  ora_inizio_carico: string | null;
  ora_fine_carico: string | null;
  operatore_id: number | null;
  operatore_nome: string | null;
  idoneita_trasporto: boolean;
  idoneita_note: string | null;
  targa_automezzo: string;
  targa_rimorchio: string | null;
  nome_autista: string | null;
  lotto_caricato: string;
  scadenza_lotto: Date | null;
  peso_caricato_kg: number;
  peso_tara_kg: number | null;
  peso_lordo_kg: number | null;
  tipologia_carico: TipologiaCarico | null;
  numero_colli: number | null;
  ddt_numero: string | null;
  ddt_data: Date | null;
  foto_carico: string[];
  certificato_lavaggio: string | null;
  registrato_at: Date;
}

export interface ConfigurazioneTempiCiclo {
  id: number;
  categoria: string;
  ton_ora: number;
  tempo_setup_minuti: number;
  tempo_pulizia_minuti: number;
  attivo: boolean;
  updated_at: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  username: string;
  livello_accesso: LivelloAccesso;
  sezioni_abilitate: SezioneAbilitata[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreatePrenotazioneRequest {
  tipologia: TipologiaPrenotazione;
  cliente_id?: number;
  trasportatore_id?: number;
  data_pianificata: string;
  ora_inizio_prevista: string;
  prodotto_codice?: string;
  prodotto_descrizione?: string;
  categoria_prodotto?: CategoriaProdotto;
  specifica_w?: number;
  specifica_w_tolleranza?: number;
  specifica_pl?: number;
  specifica_pl_tolleranza?: number;
  quantita_prevista?: number;
  unita_misura?: UnitaMisura;
  quantita_kg?: number;
  lotto_previsto?: string;
  lotto_scadenza?: string;
  origine_materiale?: OrigineMateriale;
  silos_origine?: string;
  linea_produzione?: string;
  tipologia_carico?: TipologiaCarico;
  ordine_riferimento?: string;
  priorita?: number;
  note?: string;
}

export interface UpdateStatoRequest {
  nuovo_stato: StatoPrenotazione;
  note?: string;
}

export interface CreateDatiCaricoRequest {
  data_carico: string;
  ora_inizio_carico?: string;
  ora_fine_carico?: string;
  idoneita_trasporto: boolean;
  idoneita_note?: string;
  targa_automezzo: string;
  targa_rimorchio?: string;
  nome_autista?: string;
  lotto_caricato: string;
  scadenza_lotto?: string;
  peso_caricato_kg: number;
  peso_tara_kg?: number;
  peso_lordo_kg?: number;
  tipologia_carico?: TipologiaCarico;
  numero_colli?: number;
  ddt_numero?: string;
  ddt_data?: string;
}
