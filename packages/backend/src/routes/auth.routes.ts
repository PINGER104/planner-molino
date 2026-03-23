import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '@planner-molino/shared';
import { login, me, changePassword } from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
