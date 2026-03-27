# 完整E2E测试场景设计文档

**文档版本:** v1.0  
**创建日期:** 2026-03-25  
**维护者:** AI Assistant

---

## 1. 测试场景总览

### 1.1 测试范围

| 测试类型 | 覆盖范围 | 测试数量 |
|----------|----------|----------|
| UI测试 | 页面元素、交互、显示 | 50+ |
| API测试 | 接口调用、数据验证 | 30+ |
| 业务流程测试 | 跨角色业务流程 | 8 |
| 权限测试 | 角色权限边界 | 15+ |
| 数据一致性测试 | 前后端数据同步 | 20+ |

### 1.2 测试角色

| 角色 | 测试账号 | 密码 | 用途 |
|------|----------|------|------|
| 管理员 | admin@test.com | Test123456! | 管理员功能测试 |
| HR招聘官 | hr@test.com | Test123456! | HR功能测试 |
| 求职者 | freelancer@test.com | Test123456! | 求职者功能测试 |

---

## 2. 求职者测试场景

### 2.1 认证流程测试

```typescript
describe('求职者认证流程', () => {
  test('F-AUTH-01: 求职者注册', async ({ page, request }) => {
    // 1. 访问注册页面
    await page.goto('/register');
    
    // 2. 填写注册表单
    await page.fill('input[name="email"]', `freelancer-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.selectOption('select[name="userType"]', 'Job Seeker');
    
    // 3. 提交注册
    await page.click('button[type="submit"]');
    
    // 4. 验证跳转到登录页或首页
    await expect(page).toHaveURL(/\/(login|)/);
    
    // 5. 后端验证：用户已创建
    const response = await request.get(`${API_URL}/users/me`);
    expect(response.status()).toBe(200);
  });

  test('F-AUTH-02: 求职者登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'freelancer@test.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // 验证跳转到Dashboard
    await expect(page).toHaveURL('/');
    
    // 验证Dashboard显示求职者统计
    await expect(page.locator('text=进行中项目')).toBeVisible();
  });

  test('F-AUTH-03: 密码找回', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'freelancer@test.com');
    await page.click('button[type="submit"]');
    
    // 验证提示信息
    await expect(page.locator('text=邮件已发送')).toBeVisible();
  });
});
```

### 2.2 项目浏览与申请测试

```typescript
describe('求职者项目浏览与申请', () => {
  test('F-PROJ-01: 浏览项目列表', async ({ page, request }) => {
    await loginAsFreelancer(page);
    await page.goto('/jobs');
    
    // 验证项目列表显示
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    expect(count).toBeGreaterThan(0);
    
    // 后端验证：API返回数据
    const response = await request.get(`${API_URL}/jobs`);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test('F-PROJ-02: 项目筛选', async ({ page }) => {
    await loginAsFreelancer(page);
    await page.goto('/jobs');
    
    // 选择技能分类
    await page.click('[data-testid="skill-filter"]');
    await page.click('text=SAP');
    
    // 等待列表更新
    await page.waitForTimeout(500);
    
    // 验证筛选结果
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    
    // 验证所有显示的项目都包含SAP技能
    for (let i = 0; i < count; i++) {
      const card = projectCards.nth(i);
      await expect(card.locator('text=/SAP/i')).toBeVisible();
    }
  });

  test('F-PROJ-03: 查看项目详情', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 获取一个项目ID
    const response = await request.get(`${API_URL}/jobs`);
    const data = await response.json();
    const projectId = data.data.items[0]._id;
    
    await page.goto(`/jobs/${projectId}`);
    
    // 验证项目详情显示
    await expect(page.locator('[data-testid="project-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-description"]')).toBeVisible();
    await expect(page.locator('button:has-text("申请")')).toBeVisible();
  });

  test('F-PROJ-04: 申请项目', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 获取一个可申请的项目
    const response = await request.get(`${API_URL}/jobs?status=published`);
    const data = await response.json();
    const project = data.data.items.find((p: any) => p.status === 'published');
    
    if (!project) {
      console.log('没有可申请的项目，跳过测试');
      return;
    }
    
    await page.goto(`/jobs/${project._id}`);
    await page.click('button:has-text("申请")');
    
    // 填写申请表单（如果有）
    const applyForm = page.locator('[data-testid="application-form"]');
    if (await applyForm.isVisible()) {
      await page.fill('textarea[name="message"]', '我对这个项目很感兴趣...');
      await page.click('button[type="submit"]');
    }
    
    // 验证申请成功
    await expect(page.locator('text=申请已提交')).toBeVisible();
    
    // 后端验证：申请记录存在
    const appResponse = await request.get(`${API_URL}/applications?freelancer_id=me`);
    const appData = await appResponse.json();
    const application = appData.data.items.find((a: any) => a.job_id === project._id);
    expect(application).toBeDefined();
  });

  test('F-PROJ-05: 收藏项目', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 获取一个项目
    const response = await request.get(`${API_URL}/jobs`);
    const data = await response.json();
    const projectId = data.data.items[0]._id;
    
    await page.goto(`/jobs/${projectId}`);
    
    // 点击收藏按钮
    await page.click('[data-testid="bookmark-button"]');
    
    // 验证收藏成功
    await expect(page.locator('[data-testid="bookmark-button"].active')).toBeVisible();
    
    // 验证收藏列表
    await page.goto('/saved-jobs');
    await expect(page.locator(`[data-project-id="${projectId}"]`)).toBeVisible();
  });
});
```

### 2.3 工时管理测试

```typescript
describe('求职者工时管理', () => {
  test('F-WORKLOG-01: 填报工时', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 确保有进行中的项目
    const projectResponse = await request.get(`${API_URL}/my-projects?status=in_progress`);
    const projectData = await projectResponse.json();
    
    if (projectData.data.items.length === 0) {
      console.log('没有进行中的项目，跳过测试');
      return;
    }
    
    await page.goto('/work-logs/new');
    
    // 填写工时表单
    await page.selectOption('select[name="project_id"]', projectData.data.items[0]._id);
    await page.fill('input[name="work_date"]', getTodayDate());
    await page.fill('input[name="hours_worked"]', '8');
    await page.selectOption('select[name="work_type"]', 'remote_work');
    await page.fill('textarea[name="work_description"]', '完成模块开发和单元测试');
    
    // 提交工时
    await page.click('button[type="submit"]');
    
    // 验证提交成功
    await expect(page.locator('text=工时已保存')).toBeVisible();
    
    // 后端验证
    const workLogResponse = await request.get(`${API_URL}/work-logs?status=draft`);
    const workLogData = await workLogResponse.json();
    const workLog = workLogData.data.items.find((w: any) => 
      w.work_date === getTodayDate() && w.hours_worked === 8
    );
    expect(workLog).toBeDefined();
  });

  test('F-WORKLOG-02: 批量提交工时', async ({ page, request }) => {
    await loginAsFreelancer(page);
    await page.goto('/work-logs');
    
    // 等待草稿工时加载
    await page.waitForSelector('[data-testid="work-log-item"]');
    
    // 选择多个草稿工时
    const checkboxes = page.locator('input[type="checkbox"][data-testid="worklog-checkbox"]');
    const count = await checkboxes.count();
    
    if (count < 2) {
      console.log('草稿工时不足，跳过测试');
      return;
    }
    
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    
    // 点击批量提交
    await page.click('button:has-text("批量提交")');
    
    // 确认提交
    await page.click('button:has-text("确认")');
    
    // 验证提交成功
    await expect(page.locator('text=批量提交成功')).toBeVisible();
    
    // 后端验证：工时状态已更新
    const response = await request.get(`${API_URL}/work-logs?status=submitted`);
    const data = await response.json();
    expect(data.data.items.length).toBeGreaterThanOrEqual(2);
  });

  test('F-WORKLOG-03: 编辑草稿工时', async ({ page, request }) => {
    await loginAsFreelancer(page);
    await page.goto('/work-logs');
    
    // 找到草稿工时
    const draftWorkLog = page.locator('[data-status="draft"]').first();
    if (!await draftWorkLog.isVisible()) {
      console.log('没有草稿工时，跳过测试');
      return;
    }
    
    // 点击编辑
    await draftWorkLog.locator('button:has-text("编辑")').click();
    
    // 修改工时
    await page.fill('input[name="hours_worked"]', '6');
    await page.click('button[type="submit"]');
    
    // 验证修改成功
    await expect(page.locator('text=工时已更新')).toBeVisible();
  });

  test('F-WORKLOG-04: 删除草稿工时', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 先创建一个草稿工时用于删除
    await page.goto('/work-logs/new');
    await page.fill('input[name="work_date"]', getYesterdayDate());
    await page.fill('input[name="hours_worked"]', '1');
    await page.fill('textarea[name="work_description"]', '测试删除');
    await page.click('button:has-text("保存草稿")');
    
    // 返回列表
    await page.goto('/work-logs');
    
    // 找到刚创建的工时
    const workLog = page.locator('text=测试删除').first();
    await workLog.locator('xpath=..').locator('button:has-text("删除")').click();
    
    // 确认删除
    await page.click('button:has-text("确认")');
    
    // 验证删除成功
    await expect(page.locator('text=工时已删除')).toBeVisible();
  });
});
```

### 2.4 发票管理测试

```typescript
describe('求职者发票管理', () => {
  test('F-INV-01: 创建发票', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 检查是否有已确认的工时
    const workLogResponse = await request.get(`${API_URL}/work-logs?status=confirmed`);
    const workLogData = await workLogResponse.json();
    
    if (workLogData.data.items.length === 0) {
      console.log('没有已确认的工时，跳过测试');
      return;
    }
    
    await page.goto('/invoices/new');
    
    // 选择工时
    await page.check(`input[value="${workLogData.data.items[0]._id}"]`);
    
    // 选择发票类型
    await page.selectOption('select[name="invoice_type"]', 'vat_special');
    
    // 填写开票信息
    await page.fill('input[name="billing_info.company_name"]', '测试公司');
    await page.fill('input[name="billing_info.tax_number"]', '91110000MA00ABCD12');
    
    // 提交发票
    await page.click('button[type="submit"]');
    
    // 验证创建成功
    await expect(page.locator('text=发票已创建')).toBeVisible();
    
    // 后端验证
    const invoiceResponse = await request.get(`${API_URL}/invoices?status=draft`);
    const invoiceData = await invoiceResponse.json();
    expect(invoiceData.data.items.length).toBeGreaterThan(0);
  });

  test('F-INV-02: 提交发票审核', async ({ page, request }) => {
    await loginAsFreelancer(page);
    await page.goto('/invoices');
    
    // 找到草稿发票
    const draftInvoice = page.locator('[data-status="draft"]').first();
    if (!await draftInvoice.isVisible()) {
      console.log('没有草稿发票，跳过测试');
      return;
    }
    
    // 点击提交
    await draftInvoice.locator('button:has-text("提交")').click();
    await page.click('button:has-text("确认")');
    
    // 验证提交成功
    await expect(page.locator('text=发票已提交')).toBeVisible();
  });

  test('F-INV-03: 查看发票详情', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 获取一个发票ID
    const response = await request.get(`${API_URL}/invoices`);
    const data = await response.json();
    
    if (data.data.items.length === 0) {
      console.log('没有发票，跳过测试');
      return;
    }
    
    const invoiceId = data.data.items[0]._id;
    await page.goto(`/invoices/${invoiceId}`);
    
    // 验证发票详情显示
    await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-status"]')).toBeVisible();
  });

  test('F-INV-04: 确认收款', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 检查是否有已付款的发票
    const response = await request.get(`${API_URL}/invoices?status=paid');
    const data = await response.json();
    
    if (data.data.items.length === 0) {
      console.log('没有已付款的发票，跳过测试');
      return;
    }
    
    const invoiceId = data.data.items[0]._id;
    await page.goto(`/invoices/${invoiceId}`);
    
    // 点击确认收款
    await page.click('button:has-text("确认收款")');
    await page.click('button:has-text("确认")');
    
    // 验证确认成功
    await expect(page.locator('text=收款已确认')).toBeVisible();
    
    // 后端验证：状态更新
    const invoiceResponse = await request.get(`${API_URL}/invoices/${invoiceId}`);
    const invoiceData = await invoiceResponse.json();
    expect(invoiceData.data.status).toBe('received');
  });
});
```

---

## 3. HR招聘官测试场景

### 3.1 项目管理测试

```typescript
describe('HR项目管理', () => {
  test('H-PROJ-01: 发布项目', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/post-job');
    
    // 填写项目信息
    await page.fill('input[name="project_title"]', `测试项目-${Date.now()}`);
    await page.fill('textarea[name="project_description"]', '这是一个测试项目描述');
    
    // 选择技能分类
    await page.click('[data-testid="skill-category-select"]');
    await page.click('text=SAP');
    
    // 选择工作性质
    await page.selectOption('select[name="job_nature"]', 'full_time');
    
    // 选择工作形式
    await page.selectOption('select[name="work_format"]', 'remote');
    
    // 设置费率
    await page.selectOption('select[name="rate_type"]', 'daily');
    await page.fill('input[name="rate_amount"]', '2000');
    
    // 设置项目周期
    await page.selectOption('select[name="project_cycle"]', '1-3_months');
    
    // 提交发布
    await page.click('button[type="submit"]');
    
    // 验证发布成功
    await expect(page.locator('text=项目已发布')).toBeVisible();
    
    // 后端验证
    const response = await request.get(`${API_URL}/jobs?posted_by=me`);
    const data = await response.json();
    const project = data.data.items.find((p: any) => 
      p.project_title.includes('测试项目')
    );
    expect(project).toBeDefined();
  });

  test('H-PROJ-02: 编辑项目', async ({ page, request }) => {
    await loginAsHR(page);
    
    // 获取一个已发布的项目
    const response = await request.get(`${API_URL}/jobs?posted_by=me`);
    const data = await response.json();
    
    if (data.data.items.length === 0) {
      console.log('没有已发布的项目，跳过测试');
      return;
    }
    
    const projectId = data.data.items[0]._id;
    await page.goto(`/jobs/${projectId}/edit`);
    
    // 修改项目信息
    await page.fill('input[name="project_title"]', `修改后的项目-${Date.now()}`);
    await page.click('button[type="submit"]');
    
    // 验证修改成功
    await expect(page.locator('text=项目已更新')).toBeVisible();
  });

  test('H-PROJ-03: 查看申请列表', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/applications');
    
    // 验证申请列表显示
    const applicationCards = page.locator('[data-testid="application-card"]');
    const count = await applicationCards.count();
    
    // 后端验证
    const response = await request.get(`${API_URL}/applications`);
    const data = await response.json();
    expect(data.data.items.length).toBe(count);
  });

  test('H-PROJ-04: 审批申请', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/applications');
    
    // 找到待审核的申请
    const pendingApp = page.locator('[data-status="pending"]').first();
    if (!await pendingApp.isVisible()) {
      console.log('没有待审核的申请，跳过测试');
      return;
    }
    
    // 点击批准
    await pendingApp.locator('button:has-text("批准")').click();
    await page.click('button:has-text("确认")');
    
    // 验证批准成功
    await expect(page.locator('text=申请已批准')).toBeVisible();
    
    // 后端验证：申请状态更新
    const response = await request.get(`${API_URL}/applications?status=approved`);
    const data = await response.json();
    expect(data.data.items.length).toBeGreaterThan(0);
  });
});
```

### 3.2 工时审核测试

```typescript
describe('HR工时审核', () => {
  test('H-WORKLOG-01: 查看待审核工时', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/work-logs/pending');
    
    // 验证工时列表显示
    const workLogCards = page.locator('[data-testid="work-log-card"]');
    const count = await workLogCards.count();
    
    // 后端验证
    const response = await request.get(`${API_URL}/work-logs?status=submitted`);
    const data = await response.json();
    expect(data.data.items.length).toBe(count);
  });

  test('H-WORKLOG-02: 确认工时', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/work-logs/pending');
    
    // 找到待审核工时
    const pendingWorkLog = page.locator('[data-status="submitted"]').first();
    if (!await pendingWorkLog.isVisible()) {
      console.log('没有待审核工时，跳过测试');
      return;
    }
    
    // 点击确认
    await pendingWorkLog.locator('button:has-text("确认")').click();
    await page.click('button:has-text("确认")');
    
    // 验证确认成功
    await expect(page.locator('text=工时已确认')).toBeVisible();
    
    // 后端验证
    const response = await request.get(`${API_URL}/work-logs?status=confirmed`);
    const data = await response.json();
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test('H-WORKLOG-03: 驳回工时', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/work-logs/pending');
    
    const pendingWorkLog = page.locator('[data-status="submitted"]').first();
    if (!await pendingWorkLog.isVisible()) {
      console.log('没有待审核工时，跳过测试');
      return;
    }
    
    // 点击驳回
    await pendingWorkLog.locator('button:has-text("驳回")').click();
    
    // 填写驳回原因
    await page.fill('textarea[name="rejection_reason"]', '工时描述不够详细');
    await page.click('button:has-text("确认")');
    
    // 验证驳回成功
    await expect(page.locator('text=工时已驳回')).toBeVisible();
  });
});
```

### 3.3 发票审核测试

```typescript
describe('HR发票审核', () => {
  test('H-INV-01: 查看待审核发票', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/invoices/review');
    
    // 验证发票列表显示
    const invoiceCards = page.locator('[data-testid="invoice-card"]');
    const count = await invoiceCards.count();
    
    // 后端验证
    const response = await request.get(`${API_URL}/invoices?status=submitted`);
    const data = await response.json();
    expect(data.data.items.length).toBe(count);
  });

  test('H-INV-02: 审批发票', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/company/invoices/review');
    
    const pendingInvoice = page.locator('[data-status="submitted"]').first();
    if (!await pendingInvoice.isVisible()) {
      console.log('没有待审核发票，跳过测试');
      return;
    }
    
    // 点击审批
    await pendingInvoice.locator('button:has-text("审批")').click();
    await page.click('button:has-text("通过")');
    
    // 验证审批成功
    await expect(page.locator('text=发票已审批')).toBeVisible();
    
    // 后端验证
    const response = await request.get(`${API_URL}/invoices?status=approved');
    const data = await response.json();
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test('H-INV-03: 确认付款', async ({ page, request }) => {
    await loginAsHR(page);
    await page.goto('/payments');
    
    const approvedInvoice = page.locator('[data-status="approved"]').first();
    if (!await approvedInvoice.isVisible()) {
      console.log('没有待付款发票，跳过测试');
      return;
    }
    
    // 点击确认付款
    await approvedInvoice.locator('button:has-text("确认付款")').click();
    
    // 上传付款凭证
    await page.setInputFiles('input[type="file"]', 'test-files/payment-proof.pdf');
    await page.click('button:has-text("确认")');
    
    // 验证付款成功
    await expect(page.locator('text=付款已确认')).toBeVisible();
  });
});
```

---

## 4. 管理员测试场景

### 4.1 用户管理测试

```typescript
describe('管理员用户管理', () => {
  test('A-USER-01: 查看用户列表', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // 验证用户列表显示
    const userRows = page.locator('[data-testid="user-row"]');
    const count = await userRows.count();
    expect(count).toBeGreaterThan(0);
    
    // 后端验证
    const response = await request.get(`${API_URL}/admin/users`);
    const data = await response.json();
    expect(data.data.items.length).toBe(count);
  });

  test('A-USER-02: 禁用用户', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // 找到一个活跃用户
    const activeUser = page.locator('[data-is-active="true"]').first();
    if (!await activeUser.isVisible()) {
      console.log('没有活跃用户，跳过测试');
      return;
    }
    
    // 点击禁用
    await activeUser.locator('button:has-text("禁用")').click();
    await page.click('button:has-text("确认")');
    
    // 验证禁用成功
    await expect(page.locator('text=用户已禁用')).toBeVisible();
  });

  test('A-USER-03: 角色审批', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/role-approvals');
    
    // 找到待审批的角色申请
    const pendingRequest = page.locator('[data-status="pending"]').first();
    if (!await pendingRequest.isVisible()) {
      console.log('没有待审批的角色申请，跳过测试');
      return;
    }
    
    // 点击批准
    await pendingRequest.locator('button:has-text("批准")').click();
    await page.click('button:has-text("确认")');
    
    // 验证批准成功
    await expect(page.locator('text=角色已批准')).toBeVisible();
  });
});
```

### 4.2 企业管理测试

```typescript
describe('管理员企业管理', () => {
  test('A-COMPANY-01: 查看企业列表', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/companies');
    
    // 验证企业列表显示
    const companyRows = page.locator('[data-testid="company-row"]');
    const count = await companyRows.count();
    
    // 后端验证
    const response = await request.get(`${API_URL}/admin/companies`);
    const data = await response.json();
    expect(data.data.items.length).toBe(count);
  });

  test('A-COMPANY-02: 审核企业认证', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/companies');
    
    // 找到待认证企业
    const pendingCompany = page.locator('[data-verification-status="pending"]').first();
    if (!await pendingCompany.isVisible()) {
      console.log('没有待认证企业，跳过测试');
      return;
    }
    
    // 点击审核
    await pendingCompany.locator('button:has-text("审核")').click();
    
    // 查看营业执照
    await page.click('[data-testid="view-license"]');
    
    // 通过认证
    await page.click('button:has-text("通过")');
    
    // 验证认证成功
    await expect(page.locator('text=企业已认证')).toBeVisible();
  });
});
```

### 4.3 系统配置测试

```typescript
describe('管理员系统配置', () => {
  test('A-CONFIG-01: 技能分类管理', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config/skill-categories');
    
    // 添加新技能分类
    await page.click('button:has-text("添加分类")');
    await page.fill('input[name="name"]', `测试技能-${Date.now()}`);
    await page.fill('textarea[name="description"]', '这是一个测试技能分类');
    await page.click('button[type="submit"]');
    
    // 验证添加成功
    await expect(page.locator('text=分类已添加')).toBeVisible();
    
    // 后端验证
    const response = await request.get(`${API_URL}/admin/skill-categories`);
    const data = await response.json();
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test('A-CONFIG-02: 枚举配置管理', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/configuration');
    
    // 验证配置项显示
    await expect(page.locator('text=技能分类')).toBeVisible();
    await expect(page.locator('text=工时类型')).toBeVisible();
    await expect(page.locator('text=税率配置')).toBeVisible();
  });

  test('A-CONFIG-03: 举报管理', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports');
    
    // 找到待处理的举报
    const pendingReport = page.locator('[data-status="pending"]').first();
    if (!await pendingReport.isVisible()) {
      console.log('没有待处理的举报，跳过测试');
      return;
    }
    
    // 点击处理
    await pendingReport.locator('button:has-text("处理")').click();
    
    // 填写处理结果
    await page.selectOption('select[name="action"]', 'warning');
    await page.fill('textarea[name="notes"]', '已核实，给予警告');
    await page.click('button:has-text("确认")');
    
    // 验证处理成功
    await expect(page.locator('text=举报已处理')).toBeVisible();
  });
});
```

---

## 5. 跨角色业务流程测试

### 5.1 完整业务流程测试

```typescript
describe('跨角色业务流程', () => {
  test('E2E-001: 项目申请审批流程', async ({ browser }) => {
    // 创建多个浏览器上下文
    const hrContext = await browser.newContext();
    const freelancerContext = await browser.newContext();
    
    const hrPage = await hrContext.newPage();
    const freelancerPage = await freelancerContext.newPage();
    
    // HR发布项目
    await loginAsHR(hrPage);
    await hrPage.goto('/post-job');
    await hrPage.fill('input[name="project_title"]', `E2E测试项目-${Date.now()}`);
    await hrPage.fill('textarea[name="project_description"]', 'E2E测试项目描述');
    await hrPage.click('[data-testid="skill-category-select"]');
    await hrPage.click('text=SAP');
    await hrPage.selectOption('select[name="job_nature"]', 'full_time');
    await hrPage.selectOption('select[name="work_format"]', 'remote');
    await hrPage.selectOption('select[name="rate_type"]', 'daily');
    await hrPage.fill('input[name="rate_amount"]', '2000');
    await hrPage.click('button[type="submit"]');
    
    // 获取项目ID
    const projectUrl = hrPage.url();
    const projectId = projectUrl.split('/').pop();
    
    // 求职者申请项目
    await loginAsFreelancer(freelancerPage);
    await freelancerPage.goto(`/jobs/${projectId}`);
    await freelancerPage.click('button:has-text("申请")');
    await freelancerPage.click('button[type="submit"]');
    
    // HR审批申请
    await hrPage.goto('/company/applications');
    await hrPage.locator('[data-status="pending"]').first()
      .locator('button:has-text("批准")').click();
    await hrPage.click('button:has-text("确认")');
    
    // 验证审批成功
    await expect(hrPage.locator('text=申请已批准')).toBeVisible();
    
    // 清理
    await hrContext.close();
    await freelancerContext.close();
  });

  test('E2E-002: 工时填报审核流程', async ({ browser, request }) => {
    const hrContext = await browser.newContext();
    const freelancerContext = await browser.newContext();
    
    const hrPage = await hrContext.newPage();
    const freelancerPage = await freelancerContext.newPage();
    
    // 获取已批准的项目
    const projectResponse = await request.get(`${API_URL}/jobs?status=in_progress`);
    const projectData = await projectResponse.json();
    
    if (projectData.data.items.length === 0) {
      console.log('没有进行中的项目，跳过测试');
      return;
    }
    
    const projectId = projectData.data.items[0]._id;
    
    // 求职者填报工时
    await loginAsFreelancer(freelancerPage);
    await freelancerPage.goto('/work-logs/new');
    await freelancerPage.selectOption('select[name="project_id"]', projectId);
    await freelancerPage.fill('input[name="work_date"]', getTodayDate());
    await freelancerPage.fill('input[name="hours_worked"]', '8');
    await freelancerPage.selectOption('select[name="work_type"]', 'remote_work');
    await freelancerPage.fill('textarea[name="work_description"]', 'E2E测试工时');
    await freelancerPage.click('button[type="submit"]');
    
    // HR审核工时
    await loginAsHR(hrPage);
    await hrPage.goto('/company/work-logs/pending');
    await hrPage.locator('text=E2E测试工时').first()
      .locator('xpath=..').locator('button:has-text("确认")').click();
    await hrPage.click('button:has-text("确认")');
    
    // 验证审核成功
    await expect(hrPage.locator('text=工时已确认')).toBeVisible();
    
    await hrContext.close();
    await freelancerContext.close();
  });

  test('E2E-003: 发票创建审核付款流程', async ({ browser, request }) => {
    const hrContext = await browser.newContext();
    const freelancerContext = await browser.newContext();
    
    const hrPage = await hrContext.newPage();
    const freelancerPage = await freelancerContext.newPage();
    
    // 获取已确认的工时
    const workLogResponse = await request.get(`${API_URL}/work-logs?status=confirmed`);
    const workLogData = await workLogResponse.json();
    
    if (workLogData.data.items.length === 0) {
      console.log('没有已确认的工时，跳过测试');
      return;
    }
    
    const workLogId = workLogData.data.items[0]._id;
    
    // 求职者创建发票
    await loginAsFreelancer(freelancerPage);
    await freelancerPage.goto('/invoices/new');
    await freelancerPage.check(`input[value="${workLogId}"]`);
    await freelancerPage.selectOption('select[name="invoice_type"]', 'vat_special');
    await freelancerPage.fill('input[name="billing_info.company_name"]', 'E2E测试公司');
    await freelancerPage.click('button[type="submit"]');
    
    // HR审核发票
    await loginAsHR(hrPage);
    await hrPage.goto('/company/invoices/review');
    await hrPage.locator('text=E2E测试公司').first()
      .locator('xpath=..').locator('button:has-text("审批")').click();
    await hrPage.click('button:has-text("通过")');
    
    // HR确认付款
    await hrPage.goto('/payments');
    await hrPage.locator('[data-status="approved"]').first()
      .locator('button:has-text("确认付款")').click();
    await hrPage.setInputFiles('input[type="file"]', 'test-files/payment-proof.pdf');
    await hrPage.click('button:has-text("确认")');
    
    // 求职者确认收款
    await freelancerPage.goto('/invoices');
    await freelancerPage.locator('[data-status="paid"]').first()
      .locator('button:has-text("确认收款")').click();
    await freelancerPage.click('button:has-text("确认")');
    
    // 验证收款确认成功
    await expect(freelancerPage.locator('text=收款已确认')).toBeVisible();
    
    await hrContext.close();
    await freelancerContext.close();
  });
});
```

---

## 6. 权限边界测试

### 6.1 路由权限测试

```typescript
describe('路由权限测试', () => {
  test('P-ROUTE-01: 求职者访问HR页面', async ({ page }) => {
    await loginAsFreelancer(page);
    await page.goto('/post-job');
    
    // 验证重定向或显示无权限
    await expect(page).not.toHaveURL('/post-job');
  });

  test('P-ROUTE-02: 求职者访问管理员页面', async ({ page }) => {
    await loginAsFreelancer(page);
    await page.goto('/admin/users');
    
    // 验证重定向或显示无权限
    await expect(page).not.toHaveURL('/admin/users');
  });

  test('P-ROUTE-03: HR访问管理员页面', async ({ page }) => {
    await loginAsHR(page);
    await page.goto('/admin/users');
    
    // 验证重定向或显示无权限
    await expect(page).not.toHaveURL('/admin/users');
  });

  test('P-ROUTE-04: 未登录访问受保护页面', async ({ page }) => {
    await page.goto('/profile');
    
    // 验证重定向到登录页
    await expect(page).toHaveURL('/login');
  });
});
```

### 6.2 API权限测试

```typescript
describe('API权限测试', () => {
  test('P-API-01: 求职者创建项目', async ({ request }) => {
    const response = await request.post(`${API_URL}/jobs`, {
      headers: {
        Authorization: `Bearer ${freelancerToken}`
      },
      data: {
        project_title: '测试项目',
        project_description: '测试描述'
      }
    });
    
    expect(response.status()).toBe(403);
  });

  test('P-API-02: 求职者审核工时', async ({ request }) => {
    const response = await request.put(`${API_URL}/work-logs/123/confirm`, {
      headers: {
        Authorization: `Bearer ${freelancerToken}`
      }
    });
    
    expect(response.status()).toBe(403);
  });

  test('P-API-03: HR访问管理员接口', async ({ request }) => {
    const response = await request.get(`${API_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${hrToken}`
      }
    });
    
    expect(response.status()).toBe(403);
  });
});
```

---

## 7. 数据一致性测试

### 7.1 工时状态流转测试

```typescript
describe('工时状态流转', () => {
  test('D-WORKLOG-01: 草稿→已提交→已确认', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 创建草稿工时
    await page.goto('/work-logs/new');
    await page.fill('input[name="work_date"]', getTodayDate());
    await page.fill('input[name="hours_worked"]', '8');
    await page.fill('textarea[name="work_description"]', '状态流转测试');
    await page.click('button:has-text("保存草稿")');
    
    // 验证状态为草稿
    const draftResponse = await request.get(`${API_URL}/work-logs?status=draft`);
    const draftData = await draftResponse.json();
    const workLog = draftData.data.items.find((w: any) => 
      w.work_description === '状态流转测试'
    );
    expect(workLog.status).toBe('draft');
    
    // 提交工时
    await page.goto('/work-logs');
    await page.locator('text=状态流转测试').first()
      .locator('xpath=..').locator('button:has-text("提交")').click();
    
    // 验证状态为已提交
    const submittedResponse = await request.get(`${API_URL}/work-logs/${workLog._id}`);
    const submittedData = await submittedResponse.json();
    expect(submittedData.data.status).toBe('submitted');
    
    // HR确认工时
    await loginAsHR(page);
    await page.goto('/company/work-logs/pending');
    await page.locator('text=状态流转测试').first()
      .locator('xpath=..').locator('button:has-text("确认")').click();
    
    // 验证状态为已确认
    const confirmedResponse = await request.get(`${API_URL}/work-logs/${workLog._id}`);
    const confirmedData = await confirmedResponse.json();
    expect(confirmedData.data.status).toBe('confirmed');
  });

  test('D-WORKLOG-02: 已提交工时不可编辑', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 获取已提交的工时
    const response = await request.get(`${API_URL}/work-logs?status=submitted`);
    const data = await response.json();
    
    if (data.data.items.length === 0) {
      console.log('没有已提交的工时，跳过测试');
      return;
    }
    
    const workLogId = data.data.items[0]._id;
    
    // 尝试编辑
    const editResponse = await request.put(`${API_URL}/work-logs/${workLogId}`, {
      data: { hours_worked: 10 }
    });
    
    expect(editResponse.status()).toBe(400);
  });
});
```

### 7.2 发票金额计算测试

```typescript
describe('发票金额计算', () => {
  test('D-INV-01: 含税价计算', async ({ page, request }) => {
    await loginAsFreelancer(page);
    
    // 创建发票
    await page.goto('/invoices/new');
    
    // 选择工时并设置税率
    await page.check('input[type="checkbox"]'); // 选择第一个工时
    await page.selectOption('select[name="tax_calculation_mode"]', 'inclusive');
    await page.fill('input[name="tax_rate"]', '6');
    
    // 验证金额计算
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    const taxAmount = await page.locator('[data-testid="tax-amount"]').textContent();
    const total = await page.locator('[data-testid="total"]').textContent();
    
    // 验证计算公式
    const subtotalNum = parseFloat(subtotal.replace(/[^0-9.]/g, ''));
    const taxNum = parseFloat(taxAmount.replace(/[^0-9.]/g, ''));
    const totalNum = parseFloat(total.replace(/[^0-9.]/g, ''));
    
    // 含税价: 不含税金额 = 含税金额 / (1 + 税率/100)
    const expectedSubtotal = totalNum / 1.06;
    expect(Math.abs(subtotalNum - expectedSubtotal)).toBeLessThan(0.01);
    
    // 税额 = 含税金额 - 不含税金额
    expect(Math.abs(taxNum - (totalNum - expectedSubtotal))).toBeLessThan(0.01);
  });

  test('D-INV-02: 不含税价计算', async ({ page, request }) => {
    await loginAsFreelancer(page);
    await page.goto('/invoices/new');
    
    await page.check('input[type="checkbox"]');
    await page.selectOption('select[name="tax_calculation_mode"]', 'exclusive');
    await page.fill('input[name="tax_rate"]', '6');
    
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    const taxAmount = await page.locator('[data-testid="tax-amount"]').textContent();
    const total = await page.locator('[data-testid="total"]').textContent();
    
    const subtotalNum = parseFloat(subtotal.replace(/[^0-9.]/g, ''));
    const taxNum = parseFloat(taxAmount.replace(/[^0-9.]/g, ''));
    const totalNum = parseFloat(total.replace(/[^0-9.]/g, ''));
    
    // 不含税价: 价税合计 = 不含税金额 * (1 + 税率/100)
    const expectedTotal = subtotalNum * 1.06;
    expect(Math.abs(totalNum - expectedTotal)).toBeLessThan(0.01);
    
    // 税额 = 不含税金额 * 税率/100
    expect(Math.abs(taxNum - subtotalNum * 0.06)).toBeLessThan(0.01);
  });
});
```

---

## 8. 测试辅助函数

### 8.1 登录函数

```typescript
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

