import mongoose from "mongoose";

const ProjectRequirementSchema = new mongoose.Schema(
  {
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: false,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    project_title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    project_description: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    language_requirements: [String],
    job_nature: {
      type: String,
      enum: ["full_time", "part_time", "freelance", "internship", "全职", "兼职", "自由顾问", "实习"],
      required: true,
    },
    work_format: {
      type: String,
      enum: ["remote", "onsite", "hybrid", "远程", "现场", "混合"],
      required: true,
    },
    rate_type: {
      type: String,
      enum: ["negotiable", "daily", "monthly", "yearly", "project", "待面试", "日薪", "月薪", "年薪", "项目总价"],
      required: true,
    },
    rate_amount: Number,
    rate_currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    project_major_categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillCategory",
    }],
    project_sub_categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillSubCategory",
    }],
    project_location: {
      street_address: String,
      city: String,
      state: String,
      country: String,
      zip_code: String,
    },
    project_cycle: {
      type: String,
      enum: ["1_week", "1_month", "3_months", "6_months", "1_year", "long_term", "1个月以内", "1个月", "3个月", "6个月", "1年", "长期"],
      required: true,
    },
    start_date: Date,
    required_skills: [{
      skill_name: String,
      skill_level: String,
      is_mandatory: {
        type: Boolean,
        default: true,
      },
    }],
    work_requirements: {
      type: String,
      maxlength: 2000,
    },
    budget_range: {
      min: Number,
      max: Number,
      currency: String,
    },
    hiring_count: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    view_count: {
      type: Number,
      default: 0,
    },
    application_count: {
      type: Number,
      default: 0,
    },
    created_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiry_date: Date,
    status: {
      type: String,
      enum: ["draft", "published", "in_progress", "closed", "expired", "草稿", "发布", "进行中", "已关闭", "已到期"],
      default: "published",
    },
  },
  {
    collection: "project_requirement",
    timestamps: true,
  }
);

ProjectRequirementSchema.index({ job_post_id: 1 });
ProjectRequirementSchema.index({ company_id: 1, status: 1 });

const ProjectRequirement = mongoose.model("ProjectRequirement", ProjectRequirementSchema);
export default ProjectRequirement;
