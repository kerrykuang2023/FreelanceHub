# 角色菜单逻辑设计文档

**文档版本:** v1.0  
**创建日期:** 2026-03-25  
**维护者:** AI Assistant

---

## 1. 角色定义

### 1.1 系统角色

| 角色ID | 角色名称 | 角色类型标识 | 描述 |
|--------|----------|--------------|------|
| R001 | 求职者/自由顾问 | `job_seeker` | 以项目制工作的专业顾问 |
| R002 | HR招聘官 | `hr_recruiter` | 企业HR，负责发布项目和管理顾问 |
| R003 | 管理员 | `admin` | 平台管理员，负责平台运营管理 |

### 1.2 角色权限矩阵

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           角色权限矩阵                                        │
└─────────────────────────────────────────────────────────────────────────────┘

功能模块          │ 求职者(job_seeker) │ HR招聘官(hr_recruiter) │ 管理员(admin)
─────────────────┼───────────────────┼───────────────────────┼──────────────
首页Dashboard     │       RW          │          RW           │      RW
项目浏览          │       RW          │           R           │      RW
项目发布          │        -          │          RW           │      RW
项目申请          │       RW          │           -           │      R
申请管理          │        -          │          RW           │      RW
工时填报          │       RW          │           -           │      RW
工时审核          │        -          │          RW           │      RW
发票创建          │       RW          │           -           │      RW
发票审核          │        -          │          RW           │      RW
付款确认          │        -          │          RW           │      RW
收款确认          │       RW          │           -           │      R
消息中心          │       RW          │          RW           │      RW
个人档案          │       RW          │          RW           │      RW
评价系统          │       RW          │          RW           │      RW
举报功能          │       RW          │          RW           │      RW
用户管理          │        -          │           -           │      RW
企业管理          │        -          │           -           │      RW
系统配置          │        -          │           -           │      RW
举报处理          │        -          │           -           │      RW

R = 只读, RW = 读写, - = 无权限
```

---

## 2. 菜单结构设计

### 2.1 求职者/自由顾问 (job_seeker) 菜单

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        求职者/自由顾问菜单结构                                  │
└─────────────────────────────────────────────────────────────────────────────┘

首页 (Dashboard)
├── 概览统计
│   ├── 进行中项目数
│   ├── 待确认工时
│   ├── 待处理发票
│   └── 本月收入
├── 快捷操作
│   ├── 填报工时
│   ├── 开具发票
│   ├── 浏览项目
│   └── 编辑档案
└── 最新消息

我的项目
├── 进行中项目
├── 已完成项目
└── 项目详情

浏览项目
├── 项目列表
├── 项目筛选
│   ├── 技能分类
│   ├── 工作形式
│   ├── 费率范围
│   └── 项目周期
├── 项目搜索
└── 项目详情
    └── 申请项目

我的申请
├── 待审核申请
├── 已通过申请
├── 已拒绝申请
└── 申请详情

收藏职位
├── 收藏列表
└── 取消收藏

工时管理
├── 工时列表
│   ├── 草稿
│   ├── 已提交
│   ├── 已确认
│   ├── 已驳回
│   └── 已开票
├── 填报工时
├── 批量提交
└── 工时详情

发票管理
├── 发票列表
│   ├── 草稿
│   ├── 已提交
│   ├── 已审核
│   ├── 已驳回
│   └── 已付款
├── 创建发票
├── 发票详情
└── 编辑发票

消息
├── 消息列表
├── 消息详情
└── 未读计数

个人档案
├── 基本信息
├── 技能标签
├── 项目经历
├── 资质证书
├── 费率设置
├── 可用性设置
├── 档案预览
└── 档案完整度

评价管理
├── 收到的评价
├── 发出的评价
└── 创建评价

举报功能
├── 提交举报
└── 我的举报
```

### 2.2 HR招聘官 (hr_recruiter) 菜单

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HR招聘官菜单结构                                      │
└─────────────────────────────────────────────────────────────────────────────┘

