import { Router } from 'express';
import { requireAuth, requireModifica } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPrenotazioneSchema,
  updatePrenotazioneSchema,
  cambioStatoSchema,
  createDatiCaricoSchema,
  updateDatiCaricoSchema,
} from '@planner-molino/shared';
import {
  list,
  calendario,
  getById,
  create,
  update,
  cambioStato,
  remove,
  getDatiCarico,
  createDatiCarico,
  updateDatiCarico,
} from '../controllers/prenotazioni.controller';

const router = Router();

router.get('/', requireAuth, list);
router.get('/calendario', requireAuth, calendario);
router.get('/:id', requireAuth, getById);
router.post('/', requireAuth, requireModifica, validate(createPrenotazioneSchema), create);
router.put('/:id', requireAuth, requireModifica, validate(updatePrenotazioneSchema), update);
router.patch('/:id/stato', requireAuth, requireModifica, validate(cambioStatoSchema), cambioStato);
router.delete('/:id', requireAuth, requireModifica, remove);
router.get('/:id/dati-carico', requireAuth, getDatiCarico);
router.post('/:id/dati-carico', requireAuth, requireModifica, validate(createDatiCaricoSchema), createDatiCarico);
router.put('/:id/dati-carico', requireAuth, requireModifica, validate(updateDatiCaricoSchema), updateDatiCarico);

export default router;
