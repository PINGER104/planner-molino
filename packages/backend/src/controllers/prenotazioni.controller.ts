import { Request, Response } from 'express';
import pool from '../config/database';
import { COLORI_STATO, STATI_FINALI } from '@planner-molino/shared';

function sanitizeSearch(input: string): string {
  return input.replace(/[%_'\\]/g, '').trim();
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const tipologia = req.query.tipologia as string | undefined;
    const stato = req.query.stato as string | undefined;
    const dataDa = req.query.data_da as string | undefined;
    const dataA = req.query.data_a as string | undefined;
    const clienteId = req.query.cliente_id as string | undefined;
    const priorita = req.query.priorita as string | undefined;
    const search = req.query.search ? sanitizeSearch(req.query.search as string) : null;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (tipologia) {
      conditions.push(`tipologia = $${paramIndex}`);
      params.push(tipologia);
      paramIndex++;
    }

    if (stato) {
      conditions.push(`stato = $${paramIndex}`);
      params.push(stato);
      paramIndex++;
    }

    if (dataDa) {
      conditions.push(`data_pianificata >= $${paramIndex}`);
      params.push(dataDa);
      paramIndex++;
    }

    if (dataA) {
      conditions.push(`data_pianificata <= $${paramIndex}`);
      params.push(dataA);
      paramIndex++;
    }

    if (clienteId) {
      conditions.push(`cliente_id = $${paramIndex}`);
      params.push(parseInt(clienteId));
      paramIndex++;
    }

    if (priorita) {
      conditions.push(`priorita = $${paramIndex}`);
      params.push(parseInt(priorita));
      paramIndex++;
    }

    if (search) {
      conditions.push(
        `(codice_prenotazione ILIKE $${paramIndex} OR cliente_ragione_sociale ILIKE $${paramIndex} OR prodotto_descrizione ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM prenotazioni_view ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM prenotazioni_view ${whereClause} ORDER BY data_pianificata DESC, ora_inizio_prevista ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
    console.error('Prenotazioni list error:', err);
    res.status(500).json({ error: 'Errore nel recupero prenotazioni' });
  }
}

export async function calendario(req: Request, res: Response): Promise<void> {
  try {
    const start = req.query.start as string;
    const end = req.query.end as string;
    const tipologia = req.query.tipologia as string | undefined;

    if (!start || !end) {
      res.status(400).json({ error: 'Parametri start e end obbligatori' });
      return;
    }

    const conditions: string[] = ['data_pianificata >= $1', 'data_pianificata <= $2'];
    const params: unknown[] = [start, end];

    if (tipologia) {
      conditions.push('tipologia = $3');
      params.push(tipologia);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await pool.query(
      `SELECT id, codice_prenotazione, data_pianificata, ora_inizio_prevista, ora_fine_prevista,
              stato, tipologia, cliente_ragione_sociale, prodotto_descrizione, quantita_prevista
       FROM prenotazioni_view ${whereClause}
       ORDER BY data_pianificata, ora_inizio_prevista`,
      params
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      title: row.codice_prenotazione,
      start: row.ora_inizio_prevista
        ? `${row.data_pianificata}T${row.ora_inizio_prevista}`
        : row.data_pianificata,
      end: row.ora_fine_prevista
        ? `${row.data_pianificata}T${row.ora_fine_prevista}`
        : row.data_pianificata,
      backgroundColor: COLORI_STATO[row.stato] || '#6B7280',
      extendedProps: {
        stato: row.stato,
        tipologia: row.tipologia,
        cliente_ragione_sociale: row.cliente_ragione_sociale,
        prodotto_descrizione: row.prodotto_descrizione,
        quantita_prevista: row.quantita_prevista,
      },
    }));

    res.json(events);
  } catch (err) {
    console.error('Prenotazioni calendario error:', err);
    res.status(500).json({ error: 'Errore nel recupero calendario' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const [prenotazioneRes, storicoRes, datiCaricoRes, transizioniRes] = await Promise.all([
      pool.query('SELECT * FROM prenotazioni_view WHERE id = $1', [id]),
      pool.query('SELECT * FROM storico_stati_view WHERE prenotazione_id = $1 ORDER BY data_cambio DESC', [id]),
      pool.query('SELECT * FROM dati_carico WHERE prenotazione_id = $1 ORDER BY created_at DESC', [id]),
      pool.query('SELECT * FROM get_transizioni_possibili($1)', [id]),
    ]);

    if (prenotazioneRes.rows.length === 0) {
      res.status(404).json({ error: 'Prenotazione non trovata' });
      return;
    }

    res.json({
      prenotazione: prenotazioneRes.rows[0],
      storico: storicoRes.rows,
      datiCarico: datiCaricoRes.rows,
      transizioniPossibili: transizioniRes.rows,
    });
  } catch (err) {
    console.error('Prenotazioni getById error:', err);
    res.status(500).json({ error: 'Errore nel recupero prenotazione' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body, created_by: req.user!.id };

    const result = await pool.query(
      'SELECT * FROM create_prenotazione($1::jsonb)',
      [JSON.stringify(data)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Prenotazioni create error:', err);
    res.status(500).json({ error: 'Errore nella creazione prenotazione' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check state is not final
    const checkResult = await pool.query(
      'SELECT stato FROM prenotazioni WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Prenotazione non trovata' });
      return;
    }

    if ((STATI_FINALI as readonly string[]).includes(checkResult.rows[0].stato)) {
      res.status(400).json({ error: 'Impossibile modificare una prenotazione in stato finale' });
      return;
    }

    const fields = req.body;
    const keys = Object.keys(fields);

    if (keys.length === 0) {
      res.status(400).json({ error: 'Nessun campo da aggiornare' });
      return;
    }

    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);

    const result = await pool.query(
      `UPDATE prenotazioni SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Prenotazioni update error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento prenotazione' });
  }
}

export async function cambioStato(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { stato, note } = req.body;

    const result = await pool.query(
      'SELECT * FROM update_stato_prenotazione($1, $2, $3, $4)',
      [id, stato, note || null, req.user!.id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Prenotazioni cambioStato error:', err);
    // DB function raises exceptions for invalid transitions
    if (err.message) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Errore nel cambio stato' });
    }
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT stato FROM prenotazioni WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Prenotazione non trovata' });
      return;
    }

    if (checkResult.rows[0].stato !== 'pianificato') {
      res.status(400).json({ error: 'Eliminazione consentita solo per prenotazioni in stato pianificato' });
      return;
    }

    await pool.query('DELETE FROM prenotazioni WHERE id = $1', [id]);
    res.json({ message: 'Prenotazione eliminata' });
  } catch (err) {
    console.error('Prenotazioni remove error:', err);
    res.status(500).json({ error: 'Errore nella rimozione prenotazione' });
  }
}

export async function getDatiCarico(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM dati_carico WHERE prenotazione_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Prenotazioni getDatiCarico error:', err);
    res.status(500).json({ error: 'Errore nel recupero dati carico' });
  }
}

export async function createDatiCarico(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = { ...req.body, operatore_id: req.user!.id };

    const result = await pool.query(
      'SELECT * FROM create_dati_carico($1, $2::jsonb)',
      [id, JSON.stringify(data)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Prenotazioni createDatiCarico error:', err);
    res.status(500).json({ error: 'Errore nella creazione dati carico' });
  }
}

export async function updateDatiCarico(req: Request, res: Response): Promise<void> {
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
      `UPDATE dati_carico SET ${setClauses.join(', ')}, updated_at = NOW() WHERE prenotazione_id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dati carico non trovati' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Prenotazioni updateDatiCarico error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dati carico' });
  }
}
