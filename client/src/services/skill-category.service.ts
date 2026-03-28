import HttpService from "@/core/http.service";

class SkillCategoryService {
  private http: HttpService;
  private baseUrl = "/skills";

  constructor() {
    this.http = new HttpService();
  }

  async getAllSkillCategories() {
    // Use /tree endpoint to get categories with sub-categories
    return this.http.get(`${this.baseUrl}/categories/tree`);
  }

  async getSkillCategoryById(id: string) {
    return this.http.get(`${this.baseUrl}/categories/${id}`);
  }

  async createSkillCategory(data: any) {
    return this.http.post(`${this.baseUrl}/categories`, data);
  }

  async updateSkillCategory(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/categories/${id}`, data);
  }

  async deleteSkillCategory(id: string) {
    return this.http.delete(`${this.baseUrl}/categories/${id}`);
  }

  async getSubCategories(categoryId: string) {
    return this.http.get(`${this.baseUrl}/categories/${categoryId}/sub-categories`);
  }
}

export default new SkillCategoryService();
