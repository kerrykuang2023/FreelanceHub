import mongoose from "mongoose";

const FreelancerProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
      unique: true,
    },
    freelancer_type: {
      type: String,
      enum: ["独立顾问", "挂靠顾问", "团队顾问"],
      default: "独立顾问",
    },
    display_name: {
      type: String,
      required: true,
      length: 100,
    },
    headline: {
      type: String,
      required: false,
      length: 200,
    },
    summary: {
      type: String,
      required: false,
      length: 2000,
    },
    skills: [{
      skill_name: { type: String, required: true },
      skill_level: { type: String, enum: ["初级", "中级", "高级", "专家"], default: "中级" },
      years_of_experience: { type: Number, default: 1 },
      skill_category_id: { type: mongoose.Schema.Types.ObjectId, ref: "SkillCategory" },
      skill_sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: "SkillSubCategory" },
    }],
    project_experiences: [{
      project_name: { type: String, required: true },
      company_name: { type: String, required: true },
      role: { type: String, required: true },
      start_date: { type: Date, required: true },
      end_date: { type: Date },
      description: { type: String },
      technologies: [{ type: String }],
    }],
    certifications: [{
      certification_name: { type: String, required: true },
      issuing_organization: { type: String, required: true },
      issue_date: { type: Date, required: true },
      expiry_date: { type: Date },
      credential_id: { type: String },
      credential_url: { type: String },
    }],
    current_company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    current_title: {
      type: String,
      required: false,
      length: 100,
    },
    years_of_experience: {
      type: Number,
      default: 0,
    },
    hourly_rate: {
      type: Number,
      required: false,
    },
    daily_rate: {
      type: Number,
      required: false,
    },
    monthly_rate: {
      type: Number,
      required: false,
    },
    preferred_currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ["入门", "日常会话", "商务", "流利", "母语"],
      },
    }],
    skill_category_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillCategory",
    }],
    skill_sub_category_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillSubCategory",
    }],
    portfolio_urls: [{
      type: String,
    }],
    linkedin_url: String,
    availability_status: {
      type: String,
      enum: ["available", "busy", "not_available", "open_to_opportunities"],
      default: "open_to_opportunities",
    },
    availability_notes: {
      type: String,
      length: 500,
    },
    availability_calendar: [{
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
      status: { 
        type: String, 
        enum: ["available", "busy", "tentative"], 
        default: "available" 
      },
      notes: { type: String },
      project_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "JobPost" 
      },
    }],
    preferred_work_formats: [{
      type: String,
      enum: ["远程", "现场", "混合"],
    }],
    preferred_job_natures: [{
      type: String,
      enum: ["全职", "兼职", "自由顾问", "项目制"],
    }],
    preferred_project_cycles: [{
      type: String,
      enum: ["1个月以内", "3个月", "6个月", "1年", "2年", "长期"],
    }],
    preferred_locations: [{
      city: String,
      country: String,
    }],
    is_verified: {
      type: Boolean,
      default: false,
    },
    verification_documents: [{
      document_type: String,
      document_url: String,
      uploaded_at: Date,
      verified_at: Date,
      verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
    }],
    profile_completion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "freelancer_profile",
    timestamps: true,
  }
);

FreelancerProfileSchema.index({ user_id: 1 }, { unique: true });
FreelancerProfileSchema.index({ skill_category_ids: 1 });
FreelancerProfileSchema.index({ availability_status: 1 });

const FreelancerProfile = mongoose.model("FreelancerProfile", FreelancerProfileSchema);
export default FreelancerProfile;
