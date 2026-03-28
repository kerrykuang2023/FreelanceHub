import mongoose from "mongoose";

const CompanyJoinRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
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
    message: {
      type: String,
      required: false,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    reviewed_at: {
      type: Date,
    },
    review_note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    collection: "company_join_requests",
    timestamps: true,
  }
);

CompanyJoinRequestSchema.index({ user_id: 1, company_id: 1 });
CompanyJoinRequestSchema.index({ status: 1 });

const CompanyJoinRequest = mongoose.model("CompanyJoinRequest", CompanyJoinRequestSchema);

export default CompanyJoinRequest;
