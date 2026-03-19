import HttpService from "@/core/http.service";
import { IModels } from "@/interfaces";

export default class ApplicationsService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async applyForJob(jobId: string) {
    return this.http
      .service()
      .post<IModels.IApplicationResponse, void>(`job/${jobId}/apply`, {});
  }

  public async getJobApplications(jobId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return this.http
      .service()
      .get<IModels.IApplicationsResponse>(`job/${jobId}/applications?${queryParams.toString()}`);
  }

  public async getUserApplications(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return this.http
      .service()
      .get<IModels.IApplicationsResponse>(`job/applications?${queryParams.toString()}`);
  }

  public async updateApplicationStatus(applicationId: string, status: string) {
    return this.http
      .service()
      .put<IModels.IApplicationResponse, { status: string }>(`job/applications/${applicationId}`, { status });
  }
}
