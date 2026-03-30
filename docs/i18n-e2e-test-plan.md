# 国际化E2E测试计划 / i18n E2E Test Plan

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant

---

## 1. 测试目标 / Test Objectives

### 1.1 核心目标

| 目标 | 描述 | 验收标准 |
|------|------|----------|
| 语言切换功能 | 语言切换器正常工作 | 切换后页面文本正确更新 |
| 语言持久化 | 语言选择被保存 | 刷新页面后语言保持 |
| 页面完整性 | 所有页面支持中英文 | 无硬编码文本显示 |
| 数据一致性 | 语言切换不影响数据 | 数据显示正确无误 |

### 1.2 测试范围

- **支持语言**: 中文(zh)、英文(en)
- **测试页面**: 全部55个页面
- **测试角色**: Freelancer、HR、Admin

---

## 2. 测试架构 / Test Architecture

### 2.1 测试层级

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           E2E国际化测试层级架构                               │
└─────────────────────────────────────────────────────────────────────────────┘

Level 1: 组件级测试 (Component Level)
├── 语言切换器组件测试
├── 导航菜单组件测试
└── 表单组件测试

Level 2: 页面级测试 (Page Level)
├── 公共页面测试 (登录、注册、忘记密码)
├── Freelancer页面测试
├── HR页面测试
└── Admin页面测试

Level 3: 流程级测试 (Flow Level)
├── 登录流程测试
├── 项目申请流程测试
├── 工时提交流程测试
└── 发票审批流程测试

