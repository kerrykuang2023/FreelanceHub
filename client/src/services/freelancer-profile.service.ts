import HttpService from "@/core/http.service";

const httpService = new HttpService();

interface Skill {
  _id?: string;
  skill_name: string;
  skill_level: '初级' | '中级' | '高级' | '专家';
  years_of_experience: number;
  skill_category_id?: string;
  skill_sub_category_id?: string;
}

interface ProjectExperience {
  _id?: string;
  project_name: string;
  company_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  description: string;
  technologies: string[];
}

interface Certification {
  _id?: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface Education {
  _id?: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
}

interface FreelancerProfile {
  _id?: string;
  user_id?: {
    _id: string;
    user_name: string;
    email: string;
    user_image?: string;
  };
  display_name?: string;
  headline?: string;
  summary?: string;
  skills?: Skill[];
  project_experiences?: ProjectExperience[];
  certifications?: Certification[];
  education?: Education[];
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  preferred_currency?: string;
  availability_status?: string;
  available_hours_per_week?: number;
  years_of_experience?: number;
  languages?: { language: string; proficiency: string }[];
  portfolio_urls?: string[];
  rating?: {
    average: number;
    count: number;
  };
  profile_completion?: number;
  is_verified?: boolean;
}

interface ProfileResponse {
  success: boolean;
  profile?: FreelancerProfile;
  message?: string;
}

class FreelancerProfileService {
  private baseUrl = "/freelancer-profile";

  async getMyProfile(): Promise<ProfileResponse> {
    return httpService.get<ProfileResponse>(`${this.baseUrl}/me`);
  }

  async getProfileById(id: string): Promise<ProfileResponse> {
    return httpService.get<ProfileResponse>(`${this.baseUrl}/${id}`);
  }

  async createProfile(data: Partial<FreelancerProfile>): Promise<ProfileResponse> {
    return httpService.post<ProfileResponse>(this.baseUrl, data);
  }

  async updateProfile(data: Partial<FreelancerProfile>): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me`, data);
  }

  async updateBasicInfo(data: { headline?: string; summary?: string; display_name?: string; location?: string }): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me`, data);
  }

  async addSkill(skill: Skill): Promise<ProfileResponse> {
    return httpService.post<ProfileResponse>(`${this.baseUrl}/me/skills`, skill);
  }

  async updateSkill(skillId: string, skill: Skill): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/skills/${skillId}`, skill);
  }

  async deleteSkill(skillId: string): Promise<ProfileResponse> {
    return httpService.delete<ProfileResponse>(`${this.baseUrl}/me/skills/${skillId}`);
  }

  async addProjectExperience(experience: ProjectExperience): Promise<ProfileResponse> {
    return httpService.post<ProfileResponse>(`${this.baseUrl}/me/project-experiences`, experience);
  }

  async updateProjectExperience(id: string, experience: ProjectExperience): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/project-experiences/${id}`, experience);
  }

  async deleteProjectExperience(id: string): Promise<ProfileResponse> {
    return httpService.delete<ProfileResponse>(`${this.baseUrl}/me/project-experiences/${id}`);
  }

  async addCertification(certification: Certification): Promise<ProfileResponse> {
    return httpService.post<ProfileResponse>(`${this.baseUrl}/me/certifications`, certification);
  }

  async updateCertification(id: string, certification: Certification): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/certifications/${id}`, certification);
  }

  async deleteCertification(id: string): Promise<ProfileResponse> {
    return httpService.delete<ProfileResponse>(`${this.baseUrl}/me/certifications/${id}`);
  }

  async addEducation(education: Education): Promise<ProfileResponse> {
    return httpService.post<ProfileResponse>(`${this.baseUrl}/me/education`, education);
  }

  async updateEducation(id: string, education: Education): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/education/${id}`, education);
  }

  async deleteEducation(id: string): Promise<ProfileResponse> {
    return httpService.delete<ProfileResponse>(`${this.baseUrl}/me/education/${id}`);
  }

  async updateRates(data: {
    hourly_rate?: number;
    daily_rate?: number;
    monthly_rate?: number;
    preferred_currency?: string;
  }): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/rates`, data);
  }

  async updateAvailability(data: {
    availability_status?: string;
    available_hours_per_week?: number;
  }): Promise<ProfileResponse> {
    return httpService.put<ProfileResponse>(`${this.baseUrl}/me/availability`, data);
  }
}

export default new FreelancerProfileService();
export type { FreelancerProfile, Skill, ProjectExperience, Certification, Education };
