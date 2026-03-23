import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import pool from '../config/database';

function sanitizeSearch(input: string): string {
  return input.replace(/[%_'\\]/g, '').trim();
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? sanitizeSearch(req.query.search as string) : null;
    const attivo = req.query.attivo !== undefined ? req.query.attivo === 'true' : null;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(nome ILIKE $${paramIndex} OR cognome ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (attivo !== null) {
      conditions.push(`attivo = $${paramIndex}`);
      params.push(attivo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM utenti ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, ultimo_accesso, created_at
       FROM utenti ${whereClause} ORDER BY cognome, nome ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Utenti list error:', err);
    res.status(500).json({ error: 'Errore nel recupero utenti' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, ultimo_accesso, created_at
       FROM utenti WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utente non trovato' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Utenti getById error:', err);
    res.status(500).json({ error: 'Errore nel recupero utente' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username, nome, cognome, livello_accesso, sezioni_abilitate, telefono, ruolo } = req.body;

    // Create user in Supabase Auth (trigger handle_new_user auto-creates utenti record)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        nome,
        cognome,
        livello_accesso,
        sezioni_abilitate,
        telefono,
        ruolo,
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Fetch the created user profile
    const result = await pool.query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at
       FROM utenti WHERE id = $1`,
      [data.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Utenti create error:', err);
    res.status(500).json({ error: 'Errore nella creazione utente' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const fields = { ...req.body };

    // Self-protection: cannot change own livello_accesso or attivo
    if (req.user!.id === id) {
      delete fields.livello_accesso;
      delete fields.attivo;
    }

    const keys = Object.keys(fields);

    if (keys.length === 0) {
      res.status(400).json({ error: 'Nessun campo da aggiornare' });
      return;
    }

    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);

    const result = await pool.query(
      `UPDATE utenti SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utente non trovato' });
      return;
    }

    // Sync email to Supabase Auth if changed
    if (fields.email) {
      await supabaseAdmin.auth.admin.updateUserById(id, { email: fields.email });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Utenti update error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento utente' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password deve essere di almeno 6 caratteri' });
      return;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Password reimpostata con successo' });
  } catch (err) {
    console.error('Utenti resetPassword error:', err);
    res.status(500).json({ error: 'Errore nel reset password' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Cannot deactivate self
    if (req.user!.id === id) {
      res.status(400).json({ error: 'Non puoi disattivare il tuo account' });
      return;
    }

    const result = await pool.query(
      'UPDATE utenti SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING id, username, nome, cognome, attivo',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utente non trovato' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Utenti remove error:', err);
    res.status(500).json({ error: 'Errore nella disattivazione utente' });
  }
}
