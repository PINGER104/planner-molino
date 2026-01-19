import { Router } from 'express';
import {
  getTempiCiclo,
  updateTempiCiclo,
  calcolaDurata,
  getDashboardStats,
} from '../controllers/configurazioneController';
import { authenticateToken, requireModifica } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes
router.get('/tempi-ciclo', getTempiCiclo);
router.post('/calcola-durata', calcolaDurata);
router.get('/dashboard-stats', getDashboardStats);

// Write routes (require modifica permission)
router.put('/tempi-ciclo/:categoria', requireModifica, updateTempiCiclo);

export default router;
