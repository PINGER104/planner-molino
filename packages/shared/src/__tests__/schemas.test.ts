import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  changePasswordSchema,
  createClienteSchema,
  updateClienteSchema,
  createTrasportatoreSchema,
  updateTrasportatoreSchema,
  createPrenotazioneSchema,
  updatePrenotazioneSchema,
  cambioStatoSchema,
  createDatiCaricoSchema,
  updateDatiCaricoSchema,
  createUtenteSchema,
  updateUtenteSchema,
  updateTempiCicloSchema,
  calcolaDurataSchema,
  resetPasswordSchema,
} from '../schemas';

// ─── Auth Schemas ────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '123456',
      newPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '123456',
      newPassword: '12',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Cliente Schemas ─────────────────────────────────────────

describe('createClienteSchema', () => {
  it('accepts minimal required fields', () => {
    const result = createClienteSchema.safeParse({
      ragione_sociale: 'ACME S.r.l.',
      nazione: 'IT',
      destinazione_diversa: false,
      requisiti_documentali: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing ragione_sociale', () => {
    const result = createClienteSchema.safeParse({
      nazione: 'IT',
      destinazione_diversa: false,
      requisiti_documentali: [],
    });
    expect(result.success).toBe(false);
  });

  it('strips unknown fields', () => {
    const result = createClienteSchema.safeParse({
      ragione_sociale: 'Test',
      nazione: 'IT',
      destinazione_diversa: false,
      requisiti_documentali: [],
      evil_field: 'DROP TABLE',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('evil_field' in result.data).toBe(false);
    }
  });
});

describe('updateClienteSchema', () => {
  it('accepts partial updates', () => {
    const result = updateClienteSchema.safeParse({ ragione_sociale: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateClienteSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── Trasportatore Schemas ───────────────────────────────────

describe('createTrasportatoreSchema', () => {
  it('accepts valid trasportatore', () => {
    const result = createTrasportatoreSchema.safeParse({
      ragione_sociale: 'Trasporti SpA',
      tipologie_mezzi: ['bilico'],
      certificazioni: ['ISO9001'],
      rating_puntualita: 4.5,
    });
    expect(result.success).toBe(true);
  });
});

// ─── Prenotazione Schemas ────────────────────────────────────

describe('createPrenotazioneSchema', () => {
  it('accepts valid prenotazione', () => {
    const result = createPrenotazioneSchema.safeParse({
      tipologia: 'produzione',
      cliente_id: 1,
      data_pianificata: '2026-03-25',
      ora_inizio_prevista: '08:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid tipologia', () => {
    const result = createPrenotazioneSchema.safeParse({
      tipologia: 'invalid',
      cliente_id: 1,
      data_pianificata: '2026-03-25',
      ora_inizio_prevista: '08:00',
    });
    expect(result.success).toBe(false);
  });
});

describe('cambioStatoSchema', () => {
  it('accepts stato without note', () => {
    const result = cambioStatoSchema.safeParse({ stato: 'preso_in_carico' });
    expect(result.success).toBe(true);
  });

  it('requires note when annullato', () => {
    const result = cambioStatoSchema.safeParse({ stato: 'annullato' });
    expect(result.success).toBe(false);
  });

  it('accepts annullato with note', () => {
    const result = cambioStatoSchema.safeParse({ stato: 'annullato', note: 'Motivo annullamento' });
    expect(result.success).toBe(true);
  });
});

// ─── Dati Carico Schemas ─────────────────────────────────────

describe('createDatiCaricoSchema', () => {
  const validData = {
    data_carico: '2026-03-25',
    idoneita_trasporto: true,
    targa_automezzo: 'AB123CD',
    lotto_caricato: 'LOT001',
    peso_caricato_kg: 25000,
  };

  it('accepts valid data', () => {
    const result = createDatiCaricoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('requires idoneita_note when idoneita_trasporto is false', () => {
    const result = createDatiCaricoSchema.safeParse({
      ...validData,
      idoneita_trasporto: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepts idoneita false with note', () => {
    const result = createDatiCaricoSchema.safeParse({
      ...validData,
      idoneita_trasporto: false,
      idoneita_note: 'Mezzo sporco',
    });
    expect(result.success).toBe(true);
  });

  it('defaults foto_carico to empty array', () => {
    const result = createDatiCaricoSchema.safeParse(validData);
    if (result.success) {
      expect(result.data.foto_carico).toEqual([]);
    }
  });
});

// ─── Utente Schemas ──────────────────────────────────────────

describe('createUtenteSchema', () => {
  it('accepts valid utente', () => {
    const result = createUtenteSchema.safeParse({
      username: 'mario',
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@example.com',
      password: '123456',
      livello_accesso: 'modifica',
      sezioni_abilitate: ['produzione'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects short username', () => {
    const result = createUtenteSchema.safeParse({
      username: 'ab',
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@example.com',
      password: '123456',
      livello_accesso: 'modifica',
      sezioni_abilitate: ['produzione'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty sezioni_abilitate', () => {
    const result = createUtenteSchema.safeParse({
      username: 'mario',
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@example.com',
      password: '123456',
      livello_accesso: 'modifica',
      sezioni_abilitate: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid livello_accesso', () => {
    const result = createUtenteSchema.safeParse({
      username: 'mario',
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@example.com',
      password: '123456',
      livello_accesso: 'admin',
      sezioni_abilitate: ['produzione'],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUtenteSchema', () => {
  it('accepts partial fields', () => {
    const result = updateUtenteSchema.safeParse({ nome: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = updateUtenteSchema.safeParse({ nome: 'Test', id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('id' in result.data).toBe(false);
    }
  });
});

// ─── Configurazione Schemas (NEW) ────────────────────────────

describe('updateTempiCicloSchema', () => {
  it('accepts valid partial update', () => {
    const result = updateTempiCicloSchema.safeParse({ ton_ora: 5.5 });
    expect(result.success).toBe(true);
  });

  it('accepts all fields', () => {
    const result = updateTempiCicloSchema.safeParse({
      ton_ora: 5.5,
      tempo_setup_minuti: 30,
      tempo_pulizia_minuti: 15,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative ton_ora', () => {
    const result = updateTempiCicloSchema.safeParse({ ton_ora: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative tempo_setup_minuti', () => {
    const result = updateTempiCicloSchema.safeParse({ tempo_setup_minuti: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts empty object', () => {
    const result = updateTempiCicloSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('calcolaDurataSchema', () => {
  it('accepts valid calculation request', () => {
    const result = calcolaDurataSchema.safeParse({
      categoria: 'rinfusa',
      quantita_kg: 25000,
    });
    expect(result.success).toBe(true);
  });

  it('defaults cambio_prodotto to false', () => {
    const result = calcolaDurataSchema.safeParse({
      categoria: 'rinfusa',
      quantita_kg: 25000,
    });
    if (result.success) {
      expect(result.data.cambio_prodotto).toBe(false);
    }
  });

  it('rejects missing categoria', () => {
    const result = calcolaDurataSchema.safeParse({ quantita_kg: 25000 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantita_kg', () => {
    const result = calcolaDurataSchema.safeParse({ categoria: 'rinfusa', quantita_kg: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantita_kg', () => {
    const result = calcolaDurataSchema.safeParse({ categoria: 'rinfusa', quantita_kg: 0 });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid password', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'newpass123' });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = resetPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
