import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import pool from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        nome: string;
        cognome: string;
        email: string;
        ruolo: string;
        livello_accesso: 'visualizzazione' | 'modifica';
        sezioni_abilitate: string[];
        attivo: boolean;
      };
    }
  }
}

/**
 * Middleware: validates Supabase Auth token and loads user profile from DB.
 * Extracts Bearer token from Authorization header.
 * Calls supabase.auth.getUser(token) to verify.
 * Loads profile from utenti table.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token mancante' });
      return;
    }

    const token = authHeader.substring(7);

    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ error: 'Token non valido' });
      return;
    }

    // Load profile from utenti table
    const result = await pool.query(
      'SELECT id, username, nome, cognome, email, ruolo, livello_accesso, sezioni_abilitate, attivo FROM utenti WHERE id = $1 AND attivo = true',
      [supabaseUser.id]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Utente non trovato o disattivato' });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: 'Errore autenticazione' });
  }
}

/**
 * Middleware: requires livello_accesso = 'modifica'.
 * Must be used AFTER requireAuth.
 */
export function requireModifica(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.livello_accesso !== 'modifica') {
    res.status(403).json({ error: 'Permesso di modifica richiesto' });
    return;
  }
  next();
}

/**
 * Middleware: requires specific sezione enabled for the user.
 */
export function requireSezione(sezione: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.sezioni_abilitate.includes(sezione)) {
      res.status(403).json({ error: `Accesso alla sezione '${sezione}' non autorizzato` });
      return;
    }
    next();
  };
}
