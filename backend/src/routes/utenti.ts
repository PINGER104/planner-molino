import { Router } from 'express';
import {
  getUtenti,
  getUtente,
  createUtente,
  updateUtente,
  resetPassword,
  deleteUtente,
} from '../controllers/utentiController';
import { authenticateToken, requireModifica } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes (available to all authenticated users)
router.get('/', getUtenti);
router.get('/:id', getUtente);

// Write routes (require modifica permission)
router.post('/', requireModifica, createUtente);
router.put('/:id', requireModifica, updateUtente);
router.post('/:id/reset-password', requireModifica, resetPassword);
router.delete('/:id', requireModifica, deleteUtente);

export default router;
