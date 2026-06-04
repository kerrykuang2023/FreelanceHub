export interface IUserType {
  _id: string;
  user_type_name: string;
  user_type_display_name: string;
}

export interface IUserRole {
  id: string;
  role_type: 'job_seeker' | 'freelancer' | 'hr_recruiter' | 'company_user' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'frozen';
  is_active: boolean;
  role_specific_data?: {
    skills?: string[];
    experience?: any[];
    expected_salary?: {
      min: number;
      max: number;
      currency: string;
    };
    company_id?: string;
    company_name?: string;
    position?: string;
  };
}

export interface IUserAccount {
  _id: string;
  user_type_id: string | IUserType;
  email: string;
  password: string;
  sms_notification_active: boolean;
  email_notification_active: boolean;
  registration_date: Date;
  createdAt: Date;
  updatedAt: Date;
  user_type_name?: string;
  user_type?: string;
  user_name?: string;
  roles?: IUserRole[];
  activeRole?: IUserRole | null;
  active_role?: IUserRole | null;
  first_name?: string;
  last_name?: string;
  user_image?: string;
  data?: any;
  user?: any;
  [key: string]: any;
}
