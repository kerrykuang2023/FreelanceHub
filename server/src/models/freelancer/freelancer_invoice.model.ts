import mongoose from "mongoose";

const FreelancerInvoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      required: true,
      unique: true,
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
    invoice_type: {
      type: String,
      enum: ["vat_special", "vat_normal", "personal", "service_fee"],
      required: true,
    },
    billing_period_start: {
      type: Date,
      required: true,
    },
    billing_period_end: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    items: [{
      description: String,
      quantity: Number,
      unit: {
        type: String,
        enum: ["day", "month", "hour", "project", "time"],
      },
      unit_price: Number,
      amount: Number,
    }],
    subtotal_amount: {
      type: Number,
      required: true,
    },
    tax_calculation_mode: {
      type: String,
      enum: ["inclusive", "exclusive"],
      required: true,
    },
    tax_rate: {
      type: Number,
      required: true,
      default: 6,
    },
    tax_amount: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    amount_in_words: {
      type: String,
    },
    tax_breakdown: {
      vat_amount: Number,
      personal_income_tax_amount: Number,
      other_taxes: Number,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "sent", "paid", "cancelled"],
      default: "draft",
    },
    issued_date: {
      type: Date,
    },
    due_date: {
      type: Date,
    },
    paid_date: {
      type: Date,
    },
    payment_method: {
      type: String,
      enum: ["bank_transfer", "alipay", "wechat", "check", "cash", "other"],
    },
    payment_reference: {
      type: String,
    },
    billing_info: {
      billing_company_name: String,
      billing_tax_id: String,
      billing_address: String,
      billing_phone: String,
      billing_bank_name: String,
      billing_bank_account: String,
    },
    recipient_info: {
      recipient_name: String,
      recipient_company: String,
      recipient_address: String,
      recipient_phone: String,
    },
    notes: {
      type: String,
      length: 1000,
    },
    attachments: [{
      file_name: String,
      file_url: String,
      file_type: String,
    }],
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
    collection: "freelancer_invoice",
    timestamps: false,
  }
);

FreelancerInvoiceSchema.index({ invoice_number: 1 }, { unique: true });
FreelancerInvoiceSchema.index({ freelancer_id: 1, issued_date: -1 });
FreelancerInvoiceSchema.index({ company_id: 1, status: 1 });
FreelancerInvoiceSchema.index({ status: 1, due_date: 1 });

const FreelancerInvoice = mongoose.model("FreelancerInvoice", FreelancerInvoiceSchema);
export default FreelancerInvoice;
