import { z } from 'zod';

export const createPrenotazioneSchema = z.object({
  tipologia: z.enum(['produzione', 'consegna']),
  cliente_id: z.number().int().positive(),
  data_pianificata: z.string(), // ISO date YYYY-MM-DD
  ora_inizio_prevista: z.string(), // HH:MM
  trasportatore_id: z.number().int().positive().optional(),
  prodotto_codice: z.string().max(50).optional(),
  prodotto_descrizione: z.string().max(200).optional(),
  categoria_prodotto: z.enum(['rinfusa', 'confezionato_silos', 'confezionato_sacco']).optional(),
  specifica_w: z.number().optional(),
  specifica_w_tolleranza: z.number().optional(),
  specifica_pl: z.number().optional(),
  specifica_pl_tolleranza: z.number().optional(),
  altre_specifiche: z.record(z.string(), z.unknown()).optional(),
  quantita_prevista: z.number().positive().optional(),
  unita_misura: z.enum(['kg', 'ton', 'sacchi', 'pallet']).optional(),
  quantita_kg: z.number().positive().optional(),
  lotto_previsto: z.string().max(50).optional(),
  lotto_scadenza: z.string().optional(),
  origine_materiale: z.enum(['silos', 'sacco', 'big_bag']).optional(),
  silos_origine: z.string().max(20).optional(),
  linea_produzione: z.string().max(30).optional(),
  prenotazione_consegna_collegata: z.number().int().positive().optional(),
  prenotazione_produzione_collegata: z.number().int().positive().optional(),
  tipologia_carico: z.enum(['big_bag', 'sacchi', 'cisterna', 'pallet']).optional(),
  ordine_riferimento: z.string().max(50).optional(),
  ddt_riferimento: z.string().max(50).optional(),
  priorita: z.number().int().min(1).max(10).default(5),
  note: z.string().optional(),
});

export const updatePrenotazioneSchema = createPrenotazioneSchema.partial();

export const cambioStatoSchema = z
  .object({
    stato: z.string(),
    note: z.string().optional(),
  })
  .refine(
    (data) => data.stato !== 'annullato' || (data.note && data.note.length > 0),
    { message: 'Note obbligatorie per annullamento' }
  );

export type CreatePrenotazioneInput = z.infer<typeof createPrenotazioneSchema>;
export type UpdatePrenotazioneInput = z.infer<typeof updatePrenotazioneSchema>;
export type CambioStatoInput = z.infer<typeof cambioStatoSchema>;