Level 4: 跨角色测试 (Cross-Role Level)
├── 多角色协作测试
├── 数据一致性测试
└── 状态同步测试
```

### 2.2 测试矩阵

| 测试ID | 页面名称 | 路由 | 角色 | 中文测试 | 英文测试 | 优先级 |
|--------|----------|------|------|----------|----------|--------|
| P001 | 登录页面 | /login | 公开 | ✅ | ✅ | P0 |
| P002 | 注册页面 | /register | 公开 | ✅ | ✅ | P0 |
| P003 | 忘记密码 | /forgot-password | 公开 | ✅ | ✅ | P1 |
| P004 | 首页 | / | 所有 | ✅ | ✅ | P0 |
| P005 | Freelancer仪表板 | / | Freelancer | ✅ | ✅ | P0 |
| P006 | HR仪表板 | /hr/dashboard | HR | ✅ | ✅ | P0 |
| P007 | Admin仪表板 | /admin | Admin | ✅ | ✅ | P0 |
| P008 | 职位列表 | /jobs | 所有 | ✅ | ✅ | P0 |
| P009 | 职位详情 | /jobs/:id | 所有 | ✅ | ✅ | P0 |
| P010 | 发布职位 | /jobs/post | HR | ✅ | ✅ | P1 |
| P011 | 我的职位 | /my-jobs | HR | ✅ | ✅ | P1 |
| P012 | 工时列表 | /work-logs | Freelancer | ✅ | ✅ | P0 |
| P013 | 创建工时 | /work-logs/create | Freelancer | ✅ | ✅ | P1 |
| P014 | HR工时管理 | /hr/work-logs | HR | ✅ | ✅ | P0 |
| P015 | 发票列表 | /invoices | Freelancer | ✅ | ✅ | P0 |
| P016 | 创建发票 | /invoices/create | Freelancer | ✅ | ✅ | P1 |
| P017 | 发票详情 | /invoices/:id | 所有 | ✅ | ✅ | P1 |
| P018 | 发票审核 | /invoices/:id/review | HR | ✅ | ✅ | P1 |
| P019 | 个人档案 | /profile | 所有 | ✅ | ✅ | P0 |
| P020 | 公司设置 | /company/setup | HR | ✅ | ✅ | P1 |
| P021 | 申请管理 | /applications | HR | ✅ | ✅ | P1 |
| P022 | 项目申请 | /jobs/:id/apply | Freelancer | ✅ | ✅ | P1 |
| P023 | 用户管理 | /admin/users | Admin | ✅ | ✅ | P1 |
| P024 | 顾问管理 | /admin/freelancers | Admin | ✅ | ✅ | P1 |
| P025 | 公司管理 | /admin/companies | Admin | ✅ | ✅ | P1 |
| P026 | 系统配置 | /admin/config | Admin | ✅ | ✅ | P1 |
| P027 | 角色审批 | /admin/role-approvals | Admin | ✅ | ✅ | P1 |
| P028 | 公司审核 | /admin/company-review | Admin | ✅ | ✅ | P1 |
| P029 | 消息中心 | /messages | 所有 | ✅ | ✅ | P2 |
| P030 | 工单系统 | /tickets | 所有 | ✅ | ✅ | P2 |
| P031 | 评价管理 | /ratings | 所有 | ✅ | ✅ | P2 |
| P032 | 支付管理 | /payments | 所有 | ✅ | ✅ | P2 |
| P033 | 合同管理 | /contracts | 所有 | ✅ | ✅ | P2 |
| P034 | 报表中心 | /reports | 所有 | ✅ | ✅ | P2 |
| P035 | 信用历史 | /credit-history | 所有 | ✅ | ✅ | P2 |

---

## 3. 详细测试用例 / Detailed Test Cases

### 3.1 Phase 1: 公共页面测试 (Public Pages)

#### 3.1.1 登录页面测试 (P001)

```typescript
test.describe('i18n-P001: 登录页面国际化测试', () => {
  test('中文-登录页面应正确显示中文文本', async ({ page }) => {
    // 1. 设置语言为中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    
    // 2. 访问登录页面
    await page.goto('/login');
    
    // 3. 验证中文文本
    await expect(page.locator('[data-testid="page-title"]')).toContainText('欢迎回来');
    await expect(page.locator('text=登录您的账户继续操作')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('登录');
    await expect(page.locator('text=还没有账户')).toBeVisible();
    await expect(page.locator('text=立即注册')).toBeVisible();
    
    // 4. 截图保存
    await page.screenshot({ path: 'test-results/i18n/login-zh.png' });
  });
  
  test('英文-登录页面应正确显示英文文本', async ({ page }) => {
    // 1. 设置语言为英文
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    
    // 2. 访问登录页面
    await page.goto('/login');
    
    // 3. 验证英文文本
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Welcome Back');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('Login');
    await expect(page.locator('text=Don\'t have an account')).toBeVisible();
    await expect(page.locator('text=Register now')).toBeVisible();
    
    // 4. 截图保存
    await page.screenshot({ path: 'test-results/i18n/login-en.png' });
  });
});
```

#### 3.1.2 注册页面测试 (P002)

```typescript
test.describe('i18n-P002: 注册页面国际化测试', () => {
  test('中文-注册页面应正确显示中文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/register');
    
    await expect(page.locator('[data-testid="page-title"]')).toContainText('创建账户');
    await expect(page.locator('text=已有账户')).toBeVisible();
    await expect(page.locator('text=立即登录')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/register-zh.png' });
  });
  
  test('英文-注册页面应正确显示英文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/register');
    
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Create Account');
    await expect(page.locator('text=Already have an account')).toBeVisible();
    await expect(page.locator('text=Sign in')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/register-en.png' });
  });
});
```

### 3.2 Phase 2: Freelancer页面测试

#### 3.2.1 Freelancer仪表板测试 (P005)

```typescript
test.describe('i18n-P005: Freelancer仪表板国际化测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFreelancer(page);
  });
  
  test('中文-Freelancer仪表板应正确显示中文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证导航菜单
    await expect(page.locator('text=工作台')).toBeVisible();
    await expect(page.locator('text=职位列表')).toBeVisible();
    await expect(page.locator('text=我的工时')).toBeVisible();
    await expect(page.locator('text=我的发票')).toBeVisible();
    await expect(page.locator('text=个人档案')).toBeVisible();
    
    // 验证仪表板内容
    await expect(page.locator('text=待处理工时')).toBeVisible();
    await expect(page.locator('text=待处理发票')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/freelancer-dashboard-zh.png' });
  });
  
  test('英文-Freelancer仪表板应正确显示英文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证导航菜单
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Jobs')).toBeVisible();
    await expect(page.locator('text=Work Logs')).toBeVisible();
    await expect(page.locator('text=Invoices')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/freelancer-dashboard-en.png' });
  });
});
```

#### 3.2.2 工时管理页面测试 (P012-P014)

```typescript
test.describe('i18n-P012: 工时列表页面国际化测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFreelancer(page);
  });
  
  test('中文-工时列表应正确显示中文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/work-logs');
    
    await expect(page.locator('text=工时记录')).toBeVisible();
    await expect(page.locator('text=创建工时')).toBeVisible();
    await expect(page.locator('text=状态')).toBeVisible();
    await expect(page.locator('text=日期')).toBeVisible();
    await expect(page.locator('text=小时数')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/work-logs-zh.png' });
  });
  
  test('英文-工时列表应正确显示英文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/work-logs');
    
    await expect(page.locator('text=Work Logs')).toBeVisible();
    await expect(page.locator('text=Create Work Log')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Hours')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/work-logs-en.png' });
  });
});
```

### 3.3 Phase 3: HR页面测试

#### 3.3.1 HR仪表板测试 (P006)

```typescript
test.describe('i18n-P006: HR仪表板国际化测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsHR(page);
  });
  
  test('中文-HR仪表板应正确显示中文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/hr/dashboard');
    
    await expect(page.locator('text=HR工作台')).toBeVisible();
    await expect(page.locator('text=待审核工时')).toBeVisible();
    await expect(page.locator('text=待审批发票')).toBeVisible();
    await expect(page.locator('text=进行中项目')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/hr-dashboard-zh.png' });
  });
  
  test('英文-HR仪表板应正确显示英文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/hr/dashboard');
    
    await expect(page.locator('text=HR Dashboard')).toBeVisible();
    await expect(page.locator('text=Pending Work Logs')).toBeVisible();
    await expect(page.locator('text=Pending Invoices')).toBeVisible();
    await expect(page.locator('text=Active Projects')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/hr-dashboard-en.png' });
  });
});
```

### 3.4 Phase 4: Admin页面测试

#### 3.4.1 Admin仪表板测试 (P007)

```typescript
test.describe('i18n-P007: Admin仪表板国际化测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });
  
  test('中文-Admin仪表板应正确显示中文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/admin');
    
    await expect(page.locator('text=管理后台')).toBeVisible();
    await expect(page.locator('text=用户管理')).toBeVisible();
    await expect(page.locator('text=顾问管理')).toBeVisible();
    await expect(page.locator('text=公司管理')).toBeVisible();
    await expect(page.locator('text=系统配置')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/admin-dashboard-zh.png' });
  });
  
  test('英文-Admin仪表板应正确显示英文文本', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/admin');
    
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Freelancer Management')).toBeVisible();
    await expect(page.locator('text=Company Management')).toBeVisible();
    await expect(page.locator('text=System Configuration')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/admin-dashboard-en.png' });
  });
});
```

### 3.5 Phase 5: 流程级测试

#### 3.5.1 完整登录流程测试

```typescript
test.describe('i18n-FLOW-001: 完整登录流程国际化测试', () => {
  test('中文-完整登录流程应正确显示中文', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.goto('/login');
    
    // 输入凭据
    await page.fill('[data-testid="email-input"]', 'freelancer@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    
    // 验证表单文本
    await expect(page.locator('text=邮箱')).toBeVisible();
    await expect(page.locator('text=密码')).toBeVisible();
    
    // 提交登录
    await page.click('[data-testid="login-submit-btn"]');
    
    // 等待跳转
    await page.waitForURL(/^(?!.*login).*/);
    
    // 验证登录后页面
    await expect(page.locator('text=欢迎')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/login-flow-zh.png' });
  });
  
  test('英文-完整登录流程应正确显示英文', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'freelancer@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForURL(/^(?!.*login).*/);
    
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/i18n/login-flow-en.png' });
  });
});
```

#### 3.5.2 语言切换持久化测试

```typescript
test.describe('i18n-FLOW-002: 语言切换持久化测试', () => {
  test('语言选择应在页面刷新后保持', async ({ page }) => {
    // 1. 设置语言为英文
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/login');
    
    // 2. 验证英文显示
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('Login');
    
    // 3. 刷新页面
    await page.reload();
    
    // 4. 验证语言保持
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('Login');
    
    // 5. 切换到中文
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-zh"]');
    await page.waitForTimeout(1000);
    
    // 6. 验证中文显示
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('登录');
    
    // 7. 刷新页面
    await page.reload();
    
    // 8. 验证语言保持
    await expect(page.locator('[data-testid="login-submit-btn"]')).toContainText('登录');
  });
});
```

---

## 4. 测试执行计划 / Test Execution Plan

### 4.1 执行顺序

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           测试执行顺序（按依赖关系）                           │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: 基础组件测试 (无依赖)
├── 语言切换器组件测试
├── 导航菜单组件测试
└── 公共页面测试 (登录、注册)

Phase 2: Freelancer页面测试 (依赖Phase 1)
├── Freelancer仪表板测试
├── 职位列表测试
├── 工时管理测试
└── 发票管理测试

Phase 3: HR页面测试 (依赖Phase 1)
├── HR仪表板测试
├── 职位发布测试
├── 申请管理测试
└── 工时/发票审批测试

Phase 4: Admin页面测试 (依赖Phase 1)
├── Admin仪表板测试
├── 用户管理测试
├── 公司管理测试
└── 系统配置测试

Phase 5: 流程级测试 (依赖Phase 2-4)
├── 完整登录流程测试
├── 项目申请流程测试
├── 工时提交流程测试
└── 发票审批流程测试

Phase 6: 跨角色测试 (依赖Phase 5)
├── 多角色协作测试
├── 数据一致性测试
└── 语言切换持久化测试
```

