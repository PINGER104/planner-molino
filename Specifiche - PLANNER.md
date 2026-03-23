# PLANNER MOLINO - Specifiche Complete v4.0

> Documento di specifiche per ricostruire il progetto "Planner Molino" da zero.
> Generato dall'analisi completa del codebase v3.x esistente.

---

## 1. PANORAMICA

### Cos'e'
Applicazione web per la pianificazione della produzione e delle consegne di un **molino** (impianto di macinazione cereali). Gestisce prenotazioni, clienti, trasportatori, calendario operativo e dati di carico.

### Utenti target
- **Operatori di produzione**: pianificano e monitorano la produzione
- **Operatori logistica**: gestiscono consegne e dati di carico
- **Amministratori**: gestiscono utenti, configurazioni e tempi ciclo

### Stack tecnologico
| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + TypeScript + MUI 5 |
| Backend | Node.js + Express + TypeScript (serverless su Vercel) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) |
| Calendar | FullCalendar 6 |
| Forms | react-hook-form |
| Date | date-fns (locale italiano) |
| Deploy | Vercel (monorepo: frontend statico + backend serverless) |

---

## 2. ARCHITETTURA

### Struttura monorepo
```
project-root/
├── frontend/          # React SPA (Create React App)
│   ├── src/
│   │   ├── App.tsx           # Routing + tema MUI
│   │   ├── lib/supabase.ts   # Client Supabase
│   │   ├── contexts/         # AuthContext
│   │   ├── types/            # Interfacce TypeScript
│   │   ├── services/         # API layer (supabaseApi, adminApi)
│   │   ├── utils/            # Config stati, export calendario
│   │   ├── pages/            # 11 pagine
│   │   └── components/       # Layout, Calendar, Common
│   └── public/
├── backend/           # Express API
│   ├── api/index.ts          # Entry point Vercel serverless
│   └── src/
│       ├── index.ts           # Express app setup
│       ├── config/database.ts # Pool PostgreSQL
│       ├── lib/supabaseAdmin.ts
│       ├── middleware/        # JWT + Supabase auth
│       ├── controllers/       # 7 controller
│       ├── routes/            # 6 route files
│       ├── utils/             # Codici, stati, tempi ciclo
│       └── types/
└── vercel.json        # Deploy config
```

### Deploy Vercel
- Frontend: build statico (`@vercel/static-build`, output `build/`)
- Backend: serverless function (`@vercel/node`, entry `backend/api/index.ts`)
- Routing: `/api/*` → backend, tutto il resto → frontend SPA

### Variabili d'ambiente

**Frontend:**
```
REACT_APP_SUPABASE_URL=https://[progetto].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[chiave anon]
REACT_APP_API_URL=/api  (opzionale, per backend separato)
```

**Backend:**
```
SUPABASE_URL=https://[progetto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[chiave service role]
JWT_SECRET=[segreto JWT]
JWT_EXPIRES_IN=8h
PORT=3001
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:3000
```

---

## 3. DATABASE - Schema completo

### 3.1 Tabella: `utenti`
Profili utente sincronizzati con Supabase Auth.

| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | UUID | PK, FK → auth.users(id) CASCADE | ID Supabase Auth |
| username | VARCHAR(50) | UNIQUE, NOT NULL | |
| nome | VARCHAR(100) | NOT NULL | |
| cognome | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(150) | | |
| telefono | VARCHAR(30) | | |
| ruolo | VARCHAR(100) | | Es: "Responsabile produzione" |
| livello_accesso | VARCHAR(20) | NOT NULL, CHECK | 'visualizzazione' \| 'modifica' |
| sezioni_abilitate | TEXT[] | NOT NULL, DEFAULT '{}' | ['produzione', 'consegne'] |
| attivo | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| ultimo_accesso | TIMESTAMPTZ | | Aggiornato ad ogni login |

