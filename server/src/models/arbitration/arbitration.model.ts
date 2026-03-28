import mongoose, { Document, Schema } from 'mongoose';

export interface IArbitration extends Document {
  ticket_id: mongoose.Types.ObjectId;
  applicant_id: mongoose.Types.ObjectId;
  respondent_id: mongoose.Types.ObjectId;
  arbitrator_id?: mongoose.Types.ObjectId;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  applicant_claim: string;
  respondent_defense?: string;
  decision?: string;
  resolution_type?: 'favor_applicant' | 'favor_respondent' | 'compromise' | 'dismissed';
  resolution_details?: string;
  evidence_ids: mongoose.Types.ObjectId[];
  hearing_date?: Date;
  hearing_notes?: string;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  closed_at?: Date;
}

const ArbitrationSchema = new Schema<IArbitration>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    applicant_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
    },
    respondent_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
    },
    arbitrator_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserAccount',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'closed'],
      default: 'pending',
    },
    applicant_claim: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    respondent_defense: {
      type: String,
      maxlength: 5000,
    },
    decision: {
      type: String,
      maxlength: 5000,
    },
    resolution_type: {
      type: String,
      enum: ['favor_applicant', 'favor_respondent', 'compromise', 'dismissed'],
    },
    resolution_details: {
      type: String,
      maxlength: 5000,
    },
    evidence_ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Evidence',
    }],
    hearing_date: {
      type: Date,
    },
    hearing_notes: {
      type: String,
      maxlength: 5000,
    },
    resolved_at: {
      type: Date,
    },
    closed_at: {
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

ArbitrationSchema.index({ ticket_id: 1 });
ArbitrationSchema.index({ applicant_id: 1 });
ArbitrationSchema.index({ respondent_id: 1 });
ArbitrationSchema.index({ arbitrator_id: 1 });
ArbitrationSchema.index({ status: 1 });

export default mongoose.model<IArbitration>('Arbitration', ArbitrationSchema);
