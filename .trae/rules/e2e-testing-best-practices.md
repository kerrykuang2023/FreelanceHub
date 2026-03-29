# E2E 测试最佳实践

**文档版本:** v1.2  
**创建日期:** 2026-03-25  
**更新日期:** 2026-03-28  
**维护者:** AI Assistant

---

## 1. 核心原则

### 1.0 业务依赖优先原则（最重要）

**测试必须按照业务逻辑依赖关系顺序执行，确保前置条件满足。**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           测试执行依赖顺序                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 0: 系统初始化 (必须最先执行)
├── 验证MongoDB连接
├── 验证后端服务启动
├── 验证前端服务启动
└── 验证测试用户存在

Phase 1: 管理员系统配置 (必须先于业务操作)
├── 管理员登录
├── 技能分类管理
├── 工作性质枚举配置
└── 其他系统配置

Phase 2: 公司注册与认证 (必须先于HR发布项目)
├── HR用户注册
├── 公司信息填写
└── 管理员审核公司认证

Phase 3: 顾问注册与档案 (可与Phase 2并行)
├── 顾问用户注册
└── 顾问档案填写

Phase 4: 项目发布与申请 (依赖Phase 1-3)
├── HR发布项目
├── 顾问申请项目
└── HR批准申请

Phase 5: 工时填报与审核 (依赖Phase 4)
├── 顾问创建工时
├── 顾问提交工时
└── HR确认/驳回工时

Phase 6: 发票创建与审批 (依赖Phase 5)
├── 顾问创建发票
├── 顾问提交发票
└── HR审批发票

Phase 7: 付款与收款确认 (依赖Phase 6)
├── HR确认付款
└── 顾问确认收款

Phase 8: 反向流程与异常场景 (依赖Phase 1-7的数据)
├── 状态限制验证
└── 异常操作验证
```

**违反依赖顺序的后果：**
- 测试失败：前置数据不存在
- 数据不一致：关联关系错误
- 状态异常：业务逻辑无法执行

### 1.1 测试验证的完整性

每个 E2E 测试用例必须包含以下验证：

| 验证层级 | 验证内容 | 验证方式 |
|----------|----------|----------|
| **L1 - UI 操作** | 页面元素操作成功 | Playwright 操作 |
| **L2 - 路由跳转** | 页面跳转正确 | URL 验证 |
| **L3 - 控制台监控** | 无 JavaScript 错误 | 控制台监听 |
| **L4 - 网络请求** | API 调用成功 | 网络请求监控 |
| **L5 - 数据验证** | 后端数据存在 | API 查询验证 |
| **L6 - 状态流转** | 状态转换正确 | 前后端状态对比 |
| **L7 - 跨角色同步** | 数据跨角色可见 | 多角色验证 |

### 1.2 测试结果输出规范

**重要：** 所有 E2E 测试运行时，必须将测试结果输出到文件，便于：
1. 实时查看测试进度
2. 测试结束后排查问题
3. 保留测试历史记录

**测试结果输出命令：**
```powershell
# 运行测试并输出结果到文件
npx playwright test e2e-tests/xxx.spec.ts --reporter=list 2>&1 | Tee-Object -FilePath "test-results/xxx-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# 或者使用重定向
npx playwright test e2e-tests/xxx.spec.ts --reporter=list > test-results/xxx.log 2>&1
```

**测试结果文件命名规范：**
```
test-results/
├── YYYY-MM-DD/
│   ├── full-e2e-test-HHMMSS.log
│   ├── admin-test-HHMMSS.log
│   ├── hr-test-HHMMSS.log
│   └── freelancer-test-HHMMSS.log
```

### 1.3 测试框架的完整性

```
完整的 E2E 测试框架
├── 1. 页面监控设置
│   ├── 控制台错误捕获
│   ├── 网络请求监控
│   └── 页面错误监听
├── 2. 页面操作
│   ├── 导航与路由验证
│   ├── 元素操作
│   └── 表单提交
├── 3. 操作验证
│   ├── 成功提示验证
│   ├── 路由跳转验证
│   └── 控制台错误检查
└── 4. 数据验证
    ├── API 查询验证
    ├── 数据库记录验证
    └── 状态流转验证
