export interface DatiCarico {
  id: number;
  prenotazione_id: number;
  data_carico: string;
  ora_inizio_carico: string | null;
  ora_fine_carico: string | null;
  operatore_id: string | null; // UUID
  operatore_nome: string | null;
  idoneita_trasporto: boolean;
  idoneita_note: string | null;
  targa_automezzo: string;
  targa_rimorchio: string | null;
  nome_autista: string | null;
  lotto_caricato: string;
  scadenza_lotto: string | null;
  peso_caricato_kg: number;
  peso_tara_kg: number | null;
  peso_lordo_kg: number | null;
  tipologia_carico: 'big_bag' | 'sacchi' | 'cisterna' | 'pallet' | null;
  numero_colli: number | null;
  ddt_numero: string | null;
  ddt_data: string | null;
  foto_carico: string[];
  certificato_lavaggio: string | null;
  registrato_at: string;
}