### 3.2 Tabella: `clienti`
| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| codice | VARCHAR(20) | UNIQUE, NOT NULL | Auto: CLI001, CLI002... |
| ragione_sociale | VARCHAR(200) | NOT NULL | |
| partita_iva | VARCHAR(20) | | |
| codice_fiscale | VARCHAR(20) | | |
| indirizzo | TEXT | | |
| cap | VARCHAR(10) | | |
| citta | VARCHAR(100) | | |
| provincia | VARCHAR(5) | | |
| nazione | VARCHAR(5) | DEFAULT 'IT' | |
| destinazione_diversa | BOOLEAN | DEFAULT false | Destinazione consegna diversa dalla sede |
| dest_indirizzo | TEXT | | |
| dest_cap | VARCHAR(10) | | |
| dest_citta | VARCHAR(100) | | |
| dest_provincia | VARCHAR(5) | | |
| telefono | VARCHAR(30) | | |
| email | VARCHAR(150) | | |
| referente_ordini | VARCHAR(100) | | |
| canale | VARCHAR(20) | | 'GDO' \| 'HORECA' \| 'industria' \| 'dettaglio' \| 'export' |
| modalita_consegna | VARCHAR(30) | | 'franco_destino' \| 'franco_partenza' \| 'ritiro_cliente' |
| requisiti_documentali | TEXT[] | DEFAULT '{}' | |
| finestre_consegna | TEXT | | |
| note | TEXT | | |
| attivo | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-aggiornato |

### 3.3 Tabella: `trasportatori`
| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| codice | VARCHAR(20) | UNIQUE, NOT NULL | Auto: TRA001, TRA002... |
| ragione_sociale | VARCHAR(200) | NOT NULL | |
| partita_iva | VARCHAR(20) | | |
| indirizzo_sede | TEXT | | |
| referente_nome | VARCHAR(100) | | |
| referente_telefono | VARCHAR(30) | | |
| referente_email | VARCHAR(150) | | |
| tipologie_mezzi | TEXT[] | DEFAULT '{}' | Tipi di veicoli disponibili |
| certificazioni | TEXT[] | DEFAULT '{}' | |
| rating_puntualita | DECIMAL(3,2) | DEFAULT 3.00 | 0-5 |
| note | TEXT | | |
| attivo | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### 3.4 Tabella: `prenotazioni` (tabella principale)
| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| codice_prenotazione | VARCHAR(30) | UNIQUE, NOT NULL | PROD-2026-0001 / CONS-2026-0001 |
| tipologia | VARCHAR(15) | NOT NULL, CHECK | 'produzione' \| 'consegna' |
| cliente_id | INTEGER | FK → clienti(id) | |
| trasportatore_id | INTEGER | FK → trasportatori(id) | |
| data_pianificata | DATE | NOT NULL | |
| ora_inizio_prevista | TIME | NOT NULL | |
| ora_fine_prevista | TIME | | Calcolata automaticamente |
| durata_prevista_minuti | INTEGER | | Calcolata automaticamente |
| prodotto_codice | VARCHAR(50) | | |
| prodotto_descrizione | VARCHAR(200) | | |
| categoria_prodotto | VARCHAR(30) | CHECK | 'rinfusa' \| 'confezionato_silos' \| 'confezionato_sacco' |
| specifica_w | DECIMAL(6,2) | | Specifica tecnica W |
| specifica_w_tolleranza | DECIMAL(4,2) | | |
| specifica_pl | DECIMAL(4,2) | | Specifica tecnica PL |
| specifica_pl_tolleranza | DECIMAL(4,2) | | |
| altre_specifiche | JSONB | | Campo flessibile |
| quantita_prevista | DECIMAL(12,3) | | |
| unita_misura | VARCHAR(10) | | 'kg' \| 'ton' \| 'sacchi' \| 'pallet' |
| quantita_kg | DECIMAL(12,3) | | Conversione automatica in kg |
| lotto_previsto | VARCHAR(50) | | |
| lotto_scadenza | DATE | | |
| origine_materiale | VARCHAR(20) | | 'silos' \| 'sacco' \| 'big_bag' |
| silos_origine | VARCHAR(20) | | |
| linea_produzione | VARCHAR(30) | | |
| prenotazione_consegna_collegata | INTEGER | FK → prenotazioni(id) | Link bidirezionale prod→cons |
| prenotazione_produzione_collegata | INTEGER | FK → prenotazioni(id) | Link bidirezionale cons→prod |
| tipologia_carico | VARCHAR(20) | | 'big_bag' \| 'sacchi' \| 'cisterna' \| 'pallet' |
| ordine_riferimento | VARCHAR(50) | | |
| ddt_riferimento | VARCHAR(50) | | Documento di trasporto |
| stato | VARCHAR(20) | NOT NULL, DEFAULT 'pianificato' | Vedi macchina a stati |
| priorita | INTEGER | CHECK 1-10, DEFAULT 5 | |
| note | TEXT | | |
| created_by | UUID | FK → utenti(id) | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### 3.5 Tabella: `storico_stati` (audit trail)
| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| prenotazione_id | INTEGER | NOT NULL, FK → prenotazioni(id) CASCADE | |
| stato_precedente | VARCHAR(20) | | |
| stato_nuovo | VARCHAR(20) | NOT NULL | |
| timestamp_cambio | TIMESTAMPTZ | DEFAULT NOW() | |
| utente_id | UUID | FK → utenti(id) | |
| note | TEXT | | Obbligatorie per annullamento |

