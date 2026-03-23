# Planner Molino v4.0 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ricostruire da zero l'app Planner Molino con stack moderno (Vite, Supabase Auth unificata, Realtime, PWA, zod validation).

**Architecture:** Monorepo npm workspaces con 3 packages (frontend Vite+React+MUI, backend Express serverless Vercel, shared types+zod+constants). Auth unificata via Supabase. Realtime su tutte le entita. PWA con offline support.

**Tech Stack:** Vite, React 18, TypeScript, MUI 5, Express, Supabase (PostgreSQL + Auth + Realtime + Storage), FullCalendar 6, react-hook-form + zod, date-fns, vite-plugin-pwa, Vercel.

**Design doc:** `docs/plans/2026-03-23-planner-molino-v4-design.md`
**Specifiche originali:** `Specifiche - PLANNER.md`

---

## Fase 1: Scaffold e Fondamenta

### Task 1: Inizializza monorepo con npm workspaces

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `vercel.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/tsconfig.json`

**Step 1: Crea root package.json con workspaces**

```json
{
  "name": "planner-molino",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:frontend": "npm run dev -w packages/frontend",
    "dev:backend": "npm run dev -w packages/backend",
    "build:shared": "npm run build -w packages/shared",
    "build:frontend": "npm run build -w packages/frontend",
    "build:backend": "npm run build -w packages/backend",
    "build": "npm run build:shared && npm run build:frontend && npm run build:backend",
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "engines": {
    "node": ">=18"
  }
}
```

**Step 2: Crea tsconfig.base.json condiviso**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 3: Crea .gitignore**

```
node_modules/
dist/
build/
.env
.env.local
*.log
.vercel
.DS_Store
```

**Step 4: Crea .env.example**

```env
# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Frontend (prefisso VITE_)
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_API_URL=/api

# Backend
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Step 5: Crea vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "packages/frontend/dist",
  "functions": {
    "packages/backend/api/index.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/packages/backend/api/index.ts" },
    { "source": "/(.*)", "destination": "/packages/frontend/dist/index.html" }
  ]
}
```

**Step 6: Inizializza git e commit**

```bash
git init
git add .
git commit -m "chore: init monorepo with npm workspaces"
```

---