首页 (Dashboard)
├── 概览统计
│   ├── 发布项目数
│   ├── 进行中项目
│   ├── 待审核申请
│   ├── 待确认工时
│   └── 待审核发票
├── 快捷操作
│   ├── 发布职位
│   ├── 审核申请
│   ├── 确认工时
│   └── 审核发票
└── 最新消息

我的项目
├── 发布的项目
├── 进行中项目
├── 已完成项目
└── 项目详情
    ├── 编辑项目
    └── 状态管理

发布职位
├── 项目表单
│   ├── 基本信息
│   ├── 技能要求
│   ├── 费率设置
│   └── 时间周期
└── 发布确认

申请管理
├── 申请列表
│   ├── 待审核
│   ├── 已通过
│   └── 已拒绝
├── 申请详情
└── 审批操作

工时管理
├── 待审核工时
├── 已确认工时
├── 已驳回工时
├── 工时详情
└── 审核操作
    ├── 确认工时
    └── 驳回工时

发票管理
├── 待审核发票
├── 已审核发票
├── 已驳回发票
├── 发票详情
└── 审核操作
    ├── 审批发票
    └── 驳回发票

付款管理
├── 待付款发票
├── 已付款发票
├── 付款确认
└── 上传凭证

消息
├── 消息列表
├── 消息详情
└── 未读计数

个人档案
├── 基本信息
└── 企业信息

评价管理
├── 收到的评价
├── 发出的评价
└── 创建评价

举报功能
├── 提交举报
└── 我的举报
```

### 2.3 管理员 (admin) 菜单

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            管理员菜单结构                                      │
└─────────────────────────────────────────────────────────────────────────────┘

首页 (Dashboard)
├── 平台统计
│   ├── 用户总数
│   ├── 企业总数
│   ├── 项目总数
│   ├── 工时总数
│   └── 发票总额
├── 待处理事项
│   ├── 待审核企业
│   ├── 待处理举报
│   └── 角色审批
└── 最新动态

系统管理 (下拉菜单)
├── Dashboard
├── 用户管理
│   ├── 用户列表
│   ├── 用户详情
│   └── 状态管理
├── 角色审批
│   ├── 待审批列表
│   └── 审批操作
├── 企业审核
│   ├── 企业列表
│   ├── 认证审核
│   └── 状态管理
├── 工时管理
│   ├── 工时列表
│   └── 工时详情
├── 发票管理
│   ├── 发票列表
│   └── 发票详情
├── 项目管理
│   ├── 项目列表
│   └── 项目详情
├── 举报管理
│   ├── 举报列表
│   ├── 举报详情
│   └── 处理操作
└── 系统配置
    ├── 技能分类
    ├── 工时类型
    ├── 税率配置
    ├── 货币配置
    ├── 语言要求
    ├── 工作性质
    ├── 工作形式
    ├── Rate类型
    ├── 发票类型
    └── 付款方式

配置项管理 (子菜单)
├── 技能分类
├── 工时类型
├── 税率配置
├── 货币配置
├── 语言要求
├── 工作性质
├── 工作形式
├── Rate类型
├── 发票类型
└── 付款方式

消息
├── 消息列表
├── 消息详情
└── 未读计数

个人档案
├── 基本信息
└── 权限设置
```

---

## 3. 路由权限配置

### 3.1 路由权限表

