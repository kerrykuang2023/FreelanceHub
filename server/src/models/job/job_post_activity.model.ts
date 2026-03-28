import mongoose from "mongoose";

const JobPostActivitySchema = new mongoose.Schema(
  {
    user_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: false,
    },
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    application_type: {
      type: String,
      enum: ["job", "project"],
      default: "job",
    },
    apply_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    notes: {
      type: String,
      required: false,
    },
    reviewed_at: {
      type: Date,
      required: false,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: false,
    },
    withdrawn_at: {
      type: Date,
      required: false,
    },
    cover_letter: {
      type: String,
      required: false,
    },
    expected_rate: {
      type: Number,
      required: false,
    },
    availability: {
      type: String,
      required: false,
    },
  },
  {
    collection: "job_post_activity",
    timestamps: true,
  }
);

const JobPostActivity = mongoose.model(
  "JobPostActivity",
  JobPostActivitySchema
);

export default JobPostActivity;
