import mongoose, { Document, Schema } from 'mongoose';

export type ReportType = 
  | 'spam'
  | 'harassment'
  | 'fake_profile'
  | 'scam'
  | 'inappropriate_content'
  | 'copyright'
  | 'payment_issue'
  | 'contract_dispute'
  | 'other';

export type ReportStatus = 'pending' | 'investigating' | 'verified' | 'dismissed' | 'resolved';

export type ReportTargetType = 'user' | 'project' | 'job' | 'message' | 'invoice' | 'worklog';

export interface IReport extends Document {
  reporter_id: mongoose.Types.ObjectId;
  target_type: ReportTargetType;
  target_id: mongoose.Types.ObjectId;
  target_user_id?: mongoose.Types.ObjectId;
  report_type: ReportType;
  description: string;
  attachments?: string[];
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  review_notes?: string;
  action_taken?: string;
  related_punishment?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    target_type: {
      type: String,
      enum: ['user', 'project', 'job', 'message', 'invoice', 'worklog'],
      required: true,
    },
    target_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    target_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      default: null,
    },
    report_type: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'fake_profile',
        'scam',
        'inappropriate_content',
        'copyright',
        'payment_issue',
        'contract_dispute',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    attachments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'verified', 'dismissed', 'resolved'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    review_notes: {
      type: String,
      default: null,
    },
    action_taken: {
      type: String,
      default: null,
    },
    related_punishment: {
      type: Schema.Types.ObjectId,
      ref: 'Punishment',
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

ReportSchema.index({ reporter_id: 1, created_at: -1 });
ReportSchema.index({ target_user_id: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ target_type: 1, target_id: 1 });

export default mongoose.model<IReport>('Report', ReportSchema);
