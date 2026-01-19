import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';

export async function getUtenti(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, search, attivo } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: unknown[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(
        `(username ILIKE $${paramCount} OR nome ILIKE $${paramCount} OR cognome ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      );
      params.push(`%${search}%`);
    }

    if (attivo !== undefined) {
      paramCount++;
      whereConditions.push(`attivo = $${paramCount}`);
      params.push(attivo === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM utenti ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get data
    const dataResult = await query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo,
              livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso
       FROM utenti
       ${whereClause}
       ORDER BY cognome, nome
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: dataResult.rows,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetUtenti error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero utenti' });
  }
}

export async function getUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo,
              livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso
       FROM utenti WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('GetUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero utente' });
  }
}

export async function createUtente(req: Request, res: Response): Promise<void> {
  try {
    const {
      username,
      password,
      nome,
      cognome,
      email,
      telefono,
      ruolo,
      livello_accesso,
      sezioni_abilitate,
    } = req.body;

    // Validation
    if (!username || !password || !nome || !cognome || !livello_accesso) {
      res.status(400).json({
        success: false,
        error: 'Username, password, nome, cognome e livello_accesso sono obbligatori',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La password deve avere almeno 6 caratteri',
      });
      return;
    }

    // Check username uniqueness
    const existingUser = await query('SELECT id FROM utenti WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ success: false, error: 'Username già esistente' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO utenti (username, password_hash, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at`,
      [
        username,
        passwordHash,
        nome,
        cognome,
        email || null,
        telefono || null,
        ruolo || null,
        livello_accesso,
        sezioni_abilitate || ['produzione', 'consegne'],
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('CreateUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nella creazione utente' });
  }
}

export async function updateUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo } =
      req.body;

    const result = await query(
      `UPDATE utenti
       SET nome = COALESCE($1, nome),
           cognome = COALESCE($2, cognome),
           email = COALESCE($3, email),
           telefono = COALESCE($4, telefono),
           ruolo = COALESCE($5, ruolo),
           livello_accesso = COALESCE($6, livello_accesso),
           sezioni_abilitate = COALESCE($7, sezioni_abilitate),
           attivo = COALESCE($8, attivo)
       WHERE id = $9
       RETURNING id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso`,
      [nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdateUtente error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento utente" });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nuova password deve avere almeno 6 caratteri',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await query(
      'UPDATE utenti SET password_hash = $1 WHERE id = $2 RETURNING id',
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, message: 'Password reimpostata con successo' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ success: false, error: 'Errore nel reset password' });
  }
}

export async function deleteUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate
    const result = await query(
      'UPDATE utenti SET attivo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, message: 'Utente disattivato con successo' });
  } catch (error) {
    console.error('DeleteUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nella disattivazione utente' });
  }
}
