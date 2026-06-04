import HttpService from "@/core/http.service";
import { IModels } from "@/interfaces";

export default class AuthService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async login(payload: IModels.ILoginPayload, options?: any) {
    return this.http.post<IModels.ILoginResponse, IModels.ILoginPayload>(
      "auth/login",
      payload
    );
  }

  public async register(payload: IModels.IRegisterPayload, options?: any) {
    return this.http.post<IModels.IRegisterResponse, IModels.IRegisterPayload>(
      "auth/signup",
      payload
    );
  }

  public async getCurrentUser() {
    return this.http.get<IModels.IUserAccount>("auth/me", {});
  }

  public async logout() {
  }

  public async switchRole(roleType: string) {
    return this.http.post("auth/roles/switch", { role_type: roleType });
  }

  public async getMyRoles() {
    return this.http.get("auth/roles", {});
  }

  public async applyForRole(data: { role_type: string; submitted_data?: any; role_specific_data?: any }) {
    return this.http.post("auth/roles/apply", {
      role_type: data.role_type,
      submitted_data: data.submitted_data || data.role_specific_data || {},
    });
  }

  public async getMyRoleApprovals() {
    return this.http.get("auth/my-role-approvals", {});
  }
}
