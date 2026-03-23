import { z } from 'zod';

export const createClienteSchema = z.object({
  ragione_sociale: z.string().min(1).max(200),
  partita_iva: z.string().max(20).optional(),
  codice_fiscale: z.string().max(20).optional(),
  indirizzo: z.string().optional(),
  cap: z.string().max(10).optional(),
  citta: z.string().max(100).optional(),
  provincia: z.string().max(5).optional(),
  nazione: z.string().max(5).default('IT'),
  destinazione_diversa: z.boolean().default(false),
  dest_indirizzo: z.string().optional(),
  dest_cap: z.string().max(10).optional(),
  dest_citta: z.string().max(100).optional(),
  dest_provincia: z.string().max(5).optional(),
  telefono: z.string().max(30).optional(),
  email: z.string().email().optional(),
  referente_ordini: z.string().max(100).optional(),
  canale: z.enum(['GDO', 'HORECA', 'industria', 'dettaglio', 'export']).optional(),
  modalita_consegna: z.enum(['franco_destino', 'franco_partenza', 'ritiro_cliente']).optional(),
  requisiti_documentali: z.array(z.string()).default([]),
  finestre_consegna: z.string().optional(),
  note: z.string().optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
