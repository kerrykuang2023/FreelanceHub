import mongoose from "mongoose";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

interface ISubmittedData {
  application_reason?: string;
  professional_summary?: string;
  requested_from?: string;
  skills?: string[];
  experience?: {
    company: string;
    position: string;
    start_date: Date;
    end_date?: Date;
    description: string;
  }[];
  expected_salary?: {
    min: number;
    max: number;
    currency: string;
  };
  company_name?: string;
  company_id?: mongoose.Types.ObjectId;
  position?: string;
  [key: string]: any;
}

interface IRoleApproval extends mongoose.Document {
  user_id: mongoose.Types.ObjectId;
  role_type: string;
  status: ApprovalStatus;
  submitted_data: ISubmittedData;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  review_notes?: string;
  rejection_reason?: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

const RoleApprovalSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
      index: true,
    },
    role_type: {
      type: String,
      enum: ["job_seeker", "hr_recruiter", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      required: true,
    },
    submitted_data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    reviewed_at: {
      type: Date,
    },
    review_notes: {
      type: String,
    },
    rejection_reason: {
      type: String,
    },
    expires_at: {
      type: Date,
      required: true,
      default: function () {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      },
    },
  },
  {
    collection: "role_approval",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

RoleApprovalSchema.index({ user_id: 1, role_type: 1, status: 1 });
RoleApprovalSchema.index({ status: 1, created_at: -1 });

RoleApprovalSchema.methods.toJSON = function () {
  const approval = this.toObject();
  approval.id = approval._id;
  approval.created_at = approval.created_at || approval.createdAt;
  approval.updated_at = approval.updated_at || approval.updatedAt;
  delete approval._id;
  delete approval.__v;
  return approval;
};

RoleApprovalSchema.statics.findPendingApprovals = function () {
  return this.find({ status: "pending" })
    .populate("user_id", "email first_name last_name user_image")
    .populate("reviewed_by", "email first_name last_name")
    .sort({ created_at: -1, createdAt: -1 });
};

RoleApprovalSchema.statics.findExpiredApprovals = function () {
  return this.find({
    status: "pending",
    expires_at: { $lt: new Date() },
  });
};

const RoleApproval = mongoose.model<IRoleApproval & mongoose.Document>(
  "RoleApproval",
  RoleApprovalSchema
);

export default RoleApproval;
export { IRoleApproval, ISubmittedData };
