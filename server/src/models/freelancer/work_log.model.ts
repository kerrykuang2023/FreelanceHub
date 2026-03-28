import mongoose from "mongoose";

const WorkLogSchema = new mongoose.Schema(
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
    work_period_start: {
      type: Date,
      required: true,
    },
    work_period_end: {
      type: Date,
      required: true,
    },
    work_date: {
      type: Date,
      required: true,
    },
    hours_worked: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    work_type: {
      type: String,
      enum: ["onsite_dev", "remote_work", "meeting", "training", "business_trip", "code_review", "bug_fix", "requirement_analysis", "documentation", "testing", "deployment", "other"],
      required: true,
    },
    work_description: {
      type: String,
      required: true,
      length: 2000,
    },
    work_content_detail: {
      type: String,
      required: false,
      length: 5000,
    },
    attachments: [{
      file_name: String,
      file_url: String,
      file_type: String,
      file_size: Number,
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
      file_description: String,
    }],
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
    rejected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    rejected_at: {
      type: Date,
    },
    billing_info: {
      daily_rate: Number,
      hours_billable: Number,
      amount: Number,
      currency: String,
      is_tax_inclusive: Boolean,
      tax_rate: Number,
      tax_amount: Number,
      total_amount: Number,
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerInvoice",
    },
    notes: {
      type: String,
      length: 1000,
    },
    created_at: {
      type: Date,
      required: true,
    },
    updated_at: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "work_log",
    timestamps: false,
  }
);

WorkLogSchema.index({ freelancer_id: 1, work_date: -1 });
WorkLogSchema.index({ project_requirement_id: 1 });
WorkLogSchema.index({ company_id: 1, status: 1 });
WorkLogSchema.index({ status: 1, submitted_at: -1 });

const WorkLog = mongoose.model("WorkLog", WorkLogSchema);
export default WorkLog;
