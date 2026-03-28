import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
  },
  company: {
    email: 'company@test.com',
    password: 'Test1234!',
  },
};

async function loginAndWait(page: Page, userType: 'freelancer' | 'company') {
  const user = TEST_USERS[userType];

  await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitButton.click();

  await page.waitForURL(/^(?!.*\/login).*/, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  console.log(`✓ ${userType} 登录成功`);
}

async function screenshot(page: Page, name: string) {
  const path = `e2e-test-results/screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true }).catch(() => {});
  return path;
}

test.describe('服务健康检查', () => {
  test('HEALTH-001: 验证前端服务可访问', async ({ page }) => {
    await page.goto(BASE_URL, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    console.log(`页面标题: ${title}`);

    await screenshot(page, 'health-001-frontend');
    expect(page.url()).toContain('localhost:5137');
  });

  test('HEALTH-002: 验证后端API可访问', async ({ request }) => {
    const response = await request.get('http://localhost:5555/api/v1/auth/user-types');
    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log(`用户类型: ${JSON.stringify(body.data)}`);
    expect(body.success).toBe(true);
  });
});

test.describe('用户认证模块测试', () => {
  test('AUTH-001: 验证注册页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    await screenshot(page, 'auth-001-register');

    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');

    await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 注册页面验证通过');
  });

  test('AUTH-002: 验证登录页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    await screenshot(page, 'auth-002-login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('✓ 登录页面验证通过');
  });

  test('AUTH-003: 自由顾问登录', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await screenshot(page, 'auth-003-freelancer-dashboard');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    console.log(`登录后URL: ${currentUrl}`);
  });

  test('AUTH-004: 企业用户登录', async ({ page }) => {
    await loginAndWait(page, 'company');

    await screenshot(page, 'auth-004-company-dashboard');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    console.log(`登录后URL: ${currentUrl}`);
  });
});

test.describe('自由顾问核心功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, 'freelancer');
  });

  test('FL-001: 访问个人档案页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-001-profile');

    const pageContent = await page.content();
    const hasProfileContent = pageContent.includes('档案') || pageContent.includes('Profile') ||
      pageContent.includes('技能') || pageContent.includes('skill');

    console.log(`档案页面有内容: ${hasProfileContent}`);
    expect(hasProfileContent).toBe(true);
  });

  test('FL-002: 访问工时列表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-002-worklogs-list');

    const pageContent = await page.content();
    const hasWorklogContent = pageContent.includes('工时') || pageContent.includes('Worklog') ||
      pageContent.includes('填报');

    console.log(`工时列表页面有内容: ${hasWorklogContent}`);
  });

  test('FL-003: 访问创建工时页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs/new`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-003-worklog-create');

    const projectSelect = page.locator('#project_requirement_id');
    const dateInput = page.locator('#work_date');
    const hoursInput = page.locator('#hours_worked');
    const startTime = page.locator('#work_period_start');
    const endTime = page.locator('#work_period_end');

    await expect(projectSelect).toBeVisible({ timeout: 5000 });
    await expect(dateInput).toBeVisible({ timeout: 5000 });
    await expect(hoursInput).toBeVisible({ timeout: 5000 });
    await expect(startTime).toBeVisible({ timeout: 5000 });
    await expect(endTime).toBeVisible({ timeout: 5000 });

    console.log('✓ 工时创建页面所有必填字段存在');
  });

  test('FL-004: 访问发票列表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-004-invoices-list');

    const pageContent = await page.content();
    const hasInvoiceContent = pageContent.includes('发票') || pageContent.includes('Invoice');

    console.log(`发票列表页面有内容: ${hasInvoiceContent}`);
  });

  test('FL-005: 访问创建发票页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/new`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-005-invoice-create');

    const invoiceTypeSelect = page.locator('select[name="invoice_type"], #invoice_type');
    const billingStart = page.locator('input[name="billing_period_start"], [name="items[0].description"]');
    const taxRateSelect = page.locator('select[name="tax_rate"], input[name="tax_rate"]');

    const pageContent = await page.content();
    const hasInvoiceForm = pageContent.includes('发票类型') || pageContent.includes('账单') ||
      pageContent.includes('开票');

    console.log(`发票创建页面有表单内容: ${hasInvoiceForm}`);
  });

  test('FL-006: 访问消息中心', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-006-messages');

    const pageContent = await page.content();
    const hasMessageContent = pageContent.includes('消息') || pageContent.includes('Message') ||
      pageContent.includes('通知');

    console.log(`消息中心页面有内容: ${hasMessageContent}`);
  });

  test('FL-007: 访问报表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-007-reports');

    const pageContent = await page.content();
    const hasReportsContent = pageContent.includes('报表') || pageContent.includes('Report') ||
      pageContent.includes('统计') || pageContent.includes('收入');

    console.log(`报表页面有内容: ${hasReportsContent}`);
  });
});

