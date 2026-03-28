import { Request, Response } from "express";
import NotificationService from "../services/notification.service";
import Notification from "../models/notification/notification.model";

export default class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20 } = req.query;

      const result = await NotificationService.getUserNotifications(
        user._id.toString(),
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const count = await NotificationService.getUnreadCount(user._id.toString());

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(id, user._id.toString());

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      await NotificationService.markAllAsRead(user._id.toString());

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        user_id: user._id,
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  }
}
