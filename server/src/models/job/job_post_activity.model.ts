import mongoose from "mongoose";

const JobPostActivitySchema = new mongoose.Schema(
  {
    user_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    apply_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
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
