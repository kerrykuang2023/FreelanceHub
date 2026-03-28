export interface IProjectRequirement {
  _id: string;
  posted_by: {
    _id: string;
    email: string;
  };
  company_id: ICompany;
  project_title: string;
  project_description: string;
  language_requirements: string[];
  job_nature: "全职" | "兼职" | "自由顾问" | "实习";
  work_format: "远程" | "现场" | "混合";
  rate_type: "待面试" | "日薪" | "月薪" | "年薪" | "项目总价";
  rate_amount?: number;
  rate_currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";
  project_major_categories: ISkillCategory[];
  project_sub_categories: ISkillSubCategory[];
  project_location: IJobLocation;
  project_cycle: "1个月以内" | "3个月" | "6个月" | "1年" | "2年" | "2年以上" | "长期" | "待定";
  start_date?: Date;
  required_skills: IRequiredSkill[];
  work_requirements?: string;
  budget_range?: {
    min: number;
    max: number;
    currency: string;
  };
  hiring_count: number;
  is_active: boolean;
  view_count: number;
  application_count: number;
  created_date: Date;
  expiry_date?: Date;
  status: "草稿" | "发布" | "进行中" | "已关闭" | "已到期";
}

export interface ISkillCategory {
  _id: string;
  category_name: string;
  category_code: string;
  category_icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  sub_categories?: ISkillSubCategory[];
}

export interface ISkillSubCategory {
  _id: string;
  category_id: string;
  sub_category_name: string;
  sub_category_code: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  tags?: string[];
}

export interface IRequiredSkill {
  skill_name: string;
  skill_level: "入门" | "初级" | "中级" | "高级" | "专家";
  is_mandatory: boolean;
}

export interface IFreelancerProfile {
  _id: string;
  user_id: string;
  freelancer_type: "独立顾问" | "挂靠顾问" | "团队顾问";
  display_name: string;
  headline?: string;
  summary?: string;
  current_company?: ICompany;
  current_title?: string;
  years_of_experience: number;
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  preferred_currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";
  languages: ILanguage[];
  skill_category_ids: ISkillCategory[];
  skill_sub_category_ids: ISkillSubCategory[];
  certifications: ICertification[];
  portfolio_urls: string[];
  linkedin_url?: string;
  availability_status: "available" | "busy" | "not_available" | "open_to_opportunities";
  availability_notes?: string;
  preferred_work_formats: ("远程" | "现场" | "混合")[];
  preferred_job_natures: ("全职" | "兼职" | "自由顾问" | "项目制")[];
  preferred_project_cycles: string[];
  preferred_locations: ILocation[];
  is_verified: boolean;
  profile_completion: number;
  rating: {
    average: number;
    count: number;
  };
  is_active: boolean;
}

export interface ILanguage {
  language: string;
  proficiency: "入门" | "日常会话" | "商务" | "流利" | "母语";
}

export interface ICertification {
  certification_name: string;
  issuing_organization: string;
  issue_date: Date;
  expiry_date?: Date;
  credential_url?: string;
}

export interface ILocation {
  city: string;
  country: string;
}

export interface IFreelancerAffiliation {
  _id: string;
  freelancer_id: string;
  company_id: ICompany;
  affiliation_type: "挂靠" | "正式员工" | "外包" | "合作";
  start_date: Date;
  end_date?: Date;
  status: "active" | "pending" | "suspended" | "terminated";
  contract_info: {
    contract_number?: string;
    contract_start_date?: Date;
    contract_end_date?: Date;
    contract_document_url?: string;
  };
  commission_rate: number;
  billing_info: {
    billing_mode: "月薪" | "日薪" | "项目制" | "小时制";
    billing_currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";
    agreed_daily_rate?: number;
    agreed_monthly_rate?: number;
    agreed_hourly_rate?: number;
  };
  tax_info: {
    tax_inclusive: boolean;
    tax_rate: number;
    invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票";
  };
  payment_info: {
    bank_name?: string;
    bank_account?: string;
    account_holder?: string;
  };
  approved_by?: string;
  approved_at?: Date;
  notes?: string;
}

export interface IWorkLog {
  _id: string;
  freelancer_id: string;
  project_requirement_id: string;
  company_id: string;
  affiliation_id: string;
  work_period_start: Date;
  work_period_end: Date;
  work_date: Date;
  hours_worked: number;
  work_type: "现场开发" | "远程工作" | "会议" | "培训" | "出差" | "代码评审" | "问题修复" | "需求分析" | "文档编写" | "测试" | "部署" | "其他";
  work_description: string;
  work_content_detail?: string;
  attachments: IWorkAttachment[];
  status: "draft" | "submitted" | "confirmed" | "rejected" | "invoiced" | "paid";
  submitted_at?: Date;
  confirmed_at?: Date;
  confirmed_by?: string;
  rejection_reason?: string;
  billing_info: {
    daily_rate: number;
    hours_billable: number;
    amount: number;
    currency: string;
    is_tax_inclusive: boolean;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  };
  invoice_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IWorkAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: Date;
  file_description?: string;
}

