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

## Deployment Online

### Frontend (Vercel)
Il frontend è deployato su Vercel:
- **URL**: https://frontend-two-vert-37.vercel.app

### Backend (Railway)
Per completare il deployment del backend su Railway:

1. Vai su https://railway.app e accedi con GitHub
2. Clicca "New Project" -> "Deploy from GitHub repo"
3. Seleziona il repository `PINGER104/planner-molino`
4. Railway rileverà automaticamente la cartella `backend`
5. Aggiungi un database PostgreSQL:
   - Clicca "New" -> "Database" -> "Add PostgreSQL"
6. Configura le variabili d'ambiente nel servizio backend:
   - `DATABASE_URL` - (viene auto-configurata se colleghi il DB)
   - `JWT_SECRET` - una stringa segreta casuale
   - `NODE_ENV` - `production`
   - `CORS_ORIGIN` - `https://frontend-two-vert-37.vercel.app`
   - `PORT` - `3001` (o lascia che Railway lo assegni)

7. Dopo il deploy, copia l'URL del backend Railway (es: `https://planner-molino-xxx.up.railway.app`)

8. Aggiorna la variabile d'ambiente su Vercel:
   ```bash
   vercel env rm REACT_APP_API_URL production
   vercel env add REACT_APP_API_URL production
   # Inserisci: https://TUO-URL-RAILWAY.up.railway.app/api
   vercel deploy --prod
   ```

### Repository GitHub
- **URL**: https://github.com/PINGER104/planner-molino
