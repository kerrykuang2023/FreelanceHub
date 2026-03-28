import mongoose, { Document, Schema } from 'mongoose';

export type CreditTransactionType = 
  | 'registration'
  | 'profile_completion'
  | 'project_completed'
  | 'contract_signed'
  | 'good_rating'
  | 'bad_rating'
  | 'report_valid'
  | 'report_invalid'
  | 'violation'
  | 'admin_adjustment'
  | 'daily_login'
  | 'referral';

export interface ICreditTransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  amount: number;
  balance_after: number;
  type: CreditTransactionType;
  description: string;
  reference_type?: string;
  reference_id?: mongoose.Types.ObjectId;
  created_by?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  created_at: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balance_after: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'registration',
        'profile_completion',
        'project_completed',
        'contract_signed',
        'good_rating',
        'bad_rating',
        'report_valid',
        'report_invalid',
        'violation',
        'admin_adjustment',
        'daily_login',
        'referral',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference_type: {
      type: String,
      default: null,
    },
    reference_id: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

CreditTransactionSchema.index({ user_id: 1, created_at: -1 });
CreditTransactionSchema.index({ type: 1 });

export default mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
