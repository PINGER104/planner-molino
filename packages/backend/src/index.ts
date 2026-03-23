import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import clientiRoutes from './routes/clienti.routes';
import trasportatoriRoutes from './routes/trasportatori.routes';
import prenotazioniRoutes from './routes/prenotazioni.routes';
import utentiRoutes from './routes/utenti.routes';
import configurazioneRoutes from './routes/configurazione.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clienti', clientiRoutes);
app.use('/api/trasportatori', trasportatoriRoutes);
app.use('/api/prenotazioni', prenotazioniRoutes);
app.use('/api/utenti', utentiRoutes);
app.use('/api/configurazione', configurazioneRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

// Start server (dev only, not used on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
