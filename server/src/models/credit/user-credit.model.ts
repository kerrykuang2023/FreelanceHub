import mongoose, { Document, Schema } from 'mongoose';

export type CreditLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface IUserCredit extends Document {
  user_id: mongoose.Types.ObjectId;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  level: CreditLevel;
  last_updated: Date;
  created_at: Date;
  calculateLevel: () => CreditLevel;
}

const UserCreditSchema = new Schema<IUserCredit>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      unique: true,
      index: true,
    },
    current_balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_earned: {
      type: Number,
      default: 0,
    },
    total_spent: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
    createdAt: 'created_at',
    updatedAt: false,
  },
  }
);

UserCreditSchema.methods.calculateLevel = function(): CreditLevel {
  const balance = this.current_balance;
  if (balance >= 1000) return 'platinum';
  if (balance >= 500) return 'gold';
  if (balance >= 100) return 'silver';
  return 'bronze';
};

UserCreditSchema.pre('save', function(next) {
  (this as any).level = (this as any).calculateLevel();
  (this as any).last_updated = new Date();
  next();
});

export default mongoose.model<IUserCredit>('UserCredit', UserCreditSchema);
