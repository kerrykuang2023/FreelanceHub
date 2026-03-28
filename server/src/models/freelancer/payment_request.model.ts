import mongoose from "mongoose";

const PaymentRequestSchema = new mongoose.Schema(
  {
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
    affiliation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerAffiliation",
      required: true,
    },
    project_requirement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequirement",
      required: false,
    },
    work_log_batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkLogBatch",
      required: false,
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerInvoice",
      required: false,
    },
    request_number: {
      type: String,
      required: true,
      unique: true,
    },
    request_type: {
      type: String,
      enum: ["工时结算", "项目款", "预付款", "尾款", "里程碑款"],
      required: true,
    },
    billing_period_start: {
      type: Date,
      required: false,
    },
    billing_period_end: {
      type: Date,
      required: false,
    },
    currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    requested_amount: {
      type: Number,
      required: true,
    },
    amount_breakdown: {
      subtotal: Number,
      tax_rate: Number,
      tax_amount: Number,
      total_amount: Number,
      is_tax_inclusive: Boolean,
    },
    work_summary: {
      total_hours: Number,
      work_details: String,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "payment_initiated", "paid", "cancelled"],
      default: "draft",
    },
    submitted_at: {
      type: Date,
    },
    approval_info: {
      approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      approved_at: {
        type: Date,
      },
      approval_comment: String,
    },
    rejection_info: {
      rejected_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      rejected_at: {
        type: Date,
      },
      rejection_reason: String,
    },
    payment_info: {
      payment_method: String,
      payment_initiated_at: Date,
      payment_initiated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      payment_reference: String,
    },
    attachments: [{
      file_name: String,
      file_url: String,
      file_type: String,
      file_description: String,
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
    }],
    notes: {
      type: String,
      length: 1000,
    },
    follow_up_status: {
      type: String,
      enum: ["none", "pending", "reminded", "overdue"],
      default: "none",
    },
    reminder_sent_at: {
      type: Date,
    },
    expected_payment_date: {
      type: Date,
      required: false,
    },
  },
  {
    collection: "payment_request",
    timestamps: true,
  }
);

PaymentRequestSchema.index({ request_number: 1 }, { unique: true });
PaymentRequestSchema.index({ freelancer_id: 1, status: 1 });
PaymentRequestSchema.index({ company_id: 1, status: 1 });
PaymentRequestSchema.index({ status: 1, submitted_at: -1 });

PaymentRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.request_number) {
    const count = await mongoose.model("PaymentRequest").countDocuments();
    this.request_number = `PR${Date.now()}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const PaymentRequest = mongoose.model("PaymentRequest", PaymentRequestSchema);
export default PaymentRequest;
