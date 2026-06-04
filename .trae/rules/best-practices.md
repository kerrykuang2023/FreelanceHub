# 开发最佳实践

**文档版本:** v1.2  
**创建日期:** 2026-03-22  
**最后更新:** 2026-03-30

---

## 0. 规范文档索引

> **📖 所有开发规范文档**

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [git-workflow.md](./git-workflow.md) | Git工作流程规范 | 分支管理、提交代码、发布流程 |
| [task-execution-workflow.md](./task-execution-workflow.md) | 任务执行工作流程 | 任务分析、开发、测试循环 |
| [feature-development-workflow.md](./feature-development-workflow.md) | 功能开发验证闭环 | PRD对照、E2E测试验证 |
| [e2e-testing-best-practices.md](./e2e-testing-best-practices.md) | E2E测试最佳实践 | 端到端测试编写与执行 |
| [continuous-improvement.md](./continuous-improvement.md) | 持续改进与经验总结 | 阶段复盘、流程优化 |

---

## 1. 任务执行工作流程（重要）

> **⚠️ 核心规则：所有任务必须遵循此工作流程**

当收到修改问题或开发新任务的指令时，必须按以下流程执行：

### 0.1 工作流程概览

```
任务指令 → 任务分析 → 迭代开发 → E2E全面测试 → 问题修复循环 → 任务完成
```

### 0.2 技能调用规则

| 任务复杂度 | 调用技能 | 适用场景 |
|------------|----------|----------|
| **简单任务** | `superdev` | 单一功能修改、小范围调整、预计耗时 < 30分钟 |
| **复杂任务** | `superpower-loop` | 多功能开发、跨模块修改、需要架构设计、预计耗时 > 30分钟 |
| **测试验证** | `playwright` | 所有开发完成后的端到端测试 |

### 0.3 测试验证要求

使用 `playwright` 技能进行端到端测试时，必须包含：

1. **功能测试**
   - 页面加载正常
   - 表单提交正常
   - 按钮点击响应
   - 数据展示正确

2. **跨角色场景逻辑验证**
   - 预期结果验证
   - API响应结果验证
   - 数据库存储验证
   - 前端显示结果验证
   - **四者一致性检查**

3. **用户视角操作体验测试**
   - 操作流程顺畅性
   - 错误提示友好性
   - 页面跳转正确性
   - UI/UX一致性

### 1.4 问题修复循环

```
测试发现问题 → 记录问题清单 → 分析修复 → 重新测试 → 直到问题全部解决
```

### 1.5 任务完成标准

- [ ] 所有代码修改完成
- [ ] 功能测试全部通过
- [ ] 跨角色场景验证通过
- [ ] 数据一致性验证通过
- [ ] 用户体验测试通过
- [ ] 无遗留问题
- [ ] 文档已更新

**详细工作流程请参考:** [task-execution-workflow.md](./task-execution-workflow.md)

---

## 2. Git 工作流程规范

> **⚠️ 所有代码提交必须遵循 Git 工作流程规范**

**详细规范请参考:** [git-workflow.md](./git-workflow.md)

### 2.1 分支管理

| 分支类型 | 命名规范 | 用途 |
|----------|----------|------|
| `main` | main | 生产环境代码 |
| `dev` | dev | 开发集成分支 |
| `feature/*` | feature/功能名 | 新功能开发 |
| `bugfix/*` | bugfix/问题描述 | Bug修复 |
| `release/*` | release/版本号 | 发布准备 |

### 2.2 提交规范

```
<type>(<scope>): <subject>

类型: feat, fix, docs, style, refactor, perf, test, chore
作用域: auth, i18n, jobs, worklog, invoice, user, company, admin, ui
```

### 2.3 开发流程

```
1. 从 dev 创建功能分支
2. 开发并提交代码
3. 合并回 dev 分支
4. 运行测试验证
5. 推送到远程仓库
6. 删除已合并的功能分支
```

---

## 3. 代码开发最佳实践

### 3.1 组件开发

| 实践 | 描述 | 示例 |
|------|------|------|
| 组件复用 | 优先复用现有组件，避免重复开发 | 使用已有的Button、Modal组件 |
| 单一职责 | 每个组件只负责一个功能 | 表单组件只处理表单逻辑 |
| Props类型化 | 使用TypeScript定义Props类型 | `interface Props { title: string }` |
| 默认值设置 | 为可选Props设置默认值 | `title?: string` |

