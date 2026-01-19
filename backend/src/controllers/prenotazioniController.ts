import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import { generateCodicePrenotazione } from '../utils/codiceGenerator';
import { calcolaDurataPrevista, calcolaOraFine, convertToKg } from '../utils/tempiCiclo';
import {
  isTransizioneValida,
  getTransizioniPossibili,
  richiedeNoteAnnullamento,
} from '../utils/statoTransizioni';
import { CreatePrenotazioneRequest, UpdateStatoRequest, TipologiaPrenotazione } from '../types';

export async function getPrenotazioni(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      tipologia,
      stato,
      cliente_id,
      trasportatore_id,
      data_da,
      data_a,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: unknown[] = [];
    let paramCount = 0;

    if (tipologia) {
      paramCount++;
      whereConditions.push(`p.tipologia = $${paramCount}`);
      params.push(tipologia);
    }

    if (stato) {
      paramCount++;
      whereConditions.push(`p.stato = $${paramCount}`);
      params.push(stato);
    }

    if (cliente_id) {
      paramCount++;
      whereConditions.push(`p.cliente_id = $${paramCount}`);
      params.push(cliente_id);
    }

    if (trasportatore_id) {
      paramCount++;
      whereConditions.push(`p.trasportatore_id = $${paramCount}`);
      params.push(trasportatore_id);
    }

    if (data_da) {
      paramCount++;
      whereConditions.push(`p.data_pianificata >= $${paramCount}`);
      params.push(data_da);
    }

    if (data_a) {
      paramCount++;
      whereConditions.push(`p.data_pianificata <= $${paramCount}`);
      params.push(data_a);
    }

    if (search) {
      paramCount++;
      whereConditions.push(
        `(p.codice_prenotazione ILIKE $${paramCount} OR p.prodotto_descrizione ILIKE $${paramCount} OR c.ragione_sociale ILIKE $${paramCount})`
      );
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM prenotazioni p
       LEFT JOIN clienti c ON p.cliente_id = c.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get data with joins
    const dataResult = await query(
      `SELECT p.*,
              c.ragione_sociale as cliente_ragione_sociale,
              c.codice as cliente_codice,
              t.ragione_sociale as trasportatore_ragione_sociale,
              t.codice as trasportatore_codice
       FROM prenotazioni p
       LEFT JOIN clienti c ON p.cliente_id = c.id
       LEFT JOIN trasportatori t ON p.trasportatore_id = t.id
       ${whereClause}
       ORDER BY p.data_pianificata DESC, p.ora_inizio_prevista ASC
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
    console.error('GetPrenotazioni error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero prenotazioni' });
  }
}

export async function getPrenotazioniCalendario(req: Request, res: Response): Promise<void> {
  try {
    const { tipologia, data_da, data_a } = req.query;

    if (!data_da || !data_a) {
      res.status(400).json({
        success: false,
        error: 'data_da e data_a sono obbligatori',
      });
      return;
    }

    let whereConditions = ['p.data_pianificata >= $1', 'p.data_pianificata <= $2'];
    let params: unknown[] = [data_da, data_a];

    if (tipologia) {
      whereConditions.push('p.tipologia = $3');
      params.push(tipologia);
    }

    const result = await query(
      `SELECT p.*,
              c.ragione_sociale as cliente_ragione_sociale,
              c.codice as cliente_codice,
              t.ragione_sociale as trasportatore_ragione_sociale,
              t.codice as trasportatore_codice
       FROM prenotazioni p
       LEFT JOIN clienti c ON p.cliente_id = c.id
       LEFT JOIN trasportatori t ON p.trasportatore_id = t.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY p.data_pianificata, p.ora_inizio_prevista`,
      params
    );

    // Format for FullCalendar
    const events = result.rows.map((row) => ({
      id: row.id.toString(),
      title: `${row.cliente_ragione_sociale || 'N/D'} - ${row.prodotto_descrizione || 'N/D'}`,
      start: `${row.data_pianificata.toISOString().split('T')[0]}T${row.ora_inizio_prevista}`,
      end: row.ora_fine_prevista
        ? `${row.data_pianificata.toISOString().split('T')[0]}T${row.ora_fine_prevista}`
        : undefined,
      extendedProps: {
        ...row,
      },
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('GetPrenotazioniCalendario error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero prenotazioni calendario' });
  }
}

export async function getPrenotazione(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*,
              c.ragione_sociale as cliente_ragione_sociale,
              c.codice as cliente_codice,
              c.indirizzo as cliente_indirizzo,
              c.citta as cliente_citta,
              c.provincia as cliente_provincia,
              t.ragione_sociale as trasportatore_ragione_sociale,
              t.codice as trasportatore_codice,
              t.referente_telefono as trasportatore_telefono
       FROM prenotazioni p
       LEFT JOIN clienti c ON p.cliente_id = c.id
       LEFT JOIN trasportatori t ON p.trasportatore_id = t.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
      return;
    }

    // Get state history
    const storicoResult = await query(
      `SELECT ss.*, u.nome as utente_nome, u.cognome as utente_cognome
       FROM storico_stati ss
       LEFT JOIN utenti u ON ss.utente_id = u.id
       WHERE ss.prenotazione_id = $1
       ORDER BY ss.timestamp_cambio DESC`,
      [id]
    );

    // Get dati_carico if exists
    const datiCaricoResult = await query(
      'SELECT * FROM dati_carico WHERE prenotazione_id = $1',
      [id]
    );

    const prenotazione = {
      ...result.rows[0],
      storico_stati: storicoResult.rows,
      dati_carico: datiCaricoResult.rows[0] || null,
      transizioni_possibili: getTransizioniPossibili(
        result.rows[0].tipologia,
        result.rows[0].stato
      ),
    };

    res.json({ success: true, data: prenotazione });
  } catch (error) {
    console.error('GetPrenotazione error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero prenotazione' });
  }
}

export async function createPrenotazione(req: Request, res: Response): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const data: CreatePrenotazioneRequest = req.body;

    // Validation
    if (!data.tipologia || !data.data_pianificata || !data.ora_inizio_prevista) {
      res.status(400).json({
        success: false,
        error: 'Tipologia, data_pianificata e ora_inizio_prevista sono obbligatori',
      });
      return;
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dataPianificata = new Date(data.data_pianificata);
    if (dataPianificata < today) {
      res.status(400).json({
        success: false,
        error: 'La data pianificata non può essere nel passato',
      });
      return;
    }

    // Generate code
    const codicePrenotazione = await generateCodicePrenotazione(data.tipologia);

    // Calculate duration and end time
    let durataMinuti = 60; // default
    let quantitaKg = data.quantita_kg;

    if (data.categoria_prodotto && data.quantita_prevista && data.unita_misura) {
      if (!quantitaKg) {
        quantitaKg = convertToKg(data.quantita_prevista, data.unita_misura);
      }
      durataMinuti = await calcolaDurataPrevista(data.categoria_prodotto, quantitaKg);
    }

    const oraFine = calcolaOraFine(data.ora_inizio_prevista, durataMinuti);

    // Insert prenotazione
    const result = await client.query(
      `INSERT INTO prenotazioni (
        codice_prenotazione, tipologia, cliente_id, trasportatore_id,
        data_pianificata, ora_inizio_prevista, ora_fine_prevista, durata_prevista_minuti,
        prodotto_codice, prodotto_descrizione, categoria_prodotto,
        specifica_w, specifica_w_tolleranza, specifica_pl, specifica_pl_tolleranza,
        quantita_prevista, unita_misura, quantita_kg,
        lotto_previsto, lotto_scadenza,
        origine_materiale, silos_origine, linea_produzione,
        tipologia_carico, ordine_riferimento,
        stato, priorita, note, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'pianificato', $26, $27, $28)
      RETURNING *`,
      [
        codicePrenotazione,
        data.tipologia,
        data.cliente_id || null,
        data.trasportatore_id || null,
        data.data_pianificata,
        data.ora_inizio_prevista,
        oraFine,
        durataMinuti,
        data.prodotto_codice || null,
        data.prodotto_descrizione || null,
        data.categoria_prodotto || null,
        data.specifica_w || null,
        data.specifica_w_tolleranza || null,
        data.specifica_pl || null,
        data.specifica_pl_tolleranza || null,
        data.quantita_prevista || null,
        data.unita_misura || null,
        quantitaKg || null,
        data.lotto_previsto || null,
        data.lotto_scadenza || null,
        data.origine_materiale || null,
        data.silos_origine || null,
        data.linea_produzione || null,
        data.tipologia_carico || null,
        data.ordine_riferimento || null,
        data.priorita || 5,
        data.note || null,
        req.user?.userId || null,
      ]
    );

    const prenotazione = result.rows[0];

    // Insert initial state history
    await client.query(
      `INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
       VALUES ($1, NULL, 'pianificato', $2, 'Prenotazione creata')`,
      [prenotazione.id, req.user?.userId || null]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: prenotazione });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('CreatePrenotazione error:', error);
    res.status(500).json({ success: false, error: 'Errore nella creazione prenotazione' });
  } finally {
    client.release();
  }
}

export async function updatePrenotazione(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    // Get current prenotazione
    const currentResult = await query('SELECT * FROM prenotazioni WHERE id = $1', [id]);

    if (currentResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
      return;
    }

    const current = currentResult.rows[0];

    // Only allow updates for non-final states
    if (['completato', 'partito', 'annullato'].includes(current.stato)) {
      res.status(400).json({
        success: false,
        error: 'Non è possibile modificare una prenotazione in stato finale',
      });
      return;
    }

    // Recalculate duration if relevant fields changed
    let durataMinuti = current.durata_prevista_minuti;
    let oraFine = current.ora_fine_prevista;

    const newCategoria = data.categoria_prodotto || current.categoria_prodotto;
    const newQuantitaKg = data.quantita_kg || current.quantita_kg;
    const newOraInizio = data.ora_inizio_prevista || current.ora_inizio_prevista;

    if (
      newCategoria &&
      newQuantitaKg &&
      (data.categoria_prodotto || data.quantita_kg || data.ora_inizio_prevista)
    ) {
      durataMinuti = await calcolaDurataPrevista(newCategoria, newQuantitaKg);
      oraFine = calcolaOraFine(newOraInizio, durataMinuti);
    }

    const result = await query(
      `UPDATE prenotazioni SET
        cliente_id = COALESCE($1, cliente_id),
        trasportatore_id = COALESCE($2, trasportatore_id),
        data_pianificata = COALESCE($3, data_pianificata),
        ora_inizio_prevista = COALESCE($4, ora_inizio_prevista),
        ora_fine_prevista = $5,
        durata_prevista_minuti = $6,
        prodotto_codice = COALESCE($7, prodotto_codice),
        prodotto_descrizione = COALESCE($8, prodotto_descrizione),
        categoria_prodotto = COALESCE($9, categoria_prodotto),
        specifica_w = COALESCE($10, specifica_w),
        specifica_w_tolleranza = COALESCE($11, specifica_w_tolleranza),
        specifica_pl = COALESCE($12, specifica_pl),
        specifica_pl_tolleranza = COALESCE($13, specifica_pl_tolleranza),
        quantita_prevista = COALESCE($14, quantita_prevista),
        unita_misura = COALESCE($15, unita_misura),
        quantita_kg = COALESCE($16, quantita_kg),
        lotto_previsto = COALESCE($17, lotto_previsto),
        lotto_scadenza = COALESCE($18, lotto_scadenza),
        origine_materiale = COALESCE($19, origine_materiale),
        silos_origine = COALESCE($20, silos_origine),
        linea_produzione = COALESCE($21, linea_produzione),
        tipologia_carico = COALESCE($22, tipologia_carico),
        ordine_riferimento = COALESCE($23, ordine_riferimento),
        priorita = COALESCE($24, priorita),
        note = COALESCE($25, note),
        updated_at = NOW()
      WHERE id = $26
      RETURNING *`,
      [
        data.cliente_id,
        data.trasportatore_id,
        data.data_pianificata,
        data.ora_inizio_prevista,
        oraFine,
        durataMinuti,
        data.prodotto_codice,
        data.prodotto_descrizione,
        data.categoria_prodotto,
        data.specifica_w,
        data.specifica_w_tolleranza,
        data.specifica_pl,
        data.specifica_pl_tolleranza,
        data.quantita_prevista,
        data.unita_misura,
        data.quantita_kg,
        data.lotto_previsto,
        data.lotto_scadenza,
        data.origine_materiale,
        data.silos_origine,
        data.linea_produzione,
        data.tipologia_carico,
        data.ordine_riferimento,
        data.priorita,
        data.note,
        id,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdatePrenotazione error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento prenotazione" });
  }
}

export async function updateStatoPrenotazione(req: Request, res: Response): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { nuovo_stato, note }: UpdateStatoRequest = req.body;

    if (!nuovo_stato) {
      res.status(400).json({ success: false, error: 'nuovo_stato è obbligatorio' });
      return;
    }

    // Get current prenotazione
    const currentResult = await client.query('SELECT * FROM prenotazioni WHERE id = $1', [id]);

    if (currentResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
      return;
    }

    const current = currentResult.rows[0];

    // Validate transition
    if (!isTransizioneValida(current.tipologia, current.stato, nuovo_stato)) {
      res.status(400).json({
        success: false,
        error: `Transizione da "${current.stato}" a "${nuovo_stato}" non consentita`,
        transizioni_possibili: getTransizioniPossibili(current.tipologia, current.stato),
      });
      return;
    }

    // Check if notes are required for cancellation
    if (richiedeNoteAnnullamento(nuovo_stato) && !note) {
      res.status(400).json({
        success: false,
        error: 'Note obbligatorie per annullamento',
      });
      return;
    }

    // Update state
    const updateResult = await client.query(
      `UPDATE prenotazioni SET stato = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [nuovo_stato, id]
    );

    // Insert state history
    await client.query(
      `INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, current.stato, nuovo_stato, req.user?.userId || null, note || null]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updateResult.rows[0],
      transizioni_possibili: getTransizioniPossibili(current.tipologia, nuovo_stato),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('UpdateStatoPrenotazione error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento stato" });
  } finally {
    client.release();
  }
}

export async function deletePrenotazione(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Get current prenotazione
    const currentResult = await query('SELECT * FROM prenotazioni WHERE id = $1', [id]);

    if (currentResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
      return;
    }

    const current = currentResult.rows[0];

    // Only allow deletion for 'pianificato' state
    if (current.stato !== 'pianificato') {
      res.status(400).json({
        success: false,
        error: 'Solo le prenotazioni in stato "pianificato" possono essere eliminate. Usa annullamento per altri stati.',
      });
      return;
    }

    await query('DELETE FROM prenotazioni WHERE id = $1', [id]);

    res.json({ success: true, message: 'Prenotazione eliminata con successo' });
  } catch (error) {
    console.error('DeletePrenotazione error:', error);
    res.status(500).json({ success: false, error: "Errore nell'eliminazione prenotazione" });
  }
}
