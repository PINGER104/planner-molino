export const CATEGORIE_PRODOTTO: Record<string, string> = {
  rinfusa: 'Rinfusa',
  confezionato_silos: 'Confezionato (Silos)',
  confezionato_sacco: 'Confezionato (Sacco)',
};

export const UNITA_MISURA: Record<string, string> = {
  kg: 'Kg',
  ton: 'Tonnellate',
  sacchi: 'Sacchi',
  pallet: 'Pallet',
};

export const TIPOLOGIA_CARICO: Record<string, string> = {
  big_bag: 'Big Bag',
  sacchi: 'Sacchi',
  cisterna: 'Cisterna',
  pallet: 'Pallet',
};

export const ORIGINE_MATERIALE: Record<string, string> = {
  silos: 'Silos',
  sacco: 'Sacco',
  big_bag: 'Big Bag',
};

export const CANALE_CLIENTE: Record<string, string> = {
  GDO: 'GDO',
  HORECA: 'HoReCa',
  industria: 'Industria',
  dettaglio: 'Dettaglio',
  export: 'Export',
};

export const MODALITA_CONSEGNA: Record<string, string> = {
  franco_destino: 'Franco Destino',
  franco_partenza: 'Franco Partenza',
  ritiro_cliente: 'Ritiro Cliente',
};

export const LABELS_STATO: Record<string, string> = {
  pianificato: 'Pianificato',
  preso_in_carico: 'Preso in carico',
  in_produzione: 'In produzione',
  in_preparazione: 'In preparazione',
  pronto_carico: 'Pronto al carico',
  in_carico: 'In carico',
  completato: 'Completato',
  caricato: 'Caricato',
  partito: 'Partito',
  annullato: 'Annullato',
};

export const PRIORITA_LABELS: Record<number, string> = {
  1: 'Massima',
  2: 'Alta',
  3: 'Alta',
  4: 'Media',
  5: 'Media',
  6: 'Bassa',
  7: 'Bassa',
  8: 'Bassissima',
  9: 'Bassissima',
  10: 'Bassissima',
};

export const LIVELLO_ACCESSO: Record<string, string> = {
  visualizzazione: 'Visualizzazione',
  modifica: 'Modifica',
};

export const SEZIONI: Record<string, string> = {
  produzione: 'Produzione',
  consegne: 'Consegne',
};
