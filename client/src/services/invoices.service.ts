import HttpService from "@/core/http.service";

class InvoiceService {
  private http: HttpService;
  private baseUrl = "/invoices";

  constructor() {
    this.http = new HttpService();
  }

  async getInvoices(params?: any) {
    return this.http.get(this.baseUrl, { params });
  }

  async getInvoiceById(id: string) {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  async createInvoice(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  async updateInvoice(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  async deleteInvoice(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  async submitInvoice(id: string) {
    return this.http.post(`${this.baseUrl}/${id}/submit`, {});
  }

  async approveInvoice(id: string) {
    return this.http.post(`${this.baseUrl}/${id}/approve`, {});
  }

  async rejectInvoice(id: string, reason: string) {
    return this.http.post(`${this.baseUrl}/${id}/reject`, {
      reason,
    });
  }

  async markAsPaid(id: string, paymentInfo: any) {
    return this.http.post(`${this.baseUrl}/${id}/mark-paid`, {
      payment_info: paymentInfo,
    });
  }

  async cancelInvoice(id: string, reason?: string) {
    return this.http.post(`${this.baseUrl}/${id}/cancel`, {
      cancellation_reason: reason,
    });
  }

  async getMyInvoices(params?: any) {
    return this.http.get(this.baseUrl, { params });
  }

  async getCompanyInvoices(params?: any) {
    return this.http.get(`${this.baseUrl}/company`, { params });
  }

  async calculateTax(data: { subtotal: number; tax_rate: number; tax_mode: string }) {
    return this.http.post(`${this.baseUrl}/calculate-tax`, data);
  }

  async getAvailableWorkLogs() {
    return this.http.get(`${this.baseUrl}/available-work-logs`);
  }
}

export default new InvoiceService();
