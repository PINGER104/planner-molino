import { Router } from 'express';
import { requireAuth, requireModifica } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateTempiCicloSchema, calcolaDurataSchema } from '@planner-molino/shared';
import {
  getTempiCiclo,
  updateTempiCiclo,
  calcolaDurata,
  getDashboardStats,
} from '../controllers/configurazione.controller';

const router = Router();

router.get('/tempi-ciclo', requireAuth, getTempiCiclo);
router.put('/tempi-ciclo/:categoria', requireAuth, requireModifica, validate(updateTempiCicloSchema), updateTempiCiclo);
router.post('/calcola-durata', requireAuth, validate(calcolaDurataSchema), calcolaDurata);
router.get('/dashboard-stats', requireAuth, getDashboardStats);

export default router;
