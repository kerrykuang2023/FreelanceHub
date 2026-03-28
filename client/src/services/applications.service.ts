import HttpService from "@/core/http.service";
import { IModels } from "@/interfaces";

export default class ApplicationsService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async applyForJob(jobId: string, data?: {
    cover_letter?: string;
    proposed_rate?: number;
    rate_type?: string;
    availability_date?: string;
    estimated_duration?: string;
    relevant_experience?: string;
    skills_match?: string[];
  }) {
    return this.http.post<IModels.IApplicationResponse, void>(`job-applications/jobs/${jobId}/apply`, data || {});
  }

  public async getJobApplications(jobId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return this.http.get<IModels.IApplicationsResponse>(`job-applications/jobs/${jobId}/applications?${queryParams.toString()}`);
  }

  public async getUserApplications(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    return this.http.get<IModels.IApplicationsResponse>(`job-applications/my-applications?${queryParams.toString()}`);
  }

  public async getCompanyApplications(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    return this.http.get<IModels.IApplicationsResponse>(`job-applications/received?${queryParams.toString()}`);
  }

  public async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    return this.http.put<IModels.IApplicationResponse, { status: string; notes?: string }>(
      `job-applications/${applicationId}/status`,
      { status, notes }
    );
  }

  public async withdrawApplication(applicationId: string) {
    return this.http.post(`job-applications/${applicationId}/withdraw`, {});
  }

  public async getApplicationById(applicationId: string) {
    return this.http.get(`job-applications/${applicationId}`);
  }
}
