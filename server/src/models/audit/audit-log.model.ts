import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "approve",
        "reject",
        "submit",
        "export",
        "import",
        "view",
        "download",
        "upload",
        "send",
        "other",
      ],
    },
    resource_type: {
      type: String,
      required: true,
      enum: [
        "user",
        "company",
        "job",
        "application",
        "work_log",
        "invoice",
        "payment",
        "rating",
        "notification",
        "report",
        "setting",
        "other",
      ],
    },
    resource_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ip_address: {
      type: String,
      required: false,
    },
    user_agent: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    error_message: {
      type: String,
      required: false,
    },
    duration_ms: {
      type: Number,
      required: false,
    },
  },
  {
    collection: "audit_log",
    timestamps: true,
  }
);

AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ created_at: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
