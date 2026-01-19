import { StatoProduzione, StatoConsegna, TipologiaPrenotazione } from '../types';

// Valid state transitions for production
const TRANSIZIONI_PRODUZIONE: Record<StatoProduzione, StatoProduzione[]> = {
  pianificato: ['preso_in_carico', 'annullato'],
  preso_in_carico: ['in_produzione', 'annullato'],
  in_produzione: ['completato'],
  completato: [],
  annullato: [],
};

// Valid state transitions for delivery
const TRANSIZIONI_CONSEGNE: Record<StatoConsegna, StatoConsegna[]> = {
  pianificato: ['preso_in_carico', 'annullato'],
  preso_in_carico: ['in_preparazione', 'annullato'],
  in_preparazione: ['pronto_carico', 'annullato'],
  pronto_carico: ['in_carico', 'annullato'],
  in_carico: ['caricato'],
  caricato: ['partito'],
  partito: [],
  annullato: [],
};

export function isTransizioneValida(
  tipologia: TipologiaPrenotazione,
  statoAttuale: string,
  nuovoStato: string
): boolean {
  if (tipologia === 'produzione') {
    const transizioni = TRANSIZIONI_PRODUZIONE[statoAttuale as StatoProduzione];
    return transizioni?.includes(nuovoStato as StatoProduzione) || false;
  } else {
    const transizioni = TRANSIZIONI_CONSEGNE[statoAttuale as StatoConsegna];
    return transizioni?.includes(nuovoStato as StatoConsegna) || false;
  }
}

export function getTransizioniPossibili(
  tipologia: TipologiaPrenotazione,
  statoAttuale: string
): string[] {
  if (tipologia === 'produzione') {
    return TRANSIZIONI_PRODUZIONE[statoAttuale as StatoProduzione] || [];
  } else {
    return TRANSIZIONI_CONSEGNE[statoAttuale as StatoConsegna] || [];
  }
}

export function isStatoFinale(tipologia: TipologiaPrenotazione, stato: string): boolean {
  const statiFinaliProduzione: StatoProduzione[] = ['completato', 'annullato'];
  const statiFinaliConsegne: StatoConsegna[] = ['partito', 'annullato'];

  if (tipologia === 'produzione') {
    return statiFinaliProduzione.includes(stato as StatoProduzione);
  } else {
    return statiFinaliConsegne.includes(stato as StatoConsegna);
  }
}

export function richiedeNoteAnnullamento(nuovoStato: string): boolean {
  return nuovoStato === 'annullato';
}

export function richiedeDatiCarico(nuovoStato: string): boolean {
  return nuovoStato === 'caricato';
}
