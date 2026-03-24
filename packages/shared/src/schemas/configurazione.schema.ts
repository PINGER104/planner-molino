import { z } from 'zod';

// ─── Tempi Ciclo update ──────────────────────────────────────

export const updateTempiCicloSchema = z.object({
  ton_ora: z.number().positive('Deve essere positivo').optional(),
  tempo_setup_minuti: z.number().int().min(0, 'Non può essere negativo').optional(),
  tempo_pulizia_minuti: z.number().int().min(0, 'Non può essere negativo').optional(),
});

export type UpdateTempiCicloInput = z.infer<typeof updateTempiCicloSchema>;

// ─── Calcola durata ──────────────────────────────────────────

export const calcolaDurataSchema = z.object({
  categoria: z.string().min(1, 'Categoria obbligatoria'),
  quantita_kg: z.number().positive('Deve essere positivo'),
  cambio_prodotto: z.boolean().optional().default(false),
});

export type CalcolaDurataInput = z.infer<typeof calcolaDurataSchema>;

// ─── Reset password ──────────────────────────────────────────

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimo 6 caratteri'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
