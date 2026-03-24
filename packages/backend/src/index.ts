import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root BEFORE any other imports that need env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimit';
import { AppError } from './lib/errors';
import { logger } from './lib/logger';
import authRoutes from './routes/auth.routes';
import clientiRoutes from './routes/clienti.routes';
import trasportatoriRoutes from './routes/trasportatori.routes';
import prenotazioniRoutes from './routes/prenotazioni.routes';
import utentiRoutes from './routes/utenti.routes';
import configurazioneRoutes from './routes/configurazione.routes';

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

// Centralized error handler — all controllers delegate here via next(err)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Errore interno del server', code: 'INTERNAL_ERROR' });
});

// Start server (dev only, not used on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
