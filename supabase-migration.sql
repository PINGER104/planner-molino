-- ================================================================
-- PLANNER MOLINO 4.0 — SUPABASE COMPLETE MIGRATION
-- Run this in the Supabase SQL Editor (in order)
-- ================================================================

-- ============================================
-- 1. TABLES
-- ============================================

-- Utenti (profile table, linked to auth.users)
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
    tipologie_mezzi TEXT[] DEFAULT '{}',
    certificazioni TEXT[] DEFAULT '{}',
    rating_puntualita DECIMAL(3,2) DEFAULT 3.00,
    note TEXT,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    requisiti_documentali TEXT[] DEFAULT '{}',
    finestre_consegna TEXT,
    note TEXT,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prenotazioni
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
    tipologia_carico VARCHAR(20),
    ordine_riferimento VARCHAR(50),
    ddt_riferimento VARCHAR(50),
    prenotazione_produzione_collegata INTEGER REFERENCES prenotazioni(id),
    stato VARCHAR(20) NOT NULL DEFAULT 'pianificato',
    priorita INTEGER DEFAULT 5 CHECK (priorita BETWEEN 1 AND 10),
    note TEXT,
    created_by UUID REFERENCES utenti(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storico stati
CREATE TABLE storico_stati (
    id SERIAL PRIMARY KEY,
    prenotazione_id INTEGER NOT NULL REFERENCES prenotazioni(id) ON DELETE CASCADE,
    stato_precedente VARCHAR(20),
    stato_nuovo VARCHAR(20) NOT NULL,
    timestamp_cambio TIMESTAMPTZ DEFAULT NOW(),
    utente_id UUID REFERENCES utenti(id),
    note TEXT
);

-- Dati carico
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

-- Configurazione tempi ciclo
CREATE TABLE configurazione_tempi_ciclo (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(30) UNIQUE NOT NULL,
    ton_ora DECIMAL(6,2) NOT NULL,
    tempo_setup_minuti INTEGER DEFAULT 15,
    tempo_pulizia_minuti INTEGER DEFAULT 20,
    attivo BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX idx_prenotazioni_data ON prenotazioni(data_pianificata);
CREATE INDEX idx_prenotazioni_tipologia ON prenotazioni(tipologia);
CREATE INDEX idx_prenotazioni_stato ON prenotazioni(stato);
CREATE INDEX idx_prenotazioni_cliente ON prenotazioni(cliente_id);
CREATE INDEX idx_storico_prenotazione ON storico_stati(prenotazione_id);
CREATE INDEX idx_utenti_username ON utenti(username);
CREATE INDEX idx_clienti_codice ON clienti(codice);
CREATE INDEX idx_trasportatori_codice ON trasportatori(codice);

-- ============================================
-- 3. TRIGGERS
-- ============================================

-- Auto-create utenti profile on auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.utenti (id, username, nome, cognome, email, livello_accesso, sezioni_abilitate)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nome', ''),
        COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'livello_accesso', 'visualizzazione'),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(
                CASE WHEN NEW.raw_user_meta_data->'sezioni_abilitate' IS NOT NULL
                     THEN NEW.raw_user_meta_data->'sezioni_abilitate'
                     ELSE '["produzione","consegne"]'::jsonb
                END
            )),
            ARRAY['produzione', 'consegne']
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trasportatori FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON prenotazioni FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE trasportatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE storico_stati ENABLE ROW LEVEL SECURITY;
ALTER TABLE dati_carico ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurazione_tempi_ciclo ENABLE ROW LEVEL SECURITY;

-- Utenti policies
CREATE POLICY "utenti_select" ON utenti FOR SELECT TO authenticated USING (true);
CREATE POLICY "utenti_update_own" ON utenti FOR UPDATE TO authenticated USING (id = auth.uid());

