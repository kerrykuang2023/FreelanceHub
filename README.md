# JobPortal - SAP顾问自由职业平台

一个现代化的招聘平台，连接自由顾问（Freelancer）、HR招聘者和企业管理员。

## 🌟 核心功能

### 👤 自由顾问 (Freelancer) 工作台
- ✅ **工作台仪表板** - 显示本周工时、进行中项目、待收款、待审核申请
- ✅ **项目管理** - 查看进行中的项目、项目详情、工时记录
- ✅ **职位浏览** - 浏览和搜索职位、申请职位
- ✅ **申请管理** - 查看申请状态、申请历史
- ✅ **工时管理** - 提交工时记录、查看工时统计

### 👔 HR招聘者 (HR Recruiter) 工作台
- ✅ **工作台仪表板** - 显示有效职位、待审工时、收到的申请、本月支出
- ✅ **职位发布** - 发布新职位、管理已发布职位
- ✅ **申请审核** - 查看求职者申请、审核申请状态
- ✅ **工时审核** - 审核顾问提交的工时记录

### 🔧 系统管理员 (Admin) 工作台
- ✅ **工作台仪表板** - 显示总用户数、自由顾问、注册企业、待处理发票等
- ✅ **用户管理** - 管理用户账户、角色权限
- ✅ **企业管理** - 审核企业注册、管理企业信息
- ✅ **数据统计** - 项目需求、工时记录、发票总数等统计

### 🔐 认证与权限
- ✅ **用户认证** - 登录/注册/登出
- ✅ **角色权限** - 基于角色的访问控制 (RBAC)
- ✅ **动态菜单** - 根据用户角色显示不同菜单

## 🛠️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Router v6** - 路由管理
- **Axios** - HTTP 客户端
- **React Query** - 数据获取和缓存

### 后端
- **Node.js** - 运行时
- **Express** - Web 框架
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份认证
- **Passport.js** - 认证中间件

### 开发工具
- **Docker & Docker Compose** - 容器化
- **Playwright** - E2E 测试
- **Vite** - 前端构建工具

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- Docker (可选)

### 使用 Docker（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 访问应用
# 前端：http://localhost:5137
# 后端 API: http://localhost:5555/api/v1
```

### 手动启动

#### 后端
```bash
cd JobPortal/server
npm install
npm run dev
```

#### 前端
```bash
cd JobPortal/client
npm install
npm run dev
```

## 📝 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 自由顾问 | freelancer@test.com | Test123456! |
| HR招聘者 | hr@test.com | Test123456! |
| 系统管理员 | admin@test.com | Test123456! |
| 超级管理员 | admin@jobportal.com | Admin@123 |

## 📊 数据库结构

### 主要集合
- `user_account` - 用户账户
- `user_role` - 用户角色
- `freelancer_profile` - 顾问档案
- `company` - 公司信息
- `job_post` - 职位信息
- `job_post_activity` - 职位申请
- `work_log` - 工时记录
- `invoice` - 发票信息

## 🧪 测试

### E2E 测试
```bash
# 运行跨角色全链路测试
npx playwright test e2e-tests/cross-role-e2e.spec.ts --headed

# 运行工作台数据验证测试
npx playwright test e2e-tests/dashboard-data.spec.ts --headed

# 运行调试测试
npx playwright test e2e-tests/debug-white-screen.spec.ts --headed
```

### 测试结果
- ✅ E2E-01: Freelancer 工作台完整流程 - 通过
- ✅ E2E-02: HR 工作台完整流程 - 通过
- ✅ E2E-03: Admin 工作台完整流程 - 通过
- ✅ E2E-04: API 数据验证 - 通过
- ✅ E2E-05: 跨角色完整业务流程 - 通过
- ✅ E2E-06: 页面导航和权限验证 - 通过

**总计: 6/6 通过 (100%)**

## 📸 系统截图

### Freelancer 工作台
![Freelancer Dashboard](test-results/e2e-freelancer-dashboard.png)

### HR 工作台
![HR Dashboard](test-results/e2e-hr-dashboard.png)

### Admin 工作台
![Admin Dashboard](test-results/e2e-admin-dashboard.png)

### HR 发布职位
![HR Post Job](test-results/e2e-hr-post-job.png)

### HR 查看申请
![HR Applications](test-results/e2e-hr-applications.png)

## 📁 项目结构

```
JobPortal/
├── JobPortal/
│   ├── client/                    # 前端代码
│   │   └── src/
│   │       ├── components/        # 组件
│   │       │   ├── core-ui/       # 核心UI组件
│   │       │   ├── layouts/       # 布局组件
│   │       │   └── navigation/    # 导航组件
│   │       ├── pages/             # 页面
│   │       ├── services/          # API服务
│   │       ├── providers/         # Context Provider
│   │       ├── hooks/             # 自定义Hooks
│   │       └── constants/         # 常量配置
│   └── server/                    # 后端代码
│       └── src/
│           ├── controllers/       # 控制器
│           ├── models/            # 数据模型
│           ├── routes/            # 路由
│           ├── middlewares/       # 中间件
│           └── seeders/           # 数据填充
├── e2e-tests/                     # E2E测试
├── docs/                          # 文档
├── docker-compose.yml
└── README.md
```

## 🔧 配置

### 环境变量
```bash
# 后端配置
MONGO_URL=mongodb://localhost:27017/jobportal
JWT_SECRET=your-secret-key
PORT=5555

# 前端配置
VITE_API_URL=http://localhost:5555/api/v1
```

## 🔄 最近更新

### 2026-03-28
- 🐛 修复 StorageService JSON 解析错误导致的页面白屏问题
- 🐛 修复 AuthProvider 数据解析错误导致的角色判断失败
- ✨ 添加跨角色全链路 E2E 测试
- ✨ 优化工作台数据加载逻辑
- ✨ 添加调试日志便于问题排查

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- GitHub: https://github.com/kerrykuang2023/JobPortal
- 如有问题或建议，请提交 Issue

---

**开发时间**: 2026-03-19  
**最后更新**: 2026-03-28  
**版本**: 1.1.0
