import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { HttpMethod } from "@/enums";
import StorageService from "./storage.service";

const TOKEN_KEY = "access_token";

class HttpService {
  private http: AxiosInstance;
  private baseURL: string = import.meta.env.VITE_API_URL as string;

  constructor() {
    this.http = axios.create({
      baseURL: this.baseURL,
      withCredentials: false,
      timeout: 30000,
      headers: this.setupHeaders(),
    });
    
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.http.interceptors.request.use(
      (config) => {
        const token = StorageService.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          StorageService.removeItem(TOKEN_KEY);
          StorageService.removeItem("user_data");
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthorization() {
    const accessToken = StorageService.getItem(TOKEN_KEY) || "";
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  private setupHeaders(hasAttachment = false) {
    return {
      "Content-Type": hasAttachment ? "multipart/form-data" : "application/json",
      ...this.getAuthorization(),
    };
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    options: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.http.request<T>({
        method,
        url,
        ...options,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.request<T>(HttpMethod.GET, url, {
      params,
      headers: this.setupHeaders(),
    });
    return response.data;
  }

  public async post<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>(HttpMethod.POST, url, {
      data: payload,
      headers: config?.headers || this.setupHeaders(),
      ...config,
    });
    return response.data;
  }

  public async put<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>(HttpMethod.PUT, url, {
      data: payload,
      headers: config?.headers || this.setupHeaders(),
      ...config,
    });
    return response.data;
  }

  public async patch<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>("PATCH" as HttpMethod, url, {
      data: payload,
      headers: config?.headers || this.setupHeaders(),
      ...config,
    });
    return response.data;
  }

  public async delete<T = any>(url: string): Promise<T> {
    const response = await this.request<T>(HttpMethod.DELETE, url, {
      headers: this.setupHeaders(),
    });
    return response.data;
  }

  private static defaultClient = new HttpService();

  public static get<T = any>(url: string, params?: any): Promise<T> {
    return HttpService.defaultClient.get<T>(url, params);
  }

  public static post<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    return HttpService.defaultClient.post<T, P>(url, payload, config);
  }

  public static put<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    return HttpService.defaultClient.put<T, P>(url, payload, config);
  }

  public static patch<T = any, P = any>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
    return HttpService.defaultClient.patch<T, P>(url, payload, config);
  }

  public static delete<T = any>(url: string): Promise<T> {
    return HttpService.defaultClient.delete<T>(url);
  }
}

export default HttpService;
