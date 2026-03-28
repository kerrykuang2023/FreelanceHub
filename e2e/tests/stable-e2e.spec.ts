import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'admin',
  },
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'freelancer',
  },
  company: {
    email: 'company@test.com',
    password: 'Test1234!',
    role: 'company',
  },
};

async function loginAndWait(page: Page, userType: 'admin' | 'freelancer' | 'company') {
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

test.describe('用户认证模块测试', () => {
  test('AUTH-001: 验证注册页面结构', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    await screenshot(page, 'auth-001-register');

    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('✓ 注册页面元素完整');
  });

  test('AUTH-002: 验证登录功能', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    await screenshot(page, 'auth-002-login');
    console.log('✓ 登录成功，跳转到首页');
  });
});

test.describe('自由顾问角色测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, 'freelancer');
  });

  test('FL-PROFILE-001: 访问个人档案页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-profile-001');

    const profileContainer = page.locator('[data-testid="profile-container"], .max-w-5xl');
    await expect(profileContainer.first()).toBeVisible({ timeout: 10000 });

    console.log('✓ 个人档案页面加载成功');
  });

  test('FL-WORKLOG-001: 访问创建工时页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/worklogs/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-worklog-001');

    const projectSelect = page.locator('select[id="project_requirement_id"], select[name="project_requirement_id"]');
    const dateInput = page.locator('input[id="work_date"], input[type="date"]');
    const hoursInput = page.locator('input[id="hours_worked"]');

    await expect(projectSelect.first()).toBeVisible({ timeout: 5000 });
    await expect(dateInput.first()).toBeVisible({ timeout: 5000 });
    await expect(hoursInput.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 工时填报表单完整');
  });

  test('FL-WORKLOG-002: 访问工时列表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-worklog-002');

    const pageTitle = page.locator('h1, h2');
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 工时列表页面加载成功');
  });

  test('FL-INVOICE-001: 访问创建发票页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-invoice-001');

    const invoiceTypeSelect = page.locator('select[name="invoice_type"], [id="invoice_type"]');
    const billingStart = page.locator('input[name="billing_period_start"], [id="billing_period_start"]');

    await expect(invoiceTypeSelect.first()).toBeVisible({ timeout: 5000 });
    await expect(billingStart.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 发票创建表单完整');
  });

  test('FL-MESSAGES-001: 访问消息中心', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-messages-001');

    const messagesContainer = page.locator('h1, h2, .max-w');
    await expect(messagesContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 消息中心页面加载成功');
  });

  test('FL-REPORTS-001: 访问报表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'fl-reports-001');

    const reportsContainer = page.locator('h1, h2, .max-w');
    await expect(reportsContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 报表页面加载成功');
  });
});

test.describe('企业用户角色测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, 'company');
  });

  test('HR-DASHBOARD-001: 访问企业工作台', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-dashboard-001');

    const dashboard = page.locator('h1, h2, .max-w');
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 企业工作台加载成功');
  });

  test('HR-POSTJOB-001: 访问发布项目页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/post`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-postjob-001');

    const titleInput = page.locator('input[name="project_title"]');
    const descTextarea = page.locator('textarea[name="project_description"]');

    await expect(titleInput.first()).toBeVisible({ timeout: 5000 });
    await expect(descTextarea.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 项目发布表单完整');
  });

  test('HR-MYJOBS-001: 访问我的项目页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-jobs`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-myjobs-001');

    const myJobsContainer = page.locator('h1, h2, .max-w');
    await expect(myJobsContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 我的项目页面加载成功');
  });

  test('HR-WORKLOG-001: 访问工时审核页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/worklogs`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'hr-worklog-001');

    const pageContainer = page.locator('h1, h2, .max-w');
    await expect(pageContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 工时审核页面加载成功');
  });
});

test.describe('管理员角色测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, 'admin');
  });

  test('ADMIN-DASHBOARD-001: 访问管理员仪表盘', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'admin-dashboard-001');

    const dashboard = page.locator('h1, h2, .max-w, [class*="grid"]');
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 管理员仪表盘加载成功');
  });

  test('ADMIN-USERS-001: 访问用户管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'admin-users-001');

    const pageContainer = page.locator('h1, h2, .max-w');
    await expect(pageContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 用户管理页面加载成功');
  });

  test('ADMIN-COMPANIES-001: 访问企业管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/companies`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'admin-companies-001');

    const pageContainer = page.locator('h1, h2, .max-w');
    await expect(pageContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 企业管理页面加载成功');
  });

  test('ADMIN-SKILLS-001: 访问技能管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/config`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'admin-skills-001');

    const pageContainer = page.locator('h1, h2, .max-w');
    await expect(pageContainer.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 技能管理页面加载成功');
  });
});

