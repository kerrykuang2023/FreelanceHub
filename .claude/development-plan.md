# JobPortal 第二阶段开发计划

## 项目状态

### 已完成功能
- ✅ 用户注册/登录
- ✅ JWT 认证
- ✅ 用户类型 API
- ✅ 前端基础框架

### 待实现功能

## 第一阶段：职位核心功能 (P0)

### 1.1 后端 - 职位管理 API
- [ ] `GET /api/v1/jobs` - 获取职位列表（分页、筛选）
- [ ] `GET /api/v1/jobs/:id` - 获取职位详情
- [ ] `POST /api/v1/jobs` - 创建职位
- [ ] `PUT /api/v1/jobs/:id` - 更新职位
- [ ] `DELETE /api/v1/jobs/:id` - 删除职位

### 1.2 前端 - 职位服务
- [ ] 创建 `jobs.service.ts`
- [ ] 连接首页到真实 API
- [ ] 实现职位筛选功能

## 第二阶段：用户和申请流程 (P1)

### 2.1 后端 - 用户管理 API
- [ ] `GET /api/v1/users/user` - 获取当前用户信息
- [ ] `GET /api/v1/users/:id` - 获取用户详情
- [ ] `PUT /api/v1/users/:id` - 更新用户信息

### 2.2 后端 - 职位申请 API
- [ ] `POST /api/v1/job/:id/apply` - 申请职位
- [ ] `GET /api/v1/job/:id/applications` - 获取职位申请列表
- [ ] `GET /api/v1/job/applications` - 获取用户申请历史
- [ ] `PUT /api/v1/job/applications/:id` - 更新申请状态

### 2.3 前端 - 用户和申请服务
- [ ] 创建 `users.service.ts`
- [ ] 创建 `applications.service.ts`
- [ ] 实现 ProfilePage
- [ ] 实现 MyJobsPage

## 第三阶段：完善认证和辅助功能 (P2)

### 3.1 后端 - 认证增强
- [ ] `POST /api/v1/auth/logout` - 登出
- [ ] `POST /api/v1/auth/forgot-password` - 忘记密码
- [ ] `POST /api/v1/auth/reset-password` - 重置密码

### 3.2 前端 - 辅助页面
- [ ] 实现 SavedJobsPage
- [ ] 实现 MessagesPage
- [ ] 添加 NProgress 加载指示器

## 第四阶段：公司管理 (P3)

### 4.1 后端 - 公司管理 API
- [ ] `GET /api/v1/companies` - 获取公司列表
- [ ] `GET /api/v1/companies/:id` - 获取公司详情
- [ ] `POST /api/v1/companies` - 创建公司
- [ ] `PUT /api/v1/companies/:id` - 更新公司信息

### 4.2 前端 - 公司服务
- [ ] 创建 `company.service.ts`

## 测试计划

每个阶段完成后执行：
1. 单元测试
2. API 集成测试
3. 端到端测试
4. 回归测试

---

开始时间: 2026-03-19
预计完成: 2026-03-19
