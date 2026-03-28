import mongoose from "mongoose";

const FreelancerProjectApplicationSchema = new mongoose.Schema(
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
    outsourcing_company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutsourcingCompany",
      required: false,
    },
    applicant_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    application_type: {
      type: String,
      enum: ["直接申请", "猎头推荐", "外包分配"],
      default: "直接申请",
    },
    applied_rate: {
      type: Number,
      required: false,
    },
    applied_rate_currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    applied_rate_type: {
      type: String,
      enum: ["待面试", "日薪", "月薪", "年薪", "项目总价"],
    },
    cover_letter: {
      type: String,
      length: 2000,
    },
    proposed_start_date: {
      type: Date,
      required: false,
    },
    proposed_end_date: {
      type: Date,
      required: false,
    },
    available_hours_per_week: {
      type: Number,
      required: false,
    },
    attachments: [{
      file_name: String,
      file_url: String,
      file_type: String,
    }],
    status: {
      type: String,
      enum: ["submitted", "viewed", "interview_scheduled", "interviewed", "offer_extended", "offer_accepted", "offer_rejected", "rejected", "withdrawn"],
      default: "submitted",
    },
    status_history: [{
      status: String,
      changed_at: {
        type: Date,
        default: Date.now,
      },
      changed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      notes: String,
    }],
    interview_schedules: [{
      interview_date: Date,
      interview_type: {
        type: String,
        enum: ["电话面试", "视频面试", "现场面试", "笔试", "技术面试"],
      },
      interview_duration_minutes: Number,
      interviewer_name: String,
      interviewer_contact: String,
      meeting_url: String,
      location: String,
      status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled", "rescheduled"],
        default: "scheduled",
      },
      feedback: {
        rating: Number,
        notes: String,
        recommendation: {
          type: String,
          enum: ["强烈推荐", "推荐", "一般", "不推荐"],
        },
      },
    }],
    offer_info: {
      offered_rate: Number,
      offered_rate_currency: String,
      offered_rate_type: String,
      offered_start_date: Date,
      offered_end_date: Date,
      offer_letter_url: String,
      responded_at: Date,
      response: {
        type: String,
        enum: ["accepted", "rejected", "negotiating", "pending"],
      },
      negotiation_notes: String,
    },
    rejection_reason: {
      type: String,
      length: 500,
    },
    rejection_reasons_detail: {
      reason_category: String,
      reason_description: String,
    },
    viewed_at: {
      type: Date,
    },
    applied_at: {
      type: Date,
      required: true,
    },
    updated_at: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "freelancer_project_application",
    timestamps: false,
  }
);

FreelancerProjectApplicationSchema.index({ project_requirement_id: 1, freelancer_id: 1 });
FreelancerProjectApplicationSchema.index({ freelancer_id: 1, applied_at: -1 });
FreelancerProjectApplicationSchema.index({ company_id: 1, status: 1 });
FreelancerProjectApplicationSchema.index({ status: 1, applied_at: -1 });

const FreelancerProjectApplication = mongoose.model("FreelancerProjectApplication", FreelancerProjectApplicationSchema);
export default FreelancerProjectApplication;
