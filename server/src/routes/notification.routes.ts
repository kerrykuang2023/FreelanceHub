import { Router } from 'express';
import NotificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, NotificationController.getNotifications as any);
router.get('/stats', authMiddleware, NotificationController.getStats as any);
router.post('/mark-read/:id', authMiddleware, NotificationController.markAsRead as any);
router.post('/mark-all-read', authMiddleware, NotificationController.markAllAsRead as any);
router.delete('/:id', authMiddleware, NotificationController.deleteNotification as any);

export default router;
