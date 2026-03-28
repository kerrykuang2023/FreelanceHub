import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 
  | 'role_approval_approved'
  | 'role_approval_rejected'
  | 'role_approval_pending'
  | 'worklog_submitted'
  | 'worklog_approved'
  | 'worklog_rejected'
  | 'invoice_submitted'
  | 'invoice_approved'
  | 'invoice_rejected'
  | 'payment_received'
  | 'project_assigned'
  | 'project_completed'
  | 'system_announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: Date;
  priority: NotificationPriority;
  action_url?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'role_approval_approved',
        'role_approval_rejected',
        'role_approval_pending',
        'worklog_submitted',
        'worklog_approved',
        'worklog_rejected',
        'invoice_submitted',
        'invoice_approved',
        'invoice_rejected',
        'payment_received',
        'project_assigned',
        'project_completed',
        'system_announcement',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    action_url: {
      type: String,
      default: null,
    },
    expires_at: {
      type: Date,
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

NotificationSchema.index({ user_id: 1, read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

let Notification: mongoose.Model<INotification>;

try {
  Notification = mongoose.model<INotification>("Notification");
} catch {
  Notification = mongoose.model<INotification>("Notification", NotificationSchema);
}

export default Notification;