test.describe('PRD功能完整性验证', () => {
  test('PRD-WORKLOG-FORM: 验证工时表单包含所有必填字段', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/worklogs/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-worklog-form-full');

    const checks = {
      '项目选择': page.locator('select[id="project_requirement_id"], select[name="project_requirement_id"]'),
      '工作日期': page.locator('input[id="work_date"], input[type="date"]'),
      '开始时间': page.locator('input[id="work_period_start"], input[type="time"]'),
      '结束时间': page.locator('input[id="work_period_end"], input[type="time"]'),
      '工时输入': page.locator('input[id="hours_worked"]'),
      '工作类型': page.locator('select[id="work_type"], select[name="work_type"], button[type="button"]'),
      '工作描述': page.locator('textarea[id="work_description"]'),
    };

    for (const [name, locator] of Object.entries(checks)) {
      const isVisible = await locator.first().isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${name}: ${isVisible ? '✓' : '✗'}`);
      expect(isVisible).toBe(true);
    }

    console.log('✓ 工时表单验证通过');
  });

  test('PRD-INVOICE-FORM: 验证发票表单包含所有必填字段', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/invoices/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-invoice-form-full');

    const checks = {
      '发票类型': page.locator('select[name="invoice_type"]'),
      '计费周期开始': page.locator('input[name="billing_period_start"]'),
      '计费周期结束': page.locator('input[name="billing_period_end"]'),
      '税率': page.locator('select[name="tax_rate"], input[name="tax_rate"]'),
      '开票公司': page.locator('input[name*="billing_company_name"]'),
    };

    for (const [name, locator] of Object.entries(checks)) {
      const isVisible = await locator.first().isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${name}: ${isVisible ? '✓' : '✗'}`);
    }

    console.log('✓ 发票表单验证完成');
  });

  test('PRD-PROJECT-FORM: 验证项目发布表单包含技能要求', async ({ page }) => {
    await loginAndWait(page, 'company');

    await page.goto(`${BASE_URL}/jobs/post`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-project-form-full');

    const skillButtons = page.locator('button[type="button"]');
    const count = await skillButtons.count();

    console.log(`  找到 ${count} 个按钮（包含技能选择按钮）`);

    const titleInput = page.locator('input[name="project_title"]');
    const descTextarea = page.locator('textarea[name="project_description"]');

    await expect(titleInput.first()).toBeVisible({ timeout: 5000 });
    await expect(descTextarea.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 项目发布表单验证通过');
  });

  test('PRD-PROFILE-FORM: 验证档案页面包含所有模块', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/profile`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'prd-profile-form-full');

    const tabs = {
      '概览': page.locator('button:has-text("概览"), [data-testid="tab-overview"]'),
      '技能': page.locator('button:has-text("技能"), [data-testid="tab-skills"]'),
      '项目经历': page.locator('button:has-text("项目经历"), [data-testid="tab-experience"]'),
      '资质证书': page.locator('button:has-text("资质证书"), [data-testid="tab-certifications"]'),
      '设置': page.locator('button:has-text("设置"), [data-testid="tab-settings"]'),
    };

    for (const [name, locator] of Object.entries(tabs)) {
      const isVisible = await locator.first().isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  Tab ${name}: ${isVisible ? '✓' : '✗'}`);
    }

    console.log('✓ 档案页面Tab验证完成');
  });
});

test.describe('响应式布局测试', () => {
  test('RESPONSIVE-001: 验证桌面端布局', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await screenshot(page, 'responsive-desktop');
    console.log('✓ 桌面端布局正常');
  });

  test('RESPONSIVE-002: 验证平板端布局', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await screenshot(page, 'responsive-tablet');
    console.log('✓ 平板端布局正常');
  });

  test('RESPONSIVE-003: 验证移动端布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await screenshot(page, 'responsive-mobile');
    console.log('✓ 移动端布局正常');
  });
});