### 3.6 Tabella: `dati_carico`
Una sola registrazione per prenotazione di consegna.

| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| prenotazione_id | INTEGER | UNIQUE, NOT NULL, FK CASCADE | 1:1 con prenotazione |
| data_carico | DATE | NOT NULL | |
| ora_inizio_carico | TIME | | |
| ora_fine_carico | TIME | | |
| operatore_id | UUID | FK → utenti(id) | |
| operatore_nome | VARCHAR(100) | | Denormalizzato |
| idoneita_trasporto | BOOLEAN | NOT NULL | |
| idoneita_note | TEXT | | Obbligatorio se idoneita=false |
| targa_automezzo | VARCHAR(20) | NOT NULL | |
| targa_rimorchio | VARCHAR(20) | | |
| nome_autista | VARCHAR(100) | | |
| lotto_caricato | VARCHAR(50) | NOT NULL | |
| scadenza_lotto | DATE | | |
| peso_caricato_kg | DECIMAL(12,3) | NOT NULL | Peso netto |
| peso_tara_kg | DECIMAL(12,3) | | |
| peso_lordo_kg | DECIMAL(12,3) | | |
| tipologia_carico | VARCHAR(20) | CHECK | 'big_bag' \| 'sacchi' \| 'cisterna' \| 'pallet' |
| numero_colli | INTEGER | | |
| ddt_numero | VARCHAR(50) | | |
| ddt_data | DATE | | |
| foto_carico | TEXT[] | DEFAULT '{}' | URL foto |
| certificato_lavaggio | TEXT | | URL certificato |
| registrato_at | TIMESTAMPTZ | DEFAULT NOW() | |

### 3.7 Tabella: `configurazione_tempi_ciclo`
| Colonna | Tipo | Vincoli | Note |
|---------|------|---------|------|
| id | SERIAL | PK | |
| categoria | VARCHAR(30) | UNIQUE, NOT NULL | |
| ton_ora | DECIMAL(6,2) | NOT NULL | Tonnellate/ora |
| tempo_setup_minuti | INTEGER | DEFAULT 15 | |
| tempo_pulizia_minuti | INTEGER | DEFAULT 20 | |
| attivo | BOOLEAN | DEFAULT true | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Valori iniziali:**
| Categoria | Ton/ora | Setup | Pulizia |
|-----------|---------|-------|---------|
| rinfusa | 10.00 | 15 min | 20 min |
| confezionato_silos | 4.00 | 15 min | 20 min |
| confezionato_sacco | 2.00 | 15 min | 25 min |

### 3.8 Viste
- **prenotazioni_view**: JOIN con clienti e trasportatori (ragione_sociale, codice, indirizzo)
- **storico_stati_view**: JOIN con utenti (nome, cognome)

### 3.9 Indici
```sql
idx_utenti_username ON utenti(username)
idx_trasportatori_codice ON trasportatori(codice)
idx_clienti_codice ON clienti(codice)
idx_prenotazioni_data ON prenotazioni(data_pianificata)
idx_prenotazioni_tipologia ON prenotazioni(tipologia)
idx_prenotazioni_stato ON prenotazioni(stato)
idx_prenotazioni_cliente ON prenotazioni(cliente_id)
idx_prenotazioni_link_consegna ON prenotazioni(prenotazione_consegna_collegata) WHERE NOT NULL
idx_prenotazioni_link_produzione ON prenotazioni(prenotazione_produzione_collegata) WHERE NOT NULL
idx_storico_prenotazione ON storico_stati(prenotazione_id)
```