| 路由路径 | 页面名称 | 求职者 | HR招聘官 | 管理员 |
|----------|----------|--------|----------|--------|
| `/` | Dashboard | ✅ | ✅ | ✅ |
| `/jobs` | 项目列表 | ✅ | ❌ | ✅ |
| `/my-projects` | 我的项目 | ✅ | ✅ | ✅ |
| `/applications` | 我的申请 | ✅ | ❌ | ❌ |
| `/saved-jobs` | 收藏职位 | ✅ | ❌ | ❌ |
| `/post-job` | 发布职位 | ❌ | ✅ | ✅ |
| `/jobs/:id` | 项目详情 | ✅ | ✅ | ✅ |
| `/jobs/:id/apply` | 申请项目 | ✅ | ❌ | ❌ |
| `/jobs/:id/edit` | 编辑项目 | ❌ | ✅ | ✅ |
| `/company/applications` | 申请管理 | ❌ | ✅ | ✅ |
| `/work-logs` | 工时列表 | ✅ | ✅ | ✅ |
| `/work-logs/new` | 填报工时 | ✅ | ❌ | ✅ |
| `/company/work-logs/pending` | 待审核工时 | ❌ | ✅ | ✅ |
| `/invoices` | 发票列表 | ✅ | ✅ | ✅ |
| `/invoices/new` | 创建发票 | ✅ | ❌ | ✅ |
| `/invoices/:id` | 发票详情 | ✅ | ✅ | ✅ |
| `/invoices/:id/edit` | 编辑发票 | ✅ | ❌ | ✅ |
| `/company/invoices/review` | 发票审核 | ❌ | ✅ | ✅ |
| `/payments` | 付款管理 | ❌ | ✅ | ✅ |
| `/messages` | 消息中心 | ✅ | ✅ | ✅ |
| `/profile` | 个人档案 | ✅ | ✅ | ✅ |
| `/profile/verification` | 身份认证 | ✅ | ✅ | ✅ |
| `/profile/switch-role` | 角色切换 | ✅ | ✅ | ✅ |
| `/ratings` | 评价列表 | ✅ | ✅ | ✅ |
| `/ratings/create` | 创建评价 | ✅ | ✅ | ✅ |
| `/report` | 提交举报 | ✅ | ✅ | ❌ |
| `/admin/dashboard` | 管理员Dashboard | ❌ | ❌ | ✅ |
| `/admin/users` | 用户管理 | ❌ | ❌ | ✅ |
| `/admin/role-approvals` | 角色审批 | ❌ | ❌ | ✅ |
| `/admin/companies` | 企业管理 | ❌ | ❌ | ✅ |
| `/admin/reports` | 举报管理 | ❌ | ❌ | ✅ |
| `/admin/configuration` | 系统配置 | ❌ | ❌ | ✅ |
| `/admin/config/*` | 配置项管理 | ❌ | ❌ | ✅ |

### 3.2 路由守卫逻辑

```typescript
interface RouteGuard {
  path: string;
  allowedRoles: string[];
  redirectTo?: string;
}

const routeGuards: RouteGuard[] = [
  { path: '/admin/*', allowedRoles: ['admin'], redirectTo: '/' },
  { path: '/post-job', allowedRoles: ['hr_recruiter', 'admin'], redirectTo: '/jobs' },
  { path: '/company/*', allowedRoles: ['hr_recruiter', 'admin'], redirectTo: '/' },
  { path: '/applications', allowedRoles: ['job_seeker'], redirectTo: '/' },
  { path: '/saved-jobs', allowedRoles: ['job_seeker'], redirectTo: '/' },
  { path: '/work-logs/new', allowedRoles: ['job_seeker', 'admin'], redirectTo: '/' },
  { path: '/invoices/new', allowedRoles: ['job_seeker', 'admin'], redirectTo: '/' },
];

function checkRouteAccess(path: string, userRole: string): boolean {
  const guard = routeGuards.find(g => 
    path.startsWith(g.path.replace('*', '')) || path === g.path
  );
  
  if (!guard) return true;
  return guard.allowedRoles.includes(userRole);
}
```

---

## 4. 菜单显示逻辑

### 4.1 Header导航菜单逻辑

