import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database for migration endpoint
import { query } from './config/database';
import bcrypt from 'bcryptjs';

// Import routes
import authRoutes from './routes/auth';
import utentiRoutes from './routes/utenti';
import trasportatoriRoutes from './routes/trasportatori';
import clientiRoutes from './routes/clienti';
import prenotazioniRoutes from './routes/prenotazioni';
import configurazioneRoutes from './routes/configurazione';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.trim()))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== TEMPORARY MIGRATION ENDPOINT (remove after first deploy) ==========
app.get('/api/setup-db', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const logs: string[] = [];
  try {
    // Run migration
    logs.push('Starting migration...');
    await query(`
      DROP TABLE IF EXISTS dati_carico CASCADE;
      DROP TABLE IF EXISTS storico_stati CASCADE;
      DROP TABLE IF EXISTS prenotazioni CASCADE;
      DROP TABLE IF EXISTS configurazione_tempi_ciclo CASCADE;
      DROP TABLE IF EXISTS clienti CASCADE;
      DROP TABLE IF EXISTS trasportatori CASCADE;
      DROP TABLE IF EXISTS utenti CASCADE;

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

      CREATE TABLE prenotazioni (
        id SERIAL PRIMARY KEY,
        codice_prenotazione VARCHAR(30) UNIQUE NOT NULL,
        tipologia VARCHAR(15) CHECK (tipologia IN ('produzione', 'consegna')),
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
        tipologia_carico VARCHAR(20),
        ordine_riferimento VARCHAR(50),
        ddt_riferimento VARCHAR(50),
        prenotazione_produzione_collegata INTEGER REFERENCES prenotazioni(id),
        stato VARCHAR(20) NOT NULL DEFAULT 'pianificato',
        priorita INTEGER DEFAULT 5 CHECK (priorita BETWEEN 1 AND 10),
        note TEXT,
        created_by INTEGER REFERENCES utenti(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE storico_stati (
        id SERIAL PRIMARY KEY,
        prenotazione_id INTEGER REFERENCES prenotazioni(id) ON DELETE CASCADE,
        stato_precedente VARCHAR(20),
        stato_nuovo VARCHAR(20) NOT NULL,
        timestamp_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        utente_id INTEGER REFERENCES utenti(id),
        note TEXT
      );

      CREATE TABLE dati_carico (
        id SERIAL PRIMARY KEY,
        prenotazione_id INTEGER UNIQUE REFERENCES prenotazioni(id) ON DELETE CASCADE,
        data_carico DATE NOT NULL,
        ora_inizio_carico TIME,
        ora_fine_carico TIME,
        operatore_id INTEGER REFERENCES utenti(id),
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
        tipologia_carico VARCHAR(20) CHECK (tipologia_carico IN ('big_bag', 'sacchi', 'cisterna')),
        numero_colli INTEGER,
        ddt_numero VARCHAR(50),
        ddt_data DATE,
        foto_carico TEXT[],
        certificato_lavaggio TEXT,
        registrato_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE configurazione_tempi_ciclo (
        id SERIAL PRIMARY KEY,
        categoria VARCHAR(30) UNIQUE NOT NULL,
        ton_ora DECIMAL(6,2) NOT NULL,
        tempo_setup_minuti INTEGER DEFAULT 15,
        tempo_pulizia_minuti INTEGER DEFAULT 20,
        attivo BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_prenotazioni_data ON prenotazioni(data_pianificata);
      CREATE INDEX idx_prenotazioni_tipologia ON prenotazioni(tipologia);
      CREATE INDEX idx_prenotazioni_stato ON prenotazioni(stato);
      CREATE INDEX idx_prenotazioni_cliente ON prenotazioni(cliente_id);
      CREATE INDEX idx_storico_prenotazione ON storico_stati(prenotazione_id);
      CREATE INDEX idx_utenti_username ON utenti(username);
      CREATE INDEX idx_clienti_codice ON clienti(codice);
      CREATE INDEX idx_trasportatori_codice ON trasportatori(codice);
    `);
    logs.push('Migration completed!');

    // Run seed
    logs.push('Starting seed...');
    const passwordHash = await bcrypt.hash('password123', 10);

    await query(`
      INSERT INTO utenti (username, password_hash, nome, cognome, email, ruolo, livello_accesso, sezioni_abilitate, attivo)
      VALUES
        ('admin', $1, 'Admin', 'Sistema', 'admin@molino.it', 'Amministratore', 'modifica', ARRAY['produzione', 'consegne'], true),
        ('operatore_prod', $1, 'Mario', 'Rossi', 'mario.rossi@molino.it', 'Operatore Produzione', 'modifica', ARRAY['produzione'], true),
        ('operatore_log', $1, 'Luigi', 'Bianchi', 'luigi.bianchi@molino.it', 'Operatore Logistica', 'modifica', ARRAY['consegne'], true),
        ('commerciale', $1, 'Anna', 'Verdi', 'anna.verdi@molino.it', 'Commerciale', 'visualizzazione', ARRAY['produzione', 'consegne'], true),
        ('direzione', $1, 'Giuseppe', 'Neri', 'giuseppe.neri@molino.it', 'Direzione', 'visualizzazione', ARRAY['produzione', 'consegne'], true)
      ON CONFLICT (username) DO NOTHING
    `, [passwordHash]);
    logs.push('Users seeded!');

    await query(`
      INSERT INTO trasportatori (codice, ragione_sociale, partita_iva, indirizzo_sede, referente_nome, referente_telefono, referente_email, tipologie_mezzi, certificazioni, rating_puntualita, attivo)
      VALUES
        ('TRA001', 'Trasporti Veloci SRL', '12345678901', 'Via Roma 100, Milano', 'Marco Trasporti', '02-1234567', 'info@trasportiveloci.it', ARRAY['cisterna', 'bilico'], ARRAY['ATP', 'trasporto_alimentari'], 4.5, true),
        ('TRA002', 'Logistica Nord SpA', '98765432109', 'Via Torino 50, Torino', 'Paolo Logistica', '011-9876543', 'info@logisticanord.it', ARRAY['bilico', 'furgone', 'motrice'], ARRAY['trasporto_alimentari', 'BIO'], 4.0, true),
        ('TRA003', 'Autotrasporti Bianchi', '11223344556', 'Via Venezia 25, Padova', 'Luca Bianchi', '049-1122334', 'info@autobianchi.it', ARRAY['cisterna'], ARRAY['ATP', 'trasporto_alimentari'], 3.5, true),
        ('TRA004', 'Express Delivery SRL', '55443322110', 'Via Napoli 80, Roma', 'Giulia Express', '06-5544332', 'info@expressdelivery.it', ARRAY['furgone', 'motrice'], ARRAY['trasporto_alimentari'], 4.2, true),
        ('TRA005', 'Trasporti Alimentari Italia', '99887766554', 'Via Bologna 120, Bologna', 'Roberto TAI', '051-9988776', 'info@tai.it', ARRAY['cisterna', 'bilico', 'furgone'], ARRAY['ATP', 'BIO', 'trasporto_alimentari'], 4.8, true)
      ON CONFLICT (codice) DO NOTHING
    `);
    logs.push('Transporters seeded!');

    await query(`
      INSERT INTO clienti (codice, ragione_sociale, partita_iva, indirizzo, cap, citta, provincia, canale, modalita_consegna, requisiti_documentali, attivo)
      VALUES
        ('CLI001', 'Panificio Da Mario SRL', '11111111111', 'Via del Pane 10', '20100', 'Milano', 'MI', 'dettaglio', 'franco_destino', ARRAY['certificato_analisi'], true),
        ('CLI002', 'Pastificio Artigiano SpA', '22222222222', 'Via della Pasta 20', '10100', 'Torino', 'TO', 'industria', 'franco_partenza', ARRAY['certificato_analisi', 'scheda_tecnica'], true),
        ('CLI003', 'Supermercati UniFood', '33333333333', 'Via Grande Distribuzione 100', '00100', 'Roma', 'RM', 'GDO', 'franco_destino', ARRAY['certificato_analisi', 'certificato_BIO'], true),
        ('CLI004', 'Ristorante La Buona Tavola', '44444444444', 'Piazza Garibaldi 5', '50100', 'Firenze', 'FI', 'HORECA', 'franco_destino', ARRAY['certificato_analisi'], true),
        ('CLI005', 'Export Foods International', '55555555555', 'Via Export 200', '40100', 'Bologna', 'BO', 'export', 'franco_partenza', ARRAY['certificato_analisi', 'scheda_tecnica', 'certificato_BIO'], true),
        ('CLI006', 'Dolciaria Rossi e Figli', '66666666666', 'Via Dolce 15', '35100', 'Padova', 'PD', 'industria', 'ritiro_cliente', ARRAY['certificato_analisi'], true),
        ('CLI007', 'Coop Centro Italia', '77777777777', 'Via Cooperazione 50', '06100', 'Perugia', 'PG', 'GDO', 'franco_destino', ARRAY['certificato_analisi', 'scheda_tecnica'], true),
        ('CLI008', 'Pizza Express Chain', '88888888888', 'Via della Pizza 30', '80100', 'Napoli', 'NA', 'HORECA', 'franco_destino', ARRAY['certificato_analisi'], true)
      ON CONFLICT (codice) DO NOTHING
    `);
    logs.push('Clients seeded!');

    await query(`
      INSERT INTO configurazione_tempi_ciclo (categoria, ton_ora, tempo_setup_minuti, tempo_pulizia_minuti, attivo)
      VALUES
        ('rinfusa', 10.00, 15, 20, true),
        ('confezionato_silos', 4.00, 15, 20, true),
        ('confezionato_sacco', 2.00, 15, 25, true)
      ON CONFLICT (categoria) DO NOTHING
    `);
    logs.push('Configuration seeded!');
    logs.push('ALL DONE - Database setup complete!');

    res.json({ success: true, logs });
  } catch (error: any) {
    logs.push(`ERROR: ${error.message}`);
    res.status(500).json({ success: false, logs, error: error.message });
  }
});
// ========== END TEMPORARY MIGRATION ENDPOINT ==========

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/utenti', utentiRoutes);
app.use('/api/trasportatori', trasportatoriRoutes);
app.use('/api/clienti', clientiRoutes);
app.use('/api/prenotazioni', prenotazioniRoutes);
app.use('/api/configurazione', configurazioneRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint non trovato' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Errore interno del server',
  });
});

// Start server only when not running on Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
