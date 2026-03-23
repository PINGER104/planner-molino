# Design Document: Planner Molino v4.0

> Ricostruzione completa dell'applicazione di pianificazione produzione e consegne per molino industriale.

---

## 1. Decisioni di design

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Bundler | Vite (da CRA) | Build 10x piu veloce, HMR istantaneo |
| Auth | Solo Supabase Auth (no JWT custom) | Elimina complessita dual-auth |
| Validazione | Zod (shared package) | Schemi condivisi frontend/backend |
| Realtime | Supabase Realtime completo | Sync live su tutte le entita |
| PWA | vite-plugin-pwa + Workbox | Uso in magazzino con connessione intermittente |
| Struttura | Monorepo npm workspaces | Tipi e validazione condivisi |
| Backend | Express su Vercel serverless | Controllo completo, pattern consolidato |
| Navigazione | Sezioni separate Produzione/Consegne | Chiarezza per operatori specializzati |
| Rate limiting | express-rate-limit | 100 req/min per IP |

---

## 2. Stack tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript + MUI 5 |
| Backend | Node.js + Express + TypeScript (Vercel serverless) |
| Shared | Package npm: tipi TS + schemi zod + costanti + utils |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (WebSocket) |
| Calendar | FullCalendar 6 |
| Forms | react-hook-form + @hookform/resolvers (zod) |
| Date | date-fns (locale italiano) |
| PWA | vite-plugin-pwa (Workbox) |
| Deploy | Vercel (monorepo workspaces) |

---

## 3. Architettura

### Struttura monorepo

```
planner-molino/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── lib/supabase.ts
│   │   │   ├── contexts/         # AuthContext, RealtimeContext
│   │   │   ├── hooks/            # usePrenotazioni, useCalendar, useRealtime
│   │   │   ├── pages/            # 11 pagine (lazy loaded)
│   │   │   ├── components/       # Layout, Calendar, Common, Forms
│   │   │   ├── services/         # API layer
│   │   │   ├── theme/            # MUI theme "Italian Industrial Refinement"
│   │   │   └── utils/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── backend/
│   │   ├── api/index.ts          # Entry point Vercel
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/database.ts
│   │       ├── lib/supabaseAdmin.ts
│   │       ├── middleware/       # Supabase Auth middleware
│   │       ├── controllers/     # 7 controller
│   │       ├── routes/          # 6 route files
│   │       └── utils/
│   └── shared/
│       ├── src/
│       │   ├── types/           # Interfacce condivise
│       │   ├── schemas/         # Zod schemas
│       │   ├── constants/       # Stati, colori, label
│       │   └── utils/           # Calcolo durata, conversioni
│       └── package.json
├── package.json                 # Workspace root
├── vercel.json
├── tsconfig.base.json
└── .env.example
```

### Flusso autenticazione

```
Frontend                    Supabase Auth                Backend
   |                             |                          |
   |-- signInWithPassword() --->|                          |
   |<-- session (access_token) -|                          |
   |                             |                          |
   |-- API + Bearer token -------------------------------->|
   |                             |    supabase.auth         |
   |                             |    .getUser(token)       |
   |                             |<-- user verificato       |
   |<----------------------- risposta ---------------------|
```

### Deploy Vercel

- Frontend: build statico (vite build, output `dist/`)
- Backend: serverless function (`@vercel/node`, entry `packages/backend/api/index.ts`)
- Routing: `/api/*` -> backend, tutto il resto -> frontend SPA

---

## 4. Database

Schema identico alle specifiche v3.x (7 tabelle, 2 viste, 12 funzioni PL/pgSQL, RLS).

Tabelle: `utenti`, `clienti`, `trasportatori`, `prenotazioni`, `storico_stati`, `dati_carico`, `configurazione_tempi_ciclo`.

Nessuna modifica allo schema. I miglioramenti v4.0 sono tutti lato applicazione.

---

## 5. Features e pagine

### 5.1 Login (`/login`)
- Form email + password con Supabase Auth
- Sfondo gradiente tema "Italian Industrial"
- Toggle visibilita password, redirect a dashboard

### 5.2 Dashboard (`/dashboard`)
- 4 KPI cards con contatori animati (oggi, in corso, completate, in attesa)
- 2 tabelle: prenotazioni oggi e domani
- Pull-to-refresh mobile
- Card navigazione rapida
- Realtime: KPI auto-aggiornamento

### 5.3-5.4 Calendario Produzione/Consegne (`/produzione/calendario`, `/consegne/calendario`)
- FullCalendar viste mese/settimana/giorno (default: settimana, slot 30min)
- Sidebar destra: mini-calendario, statistiche, prossimi eventi, legenda
- Click evento -> popup dettagli + azioni rapide
- Drag & drop -> dialog conferma modifica slot
- Export: iCal, CSV, HTML, JSON
- Realtime: eventi live

### 5.5-5.6 Lista Prenotazioni (`/produzione/prenotazioni`, `/consegne/prenotazioni`)
- Tabella paginata con ricerca debounce 400ms
- Filtri: stato, data, cliente, priorita
- Badge stato colorato, azioni inline
- Conferma eliminazione (solo stato "pianificato")
- Realtime: nuove prenotazioni appaiono live

### 5.7 Form Prenotazione (creazione/modifica)
- Multi-step MUI Stepper (4 step):
  1. Tipo + cliente + trasportatore (autocomplete)
  2. Prodotto + quantita + specifiche (W, PL)
  3. Data/ora + calcolo durata automatico
  4. Riepilogo + conferma
- Campi condizionali per tipologia
- Collegamento bidirezionale produzione <-> consegna
- Validazione zod inline

