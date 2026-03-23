-- ============================================================
-- Planner Molino v4.0 — Migration 002: Functions & Triggers
-- 12 PL/pgSQL functions + triggers
-- ============================================================

-- -------------------------------------------------------
-- 1. handle_new_user() — Trigger on auth.users INSERT
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO utenti (id, username, nome, cognome, email, livello_accesso, sezioni_abilitate)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'livello_accesso', 'visualizzazione'),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'sezioni_abilitate')),
      ARRAY['produzione', 'consegne']
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------------------
-- 2. update_updated_at() — Generic trigger for updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_clienti_updated_at
  BEFORE UPDATE ON clienti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trasportatori_updated_at
  BEFORE UPDATE ON trasportatori
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prenotazioni_updated_at
  BEFORE UPDATE ON prenotazioni
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_configurazione_updated_at
  BEFORE UPDATE ON configurazione_tempi_ciclo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- 3. generate_codice_prenotazione(tipo TEXT)
--    Generates PROD-YYYY-NNNN or CONS-YYYY-NNNN
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_codice_prenotazione(tipo TEXT)
RETURNS TEXT AS $$
DECLARE
  prefisso TEXT;
  anno TEXT;
  prossimo_numero INTEGER;
  codice TEXT;
BEGIN
  prefisso := CASE WHEN tipo = 'produzione' THEN 'PROD' ELSE 'CONS' END;
  anno := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codice_prenotazione, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO prossimo_numero
  FROM prenotazioni
  WHERE codice_prenotazione LIKE prefisso || '-' || anno || '-%';

  codice := prefisso || '-' || anno || '-' || LPAD(prossimo_numero::TEXT, 4, '0');
  RETURN codice;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 4. generate_codice_cliente() — CLI001, CLI002...
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_codice_cliente()
RETURNS TEXT AS $$
DECLARE
  prossimo INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codice FROM 4) AS INTEGER)), 0) + 1
  INTO prossimo
  FROM clienti;
  RETURN 'CLI' || LPAD(prossimo::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 5. generate_codice_trasportatore() — TRA001, TRA002...
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_codice_trasportatore()
RETURNS TEXT AS $$
DECLARE
  prossimo INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codice FROM 4) AS INTEGER)), 0) + 1
  INTO prossimo
  FROM trasportatori;
  RETURN 'TRA' || LPAD(prossimo::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 6. calcola_durata_prevista() — Duration rounded to 15 min
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION calcola_durata_prevista(
  p_categoria TEXT,
  p_quantita_kg DECIMAL,
  p_cambio_prodotto BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
  config configurazione_tempi_ciclo%ROWTYPE;
  tempo_lavorazione DECIMAL;
  durata_grezza DECIMAL;
BEGIN
  SELECT * INTO config
  FROM configurazione_tempi_ciclo
  WHERE categoria = p_categoria AND attivo = true;

  IF NOT FOUND THEN RETURN 60; END IF;

  tempo_lavorazione := (p_quantita_kg / 1000.0) * (60.0 / config.ton_ora);
  durata_grezza := config.tempo_setup_minuti + tempo_lavorazione;

  IF p_cambio_prodotto THEN
    durata_grezza := durata_grezza + config.tempo_pulizia_minuti;
  END IF;

  RETURN CEIL(durata_grezza / 15.0) * 15;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 7. create_prenotazione(data JSONB)
--    Auto code, auto duration, bidirectional link
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_prenotazione(p_data JSONB)
RETURNS prenotazioni AS $$
DECLARE
  result prenotazioni;
  v_codice TEXT;
  v_durata INTEGER;
  v_quantita_kg DECIMAL;
  v_tipologia TEXT;
  v_link_id INTEGER;
BEGIN
  v_tipologia := p_data->>'tipologia';
  v_codice := generate_codice_prenotazione(v_tipologia);

  -- Convert quantity to kg if needed
  v_quantita_kg := CASE
    WHEN p_data->>'unita_misura' = 'ton' THEN (p_data->>'quantita_prevista')::DECIMAL * 1000
    WHEN p_data->>'unita_misura' = 'sacchi' THEN (p_data->>'quantita_prevista')::DECIMAL * 25
    WHEN p_data->>'unita_misura' = 'pallet' THEN (p_data->>'quantita_prevista')::DECIMAL * 1000
    ELSE (p_data->>'quantita_prevista')::DECIMAL
  END;

  -- Calculate duration
  IF p_data->>'categoria_prodotto' IS NOT NULL AND v_quantita_kg IS NOT NULL THEN
    v_durata := calcola_durata_prevista(p_data->>'categoria_prodotto', v_quantita_kg, false);
  END IF;

  INSERT INTO prenotazioni (
    codice_prenotazione, tipologia, cliente_id, trasportatore_id,
    data_pianificata, ora_inizio_prevista, ora_fine_prevista, durata_prevista_minuti,
    prodotto_codice, prodotto_descrizione, categoria_prodotto,
    specifica_w, specifica_w_tolleranza, specifica_pl, specifica_pl_tolleranza,
    altre_specifiche, quantita_prevista, unita_misura, quantita_kg,
    lotto_previsto, lotto_scadenza, origine_materiale, silos_origine, linea_produzione,
    prenotazione_consegna_collegata, prenotazione_produzione_collegata,
    tipologia_carico, ordine_riferimento, ddt_riferimento,
    priorita, note, created_by
  ) VALUES (
    v_codice,
    v_tipologia,
    (p_data->>'cliente_id')::INTEGER,
    (p_data->>'trasportatore_id')::INTEGER,
    (p_data->>'data_pianificata')::DATE,
    (p_data->>'ora_inizio_prevista')::TIME,
    CASE WHEN v_durata IS NOT NULL
      THEN ((p_data->>'ora_inizio_prevista')::TIME + (v_durata || ' minutes')::INTERVAL)
      ELSE NULL END,
    v_durata,
    p_data->>'prodotto_codice',
    p_data->>'prodotto_descrizione',
    p_data->>'categoria_prodotto',
    (p_data->>'specifica_w')::DECIMAL,
    (p_data->>'specifica_w_tolleranza')::DECIMAL,
    (p_data->>'specifica_pl')::DECIMAL,
    (p_data->>'specifica_pl_tolleranza')::DECIMAL,
    (p_data->'altre_specifiche')::JSONB,
    (p_data->>'quantita_prevista')::DECIMAL,
    p_data->>'unita_misura',
    v_quantita_kg,
    p_data->>'lotto_previsto',
    (p_data->>'lotto_scadenza')::DATE,
    p_data->>'origine_materiale',
    p_data->>'silos_origine',
    p_data->>'linea_produzione',
    (p_data->>'prenotazione_consegna_collegata')::INTEGER,
    (p_data->>'prenotazione_produzione_collegata')::INTEGER,
    p_data->>'tipologia_carico',
    p_data->>'ordine_riferimento',
    p_data->>'ddt_riferimento',
    COALESCE((p_data->>'priorita')::INTEGER, 5),
    p_data->>'note',
    (p_data->>'created_by')::UUID
  ) RETURNING * INTO result;

  -- Create bidirectional link
  v_link_id := CASE
    WHEN v_tipologia = 'produzione' THEN (p_data->>'prenotazione_consegna_collegata')::INTEGER
    ELSE (p_data->>'prenotazione_produzione_collegata')::INTEGER
  END;

  IF v_link_id IS NOT NULL THEN
    IF v_tipologia = 'produzione' THEN
      UPDATE prenotazioni SET prenotazione_produzione_collegata = result.id WHERE id = v_link_id;
    ELSE
      UPDATE prenotazioni SET prenotazione_consegna_collegata = result.id WHERE id = v_link_id;
    END IF;
  END IF;

  -- Create initial storico_stati entry
  INSERT INTO storico_stati (prenotazione_id, stato_nuovo, utente_id)
  VALUES (result.id, 'pianificato', (p_data->>'created_by')::UUID);

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 9. get_transizioni_possibili(p_id INTEGER)
--    Returns array of valid next states
--    (defined BEFORE update_stato_prenotazione which calls it)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_transizioni_possibili(p_id INTEGER)
RETURNS TEXT[] AS $$
DECLARE
  v_prenotazione prenotazioni;
BEGIN
  SELECT * INTO v_prenotazione FROM prenotazioni WHERE id = p_id;
  IF NOT FOUND THEN RETURN ARRAY[]::TEXT[]; END IF;

  IF v_prenotazione.tipologia = 'produzione' THEN
    RETURN CASE v_prenotazione.stato
      WHEN 'pianificato' THEN ARRAY['preso_in_carico', 'annullato']
      WHEN 'preso_in_carico' THEN ARRAY['in_produzione', 'annullato']
      WHEN 'in_produzione' THEN ARRAY['completato']
      ELSE ARRAY[]::TEXT[]
    END;
  ELSE
    RETURN CASE v_prenotazione.stato
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
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 8. update_stato_prenotazione()
--    Validates state transition, creates history
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_stato_prenotazione(
  p_id INTEGER,
  p_nuovo_stato TEXT,
  p_note TEXT DEFAULT NULL,
  p_utente_id UUID DEFAULT NULL
)
RETURNS prenotazioni AS $$
DECLARE
  v_prenotazione prenotazioni;
  v_stato_precedente TEXT;
  v_transizioni TEXT[];
BEGIN
  SELECT * INTO v_prenotazione FROM prenotazioni WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prenotazione non trovata'; END IF;

  -- Store old state BEFORE update
  v_stato_precedente := v_prenotazione.stato;

  -- Get valid transitions
  v_transizioni := get_transizioni_possibili(p_id);

  IF NOT (p_nuovo_stato = ANY(v_transizioni)) THEN
    RAISE EXCEPTION 'Transizione non valida da % a %', v_stato_precedente, p_nuovo_stato;
  END IF;

  -- Require notes for cancellation
  IF p_nuovo_stato = 'annullato' AND (p_note IS NULL OR p_note = '') THEN
    RAISE EXCEPTION 'Note obbligatorie per annullamento';
  END IF;

  -- Update state
  UPDATE prenotazioni SET stato = p_nuovo_stato, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_prenotazione;

  -- Create history entry with the OLD state
  INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
  VALUES (p_id, v_stato_precedente, p_nuovo_stato, p_utente_id, p_note);

  RETURN v_prenotazione;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 10. create_dati_carico()
--     Validates, records, advances state to 'caricato'
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_dati_carico(
  p_prenotazione_id INTEGER,
  p_data JSONB
)
RETURNS dati_carico AS $$
DECLARE
  v_prenotazione prenotazioni;
  v_result dati_carico;
BEGIN
  SELECT * INTO v_prenotazione FROM prenotazioni WHERE id = p_prenotazione_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prenotazione non trovata'; END IF;
  IF v_prenotazione.tipologia != 'consegna' THEN RAISE EXCEPTION 'Solo prenotazioni di consegna'; END IF;
  IF v_prenotazione.stato != 'in_carico' THEN RAISE EXCEPTION 'Stato deve essere in_carico'; END IF;

  -- Validate idoneita
  IF (p_data->>'idoneita_trasporto')::BOOLEAN = false AND
     (p_data->>'idoneita_note' IS NULL OR p_data->>'idoneita_note' = '') THEN
    RAISE EXCEPTION 'Note obbligatorie per idoneita non conforme';
  END IF;

  INSERT INTO dati_carico (
    prenotazione_id, data_carico, ora_inizio_carico, ora_fine_carico,
    operatore_id, operatore_nome, idoneita_trasporto, idoneita_note,
    targa_automezzo, targa_rimorchio, nome_autista,
    lotto_caricato, scadenza_lotto, peso_caricato_kg, peso_tara_kg, peso_lordo_kg,
    tipologia_carico, numero_colli, ddt_numero, ddt_data,
    foto_carico, certificato_lavaggio
  ) VALUES (
    p_prenotazione_id,
    (p_data->>'data_carico')::DATE,
    (p_data->>'ora_inizio_carico')::TIME,
    (p_data->>'ora_fine_carico')::TIME,
    (p_data->>'operatore_id')::UUID,
    p_data->>'operatore_nome',
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
    (p_data->>'ddt_data')::DATE,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'foto_carico')), ARRAY[]::TEXT[]),
    p_data->>'certificato_lavaggio'
  ) RETURNING * INTO v_result;

  -- Save DDT in prenotazione too
  UPDATE prenotazioni SET ddt_riferimento = p_data->>'ddt_numero' WHERE id = p_prenotazione_id;

  -- Advance state to caricato
  PERFORM update_stato_prenotazione(p_prenotazione_id, 'caricato', 'Dati carico registrati', (p_data->>'operatore_id')::UUID);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 11. create_cliente(p_data JSONB) — auto code
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_cliente(p_data JSONB)
RETURNS clienti AS $$
DECLARE
  v_result clienti;
