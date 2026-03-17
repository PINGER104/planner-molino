import { Router } from 'express';
import {
  getUtenti,
  getUtente,
  createUtente,
  updateUtente,
  resetPassword,
  deleteUtente,
} from '../controllers/utentiController';
import { authenticateSupabaseToken, requireModificaSupabase } from '../middleware/supabaseAuth';

const router = Router();

// All routes require Supabase JWT authentication
router.use(authenticateSupabaseToken);

// Read routes (available to all authenticated users)
router.get('/', getUtenti);
router.get('/:id', getUtente);

// Write routes (require modifica permission)
router.post('/', requireModificaSupabase, createUtente);
router.put('/:id', requireModificaSupabase, updateUtente);
router.post('/:id/reset-password', requireModificaSupabase, resetPassword);
router.delete('/:id', requireModificaSupabase, deleteUtente);

export default router;
