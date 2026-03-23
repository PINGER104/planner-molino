import { Request, Response } from 'express';
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
      conditions.push(`(ragione_sociale ILIKE $${paramIndex} OR codice ILIKE $${paramIndex})`);
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
      `SELECT COUNT(*) FROM trasportatori ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM trasportatori ${whereClause} ORDER BY ragione_sociale ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
    console.error('Trasportatori list error:', err);
    res.status(500).json({ error: 'Errore nel recupero trasportatori' });
  }
}

export async function dropdown(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT id, codice, ragione_sociale FROM trasportatori WHERE attivo = true ORDER BY ragione_sociale ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Trasportatori dropdown error:', err);
    res.status(500).json({ error: 'Errore nel recupero trasportatori' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trasportatori WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Trasportatore non trovato' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Trasportatori getById error:', err);
    res.status(500).json({ error: 'Errore nel recupero trasportatore' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT * FROM create_trasportatore($1::jsonb)',
      [JSON.stringify(req.body)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Trasportatori create error:', err);
    res.status(500).json({ error: 'Errore nella creazione trasportatore' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);

    if (keys.length === 0) {
      res.status(400).json({ error: 'Nessun campo da aggiornare' });
      return;
    }

    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);

    const result = await pool.query(
      `UPDATE trasportatori SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Trasportatore non trovato' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Trasportatori update error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento trasportatore' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const hard = req.query.hard === 'true';

    if (hard) {
      const result = await pool.query('DELETE FROM trasportatori WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Trasportatore non trovato' });
        return;
      }
      res.json({ message: 'Trasportatore eliminato definitivamente' });
    } else {
      const result = await pool.query(
        'UPDATE trasportatori SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Trasportatore non trovato' });
        return;
      }
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Trasportatori remove error:', err);
    res.status(500).json({ error: 'Errore nella rimozione trasportatore' });
  }
}
