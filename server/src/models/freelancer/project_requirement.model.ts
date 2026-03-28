import mongoose from "mongoose";

const ProjectRequirementSchema = new mongoose.Schema(
  {
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    project_title: {
      type: String,
      required: true,
      length: 200,
    },
    project_description: {
      type: String,
      required: true,
      length: 4000,
    },
    language_requirements: [{
      type: String,
      enum: ["中文", "英语", "俄语", "日语", "韩语", "法语", "德语", "西班牙语", "葡萄牙语", "阿拉伯语"],
    }],
    job_nature: {
      type: String,
      enum: ["全职", "兼职", "自由顾问", "实习"],
      required: true,
    },
    work_format: {
      type: String,
      enum: ["远程", "现场", "混合"],
      required: true,
    },
    rate_type: {
      type: String,
      enum: ["待面试", "日薪", "月薪", "年薪", "项目总价"],
      required: true,
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
    project_location: {
      street_address: String,
      city: String,
      state: String,
      country: String,
      zip_code: String,
    },
    project_cycle: {
      type: String,
      enum: ["1个月以内", "3个月", "6个月", "1年", "2年", "2年以上", "长期", "待定"],
      required: true,
    },
    start_date: {
      type: Date,
      required: false,
    },
    required_skills: [{
      skill_name: String,
      skill_level: {
        type: String,
        enum: ["入门", "初级", "中级", "高级", "专家"],
      },
      is_mandatory: {
        type: Boolean,
        default: true,
      },
    }],
    work_requirements: {
      type: String,
      length: 2000,
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
    },
    expiry_date: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["草稿", "发布", "进行中", "已关闭", "已到期"],
      default: "发布",
    },
  },
  {
    collection: "project_requirement",
    timestamps: true,
  }
);

const ProjectRequirement = mongoose.model("ProjectRequirement", ProjectRequirementSchema);
export default ProjectRequirement;
