import { Router, Request, Response } from 'express';
import MessageController from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { IUser } from '../types/user.interface';

interface AuthRequest extends Request {
  user?: IUser;
}

const router = Router();

router.get('/', authMiddleware, MessageController.getMessages as any);
router.get('/unread-count', authMiddleware, MessageController.getUnreadCount as any);
router.get('/:id', authMiddleware, MessageController.getMessageById as any);
router.put('/:id/read', authMiddleware, MessageController.markAsRead as any);
router.put('/read-all', authMiddleware, MessageController.markAllAsRead as any);
router.delete('/:id', authMiddleware, MessageController.deleteMessage as any);

export default router;
