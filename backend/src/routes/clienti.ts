import { Router } from 'express';
import {
  getClienti,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  getClientiDropdown,
} from '../controllers/clientiController';
import { authenticateToken, requireModifica } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes
router.get('/', getClienti);
router.get('/dropdown', getClientiDropdown);
router.get('/:id', getCliente);

// Write routes (require modifica permission)
router.post('/', requireModifica, createCliente);
router.put('/:id', requireModifica, updateCliente);
router.delete('/:id', requireModifica, deleteCliente);

export default router;
