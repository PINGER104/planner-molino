import { Router } from 'express';
import { requireAuth, requireModifica } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTrasportatoreSchema, updateTrasportatoreSchema } from '@planner-molino/shared';
import { list, dropdown, getById, create, update, remove } from '../controllers/trasportatori.controller';

const router = Router();

router.get('/', requireAuth, list);
router.get('/dropdown', requireAuth, dropdown);
router.get('/:id', requireAuth, getById);
router.post('/', requireAuth, requireModifica, validate(createTrasportatoreSchema), create);
router.put('/:id', requireAuth, requireModifica, validate(updateTrasportatoreSchema), update);
router.delete('/:id', requireAuth, requireModifica, remove);

export default router;
