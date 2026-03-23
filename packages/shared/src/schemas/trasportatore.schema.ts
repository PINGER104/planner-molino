import { z } from 'zod';

export const createTrasportatoreSchema = z.object({
  ragione_sociale: z.string().min(1).max(200),
  partita_iva: z.string().max(20).optional(),
  indirizzo_sede: z.string().optional(),
  referente_nome: z.string().max(100).optional(),
  referente_telefono: z.string().max(30).optional(),
  referente_email: z.string().email().optional(),
  tipologie_mezzi: z.array(z.string()).default([]),
  certificazioni: z.array(z.string()).default([]),
  rating_puntualita: z.number().min(0).max(5).default(3),
  note: z.string().optional(),
});

export const updateTrasportatoreSchema = createTrasportatoreSchema.partial();

export type CreateTrasportatoreInput = z.infer<typeof createTrasportatoreSchema>;
export type UpdateTrasportatoreInput = z.infer<typeof updateTrasportatoreSchema>;
