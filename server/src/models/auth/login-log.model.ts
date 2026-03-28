import mongoose from "mongoose";

const LoginLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    login_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ip_address: {
      type: String,
      required: true,
    },
    user_agent: {
      type: String,
      required: false,
    },
    device_type: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: {
      type: String,
      required: false,
    },
    os: {
      type: String,
      required: false,
    },
    login_status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    failure_reason: {
      type: String,
      required: false,
    },
    location: {
      country: { type: String },
      city: { type: String },
      region: { type: String },
    },
    session_id: {
      type: String,
      required: false,
    },
    logout_time: {
      type: Date,
      required: false,
    },
  },
  {
    collection: "login_log",
    timestamps: true,
  }
);

LoginLogSchema.index({ user_id: 1, login_time: -1 });
LoginLogSchema.index({ login_time: -1 });
LoginLogSchema.index({ ip_address: 1 });

const LoginLog = mongoose.model("LoginLog", LoginLogSchema);

export default LoginLog;
