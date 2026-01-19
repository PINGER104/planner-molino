import { Request, Response } from 'express';
import { query } from '../config/database';
import { generateCodiceTrasportatore } from '../utils/codiceGenerator';

export async function getTrasportatori(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, search, attivo } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: unknown[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(
        `(codice ILIKE $${paramCount} OR ragione_sociale ILIKE $${paramCount} OR referente_nome ILIKE $${paramCount})`
      );
      params.push(`%${search}%`);
    }

    if (attivo !== undefined) {
      paramCount++;
      whereConditions.push(`attivo = $${paramCount}`);
      params.push(attivo === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM trasportatori ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get data
    const dataResult = await query(
      `SELECT * FROM trasportatori
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
    console.error('GetTrasportatori error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero trasportatori' });
  }
}

export async function getTrasportatore(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM trasportatori WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trasportatore non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('GetTrasportatore error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero trasportatore' });
  }
}

export async function createTrasportatore(req: Request, res: Response): Promise<void> {
  try {
    const {
      codice,
      ragione_sociale,
      partita_iva,
      indirizzo_sede,
      referente_nome,
      referente_telefono,
      referente_email,
      tipologie_mezzi,
      certificazioni,
      rating_puntualita,
      note,
    } = req.body;

    if (!ragione_sociale) {
      res.status(400).json({ success: false, error: 'Ragione sociale è obbligatoria' });
      return;
    }

    // Generate code if not provided
    const finalCodice = codice || (await generateCodiceTrasportatore());

    // Check code uniqueness
    const existingCode = await query('SELECT id FROM trasportatori WHERE codice = $1', [
      finalCodice,
    ]);
    if (existingCode.rows.length > 0) {
      res.status(400).json({ success: false, error: 'Codice già esistente' });
      return;
    }

    const result = await query(
      `INSERT INTO trasportatori (
        codice, ragione_sociale, partita_iva, indirizzo_sede,
        referente_nome, referente_telefono, referente_email,
        tipologie_mezzi, certificazioni, rating_puntualita, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        finalCodice,
        ragione_sociale,
        partita_iva || null,
        indirizzo_sede || null,
        referente_nome || null,
        referente_telefono || null,
        referente_email || null,
        tipologie_mezzi || [],
        certificazioni || [],
        rating_puntualita || 3.0,
        note || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('CreateTrasportatore error:', error);
    res.status(500).json({ success: false, error: 'Errore nella creazione trasportatore' });
  }
}

export async function updateTrasportatore(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      ragione_sociale,
      partita_iva,
      indirizzo_sede,
      referente_nome,
      referente_telefono,
      referente_email,
      tipologie_mezzi,
      certificazioni,
      rating_puntualita,
      note,
      attivo,
    } = req.body;

    const result = await query(
      `UPDATE trasportatori SET
        ragione_sociale = COALESCE($1, ragione_sociale),
        partita_iva = COALESCE($2, partita_iva),
        indirizzo_sede = COALESCE($3, indirizzo_sede),
        referente_nome = COALESCE($4, referente_nome),
        referente_telefono = COALESCE($5, referente_telefono),
        referente_email = COALESCE($6, referente_email),
        tipologie_mezzi = COALESCE($7, tipologie_mezzi),
        certificazioni = COALESCE($8, certificazioni),
        rating_puntualita = COALESCE($9, rating_puntualita),
        note = COALESCE($10, note),
        attivo = COALESCE($11, attivo),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        ragione_sociale,
        partita_iva,
        indirizzo_sede,
        referente_nome,
        referente_telefono,
        referente_email,
        tipologie_mezzi,
        certificazioni,
        rating_puntualita,
        note,
        attivo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trasportatore non trovato' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UpdateTrasportatore error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento trasportatore" });
  }
}

export async function deleteTrasportatore(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if trasportatore has associated prenotazioni
    const prenotazioniCheck = await query(
      'SELECT COUNT(*) FROM prenotazioni WHERE trasportatore_id = $1',
      [id]
    );

    if (parseInt(prenotazioniCheck.rows[0].count, 10) > 0) {
      // Soft delete - just deactivate
      const result = await query(
        'UPDATE trasportatori SET attivo = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Trasportatore non trovato' });
        return;
      }

      res.json({
        success: true,
        message: 'Trasportatore disattivato (esistono prenotazioni associate)',
      });
    } else {
      // Hard delete if no associations
      const result = await query('DELETE FROM trasportatori WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Trasportatore non trovato' });
        return;
      }

      res.json({ success: true, message: 'Trasportatore eliminato con successo' });
    }
  } catch (error) {
    console.error('DeleteTrasportatore error:', error);
    res.status(500).json({ success: false, error: "Errore nell'eliminazione trasportatore" });
  }
}

// Get all active trasportatori for dropdown
export async function getTrasportatoriDropdown(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, codice, ragione_sociale, tipologie_mezzi
       FROM trasportatori
       WHERE attivo = true
       ORDER BY ragione_sociale`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GetTrasportatoriDropdown error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero trasportatori' });
  }
}
