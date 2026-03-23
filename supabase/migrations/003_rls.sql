-- ============================================================
-- Planner Molino v4.0 — Migration 003: Row Level Security
-- Enable RLS on all tables + policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE trasportatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE storico_stati ENABLE ROW LEVEL SECURITY;
ALTER TABLE dati_carico ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurazione_tempi_ciclo ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- SELECT: all authenticated users can read all tables
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can read utenti"
  ON utenti FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read clienti"
  ON clienti FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read trasportatori"
  ON trasportatori FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read prenotazioni"
  ON prenotazioni FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read storico_stati"
  ON storico_stati FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read dati_carico"
  ON dati_carico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read config"
  ON configurazione_tempi_ciclo FOR SELECT TO authenticated USING (true);

-- -------------------------------------------------------
-- UTENTI: own record update + editor full access
-- -------------------------------------------------------
CREATE POLICY "Users can update own profile"
  ON utenti FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Editors can update any utente"
  ON utenti FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can insert utenti"
  ON utenti FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- CLIENTI: editors only for insert/update/delete
-- -------------------------------------------------------
CREATE POLICY "Editors can insert clienti"
  ON clienti FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can update clienti"
  ON clienti FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can delete clienti"
  ON clienti FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- TRASPORTATORI: editors only for insert/update/delete
-- -------------------------------------------------------
CREATE POLICY "Editors can insert trasportatori"
  ON trasportatori FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can update trasportatori"
  ON trasportatori FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can delete trasportatori"
  ON trasportatori FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- PRENOTAZIONI: editors only for insert/update/delete
-- -------------------------------------------------------
CREATE POLICY "Editors can insert prenotazioni"
  ON prenotazioni FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can update prenotazioni"
  ON prenotazioni FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can delete prenotazioni"
  ON prenotazioni FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- STORICO_STATI: editors can insert
-- -------------------------------------------------------
CREATE POLICY "Editors can insert storico_stati"
  ON storico_stati FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- DATI_CARICO: editors can insert/update
-- -------------------------------------------------------
CREATE POLICY "Editors can insert dati_carico"
  ON dati_carico FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

CREATE POLICY "Editors can update dati_carico"
  ON dati_carico FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));

-- -------------------------------------------------------
-- CONFIGURAZIONE_TEMPI_CICLO: editors can update
-- -------------------------------------------------------
CREATE POLICY "Editors can update config"
  ON configurazione_tempi_ciclo FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND livello_accesso = 'modifica'));
