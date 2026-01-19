import { StatoPrenotazione, TipologiaPrenotazione } from '../types';

// Color configuration for states - Modern professional palette
export const COLORI_STATO: Record<string, string> = {
  pianificato: '#3b82f6',      // Blue - Primary action
  preso_in_carico: '#f59e0b',  // Amber - Attention
  in_produzione: '#8b5cf6',    // Violet - In progress
  in_preparazione: '#a855f7',  // Purple - Preparation
  pronto_carico: '#22c55e',    // Green - Ready
  in_carico: '#14b8a6',        // Teal - Loading
  completato: '#64748b',       // Slate - Done
  caricato: '#475569',         // Slate darker - Loaded
  partito: '#334155',          // Slate darkest - Departed
  annullato: '#ef4444',        // Red - Cancelled
};

// Color configuration for product categories
export const COLORI_CATEGORIA: Record<string, string> = {
  rinfusa: '#1e40af',           // Deep blue
  confezionato_silos: '#059669', // Emerald
  confezionato_sacco: '#d97706', // Amber
};

// State labels in Italian
export const LABEL_STATO: Record<string, string> = {
  pianificato: 'Pianificato',
  preso_in_carico: 'Preso in carico',
  in_produzione: 'In produzione',
  in_preparazione: 'In preparazione',
  pronto_carico: 'Pronto carico',
  in_carico: 'In carico',
  completato: 'Completato',
  caricato: 'Caricato',
  partito: 'Partito',
  annullato: 'Annullato',
};

// Category labels in Italian
export const LABEL_CATEGORIA: Record<string, string> = {
  rinfusa: 'Rinfusa',
  confezionato_silos: 'Confezionato (Silos)',
  confezionato_sacco: 'Confezionato (Sacco)',
};

// Unit labels
export const LABEL_UNITA: Record<string, string> = {
  kg: 'Kg',
  ton: 'Tonnellate',
  sacchi: 'Sacchi',
  pallet: 'Pallet',
};

// Load type labels
export const LABEL_TIPOLOGIA_CARICO: Record<string, string> = {
  big_bag: 'Big Bag',
  sacchi: 'Sacchi',
  cisterna: 'Cisterna',
  pallet: 'Pallet',
};

// Material origin labels
export const LABEL_ORIGINE_MATERIALE: Record<string, string> = {
  silos: 'Silos',
  sacco: 'Sacco',
  big_bag: 'Big Bag',
};

// Channel labels
export const LABEL_CANALE: Record<string, string> = {
  GDO: 'GDO',
  HORECA: 'HoReCa',
  industria: 'Industria',
  dettaglio: 'Dettaglio',
  export: 'Export',
};

// Delivery mode labels
export const LABEL_MODALITA_CONSEGNA: Record<string, string> = {
  franco_destino: 'Franco Destino',
  franco_partenza: 'Franco Partenza',
  ritiro_cliente: 'Ritiro Cliente',
};

// Get contrasting text color (white or black)
export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Check if state is final
export const isStatoFinale = (tipologia: TipologiaPrenotazione, stato: StatoPrenotazione): boolean => {
  const statiFinaliProduzione = ['completato', 'annullato'];
  const statiFinaliConsegne = ['partito', 'annullato'];

  if (tipologia === 'produzione') {
    return statiFinaliProduzione.includes(stato);
  }
  return statiFinaliConsegne.includes(stato);
};

// Priority options
export const PRIORITA_OPTIONS = [
  { value: 1, label: '1 - Massima' },
  { value: 2, label: '2 - Molto alta' },
  { value: 3, label: '3 - Alta' },
  { value: 4, label: '4 - Medio-alta' },
  { value: 5, label: '5 - Media' },
  { value: 6, label: '6 - Medio-bassa' },
  { value: 7, label: '7 - Bassa' },
  { value: 8, label: '8 - Molto bassa' },
  { value: 9, label: '9 - Minima' },
  { value: 10, label: '10 - Bassissima' },
];