### 4.2 执行命令

```powershell
# 运行所有国际化测试
npx playwright test e2e-tests/i18n-comprehensive.spec.ts --headed

# 运行特定阶段的测试
npx playwright test e2e-tests/i18n-comprehensive.spec.ts -g "Phase 1"
npx playwright test e2e-tests/i18n-comprehensive.spec.ts -g "Phase 2"

# 生成测试报告
npx playwright test e2e-tests/i18n-comprehensive.spec.ts --reporter=html
npx playwright show-report
```

---

## 5. 问题追踪模板 / Issue Tracking Template

### 5.1 国际化问题记录

| 问题ID | 页面 | 语言 | 问题描述 | 预期文本 | 实际文本 | 优先级 | 状态 |
|--------|------|------|----------|----------|----------|--------|------|
| i18n-001 | 登录页 | en | 按钮未翻译 | Login | 登录 | P0 | 待修复 |
| i18n-002 | 仪表板 | zh | 标题缺失 | 工作台 | Dashboard | P1 | 待修复 |

### 5.2 问题修复流程

```
发现问题
    │
    ▼
记录到问题追踪表
    │
    ▼
分析根本原因
├── 翻译文件缺失
├── 组件未使用useTranslation
├── 翻译key错误
└── 其他问题
    │
    ▼
实施修复
├── 添加翻译文本
├── 修改组件代码
├── 修正翻译key
└── 其他修复
    │
    ▼
验证修复
├── 重新运行测试
├── 截图对比
└── 更新问题状态
```