```

---

## 2. 测试助手类设计

### 2.1 核心功能

```typescript
export class TestHelper {
  // 页面监控
  static async setupPageMonitoring(page: Page): Promise<void>
  static getConsoleErrors(): ConsoleError[]
  static getNetworkRequests(): NetworkRequest[]
  static clearErrors(): void
  
  // 页面操作
  static async loginAsUser(page: Page, user: TestUser): Promise<{
    success: boolean;
    errors: ConsoleError[];
  }>
  
  static async navigateToPage(
    page: Page, 
    urlPath: string, 
    expectedUrlPattern?: RegExp
  ): Promise<{
    success: boolean;
    errors: ConsoleError[];
    actualUrl: string;
  }>
  
  static async fillFormAndSubmit(
    page: Page,
    formData: Record<string, string>,
    submitSelector: string
  ): Promise<{
    success: boolean;
    errors: ConsoleError[];
  }>
}
```

### 2.2 数据验证类

```typescript
export class DataVerifier {
  static async verifyCompanyExists(
    request: APIRequestContext, 
    companyName: string
  ): Promise<{ exists: boolean; company?: any }>
  
  static async verifyProjectExists(
    request: APIRequestContext, 
    projectTitle: string
  ): Promise<{ exists: boolean; project?: any }>
  
  static async verifyApplicationExists(
    request: APIRequestContext, 
    freelancerId: string,
    jobId: string
  ): Promise<{ exists: boolean; application?: any }>
}
```

### 2.3 问题日志类

```typescript
export class IssueLogger {
  logIssue(issue: {
    category: 'UX' | 'LOGIC' | 'API' | 'UI' | 'PERMISSION' | 'DATA';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    expectedBehavior: string;
    actualBehavior: string;
    steps: string[];
    consoleErrors?: ConsoleError[];
    networkErrors?: NetworkRequest[];
  })
}
```

---

## 3. 测试编写规范

### 3.1 测试结构

```typescript
test.describe('【角色】功能模块', () => {
  test('【角色 -01】测试用例名称', async ({ page, request }) => {
    // 1. 设置页面监控
    await TestHelper.setupPageMonitoring(page);
    
    // 2. 执行操作
    const result = await TestHelper.someAction(page);
    
    // 3. 验证 UI 层面
    if (!result.success) {
      // 记录问题
      issueLogger.logIssue({...});
    }
    
    // 4. 验证后端数据
    const dataExists = await DataVerifier.verifyData(request, ...);
    if (!dataExists.exists) {
      // 记录问题
      issueLogger.logIssue({...});
    }
    
    // 5. 清理
    await TestHelper.logout(page);
  });
});
```

### 3.2 错误处理模式

```typescript
// ✅ 推荐：完整的错误处理
test('测试用例', async ({ page, request }) => {
  await TestHelper.setupPageMonitoring(page);
  
  const loginResult = await TestHelper.loginAsUser(page, user);
  
  if (!loginResult.success) {
    issueLogger.logIssue({
      category: 'UX',
      severity: 'CRITICAL',
      description: '用户登录失败',
      expectedBehavior: '用户应该能够成功登录',
      actualBehavior: '登录失败',
      steps: ['访问登录页面', '输入账号密码', '点击登录'],
      consoleErrors: loginResult.errors,
    });
    throw new Error('登录失败');
  }
  
  // 检查控制台错误
  if (loginResult.errors.length > 0) {
    const criticalErrors = loginResult.errors.filter(e => 
      e.type === 'error' || e.type === 'pageerror'
    );
    
    if (criticalErrors.length > 0) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '登录过程存在控制台错误',
        expectedBehavior: '登录过程应无控制台错误',
        actualBehavior: `存在 ${criticalErrors.length} 个错误`,
        consoleErrors: criticalErrors,
      });
    }
  }
});
```

### 3.3 数据验证模式

```typescript
// ✅ 推荐：完整的后端数据验证
test('注册公司并验证数据', async ({ page, request }) => {
  const companyName = `测试公司-${Date.now()}`;
  
  // 1. UI 操作：填写表单
  await TestHelper.fillFormAndSubmit(page, {
    'input[name="company_name"]': companyName,
    // ...
  }, 'button[type="submit"]');
  
  // 2. 验证后端数据
  const companyExists = await DataVerifier.verifyCompanyExists(
    request,
    companyName
  );
  
  if (companyExists.exists) {
    context.companyId = companyExists.company?._id;
    console.log(`✅ 公司数据验证通过，ID: ${context.companyId}`);
  } else {
    issueLogger.logIssue({
      category: 'DATA',
      severity: 'CRITICAL',
      description: '公司数据在数据库中不存在',
      expectedBehavior: '注册后公司数据应该存在于数据库',
      actualBehavior: 'API 查询不到公司数据',
      steps: ['调用 GET /api/v1/admin/companies'],
    });
  }
});
```

---

## 4. 常见问题排查

### 4.1 页面路由问题

| 问题 | 排查方法 | 解决方案 |
|------|----------|----------|
| 路由不存在 | 检查 URL 是否匹配 | 查看 router 配置 |
| 页面跳转失败 | 验证导航后 URL | 检查权限和路由守卫 |
| 404 错误 | 检查路由配置 | 添加路由或修复路径 |

**排查示例：**
```typescript
// 尝试多个可能的路径
const possiblePaths = [
  '/company/register',
  '/company/setup',
  '/company/new',
];