### 3.2 状态管理

| 实践 | 描述 | 好处 |
|------|------|------|
| 状态就近原则 | 状态放在最近的使用处 | 减少不必要的渲染 |
| 状态提升 | 多组件共享时提升到共同父组件 | 保持数据一致性 |
| 使用Context | 跨层级共享状态时使用Context | 避免props drilling |

### 3.3 API调用

| 实践 | 描述 | 示例 |
|------|------|------|
| 统一封装 | 使用统一的API调用封装 | `apiService.get('/users')` |
| 错误处理 | 统一错误处理模式 | try-catch + toast提示 |
| 加载状态 | 显示加载状态 | Loading组件 |
| 请求取消 | 组件卸载时取消请求 | AbortController |

### 3.4 表单处理

| 实践 | 描述 | 示例 |
|------|------|------|
| 表单验证 | 前端验证 + 后端验证 | 必填、格式、长度检查 |
| 错误提示 | 友好的错误提示 | "请输入有效的邮箱地址" |
| 提交防抖 | 防止重复提交 | 按钮disabled状态 |

---

## 4. 测试验证最佳实践

### 4.1 测试用例编写

| 实践 | 描述 | 示例 |
|------|------|------|
| 测试先行 | 开发前先写测试用例框架 | 先定义测试场景 |
| 选择器策略 | 优先使用data-testid | `[data-testid="submit-btn"]` |
| 测试隔离 | 每个测试独立运行 | 不依赖其他测试结果 |
| 清晰命名 | 测试名称清晰描述场景 | `test('登录成功后跳转到首页')` |

### 4.2 测试覆盖

| 类型 | 覆盖内容 | 优先级 |
|------|----------|--------|
| 功能测试 | 主要功能流程 | P0 |
| 边界测试 | 边界条件和异常 | P1 |
| UI测试 | 页面元素存在性 | P0 |
| 交互测试 | 用户交互行为 | P0 |

### 4.3 截图策略

| 场景 | 截图内容 | 用途 |
|------|----------|------|
| 页面加载 | 完整页面 | 验证布局 |
| 表单填写 | 填写后状态 | 验证输入 |
| 提交成功 | 成功提示 | 验证结果 |
| 错误提示 | 错误信息 | 验证错误处理 |

---

## 5. 流程管理最佳实践

### 5.1 任务管理

| 实践 | 描述 | 工具 |
|------|------|------|
| 任务分解 | 大任务分解为小任务 | TodoWrite |
| 优先级排序 | P0 > P1 > P2 | 检查清单 |
| 状态同步 | 及时更新任务状态 | 检查清单 |
| 进度汇报 | 定期汇报进度 | 完成报告 |

### 5.2 代码管理

| 实践 | 描述 | 频率 |
|------|------|------|
| 提交频率 | 小步提交，频繁提交 | 每个功能点 |
| 提交信息 | 清晰的提交信息 | 每次提交 |
| 代码审查 | 自我审查代码 | 提交前 |

### 5.3 文档管理

| 实践 | 描述 | 时机 |
|------|------|------|
| 及时更新 | 功能完成后立即更新文档 | 每个功能 |
| 保持一致 | 文档与代码保持一致 | 持续 |
| 版本控制 | 文档版本化管理 | 每次更新 |

---

## 6. 问题处理最佳实践

### 6.1 问题记录

| 字段 | 内容 | 示例 |
|------|------|------|
| 问题ID | 唯一标识 | ISS-001 |
| 功能ID | 关联功能 | AUTH-001 |
| 问题描述 | 清晰描述 | 登录按钮无响应 |
| 复现步骤 | 详细步骤 | 1. 打开页面 2. 点击登录 |
| 预期行为 | 正确行为 | 应跳转到首页 |
| 实际行为 | 错误行为 | 无任何反应 |

### 6.2 问题分析

| 步骤 | 内容 | 方法 |
|------|------|------|
| 定位问题 | 找到问题代码位置 | 断点调试、日志 |
| 分析原因 | 找出根本原因 | 5Why分析法 |
| 制定方案 | 制定解决方案 | 评估多种方案 |
| 实施修复 | 修复问题 | 编码、测试 |
| 验证效果 | 确认问题解决 | 回归测试 |