### Task 2: Package shared — tipi, costanti, schemi zod

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/types/utente.ts`
- Create: `packages/shared/src/types/cliente.ts`
- Create: `packages/shared/src/types/trasportatore.ts`
- Create: `packages/shared/src/types/prenotazione.ts`
- Create: `packages/shared/src/types/dati-carico.ts`
- Create: `packages/shared/src/types/configurazione.ts`
- Create: `packages/shared/src/constants/stati.ts`
- Create: `packages/shared/src/constants/colori.ts`
- Create: `packages/shared/src/constants/labels.ts`
- Create: `packages/shared/src/constants/index.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/schemas/cliente.schema.ts`
- Create: `packages/shared/src/schemas/trasportatore.schema.ts`
- Create: `packages/shared/src/schemas/prenotazione.schema.ts`
- Create: `packages/shared/src/schemas/dati-carico.schema.ts`
- Create: `packages/shared/src/schemas/auth.schema.ts`
- Create: `packages/shared/src/utils/calcolo-durata.ts`
- Create: `packages/shared/src/utils/conversioni.ts`
- Create: `packages/shared/src/utils/index.ts`

**Step 1: Installa dipendenze shared**

```bash
cd packages/shared
npm init -y
npm install zod
```

Configura `package.json`:
```json
{
  "name": "@planner-molino/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

**Step 2: Crea tutti i tipi TypeScript**

Ogni file tipo corrisponde 1:1 alle tabelle DB dalla specifica (sezione 3).

`types/utente.ts`: interfaccia `Utente` con tutti i campi tabella `utenti`.
`types/cliente.ts`: interfaccia `Cliente` con tutti i campi tabella `clienti`.
`types/trasportatore.ts`: interfaccia `Trasportatore` con campi tabella `trasportatori`.
`types/prenotazione.ts`: interfaccia `Prenotazione` con campi tabella `prenotazioni` + `StoricoStato`.
`types/dati-carico.ts`: interfaccia `DatiCarico` con campi tabella `dati_carico`.
`types/configurazione.ts`: interfaccia `ConfigurazioneTempiCiclo`.

Riferimento: `Specifiche - PLANNER.md` sezione 3 per ogni campo/tipo/vincolo.

**Step 3: Crea costanti**

`constants/stati.ts`:
- Enum `StatoProduzione`: pianificato, preso_in_carico, in_produzione, completato, annullato
- Enum `StatoConsegna`: pianificato, preso_in_carico, in_preparazione, pronto_carico, in_carico, caricato, partito, annullato
- Mappa `TRANSIZIONI_PRODUZIONE`: { pianificato: ['preso_in_carico', 'annullato'], ... }
- Mappa `TRANSIZIONI_CONSEGNA`: { pianificato: ['preso_in_carico', 'annullato'], ... }
- Set `STATI_FINALI`: completato, partito, annullato

Riferimento: `Specifiche - PLANNER.md` sezione 4 (macchina a stati).

`constants/colori.ts`:
- Mappa `COLORI_STATO`: { pianificato: '#3B6FD4', preso_in_carico: '#CA8A04', ... }

Riferimento: design doc sezione 9.

`constants/labels.ts`:
- `CATEGORIE_PRODOTTO`, `UNITA_MISURA`, `TIPOLOGIA_CARICO`, `ORIGINE_MATERIALE`, `CANALE_CLIENTE`, `MODALITA_CONSEGNA`

Riferimento: `Specifiche - PLANNER.md` sezione 11.

**Step 4: Crea schemi zod**

Ogni schema corrisponde ai form/API:

`schemas/cliente.schema.ts`:
- `createClienteSchema`: ragione_sociale required, tutti gli altri opzionali. Validazione partita_iva (11 cifre), CAP (5 cifre), provincia (2 char).
- `updateClienteSchema`: tutti opzionali (partial)

`schemas/trasportatore.schema.ts`:
- `createTrasportatoreSchema`: ragione_sociale required.
- `updateTrasportatoreSchema`: partial

`schemas/prenotazione.schema.ts`:
- `createPrenotazioneSchema`: tipologia, cliente_id, data_pianificata, ora_inizio_prevista required. Quantita, categoria, specifiche W/PL opzionali. Validazione: data_pianificata >= oggi.
- `updatePrenotazioneSchema`: partial
- `cambioStatoSchema`: stato required, note required se stato === 'annullato'

`schemas/dati-carico.schema.ts`:
- `createDatiCaricoSchema`: data_carico, targa_automezzo, lotto_caricato, peso_caricato_kg, idoneita_trasporto required. idoneita_note required se idoneita === false.

`schemas/auth.schema.ts`:
- `loginSchema`: email (email format), password (min 6)

**Step 5: Crea utility calcolo durata**

`utils/calcolo-durata.ts`:
```typescript
// Formula: tempo_setup + (quantita_kg/1000 * 60/ton_ora) + tempo_pulizia_se_cambio
// Arrotondamento per eccesso a 15 minuti
export function calcolaDurataPrevista(
  quantitaKg: number,
  tonOra: number,
  tempoSetupMinuti: number,
  tempoPuliziaMinuti: number,
  cambioProdotto: boolean
): number
```

`utils/conversioni.ts`:
```typescript
// 1 ton = 1000 kg, 1 sacco = 25 kg, 1 pallet = 1000 kg
export function convertiInKg(quantita: number, unita: string): number
```

Riferimento: `Specifiche - PLANNER.md` sezione 5.1 e 5.2.

**Step 6: Crea barrel exports e commit**

```bash
git add packages/shared/
git commit -m "feat: add shared package with types, zod schemas, constants, utils"
```

---

### Task 3: Scaffold backend Express

**Files:**
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/backend/api/index.ts`
- Create: `packages/backend/src/index.ts`
- Create: `packages/backend/src/config/database.ts`
- Create: `packages/backend/src/lib/supabaseAdmin.ts`
- Create: `packages/backend/src/middleware/auth.ts`
- Create: `packages/backend/src/middleware/validate.ts`
- Create: `packages/backend/src/middleware/rateLimit.ts`

**Step 1: Installa dipendenze backend**

```bash
npm install express cors dotenv pg @supabase/supabase-js express-rate-limit
npm install -D typescript @types/express @types/cors @types/pg @vercel/node tsx
```

**Step 2: Crea entry point Express**

`src/index.ts`: Express app con cors, json parser, rate limiting globale, mount routes su `/api/*`.

`api/index.ts`: Re-export di Express app per Vercel serverless (`export default app`).

**Step 3: Crea middleware auth Supabase**

`middleware/auth.ts`:
- Estrae Bearer token da header Authorization
- Chiama `supabase.auth.getUser(token)` per validare
- Carica profilo da tabella `utenti`
- Attacca user a `req.user`
- Middleware `requireModifica`: verifica `livello_accesso === 'modifica'`

Riferimento: design doc sezione 3 (flusso auth).

**Step 4: Crea middleware validazione zod**

`middleware/validate.ts`:
- Generic middleware che accetta uno zod schema
- Valida `req.body` e ritorna 400 con errori zod formattati

**Step 5: Crea config database e Supabase admin**

`config/database.ts`: Pool pg con connection string da env.
`lib/supabaseAdmin.ts`: Client Supabase con service_role_key.

**Step 6: Commit**

```bash
git add packages/backend/
git commit -m "feat: scaffold backend Express with Supabase auth middleware"
```

---

### Task 4: Scaffold frontend Vite + React + MUI

**Files:**
- Create: `packages/frontend/index.html`
- Create: `packages/frontend/vite.config.ts`
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/tsconfig.json`
- Create: `packages/frontend/src/main.tsx`
- Create: `packages/frontend/src/App.tsx`
- Create: `packages/frontend/src/lib/supabase.ts`
- Create: `packages/frontend/src/theme/theme.ts`
- Create: `packages/frontend/src/theme/components.ts`
- Create: `packages/frontend/src/theme/palette.ts`
- Create: `packages/frontend/src/theme/typography.ts`
- Create: `packages/frontend/src/contexts/AuthContext.tsx`

**Step 1: Installa dipendenze frontend**

```bash
npm install react react-dom react-router-dom @mui/material @mui/icons-material @mui/lab @mui/x-date-pickers @emotion/react @emotion/styled @supabase/supabase-js date-fns react-hook-form @hookform/resolvers zod
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react vite-plugin-pwa
```

**Step 2: Configura Vite**

`vite.config.ts`:
- Plugin: react(), VitePWA (registerType: 'autoUpdate', workbox runtimeCaching)
- Resolve alias: `@shared` -> `../../shared/src`
- Server proxy: `/api` -> `http://localhost:3001`

**Step 3: Crea tema MUI "Italian Industrial Refinement"**

`theme/palette.ts`: Palette completa da design doc sezione 7.
`theme/typography.ts`: Outfit (titoli/bottoni), Source Sans 3 (corpo), JetBrains Mono (codici).
`theme/components.ts`: Override MUI per Button, TextField, Card, Dialog, Table, Chip, Scrollbar.
`theme/theme.ts`: Compone `createTheme()` con palette + typography + components.

Riferimento: design doc sezione 7.

**Step 4: Crea AuthContext**

`contexts/AuthContext.tsx`:
- `useAuth()` hook: user, loading, login(), logout()
- Login via `supabase.auth.signInWithPassword()`
- Carica profilo da tabella `utenti` dopo login
- Aggiorna `ultimo_accesso`
- `onAuthStateChange` listener per session persistence
- Safety timeout 8s per evitare loading infinito
- Web Locks bypass per React StrictMode

Riferimento: `Specifiche - PLANNER.md` sezione 7.

**Step 5: Crea App.tsx con routing base**

```tsx
// React.lazy per tutte le pagine
// Routes: /login, /dashboard, /produzione/*, /consegne/*, /impostazioni/*
// PrivateRoute wrapper che verifica auth + sezioni_abilitate
```

**Step 6: Commit**

```bash
git add packages/frontend/
git commit -m "feat: scaffold frontend Vite + React + MUI theme + auth context"
```

---

## Fase 2: Database e Migrazione

### Task 5: Script migrazione SQL Supabase

**Files:**
- Create: `supabase/migrations/001_tables.sql`
- Create: `supabase/migrations/002_functions.sql`
- Create: `supabase/migrations/003_rls.sql`
- Create: `supabase/migrations/004_views_indexes.sql`
- Create: `supabase/migrations/005_seed.sql`

**Step 1: Crea tabelle**

`001_tables.sql`: 7 tabelle esattamente come da specifiche sezione 3.1-3.7.
Ordine: utenti, clienti, trasportatori, prenotazioni (FK a clienti + trasportatori), storico_stati (FK prenotazioni), dati_carico (FK prenotazioni), configurazione_tempi_ciclo.

**Step 2: Crea funzioni PL/pgSQL**

`002_functions.sql`: Tutte le 12 funzioni da specifiche sezione 3.11.
Include trigger `handle_new_user()` e `update_updated_at()`.

**Step 3: Crea RLS policies**

`003_rls.sql`: Come da specifiche sezione 3.10.
- SELECT: utenti autenticati
- INSERT/UPDATE/DELETE: livello_accesso = 'modifica'
- utenti: UPDATE solo proprio record

**Step 4: Crea viste e indici**

`004_views_indexes.sql`:
- `prenotazioni_view`: JOIN con clienti e trasportatori
- `storico_stati_view`: JOIN con utenti
- Tutti gli indici da sezione 3.9

**Step 5: Seed dati iniziali**

`005_seed.sql`:
- 3 record `configurazione_tempi_ciclo` (rinfusa, confezionato_silos, confezionato_sacco)
- Valori da specifiche sezione 3.7

**Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add complete SQL migration (tables, functions, RLS, views, seed)"
```

---

## Fase 3: Backend API

### Task 6: Controller e routes — Auth

**Files:**
- Create: `packages/backend/src/controllers/auth.controller.ts`
- Create: `packages/backend/src/routes/auth.routes.ts`

**Step 1: Implementa auth controller**

- `login`: email/password via Supabase Auth signInWithPassword, ritorna session + profilo utente
- `me`: ritorna profilo utente corrente da `req.user`
- `changePassword`: `supabase.auth.admin.updateUserById()`

Riferimento: specifiche sezione 6 (Auth endpoints).

**Step 2: Crea routes e monta in Express**

POST `/api/auth/login` -> login (no auth middleware)
GET `/api/auth/me` -> me (auth required)
POST `/api/auth/change-password` -> changePassword (auth required)

**Step 3: Commit**

```bash
git commit -m "feat: add auth controller and routes"
```

---

### Task 7: Controller e routes — Clienti

**Files:**
- Create: `packages/backend/src/controllers/clienti.controller.ts`
- Create: `packages/backend/src/routes/clienti.routes.ts`

**Step 1: Implementa CRUD clienti**

- `list`: paginazione (page, limit), search (sanitizzato, debounce-ready), filtri (attivo, canale)
- `dropdown`: solo attivi, campi minimi per autocomplete
- `getById`: dettaglio singolo
- `create`: validazione zod `createClienteSchema`, codice auto via funzione PL/pgSQL `create_cliente()`
- `update`: validazione zod `updateClienteSchema`
- `delete`: soft-delete (attivo=false) o hard delete

Riferimento: specifiche sezione 6 (Clienti endpoints).

**Step 2: Routes con middleware auth e validazione**

GET `/api/clienti` -> list (auth)
GET `/api/clienti/dropdown` -> dropdown (auth)
GET `/api/clienti/:id` -> getById (auth)
POST `/api/clienti` -> create (auth + modifica + validate)
PUT `/api/clienti/:id` -> update (auth + modifica + validate)
DELETE `/api/clienti/:id` -> delete (auth + modifica)

**Step 3: Commit**

```bash
git commit -m "feat: add clienti CRUD controller and routes"
```

---

### Task 8: Controller e routes — Trasportatori

**Files:**
- Create: `packages/backend/src/controllers/trasportatori.controller.ts`
- Create: `packages/backend/src/routes/trasportatori.routes.ts`

Stessa struttura di clienti. Stesso pattern CRUD.
Campi aggiuntivi: tipologie_mezzi, certificazioni, rating_puntualita.

```bash
git commit -m "feat: add trasportatori CRUD controller and routes"
```

---

### Task 9: Controller e routes — Prenotazioni

**Files:**
- Create: `packages/backend/src/controllers/prenotazioni.controller.ts`
- Create: `packages/backend/src/routes/prenotazioni.routes.ts`

**Step 1: Implementa controller prenotazioni**

- `list`: paginazione + filtri (tipologia, stato, data_da, data_a, cliente_id, priorita) + search
- `calendario`: eventi per FullCalendar (parametri: start, end, tipologia). Ritorna array di eventi con id, title, start, end, backgroundColor (colore stato), extendedProps.
- `getById`: dettaglio + storico_stati + dati_carico + transizioni possibili (via `get_transizioni_possibili()`)
- `create`: validazione zod, chiama `create_prenotazione()` (codice auto, durata auto, link bidirezionale)
- `update`: solo stati non-finali, validazione zod
- `cambioStato`: validazione transizione via `update_stato_prenotazione()`, note obbligatorie per annullamento
- `delete`: solo se stato = 'pianificato'
- `getDatiCarico`: dati carico per prenotazione
- `createDatiCarico`: chiama `create_dati_carico()`, valida, stato -> 'caricato'
- `updateDatiCarico`: aggiorna dati carico esistenti

Riferimento: specifiche sezione 6 (Prenotazioni endpoints) e sezione 5 (business logic).

**Step 2: Routes**

Tutti gli endpoint da specifiche sezione 6 con middleware auth + modifica + validate.

**Step 3: Commit**

```bash
git commit -m "feat: add prenotazioni controller with state machine and calendar support"
```

---

### Task 10: Controller e routes — Utenti (admin)

**Files:**
- Create: `packages/backend/src/controllers/utenti.controller.ts`
- Create: `packages/backend/src/routes/utenti.routes.ts`

- CRUD con sync Supabase Auth (`supabase.auth.admin.createUser/updateUserById/deleteUser`)
- Protezione: non puoi disattivare o declassare te stesso
- Reset password via `supabase.auth.admin.updateUserById()`
- Soft delete: `attivo = false`

Riferimento: specifiche sezione 6 (Utenti endpoints).

```bash
git commit -m "feat: add utenti admin controller with Supabase Auth sync"
```

---

### Task 11: Controller e routes — Configurazione

**Files:**
- Create: `packages/backend/src/controllers/configurazione.controller.ts`
- Create: `packages/backend/src/routes/configurazione.routes.ts`

- `getTempiCiclo`: tutti i record
- `updateTempiCiclo`: aggiorna per categoria
- `calcolaDurata`: calcola durata prevista (usa util da shared)
- `getDashboardStats`: statistiche aggregate per dashboard KPI

Riferimento: specifiche sezione 6 (Configurazione endpoints).

```bash
git commit -m "feat: add configurazione controller (tempi ciclo + dashboard stats)"
```

---

### Task 12: Monta tutte le routes e testa backend

**Step 1: Monta routes in Express app**

```typescript
// src/index.ts
app.use('/api/auth', authRoutes);
app.use('/api/clienti', clientiRoutes);
app.use('/api/trasportatori', trasportatoriRoutes);
app.use('/api/prenotazioni', prenotazioniRoutes);
app.use('/api/utenti', utentiRoutes);
app.use('/api/configurazione', configurazioneRoutes);
```

**Step 2: Testa manualmente con curl/Postman**

Verifica: login -> token -> CRUD clienti -> CRUD prenotazioni -> cambio stato.

**Step 3: Commit**

```bash
git commit -m "feat: mount all routes, backend API complete"
```

---

## Fase 4: Frontend — Layout e Navigazione

### Task 13: Layout principale (Sidebar + Header)

**Files:**
- Create: `packages/frontend/src/components/layout/MainLayout.tsx`
- Create: `packages/frontend/src/components/layout/Sidebar.tsx`
- Create: `packages/frontend/src/components/layout/Header.tsx`
- Create: `packages/frontend/src/components/layout/BottomNav.tsx`

**Step 1: Implementa Sidebar**

- 260px, collassabile a 60px (icone)
- 3 sezioni: Produzione (navy), Consegne (terracotta), Impostazioni (grigio)
- Sotto-menu per sezione (Calendario, Prenotazioni, Clienti, Trasportatori)
- Visibilita condizionale su `sezioni_abilitate`
- Su mobile: Drawer overlay con swipe-to-close
- Icone MUI per ogni voce

Riferimento: design doc sezione 7 (layout + navigazione).

**Step 2: Implementa Header**

- Logo Molino (testo/SVG)
- Titolo sezione corrente
- Avatar + nome utente
- Bottone logout

**Step 3: Implementa BottomNav (mobile < 600px)**

- MUI BottomNavigation con 4 tab: Dashboard, Produzione, Consegne, Impostazioni

**Step 4: MainLayout composition**

```tsx
// Responsive: sidebar desktop, drawer tablet, bottom-nav mobile
// Outlet per contenuto pagina
```

**Step 5: Commit**

```bash
git commit -m "feat: add responsive layout (sidebar, header, bottom-nav)"
```

---

### Task 14: Pagina Login

**Files:**
- Create: `packages/frontend/src/pages/LoginPage.tsx`

- Form email + password con react-hook-form + zod (`loginSchema` da shared)
- Sfondo gradiente navy -> terracotta
- Toggle visibilita password (icona occhio)
- Loading state su bottone submit
- Errore inline per credenziali errate
- Redirect a `/dashboard` dopo login
- Redirect a `/login` se non autenticato

**Step 1: Implementa e testa**

```bash
git commit -m "feat: add login page with Supabase Auth"
```

---

### Task 15: Services layer (API client)

**Files:**
- Create: `packages/frontend/src/services/api.ts`
- Create: `packages/frontend/src/services/clienti.service.ts`
- Create: `packages/frontend/src/services/trasportatori.service.ts`
- Create: `packages/frontend/src/services/prenotazioni.service.ts`
- Create: `packages/frontend/src/services/utenti.service.ts`
- Create: `packages/frontend/src/services/configurazione.service.ts`

**Step 1: Crea API client base**

`api.ts`:
- Wrapper Supabase/fetch con Bearer token automatico
- AbortController per cancellazione su unmount
- Timeout globale 15s
- Error handling centralizzato

**Step 2: Crea service per ogni entita**

Ogni service espone le funzioni CRUD che chiamano il backend API:
- `clientiService.list(params)`, `.getById(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`, `.dropdown()`
- Stesso pattern per trasportatori, prenotazioni, utenti, configurazione

**Step 3: Commit**

```bash
git commit -m "feat: add frontend services layer with AbortController"
```

---

## Fase 5: Frontend — Pagine principali

### Task 16: Dashboard

**Files:**
- Create: `packages/frontend/src/pages/DashboardPage.tsx`
- Create: `packages/frontend/src/components/dashboard/KpiCard.tsx`
- Create: `packages/frontend/src/components/dashboard/PrenotazioniTable.tsx`
- Create: `packages/frontend/src/components/dashboard/QuickNavCards.tsx`

- 4 KPI cards con contatori animati (useCountUp o custom)
- 2 tabelle: prenotazioni oggi + domani
- Card navigazione rapida
- Pull-to-refresh (touch event handler)
- Dati da `configurazione.service.getDashboardStats()`

```bash
git commit -m "feat: add dashboard page with KPI cards and activity tables"
```

---

### Task 17: Gestione Clienti

**Files:**
- Create: `packages/frontend/src/pages/ClientiPage.tsx`
- Create: `packages/frontend/src/components/clienti/ClientiTable.tsx`
- Create: `packages/frontend/src/components/clienti/ClienteDialog.tsx`
- Create: `packages/frontend/src/components/clienti/ClienteForm.tsx`

- Tabella paginata con ricerca (debounce 400ms, sanitizzazione)
- Filtri: canale, modalita consegna, attivo
- CRUD via dialog modale
- Form con react-hook-form + zod (`createClienteSchema`)
- Toggle destinazione alternativa (mostra/nasconde campi dest_*)
- Codice auto-generato (readonly)

Riferimento: specifiche sezione 8.8.

```bash
git commit -m "feat: add clienti management page with CRUD dialog"
```

---

### Task 18: Gestione Trasportatori

**Files:**
- Create: `packages/frontend/src/pages/TrasportatoriPage.tsx`
- Create: `packages/frontend/src/components/trasportatori/TrasportatoriTable.tsx`
- Create: `packages/frontend/src/components/trasportatori/TrasportatoreDialog.tsx`
- Create: `packages/frontend/src/components/trasportatori/TrasportatoreForm.tsx`

Stesso pattern di clienti + campi extra:
- Tipologie mezzi (MUI Autocomplete multi-select con chip)
- Certificazioni (multi-select)
- Rating puntualita (MUI Rating o Slider 0-5)

```bash
git commit -m "feat: add trasportatori management page"
```

---

### Task 19: Lista Prenotazioni

**Files:**
- Create: `packages/frontend/src/pages/PrenotazioniListPage.tsx`
- Create: `packages/frontend/src/components/prenotazioni/PrenotazioniTable.tsx`
- Create: `packages/frontend/src/components/prenotazioni/StatoBadge.tsx`
- Create: `packages/frontend/src/components/prenotazioni/FiltriPrenotazioni.tsx`

- Tabella paginata con ricerca
- Filtri: stato, data range, cliente, priorita
- `StatoBadge`: Chip colorato con colore da `COLORI_STATO` (shared)
- Azioni inline: dettaglio (link), modifica, cambio stato rapido, elimina
- Conferma eliminazione (solo stato "pianificato")
- Pagina riusata per produzione e consegne (prop `tipologia`)

```bash
git commit -m "feat: add prenotazioni list page with filters and status badges"
```

---

### Task 20: Form Prenotazione (multi-step)

**Files:**
- Create: `packages/frontend/src/pages/PrenotazioneFormPage.tsx`
- Create: `packages/frontend/src/components/prenotazioni/form/StepGenerale.tsx`
- Create: `packages/frontend/src/components/prenotazioni/form/StepProdotto.tsx`
- Create: `packages/frontend/src/components/prenotazioni/form/StepDataOra.tsx`
- Create: `packages/frontend/src/components/prenotazioni/form/StepRiepilogo.tsx`

- MUI Stepper con 4 step
- Step 1 Generale: tipologia (auto da route), cliente (Autocomplete), trasportatore (Autocomplete), priorita
- Step 2 Prodotto: prodotto_codice, descrizione, categoria (select), specifica W/PL, quantita, unita_misura, origine_materiale, silos, linea produzione
- Step 3 Data/Ora: data_pianificata (DatePicker), ora_inizio_prevista (TimePicker), calcolo automatico durata e ora_fine (via `calcolaDurataPrevista` da shared), collegamento prenotazione (Autocomplete prenotazioni)
- Step 4 Riepilogo: read-only summary di tutti i campi + conferma
- Validazione zod per step
- Riuso per creazione e modifica (precarica dati se `:id` presente)

Riferimento: specifiche sezione 8.5.

```bash
git commit -m "feat: add multi-step prenotazione form with auto duration"
```

---

### Task 21: Dettaglio Prenotazione

**Files:**
- Create: `packages/frontend/src/pages/PrenotazioneDettaglioPage.tsx`
- Create: `packages/frontend/src/components/prenotazioni/dettaglio/InfoCard.tsx`
- Create: `packages/frontend/src/components/prenotazioni/dettaglio/StoricoTimeline.tsx`
- Create: `packages/frontend/src/components/prenotazioni/dettaglio/TransizioniStato.tsx`
- Create: `packages/frontend/src/components/prenotazioni/dettaglio/DatiCaricoSection.tsx`

- Card info con tutti i campi
- `StoricoTimeline`: MUI Timeline verticale con stato, timestamp, utente
- `TransizioniStato`: bottoni per ogni transizione valida (da `get_transizioni_possibili`)
- Dialog annullamento con TextField note obbligatorie
- `DatiCaricoSection`: visibile solo per consegne con stato >= in_carico. Mostra dati carico se esistono, bottone "Registra carico" se no
- Link navigabile a prenotazione collegata
- Parallel queries con `Promise.all()` per dettaglio + storico + dati carico + transizioni

Riferimento: specifiche sezione 8.6.

```bash
git commit -m "feat: add prenotazione detail page with timeline and state transitions"
```

---

### Task 22: Form Dati di Carico

**Files:**
- Create: `packages/frontend/src/components/prenotazioni/dettaglio/DatiCaricoForm.tsx`

- Dialog o pagina dedicata (da dettaglio consegna)
- Form con react-hook-form + zod (`createDatiCaricoSchema`)
- Campi: data_carico, ora_inizio/fine, targa automezzo/rimorchio, nome_autista
- Lotto caricato + scadenza
- 3 pesi: netto (obbligatorio), tara, lordo (calcolato: netto + tara)
- Idoneita trasporto (Switch) + note condizionali
- DDT numero + data
- Upload foto carico (Supabase Storage, campo file multiplo)
- Upload certificato lavaggio (Supabase Storage)
- Submit -> crea dati carico + stato automatico "caricato"

Riferimento: specifiche sezione 8.7 e 5.4.

```bash
git commit -m "feat: add dati carico form with file upload"
```

---

### Task 23: Calendario (FullCalendar)

**Files:**
- Create: `packages/frontend/src/pages/CalendarioPage.tsx`
- Create: `packages/frontend/src/components/calendario/CalendarView.tsx`
- Create: `packages/frontend/src/components/calendario/CalendarSidebar.tsx`
- Create: `packages/frontend/src/components/calendario/EventPopup.tsx`
- Create: `packages/frontend/src/components/calendario/ExportDialog.tsx`
- Create: `packages/frontend/src/hooks/useCalendar.ts`

**Step 1: Installa FullCalendar**

```bash
npm install @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/react
```

**Step 2: Implementa CalendarView**

- FullCalendar con plugin: dayGrid, timeGrid, interaction
- Viste: mese, settimana (default), giorno
- Slot 30 minuti
- Altezza evento proporzionale alla durata
- Colore evento = colore stato (da `COLORI_STATO`)
- `eventClick` -> popup dettagli
- `eventDrop`/`eventResize` -> dialog conferma modifica slot
- `datesSet` -> fetch eventi per range visibile
- Locale italiano

**Step 3: Implementa CalendarSidebar**

- Mini-calendario (MUI DateCalendar o FullCalendar mini)
- Statistiche giorno selezionato (pianificate, in corso, completate)
- Lista prossimi 5 eventi
- Legenda colori stati

**Step 4: Implementa EventPopup**

- Popup MUI (Popover) su click evento
- Codice, cliente, prodotto, stato, orario
- Bottoni: dettaglio, modifica, cambio stato rapido

**Step 5: Implementa ExportDialog**

- Dialog con selezione date range
- Formato export: iCal, CSV, HTML, JSON
- Download file

**Step 6: Hook useCalendar**

- Fetch eventi da `prenotazioni.service.getCalendario(start, end, tipologia)`
- Cache locale per range gia caricati
- Refetch su modifica

Riferimento: specifiche sezione 8.3.

```bash
git commit -m "feat: add calendar page with FullCalendar, sidebar, and export"
```

---

### Task 24: Gestione Utenti (admin)

**Files:**
- Create: `packages/frontend/src/pages/UtentiPage.tsx`
- Create: `packages/frontend/src/components/utenti/UtentiTable.tsx`
- Create: `packages/frontend/src/components/utenti/UtenteDialog.tsx`
- Create: `packages/frontend/src/components/utenti/UtenteForm.tsx`

- Lista con ricerca
- CRUD via dialog
- Campi: username, nome, cognome, email, telefono, ruolo (text), livello_accesso (select: visualizzazione/modifica), sezioni_abilitate (checkbox: produzione, consegne)
- Bottone reset password
- Toggle attivo/disattivo
- Protezione: non puoi modificare livello_accesso o attivo del proprio account

Riferimento: specifiche sezione 8.10.

```bash
git commit -m "feat: add utenti admin page with Supabase Auth sync"
```

---

### Task 25: Configurazione Tempi Ciclo (admin)

**Files:**
- Create: `packages/frontend/src/pages/TempiCicloPage.tsx`

- Tabella editabile (inline editing o dialog)
- 3 righe: rinfusa, confezionato_silos, confezionato_sacco
- Campi editabili: ton_ora, tempo_setup_minuti, tempo_pulizia_minuti
- Salvataggio singola riga
- Nota: impatto su calcolo durata future prenotazioni

Riferimento: specifiche sezione 8.11.

```bash
git commit -m "feat: add tempi ciclo admin page"
```

---

## Fase 6: Realtime e PWA

### Task 26: Supabase Realtime

**Files:**
- Create: `packages/frontend/src/contexts/RealtimeContext.tsx`
- Create: `packages/frontend/src/hooks/useRealtime.ts`

**Step 1: Implementa RealtimeContext**

- Sottoscrizione a 4 canali: prenotazioni, dati_carico, clienti, trasportatori
- Pattern: listener centralizzato che dispatcha eventi
- Cleanup su unmount

**Step 2: Implementa useRealtime hook**

```typescript
// useRealtime('prenotazioni', { onInsert, onUpdate, onDelete })
// Ogni pagina si sottoscrive agli eventi che le interessano
// Optimistic update + reconciliation
```

**Step 3: Integra nelle pagine**

- Dashboard: refresh KPI su cambio prenotazioni
- Calendario: aggiungi/sposta/rimuovi eventi live
- Liste: aggiungi/aggiorna righe live
- Dettaglio: aggiorna stato live

```bash
git commit -m "feat: add Supabase Realtime with optimistic updates"
```

---

### Task 27: PWA Setup

**Files:**
- Modify: `packages/frontend/vite.config.ts` (aggiunta PWA config)
- Create: `packages/frontend/public/manifest.json`
- Create: `packages/frontend/public/icons/` (icon set 192x192, 512x512)
- Create: `packages/frontend/src/hooks/useOfflineQueue.ts`

**Step 1: Configura vite-plugin-pwa**

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Planner Molino',
    short_name: 'Planner',
    theme_color: '#1B2A4A',
    background_color: '#F5F3EF',
    display: 'standalone',
    icons: [...]
  },
  workbox: {
    runtimeCaching: [
      { urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//, handler: 'NetworkFirst' },
      { urlPattern: /\.(js|css|png|svg|woff2)$/, handler: 'CacheFirst' }
    ]
  }
})
```

**Step 2: Implementa offline queue**

`useOfflineQueue`:
- Rileva stato online/offline
- Accoda operazioni fallite in IndexedDB
- Sync automatico al ritorno online
- Caso d'uso principale: form dati carico in magazzino

```bash
git commit -m "feat: add PWA support with offline queue"
```

---

## Fase 7: Routing completo e Finalizzazione

### Task 28: Routing completo App.tsx

**Files:**
- Modify: `packages/frontend/src/App.tsx`

**Step 1: Definisci tutte le routes**

```
/login                          -> LoginPage
/dashboard                      -> DashboardPage
/produzione/calendario          -> CalendarioPage (tipologia='produzione')
/produzione/prenotazioni        -> PrenotazioniListPage (tipologia='produzione')
/produzione/prenotazioni/nuova  -> PrenotazioneFormPage (tipologia='produzione')
/produzione/prenotazioni/:id    -> PrenotazioneDettaglioPage
/produzione/prenotazioni/:id/modifica -> PrenotazioneFormPage (edit)
/produzione/clienti             -> ClientiPage
/produzione/trasportatori       -> TrasportatoriPage
/consegne/calendario            -> CalendarioPage (tipologia='consegna')
/consegne/prenotazioni          -> PrenotazioniListPage (tipologia='consegna')
/consegne/prenotazioni/nuova    -> PrenotazioneFormPage (tipologia='consegna')
/consegne/prenotazioni/:id      -> PrenotazioneDettaglioPage
/consegne/prenotazioni/:id/modifica -> PrenotazioneFormPage (edit)
/consegne/clienti               -> ClientiPage
/consegne/trasportatori         -> TrasportatoriPage
/impostazioni/utenti            -> UtentiPage
/impostazioni/tempi-ciclo       -> TempiCicloPage
```

Tutte le pagine caricate con `React.lazy()`.
`PrivateRoute` verifica: auth + `sezioni_abilitate` per produzione/consegne.
Route `/impostazioni/*` verifica `livello_accesso === 'modifica'`.

**Step 2: Commit**

```bash
git commit -m "feat: complete routing with lazy loading and permission guards"
```

---

### Task 29: Componenti comuni condivisi

**Files:**
- Create: `packages/frontend/src/components/common/ConfirmDialog.tsx`
- Create: `packages/frontend/src/components/common/LoadingSpinner.tsx`
- Create: `packages/frontend/src/components/common/EmptyState.tsx`
- Create: `packages/frontend/src/components/common/PageHeader.tsx`
- Create: `packages/frontend/src/components/common/SearchField.tsx`

Componenti riusati in tutte le pagine:
- `ConfirmDialog`: dialog conferma con titolo, messaggio, azioni
- `LoadingSpinner`: skeleton/circular progress
- `EmptyState`: illustrazione + testo quando lista vuota
- `PageHeader`: titolo pagina + breadcrumb + azioni
- `SearchField`: TextField con icona, debounce 400ms, sanitizzazione

```bash
git commit -m "feat: add shared UI components"
```

---

### Task 30: Test e deploy

**Step 1: Test end-to-end manuale**

Verifica flusso completo:
1. Login -> Dashboard con KPI
2. Crea cliente -> appare in lista
3. Crea trasportatore -> appare in lista
4. Crea prenotazione produzione -> appare in calendario e lista
5. Crea prenotazione consegna collegata -> link bidirezionale funziona
6. Avanza stati: pianificato -> preso_in_carico -> in_preparazione -> pronto_carico -> in_carico
7. Registra dati carico -> stato diventa "caricato"
8. Avanza a "partito"
9. Annulla una prenotazione -> note obbligatorie
10. Verifica Realtime: apri 2 tab, modifica in una, vedi aggiornamento nell'altra
11. Test mobile: sidebar drawer, bottom nav, form dati carico
12. Test PWA: installa, verifica offline queue

**Step 2: Fix bug emersi**

**Step 3: Deploy su Vercel**

```bash
vercel --prod
```

Verifica variabili d'ambiente configurate su Vercel dashboard.

**Step 4: Commit finale**

```bash
git commit -m "chore: finalize v4.0 for production deploy"
```

---

## Riepilogo fasi

| Fase | Task | Descrizione |
|------|------|-------------|
| 1. Fondamenta | 1-4 | Monorepo, shared package, scaffold backend/frontend |
| 2. Database | 5 | Migrazione SQL completa Supabase |
| 3. Backend API | 6-12 | 6 controller, routes, middleware |
| 4. Layout | 13-15 | Sidebar, header, login, services layer |
| 5. Pagine | 16-25 | Dashboard, CRUD, calendario, form, dettaglio |
| 6. Realtime+PWA | 26-27 | Supabase Realtime, offline queue, PWA |
| 7. Finalizzazione | 28-30 | Routing completo, componenti comuni, test, deploy |

**Totale: 30 task**
