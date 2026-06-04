import HttpService from "@/core/http.service";

export interface OnboardingStatus {
  has_company: boolean;
  has_profile: boolean;
  is_approved: boolean;
  current_step: 'company' | 'profile' | 'review' | 'completed';
  company_id?: string;
  company_name?: string;
}

export interface Company {
  _id: string;
  company_name: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
}

export interface CreateCompanyData {
  company_name: string;
  industry: string;
  company_size: string;
  description: string;
  website?: string;
  address?: string;
  contact_phone?: string;
}

export interface JoinCompanyData {
  company_id: string;
  position: string;
  department?: string;
  message?: string;
}

export interface HRProfileData {
  position: string;
  department?: string;
  recruitment_fields: string[];
  years_of_experience?: string;
  summary?: string;
}

class HROnboardingService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  async getOnboardingStatus(): Promise<{ success: boolean; data?: OnboardingStatus }> {
    try {
      const response = await this.http.get<any>('/hr/onboarding/status');
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return { success: false };
    }
  }

  async searchCompanies(query: string): Promise<{ success: boolean; data?: { items: Company[] } }> {
    try {
      const response = await this.http.get<any>('/companies/search', { q: query });
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Failed to search companies:', error);
      return { success: false };
    }
  }

  async joinCompany(data: JoinCompanyData): Promise<{ success: boolean }> {
    try {
      await this.http.post('/hr/onboarding/company/join', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to join company:', error);
      return { success: false };
    }
  }

  async createCompany(data: CreateCompanyData): Promise<{ success: boolean; data?: Company }> {
    try {
      const response = await this.http.post<any>('/companies', data);
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Failed to create company:', error);
      return { success: false };
    }
  }

  async saveProfile(data: HRProfileData): Promise<{ success: boolean }> {
    try {
      await this.http.put('/hr/profile', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to save profile:', error);
      return { success: false };
    }
  }

  async submitForReview(): Promise<{ success: boolean }> {
    try {
      await this.http.post('/hr/onboarding/submit');
      return { success: true };
    } catch (error) {
      console.error('Failed to submit for review:', error);
      return { success: false };
    }
  }

  async getHRProfile(): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await this.http.get<any>('/hr/profile');
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Failed to get HR profile:', error);
      return { success: false };
    }
  }

  async updateHRProfile(data: Partial<HRProfileData>): Promise<{ success: boolean }> {
    try {
      await this.http.put('/hr/profile', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update HR profile:', error);
      return { success: false };
    }
  }

  async uploadCompanyLogo(companyId: string, file: File): Promise<{ success: boolean; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await this.http.post<any>(`/companies/${companyId}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, url: response.data?.url || response.url };
    } catch (error) {
      console.error('Failed to upload company logo:', error);
      return { success: false };
    }
  }

  async uploadCompanyCover(companyId: string, file: File): Promise<{ success: boolean; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await this.http.post<any>(`/companies/${companyId}/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, url: response.data?.url || response.url };
    } catch (error) {
      console.error('Failed to upload company cover:', error);
      return { success: false };
    }
  }
}

export default new HROnboardingService();
