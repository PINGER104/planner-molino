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
  created_at: string;
  updated_at: string;
}