for (const path of possiblePaths) {
  const result = await TestHelper.navigateToPage(page, path, undefined, 3000);
  if (result.success) {
    console.log(`✅ 找到公司注册页面：${path}`);
    break;
  }
}
```

### 4.2 表单提交问题

| 问题 | 排查方法 | 解决方案 |
|------|----------|----------|
| 表单元素不存在 | 检查选择器 | 使用 DevTools 查看实际元素 |
| 提交无响应 | 检查控制台错误 | 修复 JavaScript 错误 |
| 提交后无数据 | 检查网络请求 | 查看 API 是否被调用 |

**排查示例：**
```typescript
// 检查表单元素是否存在
const elementExists = await TestHelper.verifyElementExists(
  page,
  'input[name="company_name"]',
  '公司名称输入框'
);

if (!elementExists.exists) {
  // 尝试其他选择器
  const altSelectors = [
    'input[placeholder*="公司名称"]',
    '[data-testid="company-name-input"]',
  ];
  
  for (const selector of altSelectors) {
    const altExists = await TestHelper.verifyElementExists(
      page,
      selector,
      `备选选择器：${selector}`
    );
    if (altExists.exists) break;
  }
}
```

### 4.3 数据验证问题

| 问题 | 排查方法 | 解决方案 |
|------|----------|----------|
| API 查询不到数据 | 检查 API 端点 | 验证 API 路径和参数 |
| 数据状态不对 | 检查状态流转 | 验证业务流程 |
| 数据库连接失败 | 检查 MongoDB | 确保数据库运行 |

**排查示例：**
```typescript
// 完整的 API 验证流程
const response = await request.get(`${API_URL}/admin/companies`);
const data = await response.json();

console.log('API 响应:', data);

const companies = data.data?.items || data.data || [];
console.log(`找到 ${companies.length} 家公司`);

const company = companies.find(c => c.company_name === companyName);
if (company) {
  console.log('✅ 公司数据存在:', company);
} else {
  console.log('❌ 公司数据不存在');
  console.log('所有公司:', companies.map(c => c.company_name));
}
```

---

## 5. 测试执行流程

### 5.1 测试前准备

```bash
# 1. 确保服务运行
docker ps | findstr mongo
# 或
netstat -ano | findstr "27017"

# 2. 启动后端
cd JobPortal/server
npm run dev

# 3. 启动前端
cd JobPortal/client
npm run dev

# 4. 验证服务
Invoke-WebRequest -Uri "http://localhost:5137"
Invoke-WebRequest -Uri "http://localhost:5555/api/v1/auth/login" -Method POST
```

### 5.2 运行测试

```bash
# 运行单个测试文件
npx playwright test e2e-tests/enhanced-hr-company.spec.ts --headed

# 运行特定测试
npx playwright test -g "HR-01"

# 可视化运行
npx playwright test --ui

