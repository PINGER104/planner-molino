import { z } from 'zod';

export const createUtenteSchema = z.object({
  username: z.string().min(3).max(50),
  nome: z.string().min(1).max(100),
  cognome: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().max(30).optional(),
  ruolo: z.string().max(100).optional(),
  livello_accesso: z.enum(['visualizzazione', 'modifica']),
  sezioni_abilitate: z.array(z.enum(['produzione', 'consegne'])).min(1),
});

export const updateUtenteSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  nome: z.string().min(1).max(100).optional(),
  cognome: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  telefono: z.string().max(30).optional(),
  ruolo: z.string().max(100).optional(),
  livello_accesso: z.enum(['visualizzazione', 'modifica']).optional(),
  sezioni_abilitate: z.array(z.enum(['produzione', 'consegne'])).min(1).optional(),
});

export type CreateUtenteInput = z.infer<typeof createUtenteSchema>;
export type UpdateUtenteInput = z.infer<typeof updateUtenteSchema>;
