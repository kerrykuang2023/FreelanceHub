import mongoose from "mongoose";

const WorkLogBatchSchema = new mongoose.Schema(
  {
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
    },
    project_requirement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequirement",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    affiliation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerAffiliation",
      required: true,
    },
    batch_period_start: {
      type: Date,
      required: true,
    },
    batch_period_end: {
      type: Date,
      required: true,
    },
    work_logs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkLog",
    }],
    total_hours: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "confirmed", "rejected", "invoiced", "paid"],
      default: "draft",
    },
    submitted_at: {
      type: Date,
    },
    confirmed_at: {
      type: Date,
    },
    confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    rejection_reason: {
      type: String,
      length: 500,
    },
    notes: {
      type: String,
      length: 1000,
    },
  },
  {
    collection: "work_log_batch",
    timestamps: true,
  }
);

WorkLogBatchSchema.index({ freelancer_id: 1, batch_period_end: -1 });
WorkLogBatchSchema.index({ company_id: 1, status: 1 });
WorkLogBatchSchema.index({ project_requirement_id: 1 });

const WorkLogBatch = mongoose.model("WorkLogBatch", WorkLogBatchSchema);
export default WorkLogBatch;
