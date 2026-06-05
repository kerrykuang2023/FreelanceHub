import { RoleType } from "@/hooks/usePermissions";

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  icon?: any;
  permission?: string;
  children?: MenuItem[];
  roles?: RoleType[];
}

export interface MenuConfig {
  [role: string]: MenuItem[];
}

const freelancerMenu: MenuItem[] = [
  {
    key: "dashboard",
    label: "工作台",
    path: "/",
    permission: "view_dashboard",
    roles: ["job_seeker", "freelancer"],
  },
  {
    key: "projects",
    label: "项目",
    roles: ["job_seeker", "freelancer"],
    children: [
      {
        key: "browse-projects",
        label: "浏览项目",
        path: "/jobs",
        permission: "browse_projects",
      },
      {
        key: "my-projects",
        label: "进行中项目",
        path: "/my-projects",
        permission: "view_my_projects",
      },
      {
        key: "my-applications",
        label: "我的申请",
        path: "/applications",
        permission: "view_applications",
      },
      {
        key: "saved-jobs",
        label: "收藏职位",
        path: "/saved-jobs",
        permission: "view_saved_jobs",
      },
    ],
  },
  {
    key: "delivery",
    label: "交付",
    roles: ["job_seeker", "freelancer"],
    children: [
      {
        key: "work-logs",
        label: "工时管理",
        path: "/work-logs",
        permission: "manage_work_logs",
      },
      {
        key: "invoices",
        label: "发票管理",
        path: "/invoices",
        permission: "manage_invoices",
      },
    ],
  },
  {
    key: "messages",
    label: "消息",
    path: "/messages",
    permission: "view_messages",
    roles: ["job_seeker", "freelancer"],
  },
];

const hrMenu: MenuItem[] = [
  {
    key: "dashboard",
    label: "工作台",
    path: "/",
    permission: "view_dashboard",
    roles: ["hr_recruiter"],
  },
  {
    key: "company",
    label: "公司",
    path: "/company",
    permission: "manage_company",
    roles: ["hr_recruiter"],
  },
  {
    key: "recruiting",
    label: "招聘",
    roles: ["hr_recruiter"],
    children: [
      {
        key: "post-job",
        label: "发布职位",
        path: "/post-job",
        permission: "post_job",
      },
      {
        key: "my-jobs",
        label: "职位管理",
        path: "/my-jobs",
        permission: "view_my_jobs",
      },
      {
        key: "applications",
        label: "申请管理",
        path: "/company/applications",
        permission: "manage_applications",
      },
    ],
  },
  {
    key: "delivery",
    label: "交付",
    roles: ["hr_recruiter"],
    children: [
      {
        key: "work-logs",
        label: "工时管理",
        path: "/work-logs",
        permission: "manage_work_logs",
      },
      {
        key: "invoices",
        label: "发票管理",
        path: "/invoices",
        permission: "manage_invoices",
      },
    ],
  },
  {
    key: "messages",
    label: "消息",
    path: "/messages",
    permission: "view_messages",
    roles: ["hr_recruiter"],
  },
];

const adminMenu: MenuItem[] = [
  {
    key: "dashboard",
    label: "工作台",
    path: "/",
    permission: "view_dashboard",
    roles: ["admin"],
  },
  {
    key: "operations",
    label: "运营",
    permission: "admin_access",
    roles: ["admin"],
    children: [
      {
        key: "admin-dashboard",
        label: "管理后台",
        path: "/admin/dashboard",
        permission: "admin_access",
      },
      {
        key: "admin-users",
        label: "用户管理",
        path: "/admin/users",
        permission: "manage_users",
      },
      {
        key: "admin-freelancers",
        label: "顾问管理",
        path: "/admin/freelancers",
        permission: "manage_users",
      },
      {
        key: "admin-companies",
        label: "企业审核",
        path: "/admin/companies",
        permission: "review_companies",
      },
      {
        key: "admin-projects",
        label: "项目管理",
        path: "/admin/projects",
        permission: "manage_projects",
      },
    ],
  },
  {
    key: "reviews",
    label: "审核",
    permission: "admin_access",
    roles: ["admin"],
    children: [
      {
        key: "admin-role-approvals",
        label: "角色审批",
        path: "/admin/role-approvals",
        permission: "approve_roles",
      },
      {
        key: "admin-worklogs",
        label: "工时审核",
        path: "/admin/worklogs",
        permission: "manage_worklogs",
      },
      {
        key: "admin-invoices",
        label: "发票审核",
        path: "/admin/invoices",
        permission: "manage_invoices",
      },
      {
        key: "admin-reports",
        label: "举报管理",
        path: "/admin/reports",
        permission: "manage_reports",
      },
    ],
  },
  {
    key: "configuration",
    label: "配置",
    permission: "system_config",
    roles: ["admin"],
    children: [
      {
        key: "admin-configuration",
        label: "配置总览",
        path: "/admin/configuration",
        permission: "system_config",
      },
      {
        key: "config-skill-categories",
        label: "技能分类",
        path: "/admin/config/skill-categories",
        permission: "system_config",
      },
      {
        key: "config-work-types",
        label: "工时类型",
        path: "/admin/config/work-types",
        permission: "system_config",
      },
      {
        key: "config-tax-rates",
        label: "税率配置",
        path: "/admin/config/tax-rates",
        permission: "system_config",
      },
      {
        key: "config-currencies",
        label: "货币配置",
        path: "/admin/config/currencies",
        permission: "system_config",
      },
      {
        key: "config-languages",
        label: "语言要求",
        path: "/admin/config/languages",
        permission: "system_config",
      },
      {
        key: "config-job-natures",
        label: "工作性质",
        path: "/admin/config/job-natures",
        permission: "system_config",
      },
      {
        key: "config-work-formats",
        label: "工作形式",
        path: "/admin/config/work-formats",
        permission: "system_config",
      },
      {
        key: "config-rate-types",
        label: "计费类型",
        path: "/admin/config/rate-types",
        permission: "system_config",
      },
      {
        key: "config-invoice-types",
        label: "发票类型",
        path: "/admin/config/invoice-types",
        permission: "system_config",
      },
      {
        key: "config-payment-methods",
        label: "付款方式",
        path: "/admin/config/payment-methods",
        permission: "system_config",
      },
    ],
  },
  {
    key: "messages",
    label: "消息",
    path: "/messages",
    permission: "view_messages",
    roles: ["admin"],
  },
];

export const MENU_CONFIG: MenuConfig = {
  freelancer: freelancerMenu,
  job_seeker: freelancerMenu,
  hr_recruiter: hrMenu,
  admin: adminMenu,
};

export const CTA_CONFIG: Record<string, { label: string; path: string }> = {
  freelancer: {
    label: "找项目",
    path: "/jobs",
  },
  hr_recruiter: {
    label: "发布职位",
    path: "/post-job",
  },
  admin: {
    label: "系统管理",
    path: "/admin/dashboard",
  },
  job_seeker: {
    label: "找项目",
    path: "/jobs",
  },
  company_user: {
    label: "发布职位",
    path: "/post-job",
  },
};

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: "管理员",
  hr_recruiter: "HR 招聘官",
  freelancer: "自由顾问",
  job_seeker: "求职者",
  company_user: "企业用户",
};

export const ROLE_COLORS: Record<RoleType, string> = {
  admin: "bg-purple-100 text-purple-800",
  hr_recruiter: "bg-green-100 text-green-800",
  freelancer: "bg-blue-100 text-blue-800",
  job_seeker: "bg-blue-100 text-blue-800",
  company_user: "bg-orange-100 text-orange-800",
};
