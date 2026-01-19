import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const migrationSQL = `
-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS dati_carico CASCADE;
DROP TABLE IF EXISTS storico_stati CASCADE;
DROP TABLE IF EXISTS prenotazioni CASCADE;
DROP TABLE IF EXISTS configurazione_tempi_ciclo CASCADE;
DROP TABLE IF EXISTS clienti CASCADE;
DROP TABLE IF EXISTS trasportatori CASCADE;
DROP TABLE IF EXISTS utenti CASCADE;

-- Utenti
CREATE TABLE utenti (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(30),
    ruolo VARCHAR(100),
    livello_accesso VARCHAR(20) CHECK (livello_accesso IN ('visualizzazione', 'modifica')),
    sezioni_abilitate TEXT[],
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_accesso TIMESTAMP
);

-- Trasportatori
CREATE TABLE trasportatori (
    id SERIAL PRIMARY KEY,
    codice VARCHAR(20) UNIQUE NOT NULL,
    ragione_sociale VARCHAR(200) NOT NULL,
    partita_iva VARCHAR(20),
    indirizzo_sede TEXT,
    referente_nome VARCHAR(100),
    referente_telefono VARCHAR(30),
    referente_email VARCHAR(150),
    tipologie_mezzi TEXT[],
    certificazioni TEXT[],
    rating_puntualita DECIMAL(3,2) DEFAULT 3.00,
    note TEXT,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clienti
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
    requisiti_documentali TEXT[],
    finestre_consegna TEXT,
    note TEXT,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prenotazioni (tabella principale)
CREATE TABLE prenotazioni (
    id SERIAL PRIMARY KEY,
    codice_prenotazione VARCHAR(30) UNIQUE NOT NULL,
    tipologia VARCHAR(15) CHECK (tipologia IN ('produzione', 'consegna')),

    -- Riferimenti
    cliente_id INTEGER REFERENCES clienti(id),
    trasportatore_id INTEGER REFERENCES trasportatori(id),

    -- Schedulazione
    data_pianificata DATE NOT NULL,
    ora_inizio_prevista TIME NOT NULL,
    ora_fine_prevista TIME,
    durata_prevista_minuti INTEGER,

    -- Prodotto
    prodotto_codice VARCHAR(50),
    prodotto_descrizione VARCHAR(200),
    categoria_prodotto VARCHAR(30) CHECK (categoria_prodotto IN ('rinfusa', 'confezionato_silos', 'confezionato_sacco')),

    -- Specifiche tecniche
    specifica_w DECIMAL(6,2),
    specifica_w_tolleranza DECIMAL(4,2),
    specifica_pl DECIMAL(4,2),
    specifica_pl_tolleranza DECIMAL(4,2),
    altre_specifiche JSONB,

    -- Quantità
    quantita_prevista DECIMAL(12,3),
    unita_misura VARCHAR(10),
    quantita_kg DECIMAL(12,3),

    -- Lotto
    lotto_previsto VARCHAR(50),
    lotto_scadenza DATE,

    -- Specifico produzione
    origine_materiale VARCHAR(20),
    silos_origine VARCHAR(20),
    linea_produzione VARCHAR(30),
    prenotazione_consegna_collegata INTEGER REFERENCES prenotazioni(id),

    -- Specifico consegne
    tipologia_carico VARCHAR(20),
    ordine_riferimento VARCHAR(50),
    ddt_riferimento VARCHAR(50),
    prenotazione_produzione_collegata INTEGER REFERENCES prenotazioni(id),

    -- Stato
    stato VARCHAR(20) NOT NULL DEFAULT 'pianificato',
    priorita INTEGER DEFAULT 5 CHECK (priorita BETWEEN 1 AND 10),

    -- Metadati
    note TEXT,
    created_by INTEGER REFERENCES utenti(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storico stati
CREATE TABLE storico_stati (
    id SERIAL PRIMARY KEY,
    prenotazione_id INTEGER REFERENCES prenotazioni(id) ON DELETE CASCADE,
    stato_precedente VARCHAR(20),
    stato_nuovo VARCHAR(20) NOT NULL,
    timestamp_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utente_id INTEGER REFERENCES utenti(id),
    note TEXT
);

-- Dati carico (registrazione completamento)
CREATE TABLE dati_carico (
    id SERIAL PRIMARY KEY,
    prenotazione_id INTEGER UNIQUE REFERENCES prenotazioni(id) ON DELETE CASCADE,

    -- Temporali
    data_carico DATE NOT NULL,
    ora_inizio_carico TIME,
    ora_fine_carico TIME,

    -- Operatore
    operatore_id INTEGER REFERENCES utenti(id),
    operatore_nome VARCHAR(100),

    -- Verifica mezzo
    idoneita_trasporto BOOLEAN NOT NULL,
    idoneita_note TEXT,
    targa_automezzo VARCHAR(20) NOT NULL,
    targa_rimorchio VARCHAR(20),
    nome_autista VARCHAR(100),

    -- Prodotto effettivo
    lotto_caricato VARCHAR(50) NOT NULL,
    scadenza_lotto DATE,
    peso_caricato_kg DECIMAL(12,3) NOT NULL,
    peso_tara_kg DECIMAL(12,3),
    peso_lordo_kg DECIMAL(12,3),

    -- Modalità
    tipologia_carico VARCHAR(20) CHECK (tipologia_carico IN ('big_bag', 'sacchi', 'cisterna')),
    numero_colli INTEGER,

    -- Documentazione
    ddt_numero VARCHAR(50),
    ddt_data DATE,

    -- Allegati
    foto_carico TEXT[],
    certificato_lavaggio TEXT,

    registrato_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurazione tempi ciclo
CREATE TABLE configurazione_tempi_ciclo (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(30) UNIQUE NOT NULL,
    ton_ora DECIMAL(6,2) NOT NULL,
    tempo_setup_minuti INTEGER DEFAULT 15,
    tempo_pulizia_minuti INTEGER DEFAULT 20,
    attivo BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_prenotazioni_data ON prenotazioni(data_pianificata);
CREATE INDEX idx_prenotazioni_tipologia ON prenotazioni(tipologia);
CREATE INDEX idx_prenotazioni_stato ON prenotazioni(stato);
CREATE INDEX idx_prenotazioni_cliente ON prenotazioni(cliente_id);
CREATE INDEX idx_storico_prenotazione ON storico_stati(prenotazione_id);
CREATE INDEX idx_utenti_username ON utenti(username);
CREATE INDEX idx_clienti_codice ON clienti(codice);
CREATE INDEX idx_trasportatori_codice ON trasportatori(codice);
`;

async function migrate() {
  console.log('Starting database migration...');

  try {
    await pool.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