### 5.8 Dettaglio Prenotazione (`/prenotazioni/:id`)
- Card info complete
- Timeline storico stati (verticale, timestamp + utente)
- Bottoni transizione stato (solo stati validi)
- Dialog annullamento con note obbligatorie
- Sezione dati carico (consegne >= in_carico)
- Link prenotazione collegata
- Realtime: stato live

### 5.9 Form Dati di Carico
- Prerequisito: consegna stato `in_carico`
- Dati veicolo (targhe, autista)
- Lotto + scadenza
- 3 pesi (netto, tara, lordo con calcolo)
- Orari carico
- Idoneita trasporto (si/no + note se no)
- DDT numero + data
- Upload foto + certificato lavaggio (Supabase Storage)
- Salvataggio -> stato automatico "caricato"

### 5.10 Gestione Clienti (`/produzione/clienti`, `/consegne/clienti`)
- Lista paginata + ricerca
- CRUD via dialog modale
- Filtri canale e modalita consegna
- Destinazione alternativa condizionale
- Codice auto (CLI001...)

### 5.11 Gestione Trasportatori (`/produzione/trasportatori`, `/consegne/trasportatori`)
- Come clienti + tipologie mezzi, certificazioni, rating puntualita

### 5.12 Gestione Utenti (`/impostazioni/utenti`) - Solo admin
- CRUD con sync Supabase Auth
- Livello accesso + sezioni abilitate
- Reset password, soft-delete
- Protezione auto-disattivazione/demozione

### 5.13 Tempi Ciclo (`/impostazioni/tempi-ciclo`) - Solo admin
- Tabella editabile per categoria
- Impatto su calcolo durata nuove prenotazioni

---

## 6. Feature trasversali

| Feature | Dettaglio |
|---------|-----------|
| PWA | Installabile, Workbox cache-first asset/network-first API, offline queue IndexedDB |
| Realtime | Supabase Realtime su prenotazioni, dati_carico, clienti, trasportatori |
| Validazione | Zod schemas condivisi. Frontend: hookform resolver. Backend: middleware |
| Rate limiting | express-rate-limit 100 req/min per IP |
| Lazy loading | React.lazy() tutte le pagine |
| AbortController | Cancellazione request su unmount |
| Permessi UI | Sidebar/azioni condizionali su livello_accesso e sezioni_abilitate |

---

## 7. UI/UX Design

### Palette colori "Italian Industrial Refinement"

| Ruolo | Hex | Uso |
|-------|-----|-----|
| Primary (Navy) | #1B2A4A | Sidebar, header, bottoni, sez. Produzione |
| Primary light | #3B6FD4 | Hover, varianti chiare |
| Primary dark | #0F1D35 | Active states |
| Secondary (Terracotta) | #C2410C | Sezione Consegne, accenti |
| Secondary light | #EA580C | Hover consegne |
| Success | #16A34A | Stati completati |
| Warning | #CA8A04 | Stati in corso |
| Error | #DC2626 | Errori, annullamenti |
| Background | #F5F3EF | Sfondo pagina (beige caldo) |
| Paper | #FFFFFF | Card, dialog |

### Tipografia

| Elemento | Font | Weight |
|----------|------|--------|
| Titoli | Outfit | 600-800 |
| Corpo | Source Sans 3 | 400 |
| Bottoni | Outfit | 600 (no uppercase) |
| Codici | JetBrains Mono | 400 |

### Componenti MUI

- Bottoni: padding 8px 22px, borderRadius 8px, gradient sottile
- TextField: borderRadius 8px, focus shadow 3px
- Card: borderRadius 12px, border 1px #E8E5DF
- Table: header uppercase, righe alternate
- Dialog: borderRadius 14px, shadow 0 24px 48px

### Layout

- Sidebar sinistra 260px, collassabile
- Sezioni con colori distinti (navy/terracotta/grigio)
- Visibilita condizionale su permessi utente
- Header: logo + titolo sezione + profilo + logout

### Navigazione sidebar

```
PRODUZIONE (navy)
  Calendario
  Prenotazioni
  Clienti
  Trasportatori
CONSEGNE (terracotta)
  Calendario
  Prenotazioni
  Clienti
  Trasportatori
IMPOSTAZIONI (grigio)
  Gestione Utenti
  Tempi Ciclo
```

### Responsive (PWA)

| Breakpoint | Layout |
|-----------|--------|
| >= 1200px | Sidebar 260px + contenuto |
| 900-1199px | Sidebar collassata 60px (icone) + contenuto |
| 600-899px | Sidebar drawer overlay + contenuto full-width |
| < 600px | Bottom navigation + contenuto full-width |

---

## 8. Supabase Realtime

```
useRealtime() hook
  Channel "prenotazioni" -> INSERT, UPDATE, DELETE
  Channel "dati_carico"  -> INSERT, UPDATE
  Channel "clienti"      -> INSERT, UPDATE
  Channel "trasportatori" -> INSERT, UPDATE

Pattern: optimistic update + reconciliation
  1. Applica modifica localmente
  2. Invia al backend
  3. Realtime conferma/corregge
```

PWA offline: modifiche accodate in IndexedDB, sync al ritorno connessione.

---

## 9. Colori stati prenotazione

| Stato | Hex | Colore |
|-------|-----|--------|
| pianificato | #3B6FD4 | Blu acciaio |
| preso_in_carico | #CA8A04 | Ambra |
| in_produzione | #7C3AED | Viola |
| in_preparazione | #9333EA | Porpora |
| pronto_carico | #16A34A | Verde foresta |
| in_carico | #0D9488 | Teal |
| completato | #57534E | Grigio caldo |
| caricato | #44403C | Grigio scuro |
| partito | #292524 | Antracite |
| annullato | #DC2626 | Rosso |

---

*Design approvato il 2026-03-23*
