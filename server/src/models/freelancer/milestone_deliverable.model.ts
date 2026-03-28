import mongoose from "mongoose";

const MilestoneDeliverableSchema = new mongoose.Schema(
  {
    project_requirement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequirement",
      required: true,
    },
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    milestone_number: {
      type: Number,
      required: true,
    },
    milestone_name: {
      type: String,
      required: true,
      length: 200,
    },
    description: {
      type: String,
      required: true,
      length: 2000,
    },
    planned_start_date: {
      type: Date,
      required: true,
    },
    planned_end_date: {
      type: Date,
      required: true,
    },
    due_date: {
      type: Date,
    },
    actual_start_date: {
      type: Date,
    },
    actual_end_date: {
      type: Date,
    },
    deliverables: [{
      deliverable_name: String,
      deliverable_description: String,
      deliverable_url: String,
      delivered_at: Date,
      is_approved: {
        type: Boolean,
        default: false,
      },
      approved_at: Date,
      approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      approval_comment: String,
    }],
    status: {
      type: String,
      enum: ["planned", "in_progress", "at_risk", "overdue", "submitted", "under_review", "approved", "rejected", "revision_requested"],
      default: "planned",
    },
    submitted_at: {
      type: Date,
    },
    approved_at: {
      type: Date,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    rejection_reason: {
      type: String,
      length: 1000,
    },
    rejection_reasons: [{
      reason: String,
      rejection_date: Date,
      rejected_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
    }],
    work_log_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkLog",
    }],
    billing_info: {
      milestone_amount: Number,
      currency: String,
      is_invoiced: {
        type: Boolean,
        default: false,
      },
      invoice_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FreelancerInvoice",
      },
    },
    completion_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      length: 1000,
    },
  },
  {
    collection: "milestone_deliverable",
    timestamps: true,
  }
);

MilestoneDeliverableSchema.index({ project_requirement_id: 1, milestone_number: 1 });
MilestoneDeliverableSchema.index({ freelancer_id: 1, status: 1 });
MilestoneDeliverableSchema.index({ company_id: 1, status: 1 });

const MilestoneDeliverable = mongoose.model("MilestoneDeliverable", MilestoneDeliverableSchema);

export interface IMilestoneDeliverable {
  _id: string;
  project_requirement_id: string;
  freelancer_id: string;
  company_id: string;
  milestone_number: number;
  milestone_name: string;
  description: string;
  planned_start_date: Date;
  planned_end_date: Date;
  due_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  deliverables: Array<{
    deliverable_name: string;
    deliverable_description: string;
    deliverable_url?: string;
    delivered_at?: Date;
    is_approved: boolean;
    approved_at?: Date;
    approved_by?: string;
    approval_comment?: string;
  }>;
  status: string;
  submitted_at?: Date;
  approved_at?: Date;
  approved_by?: string;
  rejection_reason?: string;
  completion_percentage: number;
  notes?: string;
}

export default MilestoneDeliverable;