### 3.10 RLS (Row Level Security)
Tutte le tabelle hanno RLS abilitato:
- **SELECT**: tutti gli utenti autenticati possono leggere
- **INSERT/UPDATE/DELETE**: solo utenti con `livello_accesso = 'modifica'`
- **utenti**: UPDATE solo sul proprio record

### 3.11 Funzioni PL/pgSQL
1. **handle_new_user()** - Trigger su auth.users INSERT → crea profilo utenti
2. **update_updated_at()** - Trigger per aggiornare updated_at
3. **generate_codice_prenotazione(tipo)** → 'PROD-2026-0001' / 'CONS-2026-0001'
4. **generate_codice_cliente()** → 'CLI001'
5. **generate_codice_trasportatore()** → 'TRA001'
6. **calcola_durata_prevista(categoria, kg, cambio_prodotto)** → minuti arrotondati a 15 min
7. **create_prenotazione(data JSONB)** → crea con codice auto, durata auto, link bidirezionale
8. **update_stato_prenotazione(id, stato, note)** → valida transizione, crea storico
9. **get_transizioni_possibili(id)** → array stati successivi validi
10. **create_dati_carico(id, data JSONB)** → valida, registra, avanza stato a 'caricato'
11. **create_cliente(data JSONB)** → crea con codice auto
12. **create_trasportatore(data JSONB)** → crea con codice auto

---

## 4. MACCHINA A STATI

### Produzione
```
pianificato ──→ preso_in_carico ──→ in_produzione ──→ completato (FINALE)
     │                │
     └── annullato ◄──┘
         (FINALE)
```

### Consegna
```
pianificato ──→ preso_in_carico ──→ in_preparazione ──→ pronto_carico
     │                │                    │
     └── annullato ◄──┴────────────────────┘
         (FINALE)
                    pronto_carico ──→ in_carico ──→ caricato ──→ partito (FINALE)
                         │
                         └── annullato (FINALE)
```

**Regole:**
- Annullamento possibile da qualsiasi stato non-finale (richiede note obbligatorie)
- `in_carico → caricato` si attiva registrando i dati di carico
- Stati finali: completato, partito, annullato

### Colori stati
| Stato | Colore | Hex |
|-------|--------|-----|
| pianificato | Blu acciaio | #3B6FD4 |
| preso_in_carico | Ambra caldo | #CA8A04 |
| in_produzione | Viola | #7C3AED |
| in_preparazione | Porpora | #9333EA |
| pronto_carico | Verde foresta | #16A34A |
| in_carico | Teal | #0D9488 |
| completato | Grigio caldo | #57534E |
| caricato | Grigio scuro | #44403C |
| partito | Antracite | #292524 |
| annullato | Rosso | #DC2626 |

---

## 5. BUSINESS LOGIC

### 5.1 Calcolo durata prenotazione
```
Tempo_lavorazione = (quantita_kg / 1000) * (60 / ton_ora)
Durata = tempo_setup + tempo_lavorazione + (tempo_pulizia SE cambio_prodotto)
Durata_finale = arrotonda_per_eccesso_a_15_minuti(durata)
```

**Conversioni unita:**
- 1 ton = 1000 kg
- 1 sacco = 25 kg
- 1 pallet = 1000 kg

### 5.2 Generazione codici automatici
- Prenotazioni: `PROD-YYYY-NNNN` / `CONS-YYYY-NNNN` (sequenziale per anno)
- Clienti: `CLI001`, `CLI002`...
- Trasportatori: `TRA001`, `TRA002`...

### 5.3 Link produzione-consegna
Link bidirezionale tra prenotazioni:
- `prenotazione.prenotazione_consegna_collegata` → ID consegna
- `prenotazione.prenotazione_produzione_collegata` → ID produzione

### 5.4 Workflow dati di carico
1. Prenotazione deve essere tipo 'consegna' e stato 'in_carico'
2. Si registrano: targa, lotto, peso, idoneita, DDT
3. Se `idoneita_trasporto = false`, note obbligatorie
4. Stato avanza automaticamente a 'caricato'
5. DDT viene salvato anche nella prenotazione

---

## 6. API ENDPOINTS

### Auth
| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| POST | /api/auth/login | - | Login email/password |
| GET | /api/auth/me | JWT | Profilo utente corrente |
| POST | /api/auth/change-password | JWT | Cambio password |

