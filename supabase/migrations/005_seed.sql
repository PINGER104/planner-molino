-- ============================================================
-- Planner Molino v4.0 — Migration 005: Seed Data
-- ============================================================

-- Seed: configurazione tempi ciclo (3 categories)
INSERT INTO configurazione_tempi_ciclo (categoria, ton_ora, tempo_setup_minuti, tempo_pulizia_minuti)
VALUES
  ('rinfusa', 10.00, 15, 20),
  ('confezionato_silos', 4.00, 15, 20),
  ('confezionato_sacco', 2.00, 15, 25);
