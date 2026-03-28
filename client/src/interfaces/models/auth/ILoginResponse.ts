export interface ILoginResponse {
  success?: boolean;
  data?: {
    user: any;
    token: string;
    roles?: any[];
    active_role?: any;
  };
  user?: any;
  token?: string;
  roles?: any[];
  active_role?: any;
}
