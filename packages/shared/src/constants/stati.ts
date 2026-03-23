export type TipologiaPrenotazione = 'produzione' | 'consegna';

export type StatoProduzione =
  | 'pianificato'
  | 'preso_in_carico'
  | 'in_produzione'
  | 'completato'
  | 'annullato';

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

export const TRANSIZIONI_PRODUZIONE: Record<StatoProduzione, StatoProduzione[]> = {
  pianificato: ['preso_in_carico', 'annullato'],
  preso_in_carico: ['in_produzione', 'annullato'],
  in_produzione: ['completato'],
  completato: [],
  annullato: [],
};

export const TRANSIZIONI_CONSEGNA: Record<StatoConsegna, StatoConsegna[]> = {
  pianificato: ['preso_in_carico', 'annullato'],
  preso_in_carico: ['in_preparazione', 'annullato'],
  in_preparazione: ['pronto_carico', 'annullato'],
  pronto_carico: ['in_carico', 'annullato'],
  in_carico: ['caricato'],
  caricato: ['partito'],
  partito: [],
  annullato: [],
};

export const STATI_FINALI = ['completato', 'partito', 'annullato'] as const;