---

## 6. 验收标准 / Acceptance Criteria

### 6.1 功能验收标准

| 标准 | 描述 | 验证方法 |
|------|------|----------|
| 语言切换 | 用户可以切换语言 | 点击语言切换器，选择语言 |
| 语言持久化 | 刷新页面后语言保持 | 刷新页面，验证语言不变 |
| 文本完整性 | 所有文本正确翻译 | 对比中英文截图 |
| 无硬编码 | 无硬编码文本显示 | 检查页面源码 |

### 6.2 质量验收标准

| 标准 | 目标值 | 验证方法 |
|------|--------|----------|
| 测试通过率 | 100% | 所有测试用例通过 |
| 页面覆盖率 | 100% | 所有页面都有测试用例 |
| 语言覆盖率 | 100% | 中英文都有测试 |
| 截图对比 | 通过 | 中英文截图对比正确 |

---

## 7. 测试报告模板 / Test Report Template

### 7.1 测试执行报告

```markdown
# 国际化E2E测试报告

## 测试概览
- 执行日期: YYYY-MM-DD HH:mm:ss
- 执行环境: Windows/Chrome
- 测试人员: AI Assistant

## 测试结果统计
| 指标 | 数值 |
|------|------|
| 总测试用例数 | XX |
| 通过数 | XX |
| 失败数 | XX |
| 跳过数 | XX |
| 通过率 | XX% |

## 页面覆盖统计
| 角色 | 页面数 | 测试覆盖 | 覆盖率 |
|------|--------|----------|--------|
| 公开 | 3 | 3 | 100% |
| Freelancer | 15 | 15 | 100% |
| HR | 12 | 12 | 100% |
| Admin | 10 | 10 | 100% |

## 问题统计
| 优先级 | 数量 | 已修复 | 待修复 |
|--------|------|--------|--------|
| P0 | XX | XX | XX |
| P1 | XX | XX | XX |
| P2 | XX | XX | XX |

## 详细问题列表
[问题详情表格]

## 截图对比
[中英文截图对比]

## 建议
[改进建议]
```