-- Trasportatori policies
CREATE POLICY "trasportatori_select" ON trasportatori FOR SELECT TO authenticated USING (true);
CREATE POLICY "trasportatori_insert" ON trasportatori FOR INSERT TO authenticated
    WITH CHECK ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "trasportatori_update" ON trasportatori FOR UPDATE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "trasportatori_delete" ON trasportatori FOR DELETE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- Clienti policies
CREATE POLICY "clienti_select" ON clienti FOR SELECT TO authenticated USING (true);
CREATE POLICY "clienti_insert" ON clienti FOR INSERT TO authenticated
    WITH CHECK ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "clienti_update" ON clienti FOR UPDATE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "clienti_delete" ON clienti FOR DELETE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- Prenotazioni policies
CREATE POLICY "prenotazioni_select" ON prenotazioni FOR SELECT TO authenticated USING (true);
CREATE POLICY "prenotazioni_insert" ON prenotazioni FOR INSERT TO authenticated
    WITH CHECK ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "prenotazioni_update" ON prenotazioni FOR UPDATE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "prenotazioni_delete" ON prenotazioni FOR DELETE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- Storico stati policies
CREATE POLICY "storico_stati_select" ON storico_stati FOR SELECT TO authenticated USING (true);
CREATE POLICY "storico_stati_insert" ON storico_stati FOR INSERT TO authenticated
    WITH CHECK ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- Dati carico policies
CREATE POLICY "dati_carico_select" ON dati_carico FOR SELECT TO authenticated USING (true);
CREATE POLICY "dati_carico_insert" ON dati_carico FOR INSERT TO authenticated
    WITH CHECK ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');
CREATE POLICY "dati_carico_update" ON dati_carico FOR UPDATE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- Configurazione policies
CREATE POLICY "config_select" ON configurazione_tempi_ciclo FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_update" ON configurazione_tempi_ciclo FOR UPDATE TO authenticated
    USING ((SELECT livello_accesso FROM utenti WHERE id = auth.uid()) = 'modifica');

-- ============================================
-- 5. VIEWS
-- ============================================

CREATE OR REPLACE VIEW prenotazioni_view AS
SELECT
    p.*,
    c.ragione_sociale AS cliente_ragione_sociale,
    c.codice AS cliente_codice,
    c.indirizzo AS cliente_indirizzo,
    c.citta AS cliente_citta,
    c.provincia AS cliente_provincia,
    t.ragione_sociale AS trasportatore_ragione_sociale,
    t.codice AS trasportatore_codice,
    t.referente_telefono AS trasportatore_telefono
FROM prenotazioni p
LEFT JOIN clienti c ON p.cliente_id = c.id
LEFT JOIN trasportatori t ON p.trasportatore_id = t.id;

CREATE OR REPLACE VIEW storico_stati_view AS
SELECT
    ss.*,
    u.nome AS utente_nome,
    u.cognome AS utente_cognome
FROM storico_stati ss
LEFT JOIN utenti u ON ss.utente_id = u.id;

-- ============================================
-- 6. RPC FUNCTIONS (Business Logic)
-- ============================================

