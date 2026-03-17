import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

// Extend Express Request with Supabase user info
declare global {
  namespace Express {
    interface Request {
      supabaseUserId?: string;
      supabaseUserLivello?: string;
    }
  }
}

export async function authenticateSupabaseToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Token di accesso richiesto' });
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !user) {
      res.status(403).json({ success: false, error: 'Token non valido o scaduto' });
      return;
    }

    req.supabaseUserId = user.id;

    // Fetch livello_accesso from the utenti profile table
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('utenti')
      .select('livello_accesso')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(403).json({ success: false, error: 'Profilo utente non trovato' });
      return;
    }

    req.supabaseUserLivello = profile.livello_accesso;
    next();
  } catch {
    res.status(403).json({ success: false, error: 'Errore nella validazione del token' });
  }
}

export function requireModificaSupabase(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.supabaseUserLivello !== 'modifica') {
    res.status(403).json({
      success: false,
      error: 'Permessi insufficienti. Richiesto livello di accesso "modifica"',
    });
    return;
  }
  next();
}