```typescript
interface NavItem {
  name: string;
  href?: string;
  icon?: React.ComponentType;
  children?: NavItem[];
  roles: string[];
  showInMobile?: boolean;
}

const navigationConfig: NavItem[] = [
  {
    name: '首页',
    href: '/',
    icon: HomeIcon,
    roles: ['job_seeker', 'hr_recruiter', 'admin']
  },
  {
    name: '我的项目',
    href: '/my-projects',
    icon: BriefcaseIcon,
    roles: ['job_seeker', 'hr_recruiter']
  },
  {
    name: '浏览项目',
    href: '/jobs',
    icon: BriefcaseIcon,
    roles: ['job_seeker']
  },
  {
    name: '我的申请',
    href: '/applications',
    icon: DocumentTextIcon,
    roles: ['job_seeker']
  },
  {
    name: '收藏职位',
    href: '/saved-jobs',
    icon: BookmarkIcon,
    roles: ['job_seeker']
  },
  {
    name: '发布职位',
    href: '/post-job',
    icon: BriefcaseIcon,
    roles: ['hr_recruiter']
  },
  {
    name: '申请管理',
    href: '/company/applications',
    icon: UserGroupIcon,
    roles: ['hr_recruiter']
  },
  {
    name: '工时管理',
    href: '/work-logs',
    icon: ClipboardDocumentListIcon,
    roles: ['job_seeker', 'hr_recruiter']
  },
  {
    name: '发票管理',
    href: '/invoices',
    icon: DocumentTextIcon,
    roles: ['job_seeker', 'hr_recruiter']
  },
  {
    name: '消息',
    href: '/messages',
    icon: ChatBubbleLeftRightIcon,
    roles: ['job_seeker', 'hr_recruiter']
  }
];

const adminNavigation: NavItem = {
  name: '系统管理',
  icon: ServerStackIcon,
  roles: ['admin'],
  children: [
    { name: 'Dashboard', href: '/admin/dashboard', roles: ['admin'] },
    { name: '用户管理', href: '/admin/users', roles: ['admin'] },
    { name: '角色审批', href: '/admin/role-approvals', roles: ['admin'] },
    { name: '企业审核', href: '/admin/companies', roles: ['admin'] },
    { name: '工时管理', href: '/admin/worklogs', roles: ['admin'] },
    { name: '发票管理', href: '/admin/invoices', roles: ['admin'] },
    { name: '项目管理', href: '/admin/projects', roles: ['admin'] },
    { name: '举报管理', href: '/admin/reports', roles: ['admin'] },
    { 
      name: '系统配置', 
      href: '/admin/configuration', 
      roles: ['admin'] 
    },
    {
      name: '配置项管理',
      roles: ['admin'],
      children: [
        { name: '技能分类', href: '/admin/config/skill-categories', roles: ['admin'] },
        { name: '工时类型', href: '/admin/config/work-types', roles: ['admin'] },
        { name: '税率配置', href: '/admin/config/tax-rates', roles: ['admin'] },
        { name: '货币配置', href: '/admin/config/currencies', roles: ['admin'] },
        { name: '语言要求', href: '/admin/config/languages', roles: ['admin'] },
        { name: '工作性质', href: '/admin/config/job-natures', roles: ['admin'] },
        { name: '工作形式', href: '/admin/config/work-formats', roles: ['admin'] },
        { name: 'Rate类型', href: '/admin/config/rate-types', roles: ['admin'] },
        { name: '发票类型', href: '/admin/config/invoice-types', roles: ['admin'] },
        { name: '付款方式', href: '/admin/config/payment-methods', roles: ['admin'] }
      ]
    }
  ]
};
```

### 4.2 快捷操作按钮逻辑

```typescript
interface QuickAction {
  name: string;
  href: string;
  icon: React.ComponentType;
  roles: string[];
  primary?: boolean;
}

const quickActions: QuickAction[] = [
  {
    name: '填报工时',
    href: '/work-logs/new',
    icon: ClockIcon,
    roles: ['job_seeker']
  },
  {
    name: '开具发票',
    href: '/invoices/new',
    icon: DocumentTextIcon,
    roles: ['job_seeker']
  },
  {
    name: '浏览项目',
    href: '/jobs',
    icon: BriefcaseIcon,
    roles: ['job_seeker']
  },
  {
    name: '发布职位',
    href: '/post-job',
    icon: BriefcaseIcon,
    roles: ['hr_recruiter'],
    primary: true
  },
  {
    name: '审核申请',
    href: '/company/applications',
    icon: UserGroupIcon,
    roles: ['hr_recruiter']
  },
  {
    name: '确认工时',
    href: '/company/work-logs/pending',
    icon: ClipboardDocumentListIcon,
    roles: ['hr_recruiter']
  },
  {
    name: '审核发票',
    href: '/company/invoices/review',
    icon: DocumentTextIcon,
    roles: ['hr_recruiter']
  }
];

function getHeaderActionButton(role: string): QuickAction | null {
  if (role === 'hr_recruiter') {
    return {
      name: '发布职位',
      href: '/post-job',
      primary: true
    };
  }
  return {
    name: '找工作',
    href: '/jobs',
    primary: true
  };
}
```

