import Notification, { NotificationType, NotificationPriority } from '../models/notification/notification.model';
import NotificationPreference from '../models/notification/notification_preference.model';

interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  action_url?: string;
  expires_at?: Date;
}

class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await Notification.create({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        priority: params.priority || 'normal',
        action_url: params.action_url,
        expires_at: params.expires_at,
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async notifyRoleApprovalApproved(userId: string, roleType: string) {
    return this.createNotification({
      user_id: userId,
      type: 'role_approval_approved',
      title: '角色申请已批准',
      message: `您的${this.getRoleLabel(roleType)}角色申请已通过审批`,
      priority: 'high',
      action_url: '/profile',
    });
  }

  static async notifyRoleApprovalRejected(userId: string, roleType: string, reason: string) {
    return this.createNotification({
      user_id: userId,
      type: 'role_approval_rejected',
      title: '角色申请被拒绝',
      message: `您的${this.getRoleLabel(roleType)}角色申请被拒绝。原因：${reason}`,
      priority: 'high',
      action_url: '/profile',
    });
  }

  static async notifyAdminsOfNewRoleApproval(roleType: string, applicantName: string, approvalId: string) {
    return this.createNotification({
      user_id: approvalId,
      type: 'role_approval_pending',
      title: '新的角色审批申请',
      message: `${applicantName} 申请成为 ${this.getRoleLabel(roleType)}`,
      priority: 'normal',
      action_url: '/admin/role-approvals',
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user_id: userId, read: false });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { read: true, read_at: new Date() },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { user_id: userId, read: false },
      { read: true, read_at: new Date() }
    );
  }

  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ user_id: userId }),
      Notification.countDocuments({ user_id: userId, read: false }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  private static getRoleLabel(roleType: string): string {
    const labels: Record<string, string> = {
      job_seeker: '求职者',
      hr_recruiter: 'HR招聘官',
      admin: '管理员',
    };
    return labels[roleType] || roleType;
  }
}

export default NotificationService;
