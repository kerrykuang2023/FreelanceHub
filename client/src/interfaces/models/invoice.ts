export interface IInvoiceItemData {
  description: string;
  quantity: number;
  unit: "天" | "月" | "小时" | "项目" | "次";
  unit_price: number;
  amount: number;
  work_log_id?: string;
}

export type IInvoiceItem = IInvoiceItemData;

export interface IInvoiceBillingInfo {
  billing_company_name: string;
  billing_tax_id: string;
  billing_address: string;
  billing_phone: string;
  billing_bank_name: string;
  billing_bank_account: string;
}

export interface IRecipientInfo {
  recipient_name: string;
  recipient_company: string;
  recipient_address: string;
  recipient_phone: string;
}

export interface ITaxBreakdown {
  vat_amount: number;
  personal_income_tax_amount: number;
  other_taxes: number;
}

export interface IInvoiceAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export type InvoiceStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "sent"
  | "paid"
  | "cancelled";

export type InvoiceType =
  | "增值税专用发票"
  | "增值税普通发票"
  | "个人发票"
  | "服务费发票";

export type TaxCalculationMode = "含税价" | "不含税价";

export interface IInvoice {
  _id: string;
  invoice_number: string;
  freelancer_id: {
    _id: string;
    display_name: string;
  };
  company_id: {
    _id: string;
    company_name: string;
  };
  affiliation_id: string;
  project_requirement_id?: {
    _id: string;
    project_title: string;
  };
  work_log_batch_id?: string;
  invoice_type: InvoiceType;
  billing_period_start: string;
  billing_period_end: string;
  currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";
  items: IInvoiceItem[];
  subtotal_amount: number;
  tax_calculation_mode: TaxCalculationMode;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_in_words?: string;
  tax_breakdown?: ITaxBreakdown;
  status: InvoiceStatus;
  issued_date?: string;
  due_date?: string;
  paid_date?: string;
  payment_method?: "银行转账" | "支付宝" | "微信支付" | "支票" | "现金" | "其他";
  payment_reference?: string;
  billing_info: IInvoiceBillingInfo;
  recipient_info?: IRecipientInfo;
  notes?: string;
  attachments: IInvoiceAttachment[];
  created_at: string;
  updated_at: string;
}

export interface IInvoiceFormData {
  company_id: string;
  affiliation_id: string;
  project_requirement_id?: string;
  work_log_batch_id?: string;
  work_log_ids?: string[];
  invoice_type: InvoiceType;
  billing_period_start: string;
  billing_period_end: string;
  currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";
  items: IInvoiceItem[];
  tax_calculation_mode: TaxCalculationMode;
  tax_rate: number;
  notes?: string;
  billing_info: IInvoiceBillingInfo;
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  sent: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const INVOICE_STATUS_TEXT: Record<InvoiceStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已通过",
  rejected: "已驳回",
  sent: "已发送",
  paid: "已付款",
  cancelled: "已取消",
};

export const INVOICE_TYPE_OPTIONS = [
  { value: "增值税专用发票", label: "增值税专用发票" },
  { value: "增值税普通发票", label: "增值税普通发票" },
  { value: "个人发票", label: "个人发票" },
  { value: "服务费发票", label: "服务费发票" },
];

export const TAX_CALCULATION_MODE_OPTIONS = [
  { value: "含税价", label: "含税价" },
  { value: "不含税价", label: "不含税价" },
];

export const CURRENCY_OPTIONS = [
  { value: "CNY", label: "CNY (人民币)" },
  { value: "USD", label: "USD (美元)" },
  { value: "EUR", label: "EUR (欧元)" },
  { value: "GBP", label: "GBP (英镑)" },
  { value: "RUB", label: "RUB (卢布)" },
];