### Utenti (gestione admin)
| Metodo | Endpoint | Auth | Permesso | Descrizione |
|--------|----------|------|----------|-------------|
| GET | /api/utenti | Supabase | any | Lista paginata (page, limit, search, attivo) |
| GET | /api/utenti/:id | Supabase | any | Dettaglio |
| POST | /api/utenti | Supabase | modifica | Crea (con sync Supabase Auth) |
| PUT | /api/utenti/:id | Supabase | modifica | Aggiorna |
| POST | /api/utenti/:id/reset-password | Supabase | modifica | Reset password |
| DELETE | /api/utenti/:id | Supabase | modifica | Disattiva (soft delete) |

### Clienti
| Metodo | Endpoint | Auth | Permesso | Descrizione |
|--------|----------|------|----------|-------------|
| GET | /api/clienti | JWT | any | Lista paginata (search, attivo, canale) |
| GET | /api/clienti/dropdown | JWT | any | Per autocomplete (solo attivi) |
| GET | /api/clienti/:id | JWT | any | Dettaglio |
| POST | /api/clienti | JWT | modifica | Crea (codice auto) |
| PUT | /api/clienti/:id | JWT | modifica | Aggiorna |
| DELETE | /api/clienti/:id | JWT | modifica | Cancella (soft/hard) |

### Trasportatori
Stessa struttura di clienti (stessi endpoint con `/api/trasportatori`).

### Prenotazioni
| Metodo | Endpoint | Auth | Permesso | Descrizione |
|--------|----------|------|----------|-------------|
| GET | /api/prenotazioni | JWT | any | Lista paginata con filtri |
| GET | /api/prenotazioni/calendario | JWT | any | Eventi per FullCalendar (date range) |
| GET | /api/prenotazioni/:id | JWT | any | Dettaglio + storico + dati carico + transizioni |
| POST | /api/prenotazioni | JWT | modifica | Crea (codice auto, durata auto) |
| PUT | /api/prenotazioni/:id | JWT | modifica | Aggiorna (solo stati non-finali) |
| PATCH | /api/prenotazioni/:id/stato | JWT | modifica | Cambio stato (valida transizione) |
| DELETE | /api/prenotazioni/:id | JWT | modifica | Solo se stato='pianificato' |
| GET | /api/prenotazioni/:id/dati-carico | JWT | any | Dati carico |
| POST | /api/prenotazioni/:id/dati-carico | JWT | modifica | Registra dati carico |
| PUT | /api/prenotazioni/:id/dati-carico | JWT | modifica | Aggiorna dati carico |

### Configurazione
| Metodo | Endpoint | Auth | Permesso | Descrizione |
|--------|----------|------|----------|-------------|
| GET | /api/configurazione/tempi-ciclo | JWT | any | Tutti i tempi ciclo |
| PUT | /api/configurazione/tempi-ciclo/:cat | JWT | modifica | Aggiorna tempi ciclo |
| POST | /api/configurazione/calcola-durata | JWT | any | Calcola durata prevista |
| GET | /api/configurazione/dashboard-stats | JWT | any | Statistiche dashboard |

---

## 7. AUTENTICAZIONE

### Dual auth system
1. **Supabase Auth** (frontend + endpoint utenti): email/password, gestito da Supabase
2. **JWT tradizionale** (backend API): token firmato per le API Express

### Flusso login
1. Frontend chiama `supabase.auth.signInWithPassword()`
2. Carica profilo da tabella `utenti`
3. Aggiorna `ultimo_accesso`
4. Session Supabase persiste nel browser

### Permessi
- **livello_accesso**: 'visualizzazione' (sola lettura) | 'modifica' (CRUD completo)
- **sezioni_abilitate**: array di ['produzione', 'consegne']
- Protezione: auto-disattivazione e auto-demozione impedite

---

## 8. FRONTEND - Pagine e funzionalita

### 8.1 Login
- Email + password
- Sfondo con gradiente
- Toggle visibilita password
- Redirect a dashboard dopo login

### 8.2 Dashboard
- **KPI cards** con contatori animati (prenotazioni oggi, in corso, completate)
- **Tabelle attivita**: prenotazioni di oggi e domani
- **Pull-to-refresh** mobile-friendly
- **Card navigazione rapida** verso le sezioni

### 8.3 Calendario
- **FullCalendar** con viste mese/settimana/giorno
- Vista di default: settimana
- Slot da 30 minuti
- **Sidebar destra**: mini-calendario, statistiche, prossimi eventi
- **Legenda** colori per stato
- **Click evento** → popup con dettagli
- **Drag & drop** → dialog modifica slot
- **Export**: iCal, CSV, HTML, JSON con selezione date