async function loginAsHR(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'hr@test.com');
  await page.fill('input[name="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

async function loginAsFreelancer(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'freelancer@test.com');
  await page.fill('input[name="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
```

### 8.2 数据验证函数

```typescript
async function verifyProjectExists(request: APIRequestContext, projectId: string) {
  const response = await request.get(`${API_URL}/jobs/${projectId}`);
  const data = await response.json();
  return {
    exists: response.status() === 200 && data.success,
    project: data.data
  };
}

async function verifyWorkLogExists(request: APIRequestContext, workLogId: string) {
  const response = await request.get(`${API_URL}/work-logs/${workLogId}`);
  const data = await response.json();
  return {
    exists: response.status() === 200 && data.success,
    workLog: data.data
  };
}

async function verifyInvoiceExists(request: APIRequestContext, invoiceId: string) {
  const response = await request.get(`${API_URL}/invoices/${invoiceId}`);
  const data = await response.json();
  return {
    exists: response.status() === 200 && data.success,
    invoice: data.data
  };
}
```

### 8.3 日期工具函数

```typescript
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
```

---

## 9. 测试执行计划

### 9.1 测试执行顺序

```
Phase 1: 基础功能测试
├── 认证流程测试 (所有角色)
├── 菜单显示测试 (所有角色)
└── Dashboard测试 (所有角色)

Phase 2: 核心业务测试
├── 项目管理测试 (HR + 求职者)
├── 工时管理测试 (求职者 + HR)
└── 发票管理测试 (求职者 + HR)

Phase 3: 管理功能测试
├── 用户管理测试 (管理员)
├── 企业管理测试 (管理员)
└── 系统配置测试 (管理员)

Phase 4: 跨角色流程测试
├── 项目申请审批流程
├── 工时填报审核流程
└── 发票创建审核付款流程

Phase 5: 权限边界测试
├── 路由权限测试
├── API权限测试
└── 数据访问权限测试

Phase 6: 数据一致性测试
├── 状态流转测试
├── 金额计算测试
└── 数据同步测试
```

### 9.2 测试报告输出

```typescript
interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  byRole: {
    freelancer: TestResult[];
    hr: TestResult[];
    admin: TestResult[];
  };
  byModule: {
    auth: TestResult[];
    project: TestResult[];
    worklog: TestResult[];
    invoice: TestResult[];
    admin: TestResult[];
  };
  issues: Issue[];
  screenshots: string[];
}
```

---

**文档维护者:** AI Assistant  
**更新频率:** 功能变更时更新
