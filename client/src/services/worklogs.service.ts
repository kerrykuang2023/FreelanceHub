import HttpService from "@/core/http.service";

class WorkLogService {
  private http: HttpService;
  private baseUrl = "/work-logs";

  constructor() {
    this.http = new HttpService();
  }

  async getWorkLogs(params?: any) {
    return this.http.get(this.baseUrl, { params });
  }

  async getWorkLogById(id: string) {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  async createWorkLog(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  async updateWorkLog(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  async deleteWorkLog(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  async submitWorkLog(id: string) {
    return this.http.post(`${this.baseUrl}/${id}/submit`, {});
  }

  async batchSubmitWorkLogs(workLogIds: string[]) {
    return this.http.post(`${this.baseUrl}/batch/submit`, {
      work_log_ids: workLogIds,
    });
  }

  async confirmWorkLog(id: string, billingInfo?: any) {
    return this.http.post(`${this.baseUrl}/${id}/confirm`, {
      billing_info: billingInfo,
    });
  }

  async batchConfirmWorkLogs(workLogIds: string[], billingInfo?: any) {
    return this.http.post(`${this.baseUrl}/batch/confirm`, {
      work_log_ids: workLogIds,
      billing_info: billingInfo,
    });
  }

  async rejectWorkLog(id: string, rejectionReason: string) {
    return this.http.post(`${this.baseUrl}/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
  }

  async getWorkLogSummary(params?: any) {
    return this.http.get(`${this.baseUrl}/summary`, { params });
  }

  async getPendingWorkLogsForCompany(params?: any) {
    return this.http.get(`${this.baseUrl}/company/pending`, {
      params,
    });
  }

  async getAvailableProjects() {
    return this.http.get(`${this.baseUrl}/available-projects`);
  }
}

export default new WorkLogService();
