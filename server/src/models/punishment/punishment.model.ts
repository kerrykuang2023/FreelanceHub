import mongoose, { Document, Schema } from 'mongoose';

export type PunishmentType = 
  | 'warning'
  | 'credit_deduction'
  | 'temporary_restriction'
  | 'account_suspension'
  | 'permanent_ban';

export type PunishmentStatus = 'active' | 'expired' | 'revoked' | 'completed';

export interface IPunishment extends Document {
  user_id: mongoose.Types.ObjectId;
  type: PunishmentType;
  reason: string;
  description?: string;
  related_report?: mongoose.Types.ObjectId;
  credit_deduction?: number;
  restricted_features?: string[];
  start_date: Date;
  end_date?: Date;
  status: PunishmentStatus;
  issued_by: mongoose.Types.ObjectId;
  revoked_by?: mongoose.Types.ObjectId;
  revoked_at?: Date;
  revoke_reason?: string;
  created_at: Date;
  updated_at: Date;
}

const PunishmentSchema = new Schema<IPunishment>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['warning', 'credit_deduction', 'temporary_restriction', 'account_suspension', 'permanent_ban'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: null,
    },
    related_report: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },
    credit_deduction: {
      type: Number,
      default: 0,
    },
    restricted_features: {
      type: [String],
      default: [],
    },
    start_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    end_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'completed'],
      default: 'active',
    },
    issued_by: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
    },
    revoked_by: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      default: null,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
    revoke_reason: {
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

PunishmentSchema.index({ user_id: 1, status: 1 });
PunishmentSchema.index({ status: 1, end_date: 1 });
PunishmentSchema.index({ type: 1 });

export default mongoose.model<IPunishment>('Punishment', PunishmentSchema);