### 6.3 问题预防

| 措施 | 描述 | 效果 |
|------|------|------|
| 代码审查 | 提交前审查代码 | 发现潜在问题 |
| 单元测试 | 编写单元测试 | 预防回归 |
| 类型检查 | 使用TypeScript | 编译时发现问题 |
| ESLint | 使用代码规范检查 | 统一代码风格 |

---

## 7. 效率提升最佳实践

### 5.1 开发效率

| 技巧 | 描述 | 效果 |
|------|------|------|
| 代码片段 | 保存常用代码片段 | 减少重复输入 |
| 快捷键 | 使用IDE快捷键 | 提高操作速度 |
| 模板复用 | 使用代码模板 | 快速生成标准代码 |
| 批量操作 | 相似任务批量处理 | 减少上下文切换 |

### 5.2 调试效率

| 技巧 | 描述 | 效果 |
|------|------|------|
| 断点调试 | 使用断点而非console.log | 精确定位问题 |
| 条件断点 | 设置条件断点 | 快速定位特定场景 |
| 日志级别 | 使用不同日志级别 | 快速筛选日志 |
| 热重载 | 使用热重载功能 | 快速验证修改 |

### 5.3 测试效率

| 技巧 | 描述 | 效果 |
|------|------|------|
| 并行测试 | 无依赖测试并行执行 | 缩短测试时间 |
| 测试隔离 | 每个测试独立 | 避免相互影响 |
| 快速反馈 | 测试失败立即修复 | 避免问题积累 |
| 选择性测试 | 只运行相关测试 | 节省时间 |

---

## 8. 沟通协作最佳实践

### 6.1 报告编写

| 要素 | 内容 | 格式 |
|------|------|------|
| 简洁明了 | 关键信息优先 | 表格形式 |
| 数据支撑 | 用数据说话 | 统计图表 |
| 问题清晰 | 问题描述清晰 | 问题列表 |
| 建议明确 | 给出明确建议 | 行动计划 |

### 6.2 问题沟通

| 场景 | 沟通方式 | 内容 |
|------|----------|------|
| 阻塞问题 | 立即汇报 | 问题描述、影响范围 |
| 技术疑问 | 详细描述 | 背景、问题、尝试方案 |
| 进度延迟 | 提前预警 | 延迟原因、预计完成时间 |

---

## 9. 服务启动最佳实践

### 7.1 服务启动方式选择

| 方式 | 命令 | 适用场景 | 推荐度 |
|------|------|----------|--------|
| Docker启动 | `docker-compose up -d` | 生产环境、完整环境 | ⚠️ 有问题 |
| 本地启动后端 | `cd JobPortal/server && npm run dev` | 开发调试、E2E测试 | ✅ 推荐 |
| 本地启动前端 | `cd JobPortal/client && npm run dev` | 开发调试、E2E测试 | ✅ 推荐 |

### 7.2 服务端口说明

| 服务 | 端口 | 访问地址 | 进程检查命令 |
|------|------|----------|--------------|
| 前端 | 5137 | http://localhost:5137 | `netstat -ano \| findstr "5137"` |
| 后端API | 5555 | http://localhost:5555/api/v1 | `netstat -ano \| findstr "5555"` |
| MongoDB | 27017 | mongodb://localhost:27017/jobportal | `netstat -ano \| findstr "27017"` |

### 7.3 Docker启动问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Client容器重启循环 | esbuild版本不匹配 (Host 0.20.2 vs Binary 0.21.5) | 使用本地启动方式 |
| Server容器编译错误 | TypeScript编译失败 (multer模块缺失等) | 使用本地启动方式 |
| 端口被占用 | 服务已在运行 | `taskkill /F /PID <进程ID>` |
| MongoDB连接失败 | 容器未启动 | `docker start job-portal-mongo` |
| Docker Desktop未运行 | 服务未启动 | 启动Docker Desktop应用 |

### 7.4 推荐的服务启动流程

