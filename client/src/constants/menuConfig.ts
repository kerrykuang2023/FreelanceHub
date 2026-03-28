import { RoleType } from '@/hooks/usePermissions';

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

export const MENU_CONFIG: MenuConfig = {
  freelancer: [
    {
      key: 'dashboard',
      label: '工作台',
      path: '/',
      permission: 'view_dashboard',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'my-projects',
      label: '我的项目',
      path: '/my-projects',
      permission: 'view_my_projects',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'browse-projects',
      label: '浏览项目',
      path: '/jobs',
      permission: 'browse_projects',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'my-applications',
      label: '我的申请',
      path: '/applications',
      permission: 'view_applications',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'saved-jobs',
      label: '收藏职位',
      path: '/saved-jobs',
      permission: 'view_saved_jobs',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'work-logs',
      label: '工时管理',
      path: '/work-logs',
      permission: 'manage_work_logs',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'invoices',
      label: '发票管理',
      path: '/invoices',
      permission: 'manage_invoices',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'messages',
      label: '消息',
      path: '/messages',
      permission: 'view_messages',
      roles: ['job_seeker', 'freelancer'],
    },
  ],
  job_seeker: [
    {
      key: 'dashboard',
      label: '工作台',
      path: '/',
      permission: 'view_dashboard',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'my-projects',
      label: '我的项目',
      path: '/my-projects',
      permission: 'view_my_projects',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'browse-projects',
      label: '浏览项目',
      path: '/jobs',
      permission: 'browse_projects',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'my-applications',
      label: '我的申请',
      path: '/applications',
      permission: 'view_applications',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'saved-jobs',
      label: '收藏职位',
      path: '/saved-jobs',
      permission: 'view_saved_jobs',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'work-logs',
      label: '工时管理',
      path: '/work-logs',
      permission: 'manage_work_logs',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'invoices',
      label: '发票管理',
      path: '/invoices',
      permission: 'manage_invoices',
      roles: ['job_seeker', 'freelancer'],
    },
    {
      key: 'messages',
      label: '消息',
      path: '/messages',
      permission: 'view_messages',
      roles: ['job_seeker', 'freelancer'],
    },
  ],
  hr_recruiter: [
    {
      key: 'dashboard',
      label: '工作台',
      path: '/',
      permission: 'view_dashboard',
      roles: ['hr_recruiter'],
    },
    {
      key: 'company',
      label: '公司管理',
      path: '/company',
      permission: 'manage_company',
      roles: ['hr_recruiter'],
    },
    {
      key: 'post-job',
      label: '发布职位',
      path: '/post-job',
      permission: 'post_job',
      roles: ['hr_recruiter'],
    },
    {
      key: 'my-jobs',
      label: '我的职位',
      path: '/my-jobs',
      permission: 'view_my_jobs',
      roles: ['hr_recruiter'],
    },
    {
      key: 'applications',
      label: '申请管理',
      path: '/company/applications',
      permission: 'manage_applications',
      roles: ['hr_recruiter'],
    },
    {
      key: 'work-logs',
      label: '工时管理',
      path: '/work-logs',
      permission: 'manage_work_logs',
      roles: ['hr_recruiter'],
    },
    {
      key: 'invoices',
      label: '发票管理',
      path: '/invoices',
      permission: 'manage_invoices',
      roles: ['hr_recruiter'],
    },
    {
      key: 'messages',
      label: '消息',
      path: '/messages',
      permission: 'view_messages',
      roles: ['hr_recruiter'],
    },
  ],
  admin: [
    {
      key: 'dashboard',
      label: '工作台',
      path: '/',
      permission: 'view_dashboard',
      roles: ['admin'],
    },
    {
      key: 'my-projects',
      label: '我的项目',
      path: '/my-projects',
      permission: 'view_my_projects',
      roles: ['admin'],
    },
    {
      key: 'work-logs',
      label: '工时管理',
      path: '/work-logs',
      permission: 'manage_work_logs',
      roles: ['admin'],
    },
    {
      key: 'invoices',
      label: '发票管理',
      path: '/invoices',
      permission: 'manage_invoices',
      roles: ['admin'],
    },
    {
      key: 'messages',
      label: '消息',
      path: '/messages',
      permission: 'view_messages',
      roles: ['admin'],
    },
    {
      key: 'system-management',
      label: '系统管理',
      permission: 'admin_access',
      roles: ['admin'],
      children: [
        {
          key: 'admin-dashboard',
          label: 'Dashboard',
          path: '/admin/dashboard',
          permission: 'admin_access',
        },
        {
          key: 'admin-users',
          label: '用户管理',
          path: '/admin/users',
          permission: 'manage_users',
        },
        {
          key: 'admin-role-approvals',
          label: '角色审批',
          path: '/admin/role-approvals',
          permission: 'approve_roles',
        },
        {
          key: 'admin-companies',
          label: '企业审核',
          path: '/admin/companies',
          permission: 'review_companies',
        },
        {
          key: 'admin-worklogs',
          label: '工时管理',
          path: '/admin/worklogs',
          permission: 'manage_worklogs',
        },
        {
          key: 'admin-invoices',
          label: '发票管理',
          path: '/admin/invoices',
          permission: 'manage_invoices',
        },
        {
          key: 'admin-projects',
          label: '项目管理',
          path: '/admin/projects',
          permission: 'manage_projects',
        },
        {
          key: 'admin-reports',
          label: '举报管理',
          path: '/admin/reports',
          permission: 'manage_reports',
        },
        {
          key: 'admin-configuration',
          label: '系统配置',
          path: '/admin/configuration',
          permission: 'system_config',
        },
        {
          key: 'config-management',
          label: '配置项管理',
          permission: 'system_config',
          children: [
            {
              key: 'config-skill-categories',
              label: '技能分类',
              path: '/admin/config/skill-categories',
              permission: 'system_config',
            },
            {
              key: 'config-work-types',
              label: '工时类型',
              path: '/admin/config/work-types',
              permission: 'system_config',
            },
            {
              key: 'config-tax-rates',
              label: '税率配置',
              path: '/admin/config/tax-rates',
              permission: 'system_config',
            },
            {
              key: 'config-currencies',
              label: '货币配置',
              path: '/admin/config/currencies',
              permission: 'system_config',
            },
            {
              key: 'config-languages',
              label: '语言要求',
              path: '/admin/config/languages',
              permission: 'system_config',
            },
            {
              key: 'config-job-natures',
              label: '工作性质',
              path: '/admin/config/job-natures',
              permission: 'system_config',
            },
            {
              key: 'config-work-formats',
              label: '工作形式',
              path: '/admin/config/work-formats',
              permission: 'system_config',
            },
            {
              key: 'config-rate-types',
              label: 'Rate类型',
              path: '/admin/config/rate-types',
              permission: 'system_config',
            },
            {
              key: 'config-invoice-types',
              label: '发票类型',
              path: '/admin/config/invoice-types',
              permission: 'system_config',
            },
            {
              key: 'config-payment-methods',
              label: '付款方式',
              path: '/admin/config/payment-methods',
              permission: 'system_config',
            },
          ],
        },
      ],
    },
  ],
};

export const CTA_CONFIG: Record<string, { label: string; path: string }> = {
  freelancer: {
    label: '找工作',
    path: '/jobs',
  },
  hr_recruiter: {
    label: '发布职位',
    path: '/post-job',
  },
  admin: {
    label: '系统管理',
    path: '/admin/dashboard',
  },
  job_seeker: {
    label: '找工作',
    path: '/jobs',
  },
  company_user: {
    label: '发布职位',
    path: '/post-job',
  },
};

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: '管理员',
  hr_recruiter: 'HR 招聘官',
  freelancer: '自由顾问',
  job_seeker: '求职者',
  company_user: '企业用户',
};

export const ROLE_COLORS: Record<RoleType, string> = {
  admin: 'bg-purple-100 text-purple-800',
  hr_recruiter: 'bg-green-100 text-green-800',
  freelancer: 'bg-blue-100 text-blue-800',
  job_seeker: 'bg-blue-100 text-blue-800',
  company_user: 'bg-orange-100 text-orange-800',
};
