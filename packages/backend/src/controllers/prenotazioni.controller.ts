import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { COLORI_STATO, STATI_FINALI } from '@planner-molino/shared';
import { logger } from '../lib/logger';
import { sanitizeSearch, buildUpdateClauses } from '../lib/queryBuilder';
import { NotFoundError, BusinessRuleError } from '../lib/errors';

// Column whitelists — only these columns can be SET via update()
const PRENOTAZIONI_ALLOWED = [
  'tipologia', 'cliente_id', 'trasportatore_id', 'data_pianificata',
  'ora_inizio_prevista', 'ora_fine_prevista', 'durata_prevista_minuti',
  'prodotto_codice', 'prodotto_descrizione', 'categoria_prodotto',
  'specifica_w', 'specifica_w_tolleranza', 'specifica_pl', 'specifica_pl_tolleranza',
  'altre_specifiche', 'quantita_prevista', 'unita_misura', 'quantita_kg',
  'lotto_previsto', 'lotto_scadenza', 'origine_materiale', 'silos_origine',
  'linea_produzione', 'prenotazione_consegna_collegata', 'prenotazione_produzione_collegata',
  'tipologia_carico', 'ordine_riferimento', 'ddt_riferimento', 'priorita', 'note',
] as const;

const DATI_CARICO_ALLOWED = [
  'data_carico', 'ora_inizio_carico', 'ora_fine_carico', 'operatore_nome',
  'idoneita_trasporto', 'idoneita_note', 'targa_automezzo', 'targa_rimorchio',
  'nome_autista', 'lotto_caricato', 'scadenza_lotto', 'peso_caricato_kg',
  'peso_tara_kg', 'peso_lordo_kg', 'tipologia_carico', 'numero_colli',
  'ddt_numero', 'ddt_data', 'foto_carico', 'certificato_lavaggio',
] as const;

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    logger.error({ err }, 'Prenotazioni list error');
    next(err);
  }
}

export async function calendario(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    logger.error({ err }, 'Prenotazioni calendario error');
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const [prenotazioneRes, storicoRes, datiCaricoRes, transizioniRes] = await Promise.all([
      pool.query('SELECT * FROM prenotazioni_view WHERE id = $1', [id]),
      pool.query('SELECT * FROM storico_stati_view WHERE prenotazione_id = $1 ORDER BY data_cambio DESC', [id]),
      // 1:1 relationship — return single record or null
      pool.query('SELECT * FROM dati_carico WHERE prenotazione_id = $1 ORDER BY created_at DESC LIMIT 1', [id]),
      pool.query('SELECT * FROM get_transizioni_possibili($1)', [id]),
    ]);

    if (prenotazioneRes.rows.length === 0) {
      throw new NotFoundError('Prenotazione');
    }

    res.json({
      prenotazione: prenotazioneRes.rows[0],
      storico: storicoRes.rows,
      datiCarico: datiCaricoRes.rows[0] ?? null,
      transizioniPossibili: transizioniRes.rows.map((r: Record<string, unknown>) =>
        (r.stato ?? r.transizione ?? Object.values(r)[0]) as string
      ),
    });
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Prenotazioni getById error');
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = { ...req.body, created_by: req.user!.id };

    const result = await pool.query(
      'SELECT * FROM create_prenotazione($1::jsonb)',
      [JSON.stringify(data)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Prenotazioni create error');
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Check state is not final
    const checkResult = await pool.query(
      'SELECT stato FROM prenotazioni WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Prenotazione');
    }

    if ((STATI_FINALI as readonly string[]).includes(checkResult.rows[0].stato)) {
      throw new BusinessRuleError('Impossibile modificare una prenotazione in stato finale');
    }

    const { setClauses, values } = buildUpdateClauses(req.body, PRENOTAZIONI_ALLOWED);

    if (setClauses.length === 0) {
      throw new BusinessRuleError('Nessun campo da aggiornare');
    }

    const result = await pool.query(
      `UPDATE prenotazioni SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Prenotazioni update error');
    next(err);
  }
}

export async function cambioStato(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { stato, note } = req.body;

    const result = await pool.query(
      'SELECT * FROM update_stato_prenotazione($1, $2, $3, $4)',
      [id, stato, note || null, req.user!.id]
    );

    res.json(result.rows[0]);
  } catch (err: unknown) {
    // PostgreSQL RAISE EXCEPTION (code P0001) from state machine stored procedure
    // — surface as business rule error. Other errors pass through to centralized handler.
    const pgErr = err as { code?: string; message?: string };
    if (pgErr.code === 'P0001' && pgErr.message) {
      logger.warn({ err }, 'Prenotazioni cambioStato business rule violation');
      return next(new BusinessRuleError(pgErr.message));
    }
    logger.error({ err }, 'Prenotazioni cambioStato error');
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT stato FROM prenotazioni WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Prenotazione');
    }

    if (checkResult.rows[0].stato !== 'pianificato') {
      throw new BusinessRuleError('Eliminazione consentita solo per prenotazioni in stato pianificato');
    }

    await pool.query('DELETE FROM prenotazioni WHERE id = $1', [id]);
    res.json({ message: 'Prenotazione eliminata' });
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Prenotazioni remove error');
    next(err);
  }
}

// ─── Dati Carico (1:1 relationship with prenotazione) ────────

export async function getDatiCarico(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM dati_carico WHERE prenotazione_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    // 1:1 relationship — return single object or null
    res.json(result.rows[0] ?? null);
  } catch (err) {
    logger.error({ err }, 'Prenotazioni getDatiCarico error');
    next(err);
  }
}

export async function createDatiCarico(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = { ...req.body, operatore_id: req.user!.id };

    const result = await pool.query(
      'SELECT * FROM create_dati_carico($1, $2::jsonb)',
      [id, JSON.stringify(data)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Prenotazioni createDatiCarico error');
    next(err);
  }
}

export async function updateDatiCarico(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { setClauses, values } = buildUpdateClauses(req.body, DATI_CARICO_ALLOWED);

    if (setClauses.length === 0) {
      throw new BusinessRuleError('Nessun campo da aggiornare');
    }

    const result = await pool.query(
      `UPDATE dati_carico SET ${setClauses.join(', ')}, updated_at = NOW() WHERE prenotazione_id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dati carico');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BusinessRuleError) return next(err);
    logger.error({ err }, 'Prenotazioni updateDatiCarico error');
    next(err);
  }
}
