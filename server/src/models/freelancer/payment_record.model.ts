import mongoose from "mongoose";

const PaymentRecordSchema = new mongoose.Schema(
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
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerInvoice",
      required: false,
    },
    work_log_batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkLogBatch",
      required: false,
    },
    payment_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      required: false,
    },
    payment_type: {
      type: String,
      enum: ["工时结算", "项目款", "预付款", "尾款", "退款", "其他"],
      required: true,
    },
    payment_period_start: {
      type: Date,
      required: false,
    },
    payment_period_end: {
      type: Date,
      required: false,
    },
    billing_info: {
      total_hours: Number,
      daily_rate: Number,
      subtotal_amount: Number,
      currency: String,
      is_tax_inclusive: Boolean,
      tax_rate: Number,
      tax_amount: Number,
      total_amount: Number,
    },
    applied_amount: {
      type: Number,
      required: true,
    },
    actual_payment_amount: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    payment_method: {
      type: String,
      enum: ["银行转账", "支付宝", "微信支付", "支票", "现金", "其他"],
      required: false,
    },
    payment_status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "completed"],
      default: "pending",
    },
    payment_confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    payment_confirmed_at: {
      type: Date,
    },
    payment_voucher: {
      voucher_number: String,
      voucher_url: String,
      uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
      verification_status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
      verified_at: {
        type: Date,
      },
      rejection_reason: String,
    },
    bank_transfer_info: {
      from_bank_name: String,
      from_bank_account: String,
      from_account_holder: String,
      to_bank_name: String,
      to_bank_account: String,
      to_account_holder: String,
      transfer_reference: String,
      transfer_date: Date,
    },
    notes: {
      type: String,
      length: 1000,
    },
    reconciliation_status: {
      type: String,
      enum: ["unreconciled", "partial", "reconciled", "disputed"],
      default: "unreconciled",
    },
    reconciled_at: {
      type: Date,
    },
    reconciled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
  },
  {
    collection: "payment_record",
    timestamps: true,
  }
);

PaymentRecordSchema.index({ freelancer_id: 1, payment_period_end: -1 });
PaymentRecordSchema.index({ company_id: 1, payment_status: 1 });
PaymentRecordSchema.index({ invoice_id: 1 });
PaymentRecordSchema.index({ payment_status: 1, created_at: -1 });
PaymentRecordSchema.index({ reconciliation_status: 1 });

const PaymentRecord = mongoose.model("PaymentRecord", PaymentRecordSchema);
export default PaymentRecord;
