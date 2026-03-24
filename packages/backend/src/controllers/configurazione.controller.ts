import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { calcolaDurataPrevista } from '@planner-molino/shared';
import { logger } from '../lib/logger';
import { NotFoundError } from '../lib/errors';

export async function getTempiCiclo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT * FROM configurazione_tempi_ciclo WHERE attivo = true ORDER BY categoria'
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'Configurazione getTempiCiclo error');
    next(err);
  }
}

export async function updateTempiCiclo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoria } = req.params;
    // Body is already validated by Zod (updateTempiCicloSchema)
    const { ton_ora, tempo_setup_minuti, tempo_pulizia_minuti } = req.body;

    const result = await pool.query(
      `UPDATE configurazione_tempi_ciclo
       SET ton_ora = COALESCE($2, ton_ora),
           tempo_setup_minuti = COALESCE($3, tempo_setup_minuti),
           tempo_pulizia_minuti = COALESCE($4, tempo_pulizia_minuti),
           updated_at = NOW()
       WHERE categoria = $1
       RETURNING *`,
      [categoria, ton_ora, tempo_setup_minuti, tempo_pulizia_minuti]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Categoria');
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Configurazione updateTempiCiclo error');
    next(err);
  }
}

export async function calcolaDurata(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Body is already validated by Zod (calcolaDurataSchema)
    const { categoria, quantita_kg, cambio_prodotto } = req.body;

    const configResult = await pool.query(
      'SELECT ton_ora, tempo_setup_minuti, tempo_pulizia_minuti FROM configurazione_tempi_ciclo WHERE categoria = $1 AND attivo = true',
      [categoria]
    );

    if (configResult.rows.length === 0) {
      throw new NotFoundError('Configurazione per la categoria');
    }

    const config = configResult.rows[0];

    const durata_minuti = calcolaDurataPrevista(
      quantita_kg,
      config.ton_ora,
      config.tempo_setup_minuti,
      config.tempo_pulizia_minuti,
      cambio_prodotto ?? false
    );

    res.json({ durata_minuti });
  } catch (err) {
    if (err instanceof NotFoundError) return next(err);
    logger.error({ err }, 'Configurazione calcolaDurata error');
    next(err);
  }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE data_pianificata = CURRENT_DATE) as oggi_totale,
        COUNT(*) FILTER (WHERE data_pianificata = CURRENT_DATE AND stato NOT IN ('completato','partito','annullato')) as oggi_in_corso,
        COUNT(*) FILTER (WHERE data_pianificata = CURRENT_DATE AND stato IN ('completato','partito')) as oggi_completate,
        COUNT(*) FILTER (WHERE stato = 'pianificato') as in_attesa,
        COUNT(*) FILTER (WHERE tipologia = 'produzione' AND data_pianificata = CURRENT_DATE) as produzione_oggi,
        COUNT(*) FILTER (WHERE tipologia = 'consegna' AND data_pianificata = CURRENT_DATE) as consegne_oggi
      FROM prenotazioni
    `);

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Configurazione getDashboardStats error');
    next(err);
  }
}
