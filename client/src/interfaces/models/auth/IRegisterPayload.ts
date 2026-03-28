export interface IRegisterPayload {
  user_type_name: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