### 8.4 Lista prenotazioni
- Tabella paginata
- **Ricerca** con debounce 400ms (sanitizzata anti-injection)
- **Filtri** per stato
- Conferma eliminazione
- Badge stato colorato

### 8.5 Form prenotazione (creazione/modifica)
- **Multi-step** con MUI Stepper
- Autocomplete clienti e trasportatori
- Calcolo automatico durata basato su quantita e categoria
- Collegamento produzione ↔ consegna
- Campi condizionali in base a tipologia

### 8.6 Dettaglio prenotazione
- Info complete della prenotazione
- **Timeline storico stati** con timestamp e utente
- **Transizioni stato** possibili (bottoni)
- Sezione dati di carico (per consegne)
- Link alla prenotazione collegata

### 8.7 Form dati di carico
- Dati veicolo (targa automezzo, rimorchio, autista)
- Lotto caricato e scadenza
- Pesi (netto, tara, lordo)
- Orari inizio/fine carico
- Idoneita trasporto con note obbligatorie se non idoneo
- DDT numero e data

### 8.8 Gestione clienti
- Lista paginata con ricerca
- CRUD completo via dialog
- Filtri per canale e modalita consegna
- Destinazione consegna alternativa

### 8.9 Gestione trasportatori
- Come clienti + tipologie mezzi, certificazioni, rating puntualita

### 8.10 Gestione utenti (solo admin)
- CRUD utenti con sync Supabase Auth
- Livello accesso e sezioni abilitate
- Reset password
- Soft-delete (disattivazione)

### 8.11 Tempi ciclo (solo admin)
- Configurazione per categoria prodotto
- Tonnellate/ora, setup, pulizia
- Impatta calcolo durata prenotazioni

---

## 9. UI/UX DESIGN

### Tema: "Italian Industrial Refinement"

#### Palette colori
| Ruolo | Colore | Hex | Uso |
|-------|--------|-----|-----|
| Primary | Navy | #1B2A4A | Bottoni, stati attivi, sezione produzione |
| Primary light | Blu | #3B6FD4 | Variante chiara |
| Primary dark | Navy scuro | #0F1D35 | |
| Secondary | Terracotta | #C2410C | Sezione consegne |
| Secondary light | Arancio caldo | #EA580C | |
| Success | Verde foresta | #16A34A | Stati completati |
| Warning | Ambra | #CA8A04 | Stati in corso |
| Error | Rosso | #DC2626 | Errori, annullamenti |
| Background | Beige caldo | #F5F3EF | Sfondo pagina |
| Paper | Bianco | #FFFFFF | Card, dialog |
| Grey scale | Grigi caldi | 50→900 | Testi, bordi |

#### Tipografia
- **Titoli**: font "Outfit", weight 600-800, letter-spacing stretto
- **Corpo**: font "Source Sans 3", weight normale, lineHeight 1.55-1.65
- **Bottoni**: font "Outfit", weight 600, NO maiuscolo

