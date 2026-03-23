export interface Utente {
  id: string; // UUID
  username: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  ruolo: string | null;
  livello_accesso: 'visualizzazione' | 'modifica';
  sezioni_abilitate: ('produzione' | 'consegne')[];
  attivo: boolean;
  created_at: string;
  ultimo_accesso: string | null;
}
