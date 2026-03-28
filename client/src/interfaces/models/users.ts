import { IJob } from "./jobs";

export interface IApplication {
  _id: string;
  user_account_id: {
    _id: string;
    email: string;
  };
  job_post_id: IJob;
  apply_date: Date;
  status: "pending" | "reviewed" | "accepted" | "rejected";
}

export interface IApplicationsResponse {
  applications: IApplication[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface IApplicationResponse {
  message?: string;
  application: IApplication;
}

export interface IUserPersonalResponse {
  user: {
    _id: string;
    email: string;
    user_type_id: {
      _id: string;
      user_type_name: string;
      user_type_display_name: string;
    };
    contact_number?: string;
    sms_notification?: boolean;
    email_notification?: boolean;
    user_image?: string;
  };
  profile: {
    _id: string;
    first_name?: string;
    last_name?: string;
    current_salary?: number;
    is_annually_monthly?: boolean;
    currency?: string;
  } | null;
}

export interface IUpdateUserPayload {
  contact_number?: string;
  sms_notification?: boolean;
  email_notification?: boolean;
  user_image?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    current_salary?: number;
    is_annually_monthly?: boolean;
    currency?: string;
  };
}
