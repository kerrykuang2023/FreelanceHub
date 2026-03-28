import mongoose from "mongoose";

const OutsourcingCompanySchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    company_type: {
      type: String,
      enum: ["外包公司", "猎头公司", "挂靠企业", "直签企业"],
      required: true,
    },
    business_license_number: {
      type: String,
      required: false,
      length: 50,
    },
    business_license_url: {
      type: String,
      required: false,
    },
    tax_registration_number: {
      type: String,
      required: false,
      length: 50,
    },
    invoice_types_supported: [{
      type: String,
      enum: ["增值税专用发票", "增值税普通发票", "个人发票", "服务费发票"],
    }],
    accepted_tax_rates: [{
      type: Number,
    }],
    billing_currency: [{
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
    }],
    payment_terms_days: {
      type: Number,
      default: 30,
    },
    minimum_billing_amount: {
      type: Number,
      default: 1000,
    },
    bank_info: {
      bank_name: String,
      bank_account: String,
      account_holder: String,
      swift_code: String,
    },
    contacts: [{
      name: String,
      title: String,
      email: String,
      phone: String,
      is_primary: {
        type: Boolean,
        default: false,
      },
    }],
    service_fee_rate: {
      type: Number,
      default: 0,
    },
    contract_info: {
      contract_number: String,
      contract_start_date: Date,
      contract_end_date: Date,
      contract_document_url: String,
      auto_renew: {
        type: Boolean,
        default: false,
      },
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
    },
    verified_at: {
      type: Date,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    statistics: {
      total_projects: {
        type: Number,
        default: 0,
      },
      active_projects: {
        type: Number,
        default: 0,
      },
      total_freelancers: {
        type: Number,
        default: 0,
      },
      total_invoiced_amount: {
        type: Number,
        default: 0,
      },
      total_paid_amount: {
        type: Number,
        default: 0,
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "outsourcing_company",
    timestamps: true,
  }
);

OutsourcingCompanySchema.index({ company_id: 1 }, { unique: true });
OutsourcingCompanySchema.index({ company_type: 1 });
OutsourcingCompanySchema.index({ verification_status: 1 });

const OutsourcingCompany = mongoose.model("OutsourcingCompany", OutsourcingCompanySchema);
export default OutsourcingCompany;
