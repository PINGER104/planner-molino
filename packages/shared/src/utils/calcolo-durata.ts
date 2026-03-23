/**
 * Calcola la durata prevista di una prenotazione in minuti.
 * Formula: tempo_setup + (quantita_kg/1000 * 60/ton_ora) + tempo_pulizia (se cambio prodotto)
 * Arrotondamento per eccesso a 15 minuti.
 */
export function calcolaDurataPrevista(
  quantitaKg: number,
  tonOra: number,
  tempoSetupMinuti: number,
  tempoPuliziaMinuti: number,
  cambioProdotto: boolean
): number {
  const tempoLavorazione = (quantitaKg / 1000) * (60 / tonOra);
  const durataGrezzo = tempoSetupMinuti + tempoLavorazione + (cambioProdotto ? tempoPuliziaMinuti : 0);
  return Math.ceil(durataGrezzo / 15) * 15;
}
