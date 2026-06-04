import HttpService from "@/core/http.service";

export interface INotification {
  _id: string;
  user_id: string;
  type: 'system' | 'application' | 'worklog' | 'invoice' | 'payment' | 'message' | 'project';
  title: string;
  content: string;
  is_read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface INotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

class NotificationService {
  private http: HttpService;
  private baseUrl = "/notifications";

  constructor() {
    this.http = new HttpService();
  }

  async getNotifications(params?: any): Promise<{ notifications: INotification[]; pagination: any }> {
    return this.http.get(this.baseUrl, params);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.http.get(`${this.baseUrl}/unread-count`);
  }

  async getStats(): Promise<INotificationStats> {
    return this.http.get(`${this.baseUrl}/stats`);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.http.post(`${this.baseUrl}/${notificationId}/read`, {});
  }

  async markAllAsRead(): Promise<void> {
    await this.http.post(`${this.baseUrl}/read-all`, {});
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.http.delete(`${this.baseUrl}/${notificationId}`);
  }

  async createNotification(data: {
    user_id: string;
    type: string;
    title: string;
    content: string;
    link?: string;
    metadata?: Record<string, any>;
  }): Promise<INotification> {
    return this.http.post(this.baseUrl, data);
  }

  async sendSystemNotification(data: {
    user_ids?: string[];
    user_type?: string;
    title: string;
    content: string;
    link?: string;
  }): Promise<{ sent_count: number }> {
    return this.http.post(`${this.baseUrl}/system`, data);
  }
}

export default new NotificationService();
