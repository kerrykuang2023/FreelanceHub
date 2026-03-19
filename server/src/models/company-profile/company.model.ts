import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
      length: 100,
    },
    profile_description: {
      type: String,
      required: false,
      length: 1000,
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
      length: 500,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: false,
    },
  },
  {
    collection: "company",
    timestamps: true,
  }
);

const Company = mongoose.model("Company", CompanySchema);

export default Company;