```powershell
# 步骤1: 启动Docker Desktop（如果未运行）
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 步骤2: 等待Docker启动（约30秒）
Start-Sleep -Seconds 30

# 步骤3: 启动MongoDB容器
docker start job-portal-mongo

# 步骤4: 验证MongoDB运行
docker ps | findstr mongo

# 步骤5: 启动后端服务（新终端）
Set-Location d:\claudesapce\JobPortal\JobPortal\server
npm run dev

# 步骤6: 验证后端服务（等待看到 "Server is running at http://localhost:5555"）
# 后端启动成功标志：
# - "MongoDB connected successfully"
# - "All seeders completed successfully!"
# - "Server is running at http://localhost:5555"

# 步骤7: 启动前端服务（新终端）
Set-Location d:\claudesapce\JobPortal\JobPortal\client
npm run dev

# 步骤8: 验证前端服务（等待看到 "Local: http://localhost:5137/"）
```

### 7.5 服务验证方法

```powershell
# 验证前端服务
Invoke-WebRequest -Uri "http://localhost:5137" -UseBasicParsing -TimeoutSec 10

# 验证后端API（注意：health路由可能不存在，但任何API调用都会返回响应）
Invoke-WebRequest -Uri "http://localhost:5555/api/v1/auth/login" -Method POST -UseBasicParsing -TimeoutSec 10

# 验证MongoDB连接
docker exec -it job-portal-mongo mongosh --eval "db.stats()"
```

### 7.6 常见启动问题排查

| 问题现象 | 排查步骤 | 解决方案 |
|----------|----------|----------|
| 后端启动失败 | 1. 检查MongoDB是否运行 2. 检查端口5555是否被占用 | 启动MongoDB或释放端口 |
| 前端无法访问后端 | 1. 检查后端是否运行 2. 检查.env配置 | 确保VITE_API_URL正确 |
| 数据库连接失败 | 1. 检查MongoDB容器状态 2. 检查连接字符串 | 重启MongoDB容器 |
| 测试用户不存在 | 1. 检查seeder是否运行 2. 查看启动日志 | 确保seeder成功执行 |

### 7.7 E2E测试前置条件检查清单

| 条件 | 检查方式 | 处理方式 |
|------|----------|----------|
| Docker Desktop运行 | `docker ps` 命令可用 | 启动Docker Desktop |
| MongoDB运行 | `docker ps \| findstr mongo` | `docker start job-portal-mongo` |
| 后端服务运行 | 访问 http://localhost:5555 | `npm run dev` 在server目录 |
| 前端服务运行 | 访问 http://localhost:5137 | `npm run dev` 在client目录 |
| 测试用户存在 | 检查seeder日志 | 确保seeder成功执行 |
| 主数据初始化 | 运行初始化脚本 | `npx ts-node src/scripts/init-e2e-test-data.ts` |

### 7.8 测试用户凭据

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| 管理员 | admin@test.com | Test123456! | 管理员操作测试 |
| 自由顾问 | freelancer@test.com | Test123456! | 顾问操作测试 |
| HR用户 | hr@test.com | Test123456! | HR操作测试 |
| 超级管理员 | admin@jobportal.com | Admin@123 | 系统管理 |

### 7.9 服务启动成功标志

**后端服务成功启动日志：**
```
[Database]: MongoDB connected successfully
[Server]: Running seeders...
[Server]: All seeders completed successfully!
[Server]: Server is running at http://localhost:5555
```

**前端服务成功启动日志：**
```
VITE v5.2.9  ready in 3555 ms
➜  Local:   http://localhost:5137/
```

---

## 10. 持续改进最佳实践

### 7.1 经验总结

| 时机 | 内容 | 存储 |
|------|------|------|
| 功能完成 | 功能级经验 | 经验总结文档 |
| 模块完成 | 模块级经验 | 经验总结文档 |
| 阶段完成 | 阶段级经验 | 经验总结文档 |

### 7.2 流程优化

| 触发条件 | 优化方式 | 验证方法 |
|----------|----------|----------|
| 问题重复 | 分析根本原因 | 跟踪效果 |
| 效率低下 | 找出瓶颈 | 对比数据 |
| 流程缺陷 | 修正流程 | 试点验证 |

---

## 11. 登录与授权最佳实践

### 9.1 核心问题与解决方案

