import mongoose from "mongoose";

const FreelancerAffiliationSchema = new mongoose.Schema(
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
    affiliation_type: {
      type: String,
      enum: ["挂靠", "正式员工", "外包", "合作"],
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended", "terminated"],
      default: "pending",
    },
    contract_info: {
      contract_number: String,
      contract_start_date: Date,
      contract_end_date: Date,
      contract_document_url: String,
    },
    commission_rate: {
      type: Number,
      default: 0,
    },
    billing_info: {
      billing_mode: {
        type: String,
        enum: ["月薪", "日薪", "项目制", "小时制"],
      },
      billing_currency: {
        type: String,
        enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
        default: "CNY",
      },
      agreed_daily_rate: Number,
      agreed_monthly_rate: Number,
      agreed_hourly_rate: Number,
    },
    tax_info: {
      tax_inclusive: {
        type: Boolean,
        default: true,
      },
      tax_rate: {
        type: Number,
        default: 6,
      },
      invoice_type: {
        type: String,
        enum: ["增值税专用发票", "增值税普通发票", "个人发票"],
      },
    },
    payment_info: {
      bank_name: String,
      bank_account: String,
      account_holder: String,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    approved_at: {
      type: Date,
    },
    notes: {
      type: String,
      length: 1000,
    },
  },
  {
    collection: "freelancer_affiliation",
    timestamps: true,
  }
);

FreelancerAffiliationSchema.index({ freelancer_id: 1, company_id: 1 });
FreelancerAffiliationSchema.index({ company_id: 1 });
FreelancerAffiliationSchema.index({ status: 1 });

const FreelancerAffiliation = mongoose.model("FreelancerAffiliation", FreelancerAffiliationSchema);
export default FreelancerAffiliation;