BEGIN
  INSERT INTO clienti (
    codice, ragione_sociale, partita_iva, codice_fiscale,
    indirizzo, cap, citta, provincia, nazione,
    destinazione_diversa, dest_indirizzo, dest_cap, dest_citta, dest_provincia,
    telefono, email, referente_ordini, canale, modalita_consegna,
    requisiti_documentali, finestre_consegna, note
  ) VALUES (
    generate_codice_cliente(),
    p_data->>'ragione_sociale',
    p_data->>'partita_iva',
    p_data->>'codice_fiscale',
    p_data->>'indirizzo',
    p_data->>'cap',
    p_data->>'citta',
    p_data->>'provincia',
    COALESCE(p_data->>'nazione', 'IT'),
    COALESCE((p_data->>'destinazione_diversa')::BOOLEAN, false),
    p_data->>'dest_indirizzo',
    p_data->>'dest_cap',
    p_data->>'dest_citta',
    p_data->>'dest_provincia',
    p_data->>'telefono',
    p_data->>'email',
    p_data->>'referente_ordini',
    p_data->>'canale',
    p_data->>'modalita_consegna',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'requisiti_documentali')), ARRAY[]::TEXT[]),
    p_data->>'finestre_consegna',
    p_data->>'note'
  ) RETURNING * INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- 12. create_trasportatore(p_data JSONB) — auto code
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_trasportatore(p_data JSONB)
RETURNS trasportatori AS $$
DECLARE
  v_result trasportatori;
BEGIN
  INSERT INTO trasportatori (
    codice, ragione_sociale, partita_iva, indirizzo_sede,
    referente_nome, referente_telefono, referente_email,
    tipologie_mezzi, certificazioni, rating_puntualita, note
  ) VALUES (
    generate_codice_trasportatore(),
    p_data->>'ragione_sociale',
    p_data->>'partita_iva',
    p_data->>'indirizzo_sede',
    p_data->>'referente_nome',
    p_data->>'referente_telefono',
    p_data->>'referente_email',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'tipologie_mezzi')), ARRAY[]::TEXT[]),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'certificazioni')), ARRAY[]::TEXT[]),
    COALESCE((p_data->>'rating_puntualita')::DECIMAL, 3.00),
    p_data->>'note'
  ) RETURNING * INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