| 问题ID | 问题描述 | 根本原因 | 解决方案 |
|--------|----------|----------|----------|
| AUTH-001 | 登录后API请求未携带Authorization header | AuthProvider的login函数未将token存储到localStorage | 在login函数中添加`StorageService.setItem("access_token", token)` |
| AUTH-002 | 登录后权限检查失败，用户被重定向到首页 | React状态更新是异步的，权限检查在状态更新完成前执行 | 1. 将login函数改为async/Promise模式<br>2. 添加isLoading状态<br>3. 权限检查前等待状态就绪 |
| AUTH-003 | activeRole数据格式与IUserRole接口不匹配 | 后端返回的数据格式与前端类型定义不一致 | 添加normalizeActiveRole函数进行数据格式标准化 |
| AUTH-004 | E2E测试中API端点访问失败 | API端点路径与实际路由不一致 | 验证并修正API端点路径 |

### 9.2 登录流程处理规范

#### 9.2.1 登录函数实现要点

| 要点 | 描述 | 示例 |
|------|------|------|
| 异步返回 | login函数必须返回Promise | `async login(token, user): Promise<void>` |
| Token存储 | 必须在状态更新前存储token | `StorageService.setItem("access_token", token)` |
| 状态更新顺序 | 先存储token，再更新状态 | token → isAuthenticated → user → activeRole |
| 延迟resolve | 状态更新后延迟resolve确保稳定 | `setTimeout(() => resolve(), 50)` |

#### 9.2.2 登录函数标准模板

```typescript
const normalizeActiveRole = (activeRoleData: any): IUserRole | null => {
  if (!activeRoleData) return null;
  return {
    id: activeRoleData._id || activeRoleData.id,
    role_type: activeRoleData.role_type,
    status: activeRoleData.status || 'approved',
    is_active: activeRoleData.is_active !== undefined ? activeRoleData.is_active : true,
    role_specific_data: activeRoleData.role_specific_data,
  };
};

const login = async (token: string, userData: IUserAccount): Promise<void> => {
  return new Promise((resolve) => {
    StorageService.setItem("access_token", token);
    setIsAuthenticated(true);
    setUser(userData);
    setActiveRole(normalizeActiveRole(userData.active_role));
    setTimeout(() => resolve(), 50);
  });
};
```

### 9.3 权限管理架构

#### 9.3.1 组件层级关系

```
AuthProvider (Context)
    │
    ├── useAuth Hook (获取认证状态)
    │       │
    │       └── usePermissions Hook (权限判断)
    │               │
    │               └── RoleRoute Component (路由守卫)
```

#### 9.3.2 usePermissions Hook实现

```typescript
export type RoleType = 'job_seeker' | 'freelancer' | 'hr_recruiter' | 'company_user' | 'admin';

export const usePermissions = (): PermissionResult => {
  const { isAuthenticated, activeRole, user, roles, isLoading } = useAuth();
  
  return useMemo(() => {
    const currentRole = (activeRole?.role_type || user?.user_type_name || 'job_seeker') as RoleType;
    
    return {
      isAuthenticated,
      isLoading,
      currentRole,
      isHR: currentRole === 'hr_recruiter',
      isAdmin: currentRole === 'admin',
      isHROrAdmin: ['hr_recruiter', 'admin'].includes(currentRole),
      isFreelancer: currentRole === 'freelancer',
      hasAnyRole: (allowedRoles: RoleType[]) => {
        if (!isAuthenticated) return false;
        return allowedRoles.includes(currentRole);
      },
    };
  }, [isAuthenticated, activeRole, user, roles, isLoading]);
};
```

### 9.4 路由权限守卫

#### 9.4.1 权限检查延迟机制

| 参数 | 值 | 说明 |
|------|-----|------|
| PERMISSION_READY_DELAY | 500ms | 状态更新后的延迟等待时间 |
| isLoading检查 | 必须 | 确保状态更新完成 |
| isReady状态 | 必须 | 二次确认状态稳定 |

#### 9.4.2 RoleRoute组件标准模板

