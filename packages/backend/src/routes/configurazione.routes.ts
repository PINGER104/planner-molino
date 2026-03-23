import { Router } from 'express';
import { requireAuth, requireModifica } from '../middleware/auth';
import {
  getTempiCiclo,
  updateTempiCiclo,
  calcolaDurata,
  getDashboardStats,
} from '../controllers/configurazione.controller';

const router = Router();

router.get('/tempi-ciclo', requireAuth, getTempiCiclo);
router.put('/tempi-ciclo/:categoria', requireAuth, requireModifica, updateTempiCiclo);
router.post('/calcola-durata', requireAuth, calcolaDurata);
router.get('/dashboard-stats', requireAuth, getDashboardStats);

export default router;
