import { Router } from 'express';
import {
  getPrenotazioni,
  getPrenotazioniCalendario,
  getPrenotazione,
  createPrenotazione,
  updatePrenotazione,
  updateStatoPrenotazione,
  deletePrenotazione,
} from '../controllers/prenotazioniController';
import {
  getDatiCarico,
  createDatiCarico,
  updateDatiCarico,
} from '../controllers/datiCaricoController';
import { authenticateToken, requireModifica } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes
router.get('/', getPrenotazioni);
router.get('/calendario', getPrenotazioniCalendario);
router.get('/:id', getPrenotazione);

// Write routes (require modifica permission)
router.post('/', requireModifica, createPrenotazione);
router.put('/:id', requireModifica, updatePrenotazione);
router.patch('/:id/stato', requireModifica, updateStatoPrenotazione);
router.delete('/:id', requireModifica, deletePrenotazione);

// Dati carico routes
router.get('/:prenotazione_id/dati-carico', getDatiCarico);
router.post('/:prenotazione_id/dati-carico', requireModifica, createDatiCarico);
router.put('/:prenotazione_id/dati-carico', requireModifica, updateDatiCarico);

export default router;
