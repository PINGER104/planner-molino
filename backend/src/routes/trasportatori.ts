import { Router } from 'express';
import {
  getTrasportatori,
  getTrasportatore,
  createTrasportatore,
  updateTrasportatore,
  deleteTrasportatore,
  getTrasportatoriDropdown,
} from '../controllers/trasportatoriController';
import { authenticateToken, requireModifica } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes
router.get('/', getTrasportatori);
router.get('/dropdown', getTrasportatoriDropdown);
router.get('/:id', getTrasportatore);

// Write routes (require modifica permission)
router.post('/', requireModifica, createTrasportatore);
router.put('/:id', requireModifica, updateTrasportatore);
router.delete('/:id', requireModifica, deleteTrasportatore);

export default router;
