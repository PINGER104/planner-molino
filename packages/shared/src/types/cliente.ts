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
  canale: 'GDO' | 'HORECA' | 'industria' | 'dettaglio' | 'export' | null;
  modalita_consegna: 'franco_destino' | 'franco_partenza' | 'ritiro_cliente' | null;
  requisiti_documentali: string[];
  finestre_consegna: string | null;
  note: string | null;
  attivo: boolean;
  created_at: string;
  updated_at: string;
}
