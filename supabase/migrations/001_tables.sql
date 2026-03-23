-- ============================================================
-- Planner Molino v4.0 — Migration 001: Tables
-- Creates all 7 tables in correct FK order
-- ============================================================

-- 1. utenti — synchronized with Supabase auth.users
CREATE TABLE utenti (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  telefono VARCHAR(30),
  ruolo VARCHAR(100),
  livello_accesso VARCHAR(20) NOT NULL CHECK (livello_accesso IN ('visualizzazione', 'modifica')),
  sezioni_abilitate TEXT[] NOT NULL DEFAULT '{}',
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ultimo_accesso TIMESTAMPTZ
);

-- 2. clienti
CREATE TABLE clienti (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  ragione_sociale VARCHAR(200) NOT NULL,
  partita_iva VARCHAR(20),
  codice_fiscale VARCHAR(20),
  indirizzo TEXT,
  cap VARCHAR(10),
  citta VARCHAR(100),
  provincia VARCHAR(5),
  nazione VARCHAR(5) DEFAULT 'IT',
  destinazione_diversa BOOLEAN DEFAULT false,
  dest_indirizzo TEXT,
  dest_cap VARCHAR(10),
  dest_citta VARCHAR(100),
  dest_provincia VARCHAR(5),
  telefono VARCHAR(30),
  email VARCHAR(150),
  referente_ordini VARCHAR(100),
  canale VARCHAR(20),
  modalita_consegna VARCHAR(30),
  requisiti_documentali TEXT[] DEFAULT '{}',
  finestre_consegna TEXT,
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. trasportatori
CREATE TABLE trasportatori (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  ragione_sociale VARCHAR(200) NOT NULL,
  partita_iva VARCHAR(20),
  indirizzo_sede TEXT,
  referente_nome VARCHAR(100),
  referente_telefono VARCHAR(30),
  referente_email VARCHAR(150),
  tipologie_mezzi TEXT[] DEFAULT '{}',
  certificazioni TEXT[] DEFAULT '{}',
  rating_puntualita DECIMAL(3,2) DEFAULT 3.00,
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. prenotazioni — main table with FK to clienti, trasportatori, and self-referencing
CREATE TABLE prenotazioni (
  id SERIAL PRIMARY KEY,
  codice_prenotazione VARCHAR(30) UNIQUE NOT NULL,
  tipologia VARCHAR(15) NOT NULL CHECK (tipologia IN ('produzione', 'consegna')),
  cliente_id INTEGER REFERENCES clienti(id),
  trasportatore_id INTEGER REFERENCES trasportatori(id),
  data_pianificata DATE NOT NULL,
  ora_inizio_prevista TIME NOT NULL,
  ora_fine_prevista TIME,
  durata_prevista_minuti INTEGER,
  prodotto_codice VARCHAR(50),
  prodotto_descrizione VARCHAR(200),
  categoria_prodotto VARCHAR(30) CHECK (categoria_prodotto IN ('rinfusa', 'confezionato_silos', 'confezionato_sacco')),
  specifica_w DECIMAL(6,2),
  specifica_w_tolleranza DECIMAL(4,2),
  specifica_pl DECIMAL(4,2),
  specifica_pl_tolleranza DECIMAL(4,2),
  altre_specifiche JSONB,
  quantita_prevista DECIMAL(12,3),
  unita_misura VARCHAR(10),
  quantita_kg DECIMAL(12,3),
  lotto_previsto VARCHAR(50),
  lotto_scadenza DATE,
  origine_materiale VARCHAR(20),
  silos_origine VARCHAR(20),
  linea_produzione VARCHAR(30),
  prenotazione_consegna_collegata INTEGER REFERENCES prenotazioni(id),
  prenotazione_produzione_collegata INTEGER REFERENCES prenotazioni(id),
  tipologia_carico VARCHAR(20),
  ordine_riferimento VARCHAR(50),
  ddt_riferimento VARCHAR(50),
  stato VARCHAR(20) NOT NULL DEFAULT 'pianificato',
  priorita INTEGER CHECK (priorita BETWEEN 1 AND 10) DEFAULT 5,
  note TEXT,
  created_by UUID REFERENCES utenti(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. storico_stati — audit trail
CREATE TABLE storico_stati (
  id SERIAL PRIMARY KEY,
  prenotazione_id INTEGER NOT NULL REFERENCES prenotazioni(id) ON DELETE CASCADE,
  stato_precedente VARCHAR(20),
  stato_nuovo VARCHAR(20) NOT NULL,
  timestamp_cambio TIMESTAMPTZ DEFAULT NOW(),
  utente_id UUID REFERENCES utenti(id),
  note TEXT
);

-- 6. dati_carico — 1:1 with delivery prenotazione
CREATE TABLE dati_carico (
  id SERIAL PRIMARY KEY,
  prenotazione_id INTEGER UNIQUE NOT NULL REFERENCES prenotazioni(id) ON DELETE CASCADE,
  data_carico DATE NOT NULL,
  ora_inizio_carico TIME,
  ora_fine_carico TIME,
  operatore_id UUID REFERENCES utenti(id),
  operatore_nome VARCHAR(100),
  idoneita_trasporto BOOLEAN NOT NULL,
  idoneita_note TEXT,
  targa_automezzo VARCHAR(20) NOT NULL,
  targa_rimorchio VARCHAR(20),
  nome_autista VARCHAR(100),
  lotto_caricato VARCHAR(50) NOT NULL,
  scadenza_lotto DATE,
  peso_caricato_kg DECIMAL(12,3) NOT NULL,
  peso_tara_kg DECIMAL(12,3),
  peso_lordo_kg DECIMAL(12,3),
  tipologia_carico VARCHAR(20) CHECK (tipologia_carico IN ('big_bag', 'sacchi', 'cisterna', 'pallet')),
  numero_colli INTEGER,
  ddt_numero VARCHAR(50),
  ddt_data DATE,
  foto_carico TEXT[] DEFAULT '{}',
  certificato_lavaggio TEXT,
  registrato_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. configurazione_tempi_ciclo
CREATE TABLE configurazione_tempi_ciclo (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(30) UNIQUE NOT NULL,
  ton_ora DECIMAL(6,2) NOT NULL,
  tempo_setup_minuti INTEGER DEFAULT 15,
  tempo_pulizia_minuti INTEGER DEFAULT 20,
  attivo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
