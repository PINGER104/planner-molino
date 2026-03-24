import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../lib/logger';
import { sanitizeSearch, buildUpdateClauses } from '../lib/queryBuilder';
import { NotFoundError, BusinessRuleError } from '../lib/errors';

// Column whitelist — only these columns can be SET via update()
const CLIENTI_ALLOWED = [
  'ragione_sociale', 'partita_iva', 'codice_fiscale', 'indirizzo', 'cap', 'citta',
  'provincia', 'nazione', 'destinazione_diversa', 'dest_indirizzo', 'dest_cap',
  'dest_citta', 'dest_provincia', 'telefono', 'email', 'referente_ordini',
  'canale', 'modalita_consegna', 'requisiti_documentali', 'finestre_consegna', 'note',
] as const;

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? sanitizeSearch(req.query.search as string) : null;
    const attivo = req.query.attivo !== undefined ? req.query.attivo === 'true' : null;
    const canale = req.query.canale as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(ragione_sociale ILIKE $${paramIndex} OR codice ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (attivo !== null) {
      conditions.push(`attivo = $${paramIndex}`);
      params.push(attivo);
      paramIndex++;
    }

    if (canale) {
      conditions.push(`canale = $${paramIndex}`);
      params.push(canale);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM clienti ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM clienti ${whereClause} ORDER BY ragione_sociale ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
    logger.error({ err }, 'Clienti list error');
    next(err);
  }
}

export async function dropdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT id, codice, ragione_sociale FROM clienti WHERE attivo = true ORDER BY ragione_sociale ASC'
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'Clienti dropdown error');
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clienti WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Cliente');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Clienti getById error');
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT * FROM create_cliente($1::jsonb)',
      [JSON.stringify(req.body)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Clienti create error');
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { setClauses, values } = buildUpdateClauses(req.body, CLIENTI_ALLOWED);

    if (setClauses.length === 0) {
      throw new BusinessRuleError('Nessun campo da aggiornare');
    }

    const result = await pool.query(
      `UPDATE clienti SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Cliente');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Clienti update error');
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const hard = req.query.hard === 'true';

    if (hard) {
      const result = await pool.query('DELETE FROM clienti WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        throw new NotFoundError('Cliente');
      }
      res.json({ message: 'Cliente eliminato definitivamente' });
    } else {
      const result = await pool.query(
        'UPDATE clienti SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        throw new NotFoundError('Cliente');
      }
      res.json(result.rows[0]);
    }
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Clienti remove error');
    next(err);
  }
}
