import { z } from 'zod';

export const createDatiCaricoSchema = z
  .object({
    data_carico: z.string(), // ISO date YYYY-MM-DD
    ora_inizio_carico: z.string().optional(),
    ora_fine_carico: z.string().optional(),
    operatore_nome: z.string().optional(),
    idoneita_trasporto: z.boolean(),
    idoneita_note: z.string().optional(),
    targa_automezzo: z.string().min(1).max(20),
    targa_rimorchio: z.string().max(20).optional(),
    nome_autista: z.string().optional(),
    lotto_caricato: z.string().min(1).max(50),
    scadenza_lotto: z.string().optional(),
    peso_caricato_kg: z.number().positive(),
    peso_tara_kg: z.number().optional(),
    peso_lordo_kg: z.number().optional(),
    tipologia_carico: z.enum(['big_bag', 'sacchi', 'cisterna', 'pallet']).optional(),
    numero_colli: z.number().int().optional(),
    ddt_numero: z.string().optional(),
    ddt_data: z.string().optional(),
    foto_carico: z.array(z.string()).default([]),
    certificato_lavaggio: z.string().optional(),
  })
  .refine(
    (data) => data.idoneita_trasporto !== false || (data.idoneita_note && data.idoneita_note.length > 0),
    { message: 'Note obbligatorie se trasporto non idoneo' }
  );

export const updateDatiCaricoSchema = z.object({
  data_carico: z.string().optional(),
  ora_inizio_carico: z.string().optional(),
  ora_fine_carico: z.string().optional(),
  operatore_nome: z.string().optional(),
  idoneita_trasporto: z.boolean().optional(),
  idoneita_note: z.string().optional(),
  targa_automezzo: z.string().min(1).max(20).optional(),
  targa_rimorchio: z.string().max(20).optional(),
  nome_autista: z.string().optional(),
  lotto_caricato: z.string().min(1).max(50).optional(),
  scadenza_lotto: z.string().optional(),
  peso_caricato_kg: z.number().positive().optional(),
  peso_tara_kg: z.number().optional(),
  peso_lordo_kg: z.number().optional(),
  tipologia_carico: z.enum(['big_bag', 'sacchi', 'cisterna', 'pallet']).optional(),
  numero_colli: z.number().int().optional(),
  ddt_numero: z.string().optional(),
  ddt_data: z.string().optional(),
  foto_carico: z.array(z.string()).optional(),
  certificato_lavaggio: z.string().optional(),
});

export type CreateDatiCaricoInput = z.infer<typeof createDatiCaricoSchema>;
export type UpdateDatiCaricoInput = z.infer<typeof updateDatiCaricoSchema>;
