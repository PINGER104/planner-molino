import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import pool from '../config/database';
import { logger } from '../lib/logger';
import { sanitizeSearch, buildUpdateClauses } from '../lib/queryBuilder';
import { NotFoundError, BusinessRuleError } from '../lib/errors';

// Column whitelist — only these columns can be SET via update()
const UTENTI_ALLOWED = [
  'username', 'nome', 'cognome', 'email', 'telefono', 'ruolo',
  'livello_accesso', 'sezioni_abilitate',
] as const;

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    logger.error({ err }, 'Utenti list error');
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, ultimo_accesso, created_at
       FROM utenti WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Utente');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Utenti getById error');
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    logger.error({ err }, 'Utenti create error');
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Pre-filter body based on self-protection rules BEFORE building clauses
    const isSelf = req.user!.id === id;
    const updateBody = { ...req.body };

    // Self-protection: cannot change own livello_accesso or attivo
    if (isSelf) {
      delete updateBody.livello_accesso;
      delete updateBody.attivo;
    }

    // Build update using only whitelisted columns (attivo included for non-self edits)
    const allowedWithAttivo = isSelf ? UTENTI_ALLOWED : [...UTENTI_ALLOWED, 'attivo'] as const;
    const { setClauses, values } = buildUpdateClauses(updateBody, allowedWithAttivo);

    if (setClauses.length === 0) {
      throw new BusinessRuleError('Nessun campo da aggiornare');
    }

    const result = await pool.query(
      `UPDATE utenti SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Utente');
    }

    // Sync email to Supabase Auth if changed
    if (req.body.email) {
      await supabaseAdmin.auth.admin.updateUserById(id as string, { email: req.body.email });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Utenti update error');
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    // Body is already validated by Zod (resetPasswordSchema)
    const { newPassword } = req.body;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id as string, {
      password: newPassword,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Password reimpostata con successo' });
  } catch (err) {
    logger.error({ err }, 'Utenti resetPassword error');
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Cannot deactivate self
    if (req.user!.id === id) {
      throw new BusinessRuleError('Non puoi disattivare il tuo account');
    }

    const result = await pool.query(
      'UPDATE utenti SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING id, username, nome, cognome, attivo',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Utente');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Utenti remove error');
    next(err);
  }
}
