import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import NotificationPreferenceService from '../services/notification-preference.service';

class NotificationPreferenceController {
  public getPreference = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const preference = await NotificationPreferenceService.getPreference(userId);
      res.json({ success: true, data: preference });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public updatePreference = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const preference = await NotificationPreferenceService.updatePreference(userId, req.body);
      res.json({ success: true, data: preference, message: 'Notification preferences updated' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public resetToDefaults = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const preference = await NotificationPreferenceService.resetToDefaults(userId);
      res.json({ success: true, data: preference, message: 'Notification preferences reset to defaults' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'RESET_ERROR', message: error.message },
      });
    }
  };
}

export default new NotificationPreferenceController();
