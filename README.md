# PLANNER Molino 4.0

Sistema di pianificazione integrata della produzione e delle consegne per un molino.

## Requisiti

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Setup Database

1. Crea il database PostgreSQL:
```sql
CREATE DATABASE planner_molino;
```

2. Configura le credenziali nel file `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planner_molino
DB_USER=postgres
DB_PASSWORD=la_tua_password
```

3. Esegui le migrazioni e il seeding:
```bash
cd backend
npm run migrate:seed
```

## Avvio

### Backend
```bash
cd backend
npm run dev
```
Il server sara disponibile su http://localhost:3001

### Frontend
```bash
cd frontend
npm start
```
L'applicazione sara disponibile su http://localhost:3000

## Utenti di Test

Dopo il seeding, saranno disponibili i seguenti utenti:

| Username | Password | Ruolo | Livello Accesso | Sezioni |
|----------|----------|-------|-----------------|---------|
| admin | password123 | Amministratore | modifica | produzione, consegne |
| operatore_prod | password123 | Operatore Produzione | modifica | produzione |
| operatore_log | password123 | Operatore Logistica | modifica | consegne |
| commerciale | password123 | Commerciale | visualizzazione | produzione, consegne |
| direzione | password123 | Direzione | visualizzazione | produzione, consegne |

## Struttura del Progetto

```
planner-molino/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configurazione database
│   │   ├── controllers/    # Controller delle API
│   │   ├── database/       # Migrazioni e seed
│   │   ├── middleware/     # Middleware (auth)
│   │   ├── routes/         # Route delle API
│   │   ├── types/          # Definizioni TypeScript
│   │   └── utils/          # Utility (tempi ciclo, stati)
│   └── package.json
│
└── frontend/               # React SPA
    ├── src/
    │   ├── components/     # Componenti React
    │   ├── contexts/       # Context (Auth)
    │   ├── pages/          # Pagine dell'applicazione
    │   ├── services/       # API client
    │   ├── types/          # Definizioni TypeScript
    │   └── utils/          # Utility e configurazioni
    └── package.json
```

## Funzionalita

### Planning Produzione
- Calendario delle lavorazioni
- Gestione prenotazioni produzione
- Workflow stati: pianificato -> preso_in_carico -> in_produzione -> completato

### Planning Consegne
- Calendario delle consegne
- Gestione prenotazioni consegne
- Workflow stati: pianificato -> preso_in_carico -> in_preparazione -> pronto_carico -> in_carico -> caricato -> partito
- Registrazione dati carico (peso, lotto, DDT, etc.)

### Anagrafiche
- Gestione clienti
- Gestione trasportatori

### Calcolo Automatico Durate
Il sistema calcola automaticamente la durata delle prenotazioni in base a:
- Categoria prodotto (rinfusa, confezionato silos, confezionato sacco)
- Quantita in kg
- Tempi di setup e pulizia configurabili

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Info utente corrente

### Prenotazioni
- `GET /api/prenotazioni` - Lista prenotazioni
- `GET /api/prenotazioni/calendario` - Eventi per calendario
- `GET /api/prenotazioni/:id` - Dettaglio prenotazione
- `POST /api/prenotazioni` - Crea prenotazione
- `PUT /api/prenotazioni/:id` - Modifica prenotazione
- `PATCH /api/prenotazioni/:id/stato` - Cambia stato
- `POST /api/prenotazioni/:id/dati-carico` - Registra dati carico

### Clienti
- `GET /api/clienti` - Lista clienti
- `GET /api/clienti/dropdown` - Lista per dropdown
- `POST /api/clienti` - Crea cliente
- `PUT /api/clienti/:id` - Modifica cliente

### Trasportatori
- `GET /api/trasportatori` - Lista trasportatori
- `GET /api/trasportatori/dropdown` - Lista per dropdown
- `POST /api/trasportatori` - Crea trasportatore
- `PUT /api/trasportatori/:id` - Modifica trasportatore