#### Componenti UI
- **Bottoni**: padding 8px 22px, borderRadius 8px, sfondi con gradiente
- **TextField**: borderRadius 8px, boxShadow al focus (3px #1B2A4A15)
- **Card**: borderRadius 12px, bordo 1px #E8E5DF, ombra sottile
- **Table**: header maiuscolo, righe alternate con grey.50
- **Chip/Badge**: borderRadius 6px
- **Dialog**: borderRadius 14px, ombra 0 24px 48px
- **Scrollbar**: custom 6px, grigio.300

### Layout
- **Sidebar sinistra**: larghezza 260px, collassabile
  - Sezioni: Produzione, Consegne, Impostazioni
  - Colori diversi per sezione (navy produzione, terracotta consegne)
  - Visibilita condizionale in base ai permessi utente
- **Header**: logo, profilo utente, logout
- **Contenuto**: area principale con padding

### Navigazione
```
Sidebar:
├── PRODUZIONE (blu)
│   ├── Calendario
│   ├── Prenotazioni
│   ├── Clienti
│   └── Trasportatori
├── CONSEGNE (terracotta)
│   ├── Calendario
│   ├── Prenotazioni
│   ├── Clienti
│   └── Trasportatori
└── IMPOSTAZIONI (grigio)
    ├── Gestione Utenti
    └── Tempi Ciclo
```

---

## 10. OTTIMIZZAZIONI IMPLEMENTATE

1. **Lazy loading pagine**: React.lazy() riduce bundle iniziale da ~393KB a ~180KB
2. **Request cancellation**: AbortController su unmount componenti
3. **Debounce ricerca**: 400ms per ridurre query DB
4. **Parallel queries**: Promise.all() per dettaglio prenotazione (~300ms vs ~1.2s)
5. **Caricamento ottimistico auth**: pagine accessibili prima del profilo completo
6. **Safety timeout**: 8s timeout auth per evitare loading infinito
7. **Supabase Web Locks bypass**: evita ritardi 5s da React StrictMode
8. **Request timeout globale**: 15s per tutte le richieste Supabase
9. **Sanitizzazione ricerca**: rimuove caratteri speciali PostgREST
10. **Colori testo dinamici**: bianco/nero calcolato sulla luminanza sfondo

---

## 11. LABEL E CONFIGURAZIONI (in italiano)

### Categorie prodotto
| Chiave | Label |
|--------|-------|
| rinfusa | Rinfusa |
| confezionato_silos | Confezionato (Silos) |
| confezionato_sacco | Confezionato (Sacco) |

### Unita di misura
| Chiave | Label |
|--------|-------|
| kg | Kg |
| ton | Tonnellate |
| sacchi | Sacchi |
| pallet | Pallet |

### Tipologia carico
| Chiave | Label |
|--------|-------|
| big_bag | Big Bag |
| sacchi | Sacchi |
| cisterna | Cisterna |
| pallet | Pallet |

### Origine materiale
| Chiave | Label |
|--------|-------|
| silos | Silos |
| sacco | Sacco |
| big_bag | Big Bag |

### Canale cliente
| Chiave | Label |
|--------|-------|
| GDO | GDO |
| HORECA | HoReCa |
| industria | Industria |
| dettaglio | Dettaglio |
| export | Export |

### Modalita consegna
| Chiave | Label |
|--------|-------|
| franco_destino | Franco Destino |
| franco_partenza | Franco Partenza |
| ritiro_cliente | Ritiro Cliente |

### Priorita
1 = Massima → 10 = Bassissima (default: 5 = Media)

---

## 12. DIPENDENZE

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.3",
  "@mui/material": "^5.15.6",
  "@mui/icons-material": "^5.15.6",
  "@mui/lab": "^5.0.0-alpha.170",
  "@mui/x-date-pickers": "^6.19.0",
  "@emotion/react": "^11.11.3",
  "@emotion/styled": "^11.11.0",
  "@fullcalendar/core": "^6.1.10",
  "@fullcalendar/daygrid": "^6.1.10",
  "@fullcalendar/timegrid": "^6.1.10",
  "@fullcalendar/interaction": "^6.1.10",
  "@fullcalendar/react": "^6.1.10",
  "@supabase/supabase-js": "^2.99.1",
  "date-fns": "^3.3.0",
  "react-hook-form": "^7.49.3",
  "react-scripts": "5.0.1",
  "typescript": "^4.9.5"
}
```

### Backend
```json
{
  "express": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "pg": "^8.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "@supabase/supabase-js": "^2.x",
  "typescript": "^5.x"
}
```

---

## 13. NOTE PER LA RICOSTRUZIONE

### Cose da fare per primo
1. Creare progetto Supabase
2. Applicare la migrazione SQL completa (tabelle + funzioni + RLS + trigger)
3. Creare utente admin iniziale via Supabase dashboard
4. Configurare Vercel con le env vars
5. Inizializzare frontend (CRA o Vite) e backend (Express)

### Miglioramenti suggeriti per v4.0
- Migrare da CRA a **Vite** (build 10x piu veloce)
- Unificare auth su solo **Supabase Auth** (eliminare JWT custom)
- Aggiungere **rate limiting**
- Aggiungere **validazione input** con zod/joi
- Aggiungere **notifiche real-time** via Supabase Realtime
- Considerare **Supabase Edge Functions** invece di backend Express
- Aggiungere **test** (almeno per business logic)
- PWA support per uso mobile

---

*Documento generato il 2026-03-23 dall'analisi del codebase planner-molino v3.x*
