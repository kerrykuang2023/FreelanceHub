export interface IJobLocation {
  _id: string;
  street_address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
}

export interface IJobType {
  _id: string;
  job_type: string;
}

export interface ICompany {
  _id: string;
  company_name: string;
  profile_description?: string;
  company_website_url?: string;
}

export interface IJob {
  _id: string;
  posted_by: {
    _id: string;
    email: string;
  };
  job_type_id: IJobType;
  company_id: ICompany;
  is_company_name_hidden: boolean;
  created_date: Date;
  job_description: string;
  job_location_id: IJobLocation;
  is_active: boolean;
}

export interface IJobsResponse {
  jobs: IJob[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface IJobResponse {
  job: IJob;
  message?: string;
}

export interface ICreateJobPayload {
  job_type_id: string;
  company_id?: string;
  is_company_name_hidden?: boolean;
  job_description: string;
  job_location: {
    street_address?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
  };
}

export interface IUpdateJobPayload {
  job_type_id?: string;
  is_company_name_hidden?: boolean;
  job_description?: string;
  is_active?: boolean;
  job_location?: {
    street_address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
  };
}

export interface IDeleteJobResponse {
  message: string;
}