-- Code generation: prenotazione
CREATE OR REPLACE FUNCTION generate_codice_prenotazione(p_tipologia TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_year TEXT;
    v_last_code TEXT;
    v_next_num INTEGER;
BEGIN
    v_prefix := CASE WHEN p_tipologia = 'produzione' THEN 'PROD' ELSE 'CONS' END;
    v_year := EXTRACT(YEAR FROM NOW())::TEXT;

    SELECT codice_prenotazione INTO v_last_code
    FROM prenotazioni
    WHERE codice_prenotazione LIKE v_prefix || '-' || v_year || '-%'
    ORDER BY codice_prenotazione DESC
    LIMIT 1;

    IF v_last_code IS NULL THEN
        v_next_num := 1;
    ELSE
        v_next_num := (SPLIT_PART(v_last_code, '-', 3))::INTEGER + 1;
    END IF;

    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Code generation: cliente
CREATE OR REPLACE FUNCTION generate_codice_cliente()
RETURNS TEXT AS $$
DECLARE v_next INTEGER;
BEGIN
    SELECT COALESCE(MAX(REPLACE(codice, 'CLI', '')::INTEGER), 0) + 1
    INTO v_next FROM clienti WHERE codice LIKE 'CLI%';
    RETURN 'CLI' || LPAD(v_next::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Code generation: trasportatore
CREATE OR REPLACE FUNCTION generate_codice_trasportatore()
RETURNS TEXT AS $$
DECLARE v_next INTEGER;
BEGIN
    SELECT COALESCE(MAX(REPLACE(codice, 'TRA', '')::INTEGER), 0) + 1
    INTO v_next FROM trasportatori WHERE codice LIKE 'TRA%';
    RETURN 'TRA' || LPAD(v_next::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Duration calculation
CREATE OR REPLACE FUNCTION calcola_durata_prevista(
    p_categoria TEXT,
    p_quantita_kg DECIMAL,
    p_cambio_prodotto BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    v_ton_ora DECIMAL;
    v_setup INTEGER;
    v_pulizia INTEGER;
    v_quantita_ton DECIMAL;
    v_minuti_lavorazione DECIMAL;
    v_durata_totale DECIMAL;
BEGIN
    SELECT ton_ora, tempo_setup_minuti, tempo_pulizia_minuti
    INTO v_ton_ora, v_setup, v_pulizia
    FROM configurazione_tempi_ciclo
    WHERE categoria = p_categoria AND attivo = true;

    IF v_ton_ora IS NULL THEN
        v_ton_ora := CASE p_categoria
            WHEN 'rinfusa' THEN 10
            WHEN 'confezionato_silos' THEN 4
            ELSE 2
        END;
        v_setup := 15;
        v_pulizia := 20;
    END IF;

    v_quantita_ton := p_quantita_kg / 1000;
    v_minuti_lavorazione := v_quantita_ton * (60.0 / v_ton_ora);
    v_durata_totale := v_setup + v_minuti_lavorazione;

    IF p_cambio_prodotto THEN
        v_durata_totale := v_durata_totale + v_pulizia;
    END IF;

    RETURN CEIL(v_durata_totale / 15.0) * 15;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create prenotazione (transactional: insert + storico_stati)
CREATE OR REPLACE FUNCTION create_prenotazione(p_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_codice TEXT;
    v_durata INTEGER;
    v_quantita_kg DECIMAL;
    v_ora_fine TIME;
    v_prenotazione prenotazioni;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    v_codice := generate_codice_prenotazione(p_data->>'tipologia');

    v_quantita_kg := (p_data->>'quantita_kg')::DECIMAL;
    IF v_quantita_kg IS NULL AND p_data->>'quantita_prevista' IS NOT NULL THEN
        v_quantita_kg := CASE (p_data->>'unita_misura')
            WHEN 'ton' THEN (p_data->>'quantita_prevista')::DECIMAL * 1000
            WHEN 'sacchi' THEN (p_data->>'quantita_prevista')::DECIMAL * 25
            WHEN 'pallet' THEN (p_data->>'quantita_prevista')::DECIMAL * 1000
            ELSE (p_data->>'quantita_prevista')::DECIMAL
        END;
    END IF;

    v_durata := 60;
    IF p_data->>'categoria_prodotto' IS NOT NULL AND v_quantita_kg IS NOT NULL THEN
        v_durata := calcola_durata_prevista(p_data->>'categoria_prodotto', v_quantita_kg);
    END IF;

    v_ora_fine := (p_data->>'ora_inizio_prevista')::TIME + (v_durata || ' minutes')::INTERVAL;

    INSERT INTO prenotazioni (
        codice_prenotazione, tipologia, cliente_id, trasportatore_id,
        data_pianificata, ora_inizio_prevista, ora_fine_prevista, durata_prevista_minuti,
        prodotto_codice, prodotto_descrizione, categoria_prodotto,
        specifica_w, specifica_w_tolleranza, specifica_pl, specifica_pl_tolleranza,
        quantita_prevista, unita_misura, quantita_kg,
        lotto_previsto, lotto_scadenza,
        origine_materiale, silos_origine, linea_produzione,
        tipologia_carico, ordine_riferimento,
        stato, priorita, note, created_by
    ) VALUES (
        v_codice, p_data->>'tipologia',
        (p_data->>'cliente_id')::INTEGER, (p_data->>'trasportatore_id')::INTEGER,
        (p_data->>'data_pianificata')::DATE, (p_data->>'ora_inizio_prevista')::TIME,
        v_ora_fine, v_durata,
        p_data->>'prodotto_codice', p_data->>'prodotto_descrizione', p_data->>'categoria_prodotto',
        (p_data->>'specifica_w')::DECIMAL, (p_data->>'specifica_w_tolleranza')::DECIMAL,
        (p_data->>'specifica_pl')::DECIMAL, (p_data->>'specifica_pl_tolleranza')::DECIMAL,
        (p_data->>'quantita_prevista')::DECIMAL, p_data->>'unita_misura', v_quantita_kg,
        p_data->>'lotto_previsto', (p_data->>'lotto_scadenza')::DATE,
        p_data->>'origine_materiale', p_data->>'silos_origine', p_data->>'linea_produzione',
        p_data->>'tipologia_carico', p_data->>'ordine_riferimento',
        'pianificato', COALESCE((p_data->>'priorita')::INTEGER, 5),
        p_data->>'note', v_user_id
    ) RETURNING * INTO v_prenotazione;

    INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
    VALUES (v_prenotazione.id, NULL, 'pianificato', v_user_id, 'Prenotazione creata');

    RETURN to_jsonb(v_prenotazione);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update stato prenotazione (with transition validation)
CREATE OR REPLACE FUNCTION update_stato_prenotazione(
    p_prenotazione_id INTEGER,
    p_nuovo_stato TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current prenotazioni;
    v_valid_transitions TEXT[];
    v_user_id UUID;
    v_next_transitions TEXT[];
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_current FROM prenotazioni WHERE id = p_prenotazione_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prenotazione non trovata';
    END IF;

    -- Define valid transitions based on tipologia + stato attuale
    IF v_current.tipologia = 'produzione' THEN
        v_valid_transitions := CASE v_current.stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_produzione', 'annullato']
            WHEN 'in_produzione' THEN ARRAY['completato']
            ELSE ARRAY[]::TEXT[]
        END;
    ELSE
        v_valid_transitions := CASE v_current.stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_preparazione', 'annullato']
            WHEN 'in_preparazione' THEN ARRAY['pronto_carico', 'annullato']
            WHEN 'pronto_carico' THEN ARRAY['in_carico', 'annullato']
            WHEN 'in_carico' THEN ARRAY['caricato']
            WHEN 'caricato' THEN ARRAY['partito']
            ELSE ARRAY[]::TEXT[]
        END;
    END IF;

    IF NOT (p_nuovo_stato = ANY(v_valid_transitions)) THEN
        RAISE EXCEPTION 'Transizione da "%" a "%" non consentita', v_current.stato, p_nuovo_stato;
    END IF;

    IF p_nuovo_stato = 'annullato' AND (p_note IS NULL OR TRIM(p_note) = '') THEN
        RAISE EXCEPTION 'Note obbligatorie per annullamento';
    END IF;

    UPDATE prenotazioni SET stato = p_nuovo_stato, updated_at = NOW()
    WHERE id = p_prenotazione_id;

    INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
    VALUES (p_prenotazione_id, v_current.stato, p_nuovo_stato, v_user_id, p_note);

    -- Compute next transitions from the new state
    IF v_current.tipologia = 'produzione' THEN
        v_next_transitions := CASE p_nuovo_stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_produzione', 'annullato']
            WHEN 'in_produzione' THEN ARRAY['completato']
            ELSE ARRAY[]::TEXT[]
        END;
    ELSE
        v_next_transitions := CASE p_nuovo_stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_preparazione', 'annullato']
            WHEN 'in_preparazione' THEN ARRAY['pronto_carico', 'annullato']
            WHEN 'pronto_carico' THEN ARRAY['in_carico', 'annullato']
            WHEN 'in_carico' THEN ARRAY['caricato']
            WHEN 'caricato' THEN ARRAY['partito']
            ELSE ARRAY[]::TEXT[]
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'stato', p_nuovo_stato,
        'transizioni_possibili', to_jsonb(v_next_transitions)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get possible transitions for a prenotazione
CREATE OR REPLACE FUNCTION get_transizioni_possibili(p_prenotazione_id INTEGER)
RETURNS TEXT[] AS $$
DECLARE
    v_current prenotazioni;
BEGIN
    SELECT * INTO v_current FROM prenotazioni WHERE id = p_prenotazione_id;
    IF NOT FOUND THEN RETURN ARRAY[]::TEXT[]; END IF;

    IF v_current.tipologia = 'produzione' THEN
        RETURN CASE v_current.stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_produzione', 'annullato']
            WHEN 'in_produzione' THEN ARRAY['completato']
            ELSE ARRAY[]::TEXT[]
        END;
    ELSE
        RETURN CASE v_current.stato
            WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
            WHEN 'preso_in_carico' THEN ARRAY['in_preparazione', 'annullato']
            WHEN 'in_preparazione' THEN ARRAY['pronto_carico', 'annullato']
            WHEN 'pronto_carico' THEN ARRAY['in_carico', 'annullato']
            WHEN 'in_carico' THEN ARRAY['caricato']
            WHEN 'caricato' THEN ARRAY['partito']
            ELSE ARRAY[]::TEXT[]
        END;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create dati carico (transactional: insert dati_carico + update stato + storico)
CREATE OR REPLACE FUNCTION create_dati_carico(
    p_prenotazione_id INTEGER,
    p_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_prenotazione prenotazioni;
    v_user_id UUID;
    v_operatore_nome TEXT;
    v_result dati_carico;
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_prenotazione FROM prenotazioni WHERE id = p_prenotazione_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Prenotazione non trovata'; END IF;
    IF v_prenotazione.tipologia != 'consegna' THEN
        RAISE EXCEPTION 'I dati carico possono essere registrati solo per prenotazioni di tipo consegna';
    END IF;
    IF v_prenotazione.stato != 'in_carico' THEN
        RAISE EXCEPTION 'I dati carico possono essere registrati solo quando lo stato è in_carico';
    END IF;

    IF EXISTS (SELECT 1 FROM dati_carico WHERE prenotazione_id = p_prenotazione_id) THEN
        RAISE EXCEPTION 'Dati carico già registrati per questa prenotazione';
    END IF;

    SELECT nome || ' ' || cognome INTO v_operatore_nome FROM utenti WHERE id = v_user_id;

    INSERT INTO dati_carico (
        prenotazione_id, data_carico, ora_inizio_carico, ora_fine_carico,
        operatore_id, operatore_nome,
        idoneita_trasporto, idoneita_note, targa_automezzo, targa_rimorchio, nome_autista,
        lotto_caricato, scadenza_lotto, peso_caricato_kg, peso_tara_kg, peso_lordo_kg,
        tipologia_carico, numero_colli, ddt_numero, ddt_data
    ) VALUES (
        p_prenotazione_id,
        (p_data->>'data_carico')::DATE,
        (p_data->>'ora_inizio_carico')::TIME,
        (p_data->>'ora_fine_carico')::TIME,
        v_user_id, v_operatore_nome,
        (p_data->>'idoneita_trasporto')::BOOLEAN,
        p_data->>'idoneita_note',
        p_data->>'targa_automezzo',
        p_data->>'targa_rimorchio',
        p_data->>'nome_autista',
        p_data->>'lotto_caricato',
        (p_data->>'scadenza_lotto')::DATE,
        (p_data->>'peso_caricato_kg')::DECIMAL,
        (p_data->>'peso_tara_kg')::DECIMAL,
        (p_data->>'peso_lordo_kg')::DECIMAL,
        p_data->>'tipologia_carico',
        (p_data->>'numero_colli')::INTEGER,
        p_data->>'ddt_numero',
        (p_data->>'ddt_data')::DATE
    ) RETURNING * INTO v_result;

    UPDATE prenotazioni
    SET stato = 'caricato', ddt_riferimento = p_data->>'ddt_numero', updated_at = NOW()
    WHERE id = p_prenotazione_id;

    INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
    VALUES (p_prenotazione_id, 'in_carico', 'caricato', v_user_id, 'Dati carico registrati');

    RETURN to_jsonb(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cliente with auto-generated code
CREATE OR REPLACE FUNCTION create_cliente(p_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_codice TEXT;
    v_result clienti;
BEGIN
    v_codice := generate_codice_cliente();

    INSERT INTO clienti (
        codice, ragione_sociale, partita_iva, codice_fiscale,
        indirizzo, cap, citta, provincia, nazione,
        destinazione_diversa, dest_indirizzo, dest_cap, dest_citta, dest_provincia,
        telefono, email, referente_ordini,
        canale, modalita_consegna, requisiti_documentali,
        finestre_consegna, note
    ) VALUES (
        v_codice, p_data->>'ragione_sociale', p_data->>'partita_iva', p_data->>'codice_fiscale',
        p_data->>'indirizzo', p_data->>'cap', p_data->>'citta', p_data->>'provincia',
        COALESCE(p_data->>'nazione', 'IT'),
        COALESCE((p_data->>'destinazione_diversa')::BOOLEAN, false),
        p_data->>'dest_indirizzo', p_data->>'dest_cap', p_data->>'dest_citta', p_data->>'dest_provincia',
        p_data->>'telefono', p_data->>'email', p_data->>'referente_ordini',
        p_data->>'canale', p_data->>'modalita_consegna',
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'requisiti_documentali')), ARRAY[]::TEXT[]),
        p_data->>'finestre_consegna', p_data->>'note'
    ) RETURNING * INTO v_result;

    RETURN to_jsonb(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trasportatore with auto-generated code
CREATE OR REPLACE FUNCTION create_trasportatore(p_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_codice TEXT;
    v_result trasportatori;
BEGIN
    v_codice := generate_codice_trasportatore();

    INSERT INTO trasportatori (
        codice, ragione_sociale, partita_iva, indirizzo_sede,
        referente_nome, referente_telefono, referente_email,
        tipologie_mezzi, certificazioni, rating_puntualita, note
    ) VALUES (
        v_codice, p_data->>'ragione_sociale', p_data->>'partita_iva', p_data->>'indirizzo_sede',
        p_data->>'referente_nome', p_data->>'referente_telefono', p_data->>'referente_email',
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'tipologie_mezzi')), ARRAY[]::TEXT[]),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'certificazioni')), ARRAY[]::TEXT[]),
        COALESCE((p_data->>'rating_puntualita')::DECIMAL, 3.00),
        p_data->>'note'
    ) RETURNING * INTO v_result;

    RETURN to_jsonb(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. SEED DATA
-- ============================================

INSERT INTO configurazione_tempi_ciclo (categoria, ton_ora, tempo_setup_minuti, tempo_pulizia_minuti)
VALUES
    ('rinfusa', 10.00, 15, 20),
    ('confezionato_silos', 4.00, 15, 20),
    ('confezionato_sacco', 2.00, 15, 25)
ON CONFLICT (categoria) DO NOTHING;
