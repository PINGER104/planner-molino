import { Request, Response } from 'express';
import pool from '../config/database';
import { calcolaDurataPrevista } from '@planner-molino/shared';

export async function getTempiCiclo(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT * FROM configurazione_tempi_ciclo WHERE attivo = true ORDER BY categoria'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Configurazione getTempiCiclo error:', err);
    res.status(500).json({ error: 'Errore nel recupero tempi ciclo' });
  }
}

export async function updateTempiCiclo(req: Request, res: Response): Promise<void> {
  try {
    const { categoria } = req.params;
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
      res.status(404).json({ error: 'Categoria non trovata' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Configurazione updateTempiCiclo error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento tempi ciclo' });
  }
}

export async function calcolaDurata(req: Request, res: Response): Promise<void> {
  try {
    const { categoria, quantita_kg, cambio_prodotto } = req.body;

    if (!categoria || !quantita_kg) {
      res.status(400).json({ error: 'Parametri categoria e quantita_kg obbligatori' });
      return;
    }

    // Fetch config from DB
    const configResult = await pool.query(
      'SELECT ton_ora, tempo_setup_minuti, tempo_pulizia_minuti FROM configurazione_tempi_ciclo WHERE categoria = $1 AND attivo = true',
      [categoria]
    );

    if (configResult.rows.length === 0) {
      res.status(404).json({ error: 'Configurazione non trovata per la categoria' });
      return;
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
    console.error('Configurazione calcolaDurata error:', err);
    res.status(500).json({ error: 'Errore nel calcolo durata' });
  }
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
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
    console.error('Configurazione getDashboardStats error:', err);
    res.status(500).json({ error: 'Errore nel recupero statistiche dashboard' });
  }
}
