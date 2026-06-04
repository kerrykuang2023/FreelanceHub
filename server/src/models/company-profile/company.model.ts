import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    profile_description: {
      type: String,
      required: false,
      maxlength: 1000,
    },
    business_stream_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessStream",
      required: false,
    },
    establishment_date: {
      type: Date,
      required: false,
    },
    company_website_url: {
      type: String,
      required: false,
      maxlength: 500,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: false,
    },
    verification_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verified_at: {
      type: Date,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    verification_reason: {
      type: String,
    },
    company_type: {
      type: String,
      enum: ["limited_company", "joint_stock", "partnership", "sole_proprietorship", "other"],
    },
    business_license_number: {
      type: String,
      maxlength: 50,
    },
    legal_representative: {
      type: String,
      maxlength: 50,
    },
    registered_capital: {
      type: String,
      maxlength: 50,
    },
    company_address: {
      type: String,
      maxlength: 200,
    },
    contact_phone: {
      type: String,
      maxlength: 20,
    },
    contact_email: {
      type: String,
      maxlength: 100,
    },
    business_scope: {
      type: String,
      maxlength: 500,
    },
    license_file_url: {
      type: String,
      maxlength: 500,
    },
    logo_url: {
      type: String,
      maxlength: 500,
    },
    cover_image_url: {
      type: String,
      maxlength: 500,
    },
    industry: {
      type: String,
      maxlength: 100,
    },
    company_size: {
      type: String,
      enum: ["1-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    description: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    collection: "company",
    timestamps: true,
  }
);

CompanySchema.index({ created_by: 1 });
CompanySchema.index({ verification_status: 1 });
CompanySchema.index({ company_name: "text" });

const Company = mongoose.model("Company", CompanySchema);

export default Company;