---

## 8. 附录 / Appendix

### 8.1 翻译文件清单

| 文件路径 | 语言 | 命名空间 | 状态 |
|----------|------|----------|------|
| i18n/locales/zh/common.json | 中文 | common | ✅ 已创建 |
| i18n/locales/en/common.json | 英文 | common | ✅ 已创建 |
| i18n/locales/zh/auth.json | 中文 | auth | ✅ 已创建 |
| i18n/locales/en/auth.json | 英文 | auth | ✅ 已创建 |
| i18n/locales/zh/dashboard.json | 中文 | dashboard | ✅ 已创建 |
| i18n/locales/en/dashboard.json | 英文 | dashboard | ✅ 已创建 |
| i18n/locales/zh/jobs.json | 中文 | jobs | ✅ 已创建 |
| i18n/locales/en/jobs.json | 英文 | jobs | ✅ 已创建 |
| i18n/locales/zh/admin.json | 中文 | admin | ⏳ 待创建 |
| i18n/locales/en/admin.json | 英文 | admin | ⏳ 待创建 |
| i18n/locales/zh/validation.json | 中文 | validation | ✅ 已创建 |
| i18n/locales/en/validation.json | 英文 | validation | ✅ 已创建 |

### 8.2 组件迁移清单

| 组件 | 状态 | 优先级 |
|------|------|--------|
| LanguageSwitcher | ✅ 已迁移 | P0 |
| GlobalNavbar | ⏳ 待迁移 | P0 |
| PortalLayout | ⏳ 待迁移 | P0 |
| LoginPage | ⏳ 待迁移 | P0 |
| RegisterPage | ⏳ 待迁移 | P0 |
| FreelancerDashboardPage | ⏳ 待迁移 | P0 |
| HRDashboardPage | ⏳ 待迁移 | P0 |
| AdminDashboardPage | ⏳ 待迁移 | P0 |

---

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant
