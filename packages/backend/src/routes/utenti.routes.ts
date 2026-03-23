import { Router } from 'express';
import { requireAuth, requireModifica } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUtenteSchema, updateUtenteSchema } from '@planner-molino/shared';
import { list, getById, create, update, resetPassword, remove } from '../controllers/utenti.controller';

const router = Router();

router.get('/', requireAuth, list);
router.get('/:id', requireAuth, getById);
router.post('/', requireAuth, requireModifica, validate(createUtenteSchema), create);
router.put('/:id', requireAuth, requireModifica, validate(updateUtenteSchema), update);
router.post('/:id/reset-password', requireAuth, requireModifica, resetPassword);
router.delete('/:id', requireAuth, requireModifica, remove);

export default router;
