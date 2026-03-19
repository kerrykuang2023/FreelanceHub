import HttpService from "@/core/http.service";
import { IModels } from "@/interfaces";

export default class JobsService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async getJobTypes() {
    return this.http.service().get<{ job_types: { _id: string; job_type: string }[] }>("jobs/types");
  }

  public async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    job_type?: string;
    location?: string;
    is_active?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.job_type) queryParams.append("job_type", params.job_type);
    if (params?.location) queryParams.append("location", params.location);
    if (params?.is_active !== undefined)
      queryParams.append("is_active", params.is_active.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `jobs?${queryString}` : "jobs";
    
    return this.http
      .service()
      .get<IModels.IJobsResponse>(url);
  }

  public async getJob(id: string) {
    return this.http.service().get<IModels.IJobResponse>(`jobs/${id}`);
  }

  public async createJob(payload: IModels.ICreateJobPayload) {
    return this.http
      .service()
      .post<IModels.IJobResponse, IModels.ICreateJobPayload>("jobs", payload);
  }

  public async updateJob(id: string, payload: IModels.IUpdateJobPayload) {
    return this.http
      .service()
      .put<IModels.IJobResponse, IModels.IUpdateJobPayload>(`jobs/${id}`, payload);
  }

  public async deleteJob(id: string) {
    return this.http.service().delete<IModels.IDeleteJobResponse>(`jobs/${id}`);
  }
}
