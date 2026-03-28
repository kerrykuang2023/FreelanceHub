export interface IWorkLog {
  _id: string;
  freelancer_id: string;
  project_requirement_id: {
    _id: string;
    project_title: string;
  };
  company_id: string;
  affiliation_id: string;
  work_date: string;
  work_period_start: string;
  work_period_end: string;
  hours_worked: number;
  work_type: WorkType;
  work_description: string;
  work_content_detail?: string;
  attachments: IWorkLogAttachment[];
  status: WorkLogStatus;
  submitted_at?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  billing_info?: IBillingInfo;
  invoice_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IWorkLogAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  file_description?: string;
}

export interface IBillingInfo {
  daily_rate: number;
  hours_billable: number;
  amount: number;
  currency: string;
  is_tax_inclusive: boolean;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

export type WorkLogStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "rejected"
  | "invoiced"
  | "paid"
  | "completed";

export type WorkType =
  | "远程工作"
  | "现场开发"
  | "会议"
  | "培训"
  | "出差"
  | "代码评审"
  | "问题修复"
  | "需求分析"
  | "文档编写"
  | "测试"
  | "部署"
  | "其他";

export const WORK_TYPES: WorkType[] = [
  "远程工作",
  "现场开发",
  "会议",
  "培训",
  "出差",
  "代码评审",
  "问题修复",
  "需求分析",
  "文档编写",
  "测试",
  "部署",
  "其他",
];

export const WORK_TYPE_OPTIONS = WORK_TYPES.map((type) => ({
  value: type,
  label: type,
}));

export const WORK_LOG_STATUS_COLORS: Record<WorkLogStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  invoiced: "bg-blue-100 text-blue-800",
  paid: "bg-purple-100 text-purple-800",
  completed: "bg-indigo-100 text-indigo-800",
};

export const WORK_LOG_STATUS_TEXT: Record<WorkLogStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  confirmed: "已确认",
  rejected: "已驳回",
  invoiced: "已开票",
  paid: "已付款",
  completed: "已完成",
};

export interface IWorkLogSummary {
  total_hours: number;
  total_logs: number;
  by_status: Array<{
    status: WorkLogStatus;
    hours: number;
  }>;
}

export interface IWorkLogListResponse {
  work_logs: IWorkLog[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface IWorkLogFormData {
  project_requirement_id: string;
  work_date: string;
  work_period_start: string;
  work_period_end: string;
  hours_worked: number;
  work_type: WorkType;
  work_description: string;
  work_content_detail?: string;
  notes?: string;
}