import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    job_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobType",
      required: false,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    is_company_name_hidden: {
      type: Boolean,
      required: true,
      default: false,
    },
    created_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    job_description: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    job_location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobLocation",
      required: false,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    job_title: {
      type: String,
      required: false,
      maxlength: 200,
    },
    job_nature: {
      type: String,
      enum: ["全职", "兼职", "自由顾问", "实习", "full_time", "part_time", "freelance", "internship"],
      required: false,
    },
    work_format: {
      type: String,
      enum: ["远程", "现场", "混合", "remote", "onsite", "hybrid"],
      required: false,
    },
    rate_type: {
      type: String,
      enum: ["待面试", "日薪", "月薪", "年薪", "项目总价", "negotiable", "daily", "monthly", "yearly", "project"],
      required: false,
    },
    rate_amount: {
      type: Number,
      required: false,
    },
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
    project_cycle: {
      type: String,
      enum: ["1周以内", "1个月", "3个月", "6个月", "1年", "长期", "待定", "1_week", "1_month", "3_months", "6_months", "1_year", "long_term"],
      required: false,
    },
    start_date: {
      type: Date,
      required: false,
    },
    hiring_count: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "published", "in_progress", "closed", "expired", "草稿", "发布", "进行中", "已关闭", "已到期"],
      default: "published",
    },
    application_deadline: {
      type: Date,
      required: false,
    },
    salary_min: {
      type: Number,
      required: false,
    },
    salary_max: {
      type: Number,
      required: false,
    },
    required_skills: [{
      type: String,
    }],
    assigned_freelancers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
    }],
  },
  {
    collection: "job_post",
    timestamps: true,
  }
);

JobPostSchema.index({ posted_by: 1, created_date: -1 });
JobPostSchema.index({ status: 1 });
JobPostSchema.index({ company_id: 1 });

const JobPost = mongoose.model("JobPost", JobPostSchema);

export default JobPost;
