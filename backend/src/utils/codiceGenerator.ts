import { query } from '../config/database';
import { TipologiaPrenotazione } from '../types';

export async function generateCodicePrenotazione(tipologia: TipologiaPrenotazione): Promise<string> {
  const prefix = tipologia === 'produzione' ? 'PROD' : 'CONS';
  const year = new Date().getFullYear();

  // Get the latest code for this type and year
  const result = await query(
    `SELECT codice_prenotazione
     FROM prenotazioni
     WHERE codice_prenotazione LIKE $1
     ORDER BY codice_prenotazione DESC
     LIMIT 1`,
    [`${prefix}-${year}-%`]
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastCode = result.rows[0].codice_prenotazione;
    const lastNumber = parseInt(lastCode.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function generateCodiceTrasportatore(): Promise<string> {
  const result = await query(
    `SELECT codice
     FROM trasportatori
     WHERE codice LIKE 'TRA%'
     ORDER BY codice DESC
     LIMIT 1`
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastCode = result.rows[0].codice;
    const lastNumber = parseInt(lastCode.replace('TRA', ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `TRA${nextNumber.toString().padStart(3, '0')}`;
}

export async function generateCodiceCliente(): Promise<string> {
  const result = await query(
    `SELECT codice
     FROM clienti
     WHERE codice LIKE 'CLI%'
     ORDER BY codice DESC
     LIMIT 1`
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastCode = result.rows[0].codice;
    const lastNumber = parseInt(lastCode.replace('CLI', ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `CLI${nextNumber.toString().padStart(3, '0')}`;
}
