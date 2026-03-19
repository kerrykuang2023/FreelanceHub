import HttpService from "@/core/http.service";
import { IModels } from "@/interfaces";

export default class UsersService {
  private http: HttpService;

  constructor() {
    this.http = new HttpService();
  }

  public async getUserPersonal() {
    return this.http.service().get<IModels.IUserPersonalResponse>("users/user");
  }

  public async getUser(id: string) {
    return this.http.service().get<IModels.IUserPersonalResponse>(`users/${id}`);
  }

  public async updateUser(id: string, payload: IModels.IUpdateUserPayload) {
    return this.http
      .service()
      .put<IModels.IUserPersonalResponse, IModels.IUpdateUserPayload>(`users/${id}`, payload);
  }
}
