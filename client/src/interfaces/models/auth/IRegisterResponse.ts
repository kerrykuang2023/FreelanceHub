export interface IRegisterResponse {
  user?: any;
  token?: string;
  roles?: any[];
  active_role?: any;
  message: string;
  data?: {
    user?: any;
    token?: string;
    roles?: any[];
    active_role?: any;
  };
}
