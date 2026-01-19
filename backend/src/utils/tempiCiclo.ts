import { query } from '../config/database';
import { CategoriaProdotto, ConfigurazioneTempiCiclo } from '../types';

// Default values if not found in database
const DEFAULT_TEMPI_CICLO: Record<string, { tonOra: number; tempoSetup: number; tempoPulizia: number }> = {
  rinfusa: { tonOra: 10, tempoSetup: 15, tempoPulizia: 20 },
  confezionato_silos: { tonOra: 4, tempoSetup: 15, tempoPulizia: 20 },
  confezionato_sacco: { tonOra: 2, tempoSetup: 15, tempoPulizia: 25 },
};

export async function getTempiCicloConfig(): Promise<Map<string, ConfigurazioneTempiCiclo>> {
  const result = await query('SELECT * FROM configurazione_tempi_ciclo WHERE attivo = true');
  const configMap = new Map<string, ConfigurazioneTempiCiclo>();

  for (const row of result.rows) {
    configMap.set(row.categoria, row);
  }

  return configMap;
}

export async function calcolaDurataPrevista(
  categoriaProdotto: CategoriaProdotto,
  quantitaKg: number,
  cambioProdotto: boolean = false
): Promise<number> {
  const configMap = await getTempiCicloConfig();
  const config = configMap.get(categoriaProdotto);

  let tonOra: number;
  let tempoSetup: number;
  let tempoPulizia: number;

  if (config) {
    tonOra = parseFloat(config.ton_ora.toString());
    tempoSetup = config.tempo_setup_minuti;
    tempoPulizia = config.tempo_pulizia_minuti;
  } else {
    const defaults = DEFAULT_TEMPI_CICLO[categoriaProdotto] || DEFAULT_TEMPI_CICLO.confezionato_silos;
    tonOra = defaults.tonOra;
    tempoSetup = defaults.tempoSetup;
    tempoPulizia = defaults.tempoPulizia;
  }

  const quantitaTon = quantitaKg / 1000;

  // Calculate base processing time (minutes per ton = 60 / ton_ora)
  const minutiPerTon = 60 / tonOra;
  const tempoLavorazione = quantitaTon * minutiPerTon;

  // Add fixed times
  let durataTotale = tempoSetup + tempoLavorazione;

  if (cambioProdotto) {
    durataTotale += tempoPulizia;
  }

  // Round up to 15-minute slots
  return Math.ceil(durataTotale / 15) * 15;
}

export function calcolaOraFine(oraInizio: string, durataMinuti: number): string {
  const [hours, minutes] = oraInizio.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durataMinuti;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

export function convertToKg(quantita: number, unitaMisura: string): number {
  switch (unitaMisura) {
    case 'ton':
      return quantita * 1000;
    case 'kg':
      return quantita;
    case 'sacchi':
      // Assuming average sack weight of 25kg
      return quantita * 25;
    case 'pallet':
      // Assuming average pallet weight of 1000kg
      return quantita * 1000;
    default:
      return quantita;
  }
}
