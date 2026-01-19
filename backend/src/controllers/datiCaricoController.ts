import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import { CreateDatiCaricoRequest } from '../types';

export async function getDatiCarico(req: Request, res: Response): Promise<void> {
  try {
    const { prenotazione_id } = req.params;

    const result = await query(
      `SELECT dc.*, u.nome as operatore_nome_completo, u.cognome as operatore_cognome
       FROM dati_carico dc
       LEFT JOIN utenti u ON dc.operatore_id = u.id
       WHERE dc.prenotazione_id = $1`,
      [prenotazione_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Dati carico non trovati' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('GetDatiCarico error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero dati carico' });
  }
}

export async function createDatiCarico(req: Request, res: Response): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { prenotazione_id } = req.params;
    const data: CreateDatiCaricoRequest = req.body;

    // Validation
    if (!data.data_carico || !data.targa_automezzo || !data.lotto_caricato || data.peso_caricato_kg === undefined) {
      res.status(400).json({
        success: false,
        error: 'data_carico, targa_automezzo, lotto_caricato e peso_caricato_kg sono obbligatori',
      });
      return;
    }

    if (data.idoneita_trasporto === undefined) {
      res.status(400).json({
        success: false,
        error: 'idoneita_trasporto è obbligatorio',
      });
      return;
    }

    // Check if idoneita is false and note is missing
    if (data.idoneita_trasporto === false && !data.idoneita_note) {
      res.status(400).json({
        success: false,
        error: 'Note obbligatorie se idoneità trasporto è negativa',
      });
      return;
    }

    // Check prenotazione exists and is in correct state
    const prenotazioneResult = await client.query(
      'SELECT * FROM prenotazioni WHERE id = $1',
      [prenotazione_id]
    );

    if (prenotazioneResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
      return;
    }

    const prenotazione = prenotazioneResult.rows[0];

    if (prenotazione.tipologia !== 'consegna') {
      res.status(400).json({
        success: false,
        error: 'I dati carico possono essere registrati solo per prenotazioni di tipo consegna',
      });
      return;
    }

    if (prenotazione.stato !== 'in_carico') {
      res.status(400).json({
        success: false,
        error: 'I dati carico possono essere registrati solo quando lo stato è "in_carico"',
      });
      return;
    }

    // Check if dati_carico already exists
    const existingResult = await client.query(
      'SELECT id FROM dati_carico WHERE prenotazione_id = $1',
      [prenotazione_id]
    );

    if (existingResult.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Dati carico già registrati per questa prenotazione',
      });
      return;
    }

    // Get operator name
    let operatoreNome = null;
    if (req.user?.userId) {
      const userResult = await client.query(
        'SELECT nome, cognome FROM utenti WHERE id = $1',
        [req.user.userId]
      );
      if (userResult.rows.length > 0) {
        operatoreNome = `${userResult.rows[0].nome} ${userResult.rows[0].cognome}`;
      }
    }

    // Insert dati_carico
    const insertResult = await client.query(
      `INSERT INTO dati_carico (
        prenotazione_id, data_carico, ora_inizio_carico, ora_fine_carico,
        operatore_id, operatore_nome,
        idoneita_trasporto, idoneita_note, targa_automezzo, targa_rimorchio, nome_autista,
        lotto_caricato, scadenza_lotto, peso_caricato_kg, peso_tara_kg, peso_lordo_kg,
        tipologia_carico, numero_colli, ddt_numero, ddt_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        prenotazione_id,
        data.data_carico,
        data.ora_inizio_carico || null,
        data.ora_fine_carico || null,
        req.user?.userId || null,
        operatoreNome,
        data.idoneita_trasporto,
        data.idoneita_note || null,
        data.targa_automezzo,
        data.targa_rimorchio || null,
        data.nome_autista || null,
        data.lotto_caricato,
        data.scadenza_lotto || null,
        data.peso_caricato_kg,
        data.peso_tara_kg || null,
        data.peso_lordo_kg || null,
        data.tipologia_carico || null,
        data.numero_colli || null,
        data.ddt_numero || null,
        data.ddt_data || null,
      ]
    );

    // Update prenotazione state to 'caricato'
    await client.query(
      `UPDATE prenotazioni SET stato = 'caricato', ddt_riferimento = $1, updated_at = NOW() WHERE id = $2`,
      [data.ddt_numero || null, prenotazione_id]
    );

    // Insert state history
    await client.query(
      `INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
       VALUES ($1, 'in_carico', 'caricato', $2, 'Dati carico registrati')`,
      [prenotazione_id, req.user?.userId || null]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: insertResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('CreateDatiCarico error:', error);
    res.status(500).json({ success: false, error: 'Errore nella registrazione dati carico' });
  } finally {
    client.release();
  }
}

export async function updateDatiCarico(req: Request, res: Response): Promise<void> {
  try {
    const { prenotazione_id } = req.params;
    const data = req.body;

    // Check if idoneita is false and note is missing
    if (data.idoneita_trasporto === false && !data.idoneita_note) {
      res.status(400).json({
        success: false,
        error: 'Note obbligatorie se idoneità trasporto è negativa',
      });
      return;
    }

    const result = await query(
      `UPDATE dati_carico SET
        data_carico = COALESCE($1, data_carico),
        ora_inizio_carico = COALESCE($2, ora_inizio_carico),
        ora_fine_carico = COALESCE($3, ora_fine_carico),
        idoneita_trasporto = COALESCE($4, idoneita_trasporto),
        idoneita_note = COALESCE($5, idoneita_note),
        targa_automezzo = COALESCE($6, targa_automezzo),
        targa_rimorchio = COALESCE($7, targa_rimorchio),
        nome_autista = COALESCE($8, nome_autista),
        lotto_caricato = COALESCE($9, lotto_caricato),
        scadenza_lotto = COALESCE($10, scadenza_lotto),
        peso_caricato_kg = COALESCE($11, peso_caricato_kg),
        peso_tara_kg = COALESCE($12, peso_tara_kg),
        peso_lordo_kg = COALESCE($13, peso_lordo_kg),
        tipologia_carico = COALESCE($14, tipologia_carico),
        numero_colli = COALESCE($15, numero_colli),
        ddt_numero = COALESCE($16, ddt_numero),
        ddt_data = COALESCE($17, ddt_data)
      WHERE prenotazione_id = $18
      RETURNING *`,
      [
        data.data_carico,
        data.ora_inizio_carico,
        data.ora_fine_carico,
        data.idoneita_trasporto,
        data.idoneita_note,
        data.targa_automezzo,
        data.targa_rimorchio,
        data.nome_autista,
        data.lotto_caricato,
        data.scadenza_lotto,
        data.peso_caricato_kg,
        data.peso_tara_kg,
        data.peso_lordo_kg,
        data.tipologia_carico,
        data.numero_colli,
        data.ddt_numero,
        data.ddt_data,
        prenotazione_id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Dati carico non trovati' });
      return;
    }

    // Update DDT reference in prenotazione if changed
    if (data.ddt_numero) {
      await query(
        'UPDATE prenotazioni SET ddt_riferimento = $1 WHERE id = $2',
        [data.ddt_numero, prenotazione_id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdateDatiCarico error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento dati carico" });
  }
}