export interface IWorkLogBatch {
  _id: string;
  freelancer_id: string;
  project_requirement_id: string;
  company_id: string;
  affiliation_id: string;
  batch_period_start: Date;
  batch_period_end: Date;
  work_logs: string[];
  total_hours: number;
  total_amount: number;
  currency: string;
  status: "draft" | "submitted" | "confirmed" | "rejected" | "invoiced" | "paid";
  submitted_at?: Date;
  confirmed_at?: Date;
  confirmed_by?: string;
  rejection_reason?: string;
  notes?: string;
}

export interface IMilestoneDeliverable {
  _id: string;
  project_requirement_id: string;
  freelancer_id: string;
  company_id: string;
  milestone_number: number;
  milestone_name: string;
  description: string;
  planned_start_date: Date;
  planned_end_date: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  deliverables: IDeliverable[];
  status: "planned" | "in_progress" | "submitted" | "under_review" | "approved" | "rejected" | "revision_requested";
  submitted_at?: Date;
  approved_at?: Date;
  approved_by?: string;
  rejection_reason?: string;
  completion_percentage: number;
}

export interface IDeliverable {
  deliverable_name: string;
  deliverable_description?: string;
  deliverable_url?: string;
  delivered_at?: Date;
  is_approved: boolean;
  approved_at?: Date;
  approved_by?: string;
  approval_comment?: string;
}

export interface IFreelancerInvoice {
  _id: string;
  invoice_number: string;
  freelancer_id: string;
  company_id: string;
  affiliation_id: string;
  project_requirement_id?: string;
  work_log_batch_id?: string;
  invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票" | "服务费发票";
  billing_period_start: Date;
  billing_period_end: Date;
  currency: string;
  items: IInvoiceItem[];
  subtotal_amount: number;
  tax_calculation_mode: "含税价" | "不含税价";
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_in_words?: string;
  tax_breakdown: {
    vat_amount: number;
    personal_income_tax_amount: number;
    other_taxes: number;
  };
  status: "draft" | "submitted" | "approved" | "rejected" | "sent" | "paid" | "cancelled";
  issued_date?: Date;
  due_date?: Date;
  paid_date?: Date;
  payment_method?: string;
  payment_reference?: string;
  billing_info: {
    billing_company_name: string;
    billing_tax_id: string;
    billing_address: string;
    billing_phone: string;
    billing_bank_name: string;
    billing_bank_account: string;
  };
  notes?: string;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unit: "天" | "月" | "小时" | "项目" | "次";
  unit_price: number;
  amount: number;
}

export interface IOutsourcingCompany {
  _id: string;
  company_id: string;
  company_type: "外包公司" | "猎头公司" | "挂靠企业" | "直签企业";
  business_license_number?: string;
  tax_registration_number?: string;
  invoice_types_supported: string[];
  accepted_tax_rates: number[];
  billing_currency: string[];
  payment_terms_days: number;
  minimum_billing_amount: number;
  bank_info: {
    bank_name?: string;
    bank_account?: string;
    account_holder?: string;
    swift_code?: string;
  };
  contacts: ICompanyContact[];
  service_fee_rate: number;
  contract_info: {
    contract_number?: string;
    contract_start_date?: Date;
    contract_end_date?: Date;
    contract_document_url?: string;
    auto_renew: boolean;
  };
  verification_status: "pending" | "verified" | "rejected" | "expired";
  rating: {
    average: number;
    count: number;
  };
  statistics: {
    total_projects: number;
    active_projects: number;
    total_freelancers: number;
    total_invoiced_amount: number;
    total_paid_amount: number;
  };
  is_active: boolean;
}

export interface ICompanyContact {
  name: string;
  title?: string;
  email: string;
  phone?: string;
  is_primary: boolean;
}

export interface IFreelancerProjectApplication {
  _id: string;
  project_requirement_id: string;
  freelancer_id: string;
  company_id: string;
  outsourcing_company_id?: string;
  applicant_user_id: string;
  application_type: "直接申请" | "猎头推荐" | "外包分配";
  applied_rate?: number;
  applied_rate_currency: string;
  applied_rate_type: string;
  cover_letter?: string;
  proposed_start_date?: Date;
  proposed_end_date?: Date;
  available_hours_per_week?: number;
  attachments: IWorkAttachment[];
  status: string;
  status_history: IStatusHistory[];
  interview_schedules: IInterviewSchedule[];
  offer_info?: {
    offered_rate: number;
    offered_rate_currency: string;
    offered_rate_type: string;
    offered_start_date: Date;
    offered_end_date?: Date;
    offer_letter_url?: string;
    responded_at?: Date;
    response?: string;
    negotiation_notes?: string;
  };
  rejection_reason?: string;
  viewed_at?: Date;
  applied_at: Date;
}

export interface IStatusHistory {
  status: string;
  changed_at: Date;
  changed_by?: string;
  notes?: string;
}

export interface IInterviewSchedule {
  interview_date: Date;
  interview_type: "电话面试" | "视频面试" | "现场面试" | "笔试" | "技术面试";
  interview_duration_minutes?: number;
  interviewer_name?: string;
  interviewer_contact?: string;
  meeting_url?: string;
  location?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  feedback?: {
    rating?: number;
    notes?: string;
    recommendation?: string;
  };
}

export interface ICompany {
  _id: string;
  company_name: string;
  profile_description?: string;
  company_website_url?: string;
}

export interface IJobLocation {
  street_address?: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
}
