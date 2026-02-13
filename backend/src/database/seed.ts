import pool from '../config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Hash password for test users
    const passwordHash = await bcrypt.hash('password123', 10);

    // Insert test users
    await pool.query(`
      INSERT INTO utenti (username, password_hash, nome, cognome, email, ruolo, livello_accesso, sezioni_abilitate, attivo)
      VALUES
        ('admin', $1, 'Admin', 'Sistema', 'admin@molino.it', 'Amministratore', 'modifica', ARRAY['produzione', 'consegne'], true),
        ('operatore_prod', $1, 'Mario', 'Rossi', 'mario.rossi@molino.it', 'Operatore Produzione', 'modifica', ARRAY['produzione'], true),
        ('operatore_log', $1, 'Luigi', 'Bianchi', 'luigi.bianchi@molino.it', 'Operatore Logistica', 'modifica', ARRAY['consegne'], true),
        ('commerciale', $1, 'Anna', 'Verdi', 'anna.verdi@molino.it', 'Commerciale', 'visualizzazione', ARRAY['produzione', 'consegne'], true),
        ('direzione', $1, 'Giuseppe', 'Neri', 'giuseppe.neri@molino.it', 'Direzione', 'visualizzazione', ARRAY['produzione', 'consegne'], true)
      ON CONFLICT (username) DO NOTHING
    `, [passwordHash]);
    console.log('Users seeded successfully');

    // Insert test transporters
    await pool.query(`
      INSERT INTO trasportatori (codice, ragione_sociale, partita_iva, indirizzo_sede, referente_nome, referente_telefono, referente_email, tipologie_mezzi, certificazioni, rating_puntualita, attivo)
      VALUES
        ('TRA001', 'Trasporti Veloci SRL', '12345678901', 'Via Roma 100, Milano', 'Marco Trasporti', '02-1234567', 'info@trasportiveloci.it', ARRAY['cisterna', 'bilico'], ARRAY['ATP', 'trasporto_alimentari'], 4.5, true),
        ('TRA002', 'Logistica Nord SpA', '98765432109', 'Via Torino 50, Torino', 'Paolo Logistica', '011-9876543', 'info@logisticanord.it', ARRAY['bilico', 'furgone', 'motrice'], ARRAY['trasporto_alimentari', 'BIO'], 4.0, true),
        ('TRA003', 'Autotrasporti Bianchi', '11223344556', 'Via Venezia 25, Padova', 'Luca Bianchi', '049-1122334', 'info@autobianchi.it', ARRAY['cisterna'], ARRAY['ATP', 'trasporto_alimentari'], 3.5, true),
        ('TRA004', 'Express Delivery SRL', '55443322110', 'Via Napoli 80, Roma', 'Giulia Express', '06-5544332', 'info@expressdelivery.it', ARRAY['furgone', 'motrice'], ARRAY['trasporto_alimentari'], 4.2, true),
        ('TRA005', 'Trasporti Alimentari Italia', '99887766554', 'Via Bologna 120, Bologna', 'Roberto TAI', '051-9988776', 'info@tai.it', ARRAY['cisterna', 'bilico', 'furgone'], ARRAY['ATP', 'BIO', 'trasporto_alimentari'], 4.8, true)
      ON CONFLICT (codice) DO NOTHING
    `);
    console.log('Transporters seeded successfully');

    // Insert test clients
    await pool.query(`
      INSERT INTO clienti (codice, ragione_sociale, partita_iva, indirizzo, cap, citta, provincia, canale, modalita_consegna, requisiti_documentali, attivo)
      VALUES
        ('CLI001', 'Panificio Da Mario SRL', '11111111111', 'Via del Pane 10', '20100', 'Milano', 'MI', 'dettaglio', 'franco_destino', ARRAY['certificato_analisi'], true),
        ('CLI002', 'Pastificio Artigiano SpA', '22222222222', 'Via della Pasta 20', '10100', 'Torino', 'TO', 'industria', 'franco_partenza', ARRAY['certificato_analisi', 'scheda_tecnica'], true),
        ('CLI003', 'Supermercati UniFood', '33333333333', 'Via Grande Distribuzione 100', '00100', 'Roma', 'RM', 'GDO', 'franco_destino', ARRAY['certificato_analisi', 'certificato_BIO'], true),
        ('CLI004', 'Ristorante La Buona Tavola', '44444444444', 'Piazza Garibaldi 5', '50100', 'Firenze', 'FI', 'HORECA', 'franco_destino', ARRAY['certificato_analisi'], true),
        ('CLI005', 'Export Foods International', '55555555555', 'Via Export 200', '40100', 'Bologna', 'BO', 'export', 'franco_partenza', ARRAY['certificato_analisi', 'scheda_tecnica', 'certificato_BIO'], true),
        ('CLI006', 'Dolciaria Rossi & Figli', '66666666666', 'Via Dolce 15', '35100', 'Padova', 'PD', 'industria', 'ritiro_cliente', ARRAY['certificato_analisi'], true),
        ('CLI007', 'Coop Centro Italia', '77777777777', 'Via Cooperazione 50', '06100', 'Perugia', 'PG', 'GDO', 'franco_destino', ARRAY['certificato_analisi', 'scheda_tecnica'], true),
        ('CLI008', 'Pizza Express Chain', '88888888888', 'Via della Pizza 30', '80100', 'Napoli', 'NA', 'HORECA', 'franco_destino', ARRAY['certificato_analisi'], true)
      ON CONFLICT (codice) DO NOTHING
    `);
    console.log('Clients seeded successfully');

    // Insert cycle times configuration
    await pool.query(`
      INSERT INTO configurazione_tempi_ciclo (categoria, ton_ora, tempo_setup_minuti, tempo_pulizia_minuti, attivo)
      VALUES
        ('rinfusa', 10.00, 15, 20, true),
        ('confezionato_silos', 4.00, 15, 20, true),
        ('confezionato_sacco', 2.00, 15, 25, true)
      ON CONFLICT (categoria) DO NOTHING
    `);
    console.log('Cycle times configuration seeded successfully');

    // Look up actual IDs dynamically (avoids breakage if auto-increment doesn't start at 1)
    const clientiResult = await pool.query(`SELECT id, codice FROM clienti ORDER BY codice`);
    const trasportatoriResult = await pool.query(`SELECT id, codice FROM trasportatori ORDER BY codice`);
    const utentiResult = await pool.query(`SELECT id, username FROM utenti WHERE username = 'admin' LIMIT 1`);

    const clienteId = (codice: string) => {
      const row = clientiResult.rows.find((r: { codice: string }) => r.codice === codice);
      return row ? row.id : null;
    };
    const traspId = (codice: string) => {
      const row = trasportatoriResult.rows.find((r: { codice: string }) => r.codice === codice);
      return row ? row.id : null;
    };
    const adminId = utentiResult.rows[0]?.id || null;

    if (!adminId) {
      console.warn('WARNING: admin user not found, skipping prenotazioni seed');
    } else {
      // Insert sample bookings
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      await pool.query(`
        INSERT INTO prenotazioni (
          codice_prenotazione, tipologia, cliente_id, trasportatore_id,
          data_pianificata, ora_inizio_prevista, ora_fine_prevista, durata_prevista_minuti,
          prodotto_codice, prodotto_descrizione, categoria_prodotto,
          specifica_w, specifica_w_tolleranza, specifica_pl, specifica_pl_tolleranza,
          quantita_prevista, unita_misura, quantita_kg,
          stato, priorita, created_by
        )
        VALUES
          ('PROD-2026-0001', 'produzione', $4, NULL, $1, '08:00', '09:30', 90,
           'FAR001', 'Farina Tipo 00 W280', 'rinfusa',
           280, 20, 0.55, 0.05, 10, 'ton', 10000,
           'pianificato', 3, $7),
          ('PROD-2026-0002', 'produzione', $5, NULL, $1, '10:00', '12:00', 120,
           'FAR002', 'Farina Manitoba W380', 'confezionato_silos',
           380, 15, 0.45, 0.03, 5, 'ton', 5000,
           'preso_in_carico', 2, $7),
          ('CONS-2026-0001', 'consegna', $4, $8, $2, '07:00', '08:00', 60,
           'FAR001', 'Farina Tipo 00 W280', 'rinfusa',
           280, 20, 0.55, 0.05, 5, 'ton', 5000,
           'pianificato', 1, $7),
          ('CONS-2026-0002', 'consegna', $6, $9, $2, '09:00', '10:30', 90,
           'FAR003', 'Farina Integrale BIO', 'confezionato_sacco',
           220, 25, 0.60, 0.05, 2, 'ton', 2000,
           'pianificato', 4, $7),
          ('PROD-2026-0003', 'produzione', $10, NULL, $3, '08:00', '10:00', 120,
           'FAR004', 'Semola Rimacinata', 'confezionato_sacco',
           NULL, NULL, NULL, NULL, 3, 'ton', 3000,
           'pianificato', 5, $7)
        ON CONFLICT (codice_prenotazione) DO NOTHING
      `, [
        formatDate(today),           // $1
        formatDate(tomorrow),        // $2
        formatDate(dayAfterTomorrow),// $3
        clienteId('CLI001'),         // $4 - Panificio Da Mario
        clienteId('CLI002'),         // $5 - Pastificio Artigiano
        clienteId('CLI003'),         // $6 - Supermercati UniFood
        adminId,                     // $7 - created_by
        traspId('TRA001'),           // $8 - Trasporti Veloci
        traspId('TRA002'),           // $9 - Logistica Nord
        clienteId('CLI004'),         // $10 - Ristorante La Buona Tavola
      ]);
      console.log('Sample bookings seeded successfully');

      // Insert storico_stati for existing bookings
      await pool.query(`
        INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
        SELECT id, NULL, 'pianificato', $1, 'Prenotazione creata'
        FROM prenotazioni
        WHERE NOT EXISTS (
          SELECT 1 FROM storico_stati WHERE storico_stati.prenotazione_id = prenotazioni.id
        )
      `, [adminId]);

      // Add state change for preso_in_carico booking
      const opProdResult = await pool.query(`SELECT id FROM utenti WHERE username = 'operatore_prod' LIMIT 1`);
      const opProdId = opProdResult.rows[0]?.id || adminId;

      await pool.query(`
        INSERT INTO storico_stati (prenotazione_id, stato_precedente, stato_nuovo, utente_id, note)
        SELECT id, 'pianificato', 'preso_in_carico', $1, 'Presa in carico operatore'
        FROM prenotazioni
        WHERE codice_prenotazione = 'PROD-2026-0002'
        AND NOT EXISTS (
          SELECT 1 FROM storico_stati
          WHERE storico_stati.prenotazione_id = prenotazioni.id
          AND stato_nuovo = 'preso_in_carico'
        )
      `, [opProdId]);
      console.log('State history seeded successfully');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
