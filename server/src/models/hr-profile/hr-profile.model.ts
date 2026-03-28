import mongoose from "mongoose";

const HRProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    position: {
      type: String,
      required: false,
      maxlength: 100,
    },
    department: {
      type: String,
      required: false,
      maxlength: 100,
    },
    avatar_url: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
      maxlength: 20,
    },
    work_email: {
      type: String,
      required: false,
      maxlength: 100,
    },
    wechat: {
      type: String,
      required: false,
      maxlength: 50,
    },
    linkedin: {
      type: String,
      required: false,
      maxlength: 100,
    },
    recruitment_fields: {
      type: [String],
      default: [],
    },
    years_of_experience: {
      type: Number,
      required: false,
      min: 0,
      max: 50,
    },
    summary: {
      type: String,
      required: false,
      maxlength: 500,
    },
    skills: {
      type: [String],
      default: [],
    },
    success_cases: {
      type: String,
      required: false,
      maxlength: 1000,
    },
    stats: {
      jobs_posted: {
        type: Number,
        default: 0,
      },
      successful_hires: {
        type: Number,
        default: 0,
      },
      avg_rating: {
        type: Number,
        default: 0,
      },
      review_count: {
        type: Number,
        default: 0,
      },
    },
    verification_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verified_at: {
      type: Date,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    verification_reason: {
      type: String,
    },
  },
  {
    collection: "hr_profiles",
    timestamps: true,
  }
);

HRProfileSchema.index({ user_id: 1 }, { unique: true });
HRProfileSchema.index({ company_id: 1 });
HRProfileSchema.index({ verification_status: 1 });

const HRProfile = mongoose.model("HRProfile", HRProfileSchema);

export default HRProfile;
