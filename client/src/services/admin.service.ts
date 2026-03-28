import HttpService from "@/core/http.service";

export interface IDashboardStats {
  totalUsers: number;
  totalFreelancers: number;
  totalCompanies: number;
  totalProjects: number;
  totalWorkLogs: number;
  totalInvoices: number;
  pendingCompanies: number;
  pendingInvoices: number;
}

export interface ICompany {
  _id: string;
  company_name: string;
  profile_description?: string;
  business_stream_id?: any;
  establishment_date?: Date;
  company_website_url?: string;
  created_by?: any;
  verification_status: "pending" | "approved" | "rejected";
  verified_at?: Date;
  verified_by?: string;
  verification_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IWorkLog {
  _id: string;
  freelancer_id: any;
  project_requirement_id?: any;
  company_id: any;
  work_date: Date;
  hours_worked: number;
  work_type: string;
  work_description: string;
  status: "draft" | "submitted" | "confirmed" | "rejected" | "invoiced" | "paid";
  billing_info: {
    daily_rate: number;
    hours_billable: number;
    amount: number;
    currency: string;
  };
}

export interface IInvoice {
  _id: string;
  invoice_number: string;
  freelancer_id: any;
  company_id: any;
  invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票" | "服务费发票";
  billing_period_start: Date;
  billing_period_end: Date;
  subtotal_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "sent" | "paid" | "cancelled";
  issued_date?: Date;
}

export interface IProject {
  _id: string;
  project_title: string;
  project_description: string;
  company_id: any;
  language_requirements: string[];
  job_nature: string;
  work_format: string;
  rate_type: string;
  rate_amount?: number;
  hiring_count: number;
  status: string;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  company_id?: string;
  freelancer_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ISystemConfig {
  _id?: string;
  config_type: string;
  config_key: string;
  config_value: string;
  display_name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface IConfigType {
  key: string;
  value: string;
  label: string;
}

class AdminService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async getDashboardStats() {
    return this.http.get<{ stats: IDashboardStats; recentWorkLogs: any[]; recentInvoices: any[] }>(
      "admin/dashboard/stats"
    );
  }

  public async getCompanies(params: IPaginationParams = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);

    return this.http.get<IPaginatedResponse<ICompany>>(
      `admin/companies?${queryParams.toString()}`
    );
  }

  public async getCompanyById(id: string) {
    return this.http.get<{ company: ICompany; relatedUsers: any[]; relatedFreelancers: any[] }>(
      `admin/companies/${id}`
    );
  }

  public async verifyCompany(id: string, status: "approved" | "rejected", reason?: string) {
    return this.http.put<ICompany>(
      `admin/companies/${id}/verify`,
      { status, reason }
    );
  }

  public async getWorkLogs(params: IPaginationParams = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.status) queryParams.set("status", params.status);
    if (params.company_id) queryParams.set("company_id", params.company_id);
    if (params.freelancer_id) queryParams.set("freelancer_id", params.freelancer_id);
    if (params.start_date) queryParams.set("start_date", params.start_date);
    if (params.end_date) queryParams.set("end_date", params.end_date);

    return this.http.get<IPaginatedResponse<IWorkLog>>(
      `admin/work-logs?${queryParams.toString()}`
    );
  }

  public async getInvoices(params: IPaginationParams = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.status) queryParams.set("status", params.status);
    if (params.company_id) queryParams.set("company_id", params.company_id);
    if (params.freelancer_id) queryParams.set("freelancer_id", params.freelancer_id);
    if (params.start_date) queryParams.set("start_date", params.start_date);
    if (params.end_date) queryParams.set("end_date", params.end_date);

    return this.http.get<IPaginatedResponse<IInvoice>>(
      `admin/invoices?${queryParams.toString()}`
    );
  }

  public async getProjects(params: IPaginationParams = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.status) queryParams.set("status", params.status);
    if (params.company_id) queryParams.set("company_id", params.company_id);

    return this.http.get<IPaginatedResponse<IProject>>(
      `admin/projects?${queryParams.toString()}`
    );
  }

  public async getFreelancers(params: IPaginationParams = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.status) queryParams.set("skill_category", params.status);
    if (params.search) queryParams.set("availability", params.search);

    return this.http.get<any>(
      `admin/freelancers?${queryParams.toString()}`
    );
  }

  public async getSkillCategories() {
    return this.http.get<any>("admin/skills");
  }

  public async createSkillCategory(payload: {
    category_name: string;
    category_code: string;
    display_order?: number;
    description?: string;
  }) {
    return this.http.post<any>("admin/skills", payload);
  }

  public async updateSkillCategory(id: string, payload: {
    category_name?: string;
    category_code?: string;
    display_order?: number;
    description?: string;
  }) {
    return this.http.put<any>(`admin/skills/${id}`, payload);
  }

  public async deleteSkillCategory(id: string) {
    return this.http.delete<any>(`admin/skills/${id}`);
  }

  public async createSubCategory(payload: {
    category_id: string;
    sub_category_name: string;
    sub_category_code?: string;
    display_order?: number;
  }) {
    return this.http.post<any>("admin/skills/sub-categories", payload);
  }

  public async getFinancialSummary(params: { start_date?: string; end_date?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.set("start_date", params.start_date);
    if (params.end_date) queryParams.set("end_date", params.end_date);

    return this.http.get<any>(
      `admin/financial/summary?${queryParams.toString()}`
    );
  }

  public async getConfigTypes() {
    return this.http.get<IConfigType[]>("admin/config/types");
  }

  public async getSystemConfigs(configType?: string) {
    const queryParams = new URLSearchParams();
    if (configType) queryParams.set("config_type", configType);

    return this.http.get<ISystemConfig[]>(
      `admin/configs?${queryParams.toString()}`
    );
  }

  public async createSystemConfig(payload: {
    config_type: string;
    config_key: string;
    config_value: string;
    display_name: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
  }) {
    return this.http.post<ISystemConfig>("admin/configs", payload);
  }

  public async updateSystemConfig(id: string, payload: Partial<ISystemConfig>) {
    return this.http.put<ISystemConfig>(`admin/configs/${id}`, payload);
  }

  public async deleteSystemConfig(id: string) {
    return this.http.delete<any>(`admin/configs/${id}`);
  }

  public async initializeDefaultConfigs() {
    return this.http.post<any>("admin/configs/initialize", {});
  }
}

export default new AdminService();
