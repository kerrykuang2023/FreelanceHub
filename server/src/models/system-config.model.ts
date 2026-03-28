import mongoose from "mongoose";

export const SYSTEM_CONFIG_TYPES = {
  // 原有类型
  SKILL_CATEGORY: "skill_category",
  WORK_TYPE: "work_type",
  TAX_RATE: "tax_rate",
  CURRENCY: "currency",
  LANGUAGE: "language",
  JOB_NATURE: "job_nature",
  WORK_FORMAT: "work_format",
  RATE_TYPE: "rate_type",
  INVOICE_TYPE: "invoice_type",
  PAYMENT_METHOD: "payment_method",
  
  // 新增状态类枚举
  WORK_LOG_STATUS: "work_log_status",
  INVOICE_STATUS: "invoice_status",
  APPLICATION_STATUS: "application_status",
  COMPANY_STATUS: "company_status",
  CONTRACT_STATUS: "contract_status",
  PROJECT_STATUS: "project_status",
  USER_ROLE_STATUS: "user_role_status",
  ROLE_APPROVAL_STATUS: "role_approval_status",
  AFFILIATION_STATUS: "affiliation_status",
  PAYMENT_STATUS: "payment_status",
  TICKET_STATUS: "ticket_status",
  ARBITRATION_STATUS: "arbitration_status",
  REPORT_STATUS: "report_status",
  PUNISHMENT_STATUS: "punishment_status",
  
  // 新增类型类枚举
  CONSULTANT_TYPE: "consultant_type",
  SKILL_LEVEL: "skill_level",
  LANGUAGE_LEVEL: "language_level",
  PROJECT_DURATION: "project_duration",
  INTERVIEW_TYPE: "interview_type",
  RECOMMENDATION_LEVEL: "recommendation_level",
  AFFILIATION_TYPE: "affiliation_type",
  OUTSOURCING_TYPE: "outsourcing_type",
  INVOICE_TAX_MODE: "invoice_tax_mode",
  PAYMENT_TYPE: "payment_type",
  UNIT_TYPE: "unit_type",
  
  // 新增优先级类枚举
  PRIORITY: "priority",
  
  // 新增角色类枚举
  USER_ROLE: "user_role",
  GENDER: "gender",
  DEVICE_TYPE: "device_type",
} as const;

export type SystemConfigType = typeof SYSTEM_CONFIG_TYPES[keyof typeof SYSTEM_CONFIG_TYPES];

export interface ISystemConfig {
  config_type: SystemConfigType;
  config_key: string;
  config_value: string;
  display_name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

const SystemConfigSchema = new mongoose.Schema(
  {
    config_type: {
      type: String,
      required: true,
      enum: Object.values(SYSTEM_CONFIG_TYPES),
      index: true,
    },
    config_key: {
      type: String,
      required: true,
    },
    config_value: {
      type: String,
      required: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "system_config",
    timestamps: true,
  }
);

SystemConfigSchema.index({ config_type: 1, config_key: 1 }, { unique: true });
SystemConfigSchema.index({ config_type: 1, display_order: 1 });

const SystemConfig = mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfig;