import { Request, Response } from 'express';
import { query } from '../config/database';
import { generateCodiceCliente } from '../utils/codiceGenerator';

export async function getClienti(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, search, attivo, canale } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: unknown[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(
        `(codice ILIKE $${paramCount} OR ragione_sociale ILIKE $${paramCount} OR citta ILIKE $${paramCount})`
      );
      params.push(`%${search}%`);
    }

    if (attivo !== undefined) {
      paramCount++;
      whereConditions.push(`attivo = $${paramCount}`);
      params.push(attivo === 'true');
    }

    if (canale) {
      paramCount++;
      whereConditions.push(`canale = $${paramCount}`);
      params.push(canale);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM clienti ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get data
    const dataResult = await query(
      `SELECT * FROM clienti
       ${whereClause}
       ORDER BY ragione_sociale
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
    console.error('GetClienti error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero clienti' });
  }
}

export async function getCliente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM clienti WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Cliente non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('GetCliente error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero cliente' });
  }
}

export async function createCliente(req: Request, res: Response): Promise<void> {
  try {
    const {
      codice,
      ragione_sociale,
      partita_iva,
      codice_fiscale,
      indirizzo,
      cap,
      citta,
      provincia,
      nazione,
      destinazione_diversa,
      dest_indirizzo,
      dest_cap,
      dest_citta,
      dest_provincia,
      telefono,
      email,
      referente_ordini,
      canale,
      modalita_consegna,
      requisiti_documentali,
      finestre_consegna,
      note,
    } = req.body;

    if (!ragione_sociale) {
      res.status(400).json({ success: false, error: 'Ragione sociale è obbligatoria' });
      return;
    }

    // Generate code if not provided
    const finalCodice = codice || (await generateCodiceCliente());

    // Check code uniqueness
    const existingCode = await query('SELECT id FROM clienti WHERE codice = $1', [finalCodice]);
    if (existingCode.rows.length > 0) {
      res.status(400).json({ success: false, error: 'Codice già esistente' });
      return;
    }

    const result = await query(
      `INSERT INTO clienti (
        codice, ragione_sociale, partita_iva, codice_fiscale,
        indirizzo, cap, citta, provincia, nazione,
        destinazione_diversa, dest_indirizzo, dest_cap, dest_citta, dest_provincia,
        telefono, email, referente_ordini,
        canale, modalita_consegna, requisiti_documentali, finestre_consegna, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        finalCodice,
        ragione_sociale,
        partita_iva || null,
        codice_fiscale || null,
        indirizzo || null,
        cap || null,
        citta || null,
        provincia || null,
        nazione || 'IT',
        destinazione_diversa || false,
        dest_indirizzo || null,
        dest_cap || null,
        dest_citta || null,
        dest_provincia || null,
        telefono || null,
        email || null,
        referente_ordini || null,
        canale || null,
        modalita_consegna || null,
        requisiti_documentali || [],
        finestre_consegna || null,
        note || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('CreateCliente error:', error);
    res.status(500).json({ success: false, error: 'Errore nella creazione cliente' });
  }
}

export async function updateCliente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      ragione_sociale,
      partita_iva,
      codice_fiscale,
      indirizzo,
      cap,
      citta,
      provincia,
      nazione,
      destinazione_diversa,
      dest_indirizzo,
      dest_cap,
      dest_citta,
      dest_provincia,
      telefono,
      email,
      referente_ordini,
      canale,
      modalita_consegna,
      requisiti_documentali,
      finestre_consegna,
      note,
      attivo,
    } = req.body;

    const result = await query(
      `UPDATE clienti SET
        ragione_sociale = COALESCE($1, ragione_sociale),
        partita_iva = COALESCE($2, partita_iva),
        codice_fiscale = COALESCE($3, codice_fiscale),
        indirizzo = COALESCE($4, indirizzo),
        cap = COALESCE($5, cap),
        citta = COALESCE($6, citta),
        provincia = COALESCE($7, provincia),
        nazione = COALESCE($8, nazione),
        destinazione_diversa = COALESCE($9, destinazione_diversa),
        dest_indirizzo = COALESCE($10, dest_indirizzo),
        dest_cap = COALESCE($11, dest_cap),
        dest_citta = COALESCE($12, dest_citta),
        dest_provincia = COALESCE($13, dest_provincia),
        telefono = COALESCE($14, telefono),
        email = COALESCE($15, email),
        referente_ordini = COALESCE($16, referente_ordini),
        canale = COALESCE($17, canale),
        modalita_consegna = COALESCE($18, modalita_consegna),
        requisiti_documentali = COALESCE($19, requisiti_documentali),
        finestre_consegna = COALESCE($20, finestre_consegna),
        note = COALESCE($21, note),
        attivo = COALESCE($22, attivo),
        updated_at = NOW()
      WHERE id = $23
      RETURNING *`,
      [
        ragione_sociale,
        partita_iva,
        codice_fiscale,
        indirizzo,
        cap,
        citta,
        provincia,
        nazione,
        destinazione_diversa,
        dest_indirizzo,
        dest_cap,
        dest_citta,
        dest_provincia,
        telefono,
        email,
        referente_ordini,
        canale,
        modalita_consegna,
        requisiti_documentali,
        finestre_consegna,
        note,
        attivo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Cliente non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdateCliente error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento cliente" });
  }
}

export async function deleteCliente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if cliente has associated prenotazioni
    const prenotazioniCheck = await query(
      'SELECT COUNT(*) FROM prenotazioni WHERE cliente_id = $1',
      [id]
    );

    if (parseInt(prenotazioniCheck.rows[0].count, 10) > 0) {
      // Soft delete - just deactivate
      const result = await query(
        'UPDATE clienti SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Cliente non trovato' });
        return;
      }

      res.json({
        success: true,
        message: 'Cliente disattivato (esistono prenotazioni associate)',
      });
    } else {
      // Hard delete if no associations
      const result = await query('DELETE FROM clienti WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Cliente non trovato' });
        return;
      }

      res.json({ success: true, message: 'Cliente eliminato con successo' });
    }
  } catch (error) {
    console.error('DeleteCliente error:', error);
    res.status(500).json({ success: false, error: "Errore nell'eliminazione cliente" });
  }
}

// Get all active clienti for dropdown
export async function getClientiDropdown(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, codice, ragione_sociale, citta, provincia
       FROM clienti
       WHERE attivo = true
       ORDER BY ragione_sociale`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GetClientiDropdown error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero clienti' });
  }
}
