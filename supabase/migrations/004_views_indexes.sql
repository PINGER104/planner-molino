-- ============================================================
-- Planner Molino v4.0 — Migration 004: Views & Indexes
-- ============================================================

-- -------------------------------------------------------
-- View: prenotazioni with joined client and transporter info
-- -------------------------------------------------------
CREATE OR REPLACE VIEW prenotazioni_view AS
SELECT
  p.*,
  c.ragione_sociale AS cliente_ragione_sociale,
  c.codice AS cliente_codice,
  c.indirizzo AS cliente_indirizzo,
  c.citta AS cliente_citta,
  t.ragione_sociale AS trasportatore_ragione_sociale,
  t.codice AS trasportatore_codice
FROM prenotazioni p
LEFT JOIN clienti c ON p.cliente_id = c.id
LEFT JOIN trasportatori t ON p.trasportatore_id = t.id;

-- -------------------------------------------------------
-- View: storico_stati with user info
-- -------------------------------------------------------
CREATE OR REPLACE VIEW storico_stati_view AS
SELECT
  s.*,
  u.nome AS utente_nome,
  u.cognome AS utente_cognome
FROM storico_stati s
LEFT JOIN utenti u ON s.utente_id = u.id;

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
CREATE INDEX idx_utenti_username ON utenti(username);
CREATE INDEX idx_trasportatori_codice ON trasportatori(codice);
CREATE INDEX idx_clienti_codice ON clienti(codice);
CREATE INDEX idx_prenotazioni_data ON prenotazioni(data_pianificata);
CREATE INDEX idx_prenotazioni_tipologia ON prenotazioni(tipologia);
CREATE INDEX idx_prenotazioni_stato ON prenotazioni(stato);
CREATE INDEX idx_prenotazioni_cliente ON prenotazioni(cliente_id);
CREATE INDEX idx_prenotazioni_link_consegna ON prenotazioni(prenotazione_consegna_collegata)
  WHERE prenotazione_consegna_collegata IS NOT NULL;
CREATE INDEX idx_prenotazioni_link_produzione ON prenotazioni(prenotazione_produzione_collegata)
  WHERE prenotazione_produzione_collegata IS NOT NULL;
CREATE INDEX idx_storico_prenotazione ON storico_stati(prenotazione_id);