```typescript
const PERMISSION_READY_DELAY = 500;

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { hasAnyRole, isAuthenticated, isLoading } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, PERMISSION_READY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isReady) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### 9.5 API认证处理

#### 9.5.1 请求拦截器配置

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = StorageService.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### 9.5.2 响应拦截器配置

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      StorageService.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 9.6 E2E测试登录处理

#### 9.6.1 测试登录助手函数

```typescript
static async loginAsUser(page: Page, user: TestUser): Promise<LoginResult> {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  
  const token = await page.evaluate(() => {
    return localStorage.getItem('access_token');
  });
  
  if (!token) {
    return { success: false, errors: [{ type: 'error', message: 'Token not stored' }] };
  }
  
  await page.waitForTimeout(3000);
  
  return { success: true, errors: [] };
}
```

#### 9.6.2 登录验证要点

| 验证项 | 验证方式 | 失败处理 |
|--------|----------|----------|
| Token存储 | `localStorage.getItem('access_token')` | 返回失败结果 |
| 页面跳转 | `waitForURL` | 抛出超时错误 |
| 状态稳定 | `waitForTimeout(3000)` | 等待时间不足可能导致后续操作失败 |

### 9.7 常见问题排查指南

| 问题现象 | 可能原因 | 排查步骤 | 解决方案 |
|----------|----------|----------|----------|
| 登录后跳转首页 | 权限检查失败 | 1. 检查localStorage是否有token<br>2. 检查activeRole是否正确<br>3. 检查isLoading状态 | 确保login函数返回Promise并等待完成 |
| API返回401 | Token未携带 | 1. 检查localStorage是否有token<br>2. 检查API拦截器配置 | 确保API拦截器正确添加Authorization header |
| 角色判断错误 | 角色数据格式不一致 | 1. 检查后端返回的角色数据格式<br>2. 检查normalizeActiveRole函数 | 添加数据格式标准化处理 |
| 页面闪烁 | 状态更新延迟 | 1. 检查isLoading状态<br>2. 检查权限检查时机 | 添加延迟等待状态稳定 |
| E2E测试API失败 | API端点路径错误 | 1. 检查后端路由定义<br>2. 验证API端点是否需要认证 | 修正API端点路径或添加认证 |

### 9.8 开发注意事项清单

- [ ] 登录函数必须是async/Promise模式
- [ ] Token必须在状态更新前存储到localStorage
- [ ] 添加normalizeActiveRole函数处理角色数据格式
- [ ] 添加isLoading状态控制加载状态
- [ ] 权限检查前等待isLoading=false
- [ ] 权限检查后延迟500ms确保状态稳定
- [ ] API拦截器正确添加Authorization header
- [ ] 401响应自动清除token并跳转登录页
- [ ] E2E测试验证token存储和页面跳转
- [ ] E2E测试验证API端点路径正确性

---

## 11. Docker 部署经验修正版（2026-06-03）

旧经验中“Docker 启动有问题，建议本地启动前后端”的结论已经过期。当前项目已修复为可用的完整 Docker Compose 启动方式，优先使用以下流程：

```powershell
docker compose up --build -d
docker compose ps
```

验证入口：

| 服务 | 地址 | 预期 |
| --- | --- | --- |
| 前端 | http://localhost:5137 | 可访问 |
| 后端健康检查 | http://localhost:5555/health | 返回成功 |
| 后端 API | http://localhost:5555/api/v1 | 可被前端调用 |
| MongoDB | mongodb://localhost:27017/jobportal | 容器 healthy |

本次修复后的关键经验：

1. 浏览器访问后端必须使用 `http://localhost:5555/api/v1`，不能使用 Docker 内部服务名。
2. 后端容器必须提供 `JWT_SECRET`、`CORS_ORIGIN`、`PORT` 和 `MONGODB_URI`。
3. 服务启动顺序应由 healthcheck 控制：MongoDB healthy 后启动后端，后端 healthy 后启动前端。
4. Dockerfile 使用 `npm ci`，避免容器依赖与 lockfile 不一致。
5. `server/.env.example` 不应包含真实云数据库连接串，只保留本地占位配置。
6. 当前 Dockerfile 不依赖 Docker Hub `node:20` 镜像，改为在可用基础镜像中安装 Node 20 tarball，用于规避本地 Docker Hub 拉取不稳定的问题。

完整说明见 `docs/DOCKER-DEPLOYMENT-GUIDE.md`。

---

**维护者:** AI Assistant  
**更新频率:** 持续更新  
**最后更新:** 2026-06-03