# 生成报告
npx playwright test --reporter=html
npx playwright show-report
```

### 5.3 测试结果分析

**测试报告应包含：**
1. 通过的测试数量
2. 失败的测试数量
3. 控制台错误列表
4. 网络错误列表
5. 数据验证失败列表
6. 截图和视频证据

---

## 6. 测试覆盖率要求

### 6.1 功能覆盖率

| 功能类型 | 覆盖率要求 | 说明 |
|----------|------------|------|
| P0 - 核心功能 | 100% | 登录、注册、主要业务流程 |
| P1 - 重要功能 | 90% | 次要业务流程、管理功能 |
| P2 - 一般功能 | 70% | 辅助功能、配置功能 |

### 6.2 验证覆盖率

| 验证类型 | 覆盖率要求 | 说明 |
|----------|------------|------|
| UI 操作验证 | 100% | 所有测试都必须验证 UI 操作 |
| 路由跳转验证 | 100% | 所有页面跳转都必须验证 |
| 控制台监控 | 100% | 所有测试都必须监控控制台 |
| 后端数据验证 | 80% | 数据创建/更新操作必须验证 |
| 网络请求监控 | 80% | API 调用必须监控响应 |

---

## 7. 测试维护

### 7.1 测试更新时机

| 触发条件 | 更新内容 | 优先级 |
|----------|----------|--------|
| 功能变更 | 更新测试用例 | P0 |
| 发现 Bug | 添加回归测试 | P0 |
| 页面重构 | 更新选择器 | P0 |
| API 变更 | 更新验证逻辑 | P0 |
| 新增功能 | 添加测试用例 | P1 |

### 7.2 测试代码审查清单

- [ ] 是否设置了页面监控
- [ ] 是否验证了路由跳转
- [ ] 是否检查了控制台错误
- [ ] 是否验证了后端数据
- [ ] 是否记录了所有问题
- [ ] 是否有适当的等待时间
- [ ] 是否清理了测试状态

---

## 8. 经验总结

### 8.1 已发现的问题模式

| 问题 ID | 问题描述 | 发现方式 | 解决方案 |
|---------|----------|----------|----------|
| ISS-001 | FreelancerDashboardPage filter 错误 | 控制台监控 | 修复 dashboard 数据加载逻辑 |
| ISS-002 | 公司注册页面表单选择器不匹配 | 表单提交验证 | 使用实际页面元素选择器 |
| ISS-003 | 公司注册后 API 查询不到数据 | 后端数据验证 | 检查 API 端点和数据库 |
| ISS-004 | 项目发布后数据不存在 | 后端数据验证 | 检查项目创建流程 |
| ISS-005 | 跨角色登录超时 | 登录流程监控 | 优化 cookie 清理策略 |

### 8.2 测试框架演进

**V1.0 (基础版):**
- 基本的页面操作
- 简单的登录登出
- 无后端数据验证

**V2.0 (增强版):**
- ✅ 完整的控制台错误监控
- ✅ 网络请求监控
- ✅ 路由跳转验证
- ✅ 后端数据验证
- ✅ 问题日志记录
- ✅ 详细的测试报告

---

## 9. 附录

### 9.1 测试工具类速查

| 类名 | 主要功能 | 使用场景 |
|------|----------|----------|
| TestHelper | 页面操作、监控 | 所有测试 |
| DataVerifier | 数据验证 | 数据创建/更新后 |
| IssueLogger | 问题记录 | 发现问题时 |
| MasterDataChecker | 主数据检查 | 测试前准备 |

### 9.2 常用 API 端点

```typescript
// 公司相关
GET  /api/v1/admin/companies
POST /api/v1/companies/setup
GET  /api/v1/companies/my-company

// 项目相关
GET  /api/v1/jobs
POST /api/v1/jobs
GET  /api/v1/jobs/:id

// 申请相关
GET  /api/v1/applications
POST /api/v1/applications
PUT  /api/v1/applications/:id/approve

// 工时相关
GET  /api/v1/work-logs
POST /api/v1/work-logs
PUT  /api/v1/work-logs/:id/confirm

// 发票相关
GET  /api/v1/invoices
POST /api/v1/invoices
PUT  /api/v1/invoices/:id/approve
```

### 9.3 测试选择器策略

```typescript
// 优先级顺序
1. [data-testid="..."]        // 最稳定，推荐
2. input[name="..."]          // 语义化，可接受
3. button:has-text("...")     // 文本匹配，备用
4. [class*="button"]          // CSS 匹配，不推荐
5. div > div > button         // 结构选择器，禁止
```

---

**文档版本:** v1.0  
**创建日期:** 2026-03-25  
**维护者:** AI Assistant  
**更新频率:** 持续更新