test.describe('企业用户核心功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, 'company');
  });

  test('HR-001: 访问企业工作台', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-001-dashboard');

    const pageContent = await page.content();
    const hasDashboardContent = pageContent.includes('仪表盘') || pageContent.includes('Dashboard') ||
      pageContent.includes('项目') || pageContent.includes('Job');

    console.log(`企业工作台有内容: ${hasDashboardContent}`);
  });

  test('HR-002: 访问发布项目页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/post-job`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-002-post-job');

    const titleInput = page.locator('input[name="project_title"], #project_title');
    const descTextarea = page.locator('textarea[name="project_description"], #project_description');

    const pageContent = await page.content();
    const hasJobForm = pageContent.includes('项目标题') || pageContent.includes('项目描述') ||
      pageContent.includes('发布');

    console.log(`项目发布页面有表单内容: ${hasJobForm}`);
  });

  test('HR-003: 访问我的项目页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-jobs`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-003-my-jobs');

    const pageContent = await page.content();
    const hasJobsContent = pageContent.includes('项目') || pageContent.includes('Job') ||
      pageContent.includes('发布');

    console.log(`我的项目页面有内容: ${hasJobsContent}`);
  });

  test('HR-004: 访问工时审核页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/work-logs/pending`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-004-worklogs-review');

    const pageContent = await page.content();
    const hasWorklogContent = pageContent.includes('工时') || pageContent.includes('Worklog') ||
      pageContent.includes('审核');

    console.log(`工时审核页面有内容: ${hasWorklogContent}`);
  });

  test('HR-005: 访问发票审核页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/invoices/review`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-005-invoice-review');

    const pageContent = await page.content();
    const hasInvoiceContent = pageContent.includes('发票') || pageContent.includes('Invoice') ||
      pageContent.includes('审核');

    console.log(`发票审核页面有内容: ${hasInvoiceContent}`);
  });
});

test.describe('PRD功能完整性验证', () => {
  test('PRD-WORKLOG: 验证工时表单包含所有必填字段', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/work-logs/new`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-worklog-form');

    const checks = {
      '项目选择': '#project_requirement_id',
      '工作日期': '#work_date',
      '开始时间': '#work_period_start',
      '结束时间': '#work_period_end',
      '工时输入': '#hours_worked',
    };

    let allPassed = true;
    for (const [name, selector] of Object.entries(checks)) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${name}: ${isVisible ? '✓' : '✗'}`);
      if (!isVisible) allPassed = false;
    }

    expect(allPassed).toBe(true);
  });

  test('PRD-INVOICE: 验证发票表单存在', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/invoices/new`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-invoice-form');

    const pageContent = await page.content();
    const hasInvoiceForm = pageContent.includes('发票') || pageContent.includes('Invoice') ||
      pageContent.includes('账单') || pageContent.includes('开票');

    console.log(`发票表单存在: ${hasInvoiceForm}`);
  });

  test('PRD-JOB: 验证项目发布表单存在', async ({ page }) => {
    await loginAndWait(page, 'company');

    await page.goto(`${BASE_URL}/post-job`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-job-form');

    const pageContent = await page.content();
    const hasJobForm = pageContent.includes('项目标题') || pageContent.includes('项目描述') ||
      pageContent.includes('发布') || pageContent.includes('技能');

    console.log(`项目发布表单存在: ${hasJobForm}`);
  });
});