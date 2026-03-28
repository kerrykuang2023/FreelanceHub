import { Response, Request } from 'express';
import MessageService from '../services/message.service';
import { IUser } from '../types/user.interface';

interface AuthRequest extends Request {
  user?: IUser;
}

class MessageController {
  public getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { page, pageSize, is_read, category, type } = req.query;
      const result = await MessageService.getMessages(userId, {
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
        category: category as any,
        type: type as any,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getMessageById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const message = await MessageService.getMessageById(req.params.id, userId);
      if (!message) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Message not found' },
        });
        return;
      }

      res.json({ success: true, data: message });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const message = await MessageService.markAsRead(req.params.id, userId);
      if (!message) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Message not found' },
        });
        return;
      }

      res.json({ success: true, data: message, message: 'Message marked as read' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const count = await MessageService.markAllAsRead(userId);
      res.json({
        success: true,
        data: { modifiedCount: count },
        message: `${count} messages marked as read`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const deleted = await MessageService.deleteMessage(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Message not found' },
        });
        return;
      }

      res.json({ success: true, message: 'Message deleted' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      });
    }
  };

  public getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const count = await MessageService.getUnreadCount(userId);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };
}

export default new MessageController();
