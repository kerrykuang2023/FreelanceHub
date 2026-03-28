import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreference extends Document {
  user_id: mongoose.Types.ObjectId;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  email_categories: string[];
  sms_categories: string[];
  push_categories: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: Date;
  updated_at: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      unique: true,
    },
    email_enabled: {
      type: Boolean,
      default: true,
    },
    sms_enabled: {
      type: Boolean,
      default: false,
    },
    push_enabled: {
      type: Boolean,
      default: true,
    },
    email_categories: {
      type: [String],
      default: ['project', 'worklog', 'invoice', 'payment', 'contract'],
    },
    sms_categories: {
      type: [String],
      default: ['payment'],
    },
    push_categories: {
      type: [String],
      default: ['project', 'worklog', 'invoice', 'payment', 'contract'],
    },
    quiet_hours_start: {
      type: String,
      default: null,
    },
    quiet_hours_end: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

NotificationPreferenceSchema.index({ user_id: 1 });

export default mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
