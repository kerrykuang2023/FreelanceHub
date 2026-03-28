import HttpService from "@/core/http.service";

export interface Company {
  _id: string;
  company_name: string;
  logo_url?: string;
  cover_url?: string;
  industry?: string;
  company_size?: string;
  profile_description?: string;
  company_website_url?: string;
  company_address?: string;
  contact_phone?: string;
  contact_email?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  stats?: {
    active_jobs: number;
    total_hires: number;
  };
}

class CompanyService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  async getMyCompany(): Promise<{ success: boolean; data?: Company }> {
    try {
      const response = await this.http.get<Company>('/companies/my-company');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to get company:', error);
      return { success: false };
    }
  }

  async getCompanyById(id: string): Promise<{ success: boolean; data?: Company }> {
    try {
      const response = await this.http.get<Company>(`/companies/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to get company:', error);
      return { success: false };
    }
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<{ success: boolean }> {
    try {
      await this.http.put(`/companies/${id}`, data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update company:', error);
      return { success: false };
    }
  }

  async uploadLogo(id: string, file: File): Promise<{ success: boolean; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await this.http.post<{ url: string }>(`/companies/${id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, url: response.data.url };
    } catch (error) {
      console.error('Failed to upload logo:', error);
      return { success: false };
    }
  }

  async uploadCover(id: string, file: File): Promise<{ success: boolean; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await this.http.post<{ url: string }>(`/companies/${id}/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, url: response.data.url };
    } catch (error) {
      console.error('Failed to upload cover:', error);
      return { success: false };
    }
  }

  async searchCompanies(query: string): Promise<{ success: boolean; data?: { items: Company[] } }> {
    try {
      const response = await this.http.get<{ items: Company[] }>('/companies/search', { params: { q: query } });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to search companies:', error);
      return { success: false };
    }
  }
}

export default new CompanyService();
