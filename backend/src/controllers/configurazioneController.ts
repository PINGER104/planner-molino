import { Request, Response } from 'express';
import { query } from '../config/database';

export async function getTempiCiclo(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      'SELECT * FROM configurazione_tempi_ciclo ORDER BY categoria'
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GetTempiCiclo error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero tempi ciclo' });
  }
}

export async function updateTempiCiclo(req: Request, res: Response): Promise<void> {
  try {
    const { categoria } = req.params;
    const { ton_ora, tempo_setup_minuti, tempo_pulizia_minuti, attivo } = req.body;

    const result = await query(
      `UPDATE configurazione_tempi_ciclo SET
        ton_ora = COALESCE($1, ton_ora),
        tempo_setup_minuti = COALESCE($2, tempo_setup_minuti),
        tempo_pulizia_minuti = COALESCE($3, tempo_pulizia_minuti),
        attivo = COALESCE($4, attivo),
        updated_at = NOW()
      WHERE categoria = $5
      RETURNING *`,
      [ton_ora, tempo_setup_minuti, tempo_pulizia_minuti, attivo, categoria]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Configurazione non trovata' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdateTempiCiclo error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento tempi ciclo" });
  }
}

export async function calcolaDurata(req: Request, res: Response): Promise<void> {
  try {
    const { categoria_prodotto, quantita_kg, cambio_prodotto } = req.body;

    if (!categoria_prodotto || !quantita_kg) {
      res.status(400).json({
        success: false,
        error: 'categoria_prodotto e quantita_kg sono obbligatori',
      });
      return;
    }

    // Get configuration
    const configResult = await query(
      'SELECT * FROM configurazione_tempi_ciclo WHERE categoria = $1 AND attivo = true',
      [categoria_prodotto]
    );

    if (configResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Configurazione tempi ciclo non trovata per questa categoria',
      });
      return;
    }

    const config = configResult.rows[0];
    const quantitaTon = quantita_kg / 1000;
    const minutiPerTon = 60 / parseFloat(config.ton_ora);
    const tempoLavorazione = quantitaTon * minutiPerTon;

    let durataTotale = config.tempo_setup_minuti + tempoLavorazione;

    if (cambio_prodotto) {
      durataTotale += config.tempo_pulizia_minuti;
    }

    // Round up to 15-minute slots
    const durataArrotondata = Math.ceil(durataTotale / 15) * 15;

    res.json({
      success: true,
      data: {
        durata_minuti: durataArrotondata,
        dettaglio: {
          tempo_setup: config.tempo_setup_minuti,
          tempo_lavorazione: Math.round(tempoLavorazione),
          tempo_pulizia: cambio_prodotto ? config.tempo_pulizia_minuti : 0,
          durata_non_arrotondata: Math.round(durataTotale),
        },
      },
    });
  } catch (error) {
    console.error('CalcolaDurata error:', error);
    res.status(500).json({ success: false, error: 'Errore nel calcolo durata' });
  }
}

// Dashboard stats
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const { tipologia } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let tipologiaFilter = '';
    const params: unknown[] = [today];

    if (tipologia) {
      tipologiaFilter = 'AND tipologia = $2';
      params.push(tipologia);
    }

    // Today's bookings
    const todayResult = await query(
      `SELECT stato, COUNT(*) as count
       FROM prenotazioni
       WHERE data_pianificata = $1 ${tipologiaFilter}
       GROUP BY stato`,
      params
    );

    // Week's bookings
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekParams = [today, weekEnd.toISOString().split('T')[0]];
    if (tipologia) weekParams.push(tipologia as string);

    const weekResult = await query(
      `SELECT data_pianificata, COUNT(*) as count
       FROM prenotazioni
       WHERE data_pianificata >= $1 AND data_pianificata <= $2 ${tipologia ? 'AND tipologia = $3' : ''}
       GROUP BY data_pianificata
       ORDER BY data_pianificata`,
      weekParams
    );

    // Pending/In progress counts
    const pendingParams = tipologia ? [tipologia] : [];
    const pendingResult = await query(
      `SELECT
         SUM(CASE WHEN stato = 'pianificato' THEN 1 ELSE 0 END) as pianificato,
         SUM(CASE WHEN stato = 'preso_in_carico' THEN 1 ELSE 0 END) as preso_in_carico,
         SUM(CASE WHEN stato IN ('in_produzione', 'in_preparazione', 'pronto_carico', 'in_carico') THEN 1 ELSE 0 END) as in_corso
       FROM prenotazioni
       WHERE stato NOT IN ('completato', 'caricato', 'partito', 'annullato')
       ${tipologia ? 'AND tipologia = $1' : ''}`,
      pendingParams
    );

    res.json({
      success: true,
      data: {
        oggi: todayResult.rows,
        settimana: weekResult.rows,
        riepilogo: pendingResult.rows[0],
      },
    });
  } catch (error) {
    console.error('GetDashboardStats error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero statistiche' });
  }
}
