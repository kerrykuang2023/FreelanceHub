import mongoose, { Document, Schema } from 'mongoose';

export interface IEvidence extends Document {
  ticket_id: mongoose.Types.ObjectId;
  uploader_id: mongoose.Types.ObjectId;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  encrypted_url?: string;
  description?: string;
  is_encrypted: boolean;
  is_verified: boolean;
  verified_by?: mongoose.Types.ObjectId;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    uploader_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
    },
    file_name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    file_type: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    encrypted_url: {
      type: String,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    is_encrypted: {
      type: Boolean,
      default: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verified_by: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
    },
    verified_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

EvidenceSchema.index({ ticket_id: 1 });
EvidenceSchema.index({ uploader_id: 1 });

export default mongoose.model<IEvidence>('Evidence', EvidenceSchema);
