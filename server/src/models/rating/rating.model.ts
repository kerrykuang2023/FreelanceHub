import mongoose from "mongoose";

export interface IRating extends mongoose.Document {
  project_id: mongoose.Types.ObjectId;
  reviewer_id: mongoose.Types.ObjectId;
  reviewee_id: mongoose.Types.ObjectId;
  reviewer_type: 'company' | 'freelancer';
  reviewee_type: 'freelancer' | 'company';
  dimensions: {
    professional_skill: number;
    work_attitude: number;
    communication: number;
    delivery_quality: number;
  };
  overall_score: number;
  comment: string;
  is_anonymous: boolean;
  reply?: {
    content: string;
    created_at: Date;
  };
  status: 'active' | 'hidden' | 'disputed';
  created_at: Date;
  updated_at: Date;
}

const RatingSchema = new mongoose.Schema<IRating>(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
      required: true,
      index: true,
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    reviewee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    reviewer_type: {
      type: String,
      enum: ['company', 'freelancer'],
      required: true,
    },
    reviewee_type: {
      type: String,
      enum: ['freelancer', 'company'],
      required: true,
    },
    dimensions: {
      professional_skill: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      work_attitude: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      delivery_quality: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    overall_score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    reply: {
      content: {
        type: String,
        maxlength: 500,
      },
      created_at: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'disputed'],
      default: 'active',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

RatingSchema.index({ project_id: 1, reviewer_id: 1 }, { unique: true });

const Rating = mongoose.model<IRating>('Rating', RatingSchema, 'ratings');

export default Rating;
