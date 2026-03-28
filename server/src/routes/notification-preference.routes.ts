import { Router } from 'express';
import NotificationPreferenceController from '../controllers/notification-preference.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, NotificationPreferenceController.getPreference as any);
router.put('/', authMiddleware, NotificationPreferenceController.updatePreference as any);
router.post('/reset', authMiddleware, NotificationPreferenceController.resetToDefaults as any);

export default router;
