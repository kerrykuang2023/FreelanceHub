import HttpService from "@/core/http.service";

const httpService = new HttpService();

class JobsService {
  private baseUrl = "/jobs";

  async getJobs(params?: any) {
    return httpService.get(this.baseUrl, params);
  }

  async getJobById(id: string) {
    return httpService.get(`${this.baseUrl}/${id}`);
  }

  async createJob(data: any) {
    return httpService.post(this.baseUrl, data);
  }

  async updateJob(id: string, data: any) {
    return httpService.put(`${this.baseUrl}/${id}`, data);
  }

  async deleteJob(id: string) {
    return httpService.delete(`${this.baseUrl}/${id}`);
  }

  async getMyPostedJobs(params?: any) {
    return httpService.get(`${this.baseUrl}/my-posted-jobs`, params);
  }

  async getMyProjects(params?: any) {
    return httpService.get(`${this.baseUrl}/my-projects`, params);
  }

  async getMyApplications(params?: any) {
    return httpService.get(`/job-applications/my-applications`, params);
  }

  async getApplicationsForMyJobs(params?: any) {
    return httpService.get(`/job-applications/received`, params);
  }

  async applyForJob(jobId: string, data: any) {
    return httpService.post(`${this.baseUrl}/${jobId}/apply`, data);
  }

  async saveJob(jobId: string) {
    return httpService.post(`${this.baseUrl}/${jobId}/save`, {});
  }

  async getJobTypes() {
    return httpService.get(`${this.baseUrl}/types`);
  }
}

export default new JobsService();
