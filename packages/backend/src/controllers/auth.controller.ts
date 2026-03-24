import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import pool from '../config/database';
import { logger } from '../lib/logger';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: 'Credenziali non valide' });
      return;
    }

    // Load user profile from utenti table
    const result = await pool.query(
      `SELECT id, username, nome, cognome, email, ruolo, livello_accesso, sezioni_abilitate, attivo
       FROM utenti WHERE id = $1`,
      [data.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].attivo) {
      res.status(403).json({ error: 'Utente non trovato o disattivato' });
      return;
    }

    // Update ultimo_accesso
    await pool.query(
      'UPDATE utenti SET ultimo_accesso = NOW() WHERE id = $1',
      [data.user.id]
    );

    res.json({
      session: data.session,
      user: result.rows[0],
    });
  } catch (err) {
    logger.error({ err }, 'Login error');
    next(err);
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { newPassword } = req.body;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      req.user!.id,
      { password: newPassword }
    );

    if (error) {
      res.status(400).json({ error: 'Errore aggiornamento password' });
      return;
    }

    res.json({ message: 'Password aggiornata con successo' });
  } catch (err) {
    logger.error({ err }, 'Change password error');
    next(err);
  }
}
