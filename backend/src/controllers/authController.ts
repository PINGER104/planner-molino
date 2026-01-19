import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken } from '../middleware/auth';
import { LoginRequest, JWTPayload, UtentePublic } from '../types';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username e password sono obbligatori',
      });
      return;
    }

    // Find user
    const result = await query(
      'SELECT * FROM utenti WHERE username = $1 AND attivo = true',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Credenziali non valide',
      });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Credenziali non valide',
      });
      return;
    }

    // Update last access
    await query('UPDATE utenti SET ultimo_accesso = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      livello_accesso: user.livello_accesso,
      sezioni_abilitate: user.sezioni_abilitate || [],
    };

    const token = generateToken(payload);

    // Return user info (without password)
    const userPublic: UtentePublic = {
      id: user.id,
      username: user.username,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      telefono: user.telefono,
      ruolo: user.ruolo,
      livello_accesso: user.livello_accesso,
      sezioni_abilitate: user.sezioni_abilitate || [],
      attivo: user.attivo,
      created_at: user.created_at,
      ultimo_accesso: new Date(),
    };

    res.json({
      success: true,
      data: {
        token,
        user: userPublic,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il login',
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const result = await query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo,
              livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso
       FROM utenti WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dati utente',
    });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Password attuale e nuova password sono obbligatorie',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nuova password deve avere almeno 6 caratteri',
      });
      return;
    }

    // Get current user with password
    const result = await query('SELECT password_hash FROM utenti WHERE id = $1', [
      req.user.userId,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!validPassword) {
      res.status(400).json({
        success: false,
        error: 'Password attuale non corretta',
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query('UPDATE utenti SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      req.user.userId,
    ]);

    res.json({
      success: true,
      message: 'Password aggiornata con successo',
    });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel cambio password',
    });
  }
}
