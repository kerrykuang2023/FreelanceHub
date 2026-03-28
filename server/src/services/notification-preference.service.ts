import NotificationPreference, { INotificationPreference } from '../models/notification/notification_preference.model';

export interface UpdatePreferenceDTO {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  email_categories?: string[];
  sms_categories?: string[];
  push_categories?: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

class NotificationPreferenceService {
  private static INSTANCE: NotificationPreferenceService;

  public static getInstance(): NotificationPreferenceService {
    if (!NotificationPreferenceService.INSTANCE) {
      NotificationPreferenceService.INSTANCE = new NotificationPreferenceService();
    }
    return NotificationPreferenceService.INSTANCE;
  }

  public async getPreference(userId: string): Promise<INotificationPreference | null> {
    let preference = await NotificationPreference.findOne({ user_id: userId });

    if (!preference) {
      preference = await NotificationPreference.create({
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        email_categories: ['project', 'worklog', 'invoice', 'payment', 'contract'],
        sms_categories: ['payment'],
        push_categories: ['project', 'worklog', 'invoice', 'payment', 'contract'],
      });
    }

    return preference;
  }

  public async updatePreference(
    userId: string,
    data: UpdatePreferenceDTO
  ): Promise<INotificationPreference | null> {
    const preference = await NotificationPreference.findOneAndUpdate(
      { user_id: userId },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return preference;
  }

  public async isCategoryEnabled(
    userId: string,
    channel: 'email' | 'sms' | 'push',
    category: string
  ): Promise<boolean> {
    const preference = await this.getPreference(userId);

    if (!preference) return true;

    const enabledField = `${channel}_enabled` as keyof INotificationPreference;
    const categoriesField = `${channel}_categories` as keyof INotificationPreference;

    if (!preference[enabledField]) return false;

    const categories = preference[categoriesField] as string[];
    return categories.includes(category);
  }

  public async resetToDefaults(userId: string): Promise<INotificationPreference | null> {
    return this.updatePreference(userId, {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      email_categories: ['project', 'worklog', 'invoice', 'payment', 'contract'],
      sms_categories: ['payment'],
      push_categories: ['project', 'worklog', 'invoice', 'payment', 'contract'],
      quiet_hours_start: undefined,
      quiet_hours_end: undefined,
    });
  }
}

export default NotificationPreferenceService.getInstance();