---

## 5. Dashboard差异化设计

### 5.1 求职者Dashboard

```typescript
interface FreelancerDashboard {
  stats: {
    activeProjects: number;
    pendingWorkLogs: number;
    pendingInvoices: number;
    monthlyIncome: number;
  };
  quickActions: [
    { name: '填报工时', href: '/work-logs/new' },
    { name: '开具发票', href: '/invoices/new' },
    { name: '浏览项目', href: '/jobs' },
    { name: '编辑档案', href: '/profile' }
  ];
  activeProjects: Project[];
  recentMessages: Message[];
}
```

### 5.2 HR招聘官Dashboard

```typescript
interface HRDashboard {
  stats: {
    postedProjects: number;
    activeProjects: number;
    pendingApplications: number;
    pendingWorkLogs: number;
    pendingInvoices: number;
  };
  quickActions: [
    { name: '发布职位', href: '/post-job' },
    { name: '审核申请', href: '/company/applications' },
    { name: '确认工时', href: '/company/work-logs/pending' },
    { name: '审核发票', href: '/company/invoices/review' }
  ];
  activeProjects: Project[];
  pendingItems: {
    applications: Application[];
    workLogs: WorkLog[];
    invoices: Invoice[];
  };
  recentMessages: Message[];
}
```

### 5.3 管理员Dashboard

```typescript
interface AdminDashboard {
  stats: {
    totalUsers: number;
    totalCompanies: number;
    totalProjects: number;
    totalWorkLogs: number;
    totalInvoiceAmount: number;
  };
  pendingItems: {
    companyVerifications: number;
    reports: number;
    roleApprovals: number;
  };
  recentActivities: Activity[];
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  };
}
```

---

## 6. 权限验证实现

### 6.1 前端权限验证

```typescript
function useRoutePermission(path: string): boolean {
  const { activeRole, user } = useAuth();
  const currentRoleType = activeRole?.role_type || user?.user_type_name || 'job_seeker';
  
  return checkRouteAccess(path, currentRoleType);
}

function ProtectedRoute({ path, element }: { path: string; element: React.ReactNode }) {
  const hasPermission = useRoutePermission(path);
  
  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }
  
  return <>{element}</>;
}
```

### 6.2 后端权限验证

```typescript
function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role_type;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '您没有权限访问此资源'
        }
      });
    }
    
    next();
  };
}

app.get('/api/v1/admin/users', requireRole('admin'), getUsers);
app.post('/api/v1/jobs', requireRole('hr_recruiter', 'admin'), createJob);
app.post('/api/v1/work-logs', requireRole('job_seeker', 'admin'), createWorkLog);
```

---

## 7. 实现检查清单

### 7.1 前端实现检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header菜单按角色过滤 | ✅ | Header.tsx 已实现 |
| 管理员下拉菜单 | ✅ | Header.tsx 已实现 |
| 路由权限守卫 | ⚠️ | App.tsx 需要增强 |
| Dashboard差异化 | ✅ | 各角色Dashboard已实现 |
| 快捷操作按钮 | ✅ | Header.tsx 已实现 |
| 角色切换功能 | ✅ | RoleSwitcher组件已实现 |
| 移动端菜单 | ✅ | Header.tsx 已实现 |

### 7.2 后端实现检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| API权限验证 | ✅ | 各Controller已实现 |
| 角色数据隔离 | ✅ | 查询时过滤用户数据 |
| 操作权限验证 | ✅ | 编辑/删除时验证所有权 |
| 管理员权限 | ✅ | 管理员接口已保护 |

---

**文档维护者:** AI Assistant  
**更新频率:** 功能变更时更新
