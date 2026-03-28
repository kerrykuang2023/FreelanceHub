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

test.describe('快速验证测试', () => {
  test('TEST-001: 验证前端服务可访问', async ({ page }) => {
    await page.goto(BASE_URL, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    console.log(`页面标题: ${title}`);

    await screenshot(page, 'test-001-frontend');

    expect(page.url()).toContain('localhost:5137');
  });

  test('TEST-002: 验证注册页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    await screenshot(page, 'test-002-register');

    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');

    await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 注册页面验证通过');
  });

  test('TEST-003: 验证登录页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    await screenshot(page, 'test-003-login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('✓ 登录页面验证通过');
  });

  test('TEST-004: 测试自由顾问登录', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await screenshot(page, 'test-004-freelancer-dashboard');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    console.log(`登录后URL: ${currentUrl}`);
  });

  test('TEST-005: 测试企业用户登录', async ({ page }) => {
    await loginAndWait(page, 'company');

    await screenshot(page, 'test-005-company-dashboard');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    console.log(`登录后URL: ${currentUrl}`);
  });

  test('TEST-006: 验证工时创建页面', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/worklogs/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'test-006-worklog-create');

    const projectSelect = page.locator('select[id="project_requirement_id"], select[name="project_requirement_id"]');
    const dateInput = page.locator('input[id="work_date"], input[type="date"]');
    const hoursInput = page.locator('input[id="hours_worked"]');

    await expect(projectSelect.first()).toBeVisible({ timeout: 5000 });
    await expect(dateInput.first()).toBeVisible({ timeout: 5000 });
    await expect(hoursInput.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 工时创建页面验证通过');
  });

  test('TEST-007: 验证发票创建页面', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/invoices/create`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'test-007-invoice-create');

    const invoiceTypeSelect = page.locator('select[name="invoice_type"], [id="invoice_type"]');
    const billingStart = page.locator('input[name="billing_period_start"], [id="billing_period_start"]');

    await expect(invoiceTypeSelect.first()).toBeVisible({ timeout: 5000 });
    await expect(billingStart.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 发票创建页面验证通过');
  });

  test('TEST-008: 验证项目发布页面', async ({ page }) => {
    await loginAndWait(page, 'company');

    await page.goto(`${BASE_URL}/jobs/post`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'test-008-job-post');

    const titleInput = page.locator('input[name="project_title"]');
    const descTextarea = page.locator('textarea[name="project_description"]');

    await expect(titleInput.first()).toBeVisible({ timeout: 5000 });
    await expect(descTextarea.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ 项目发布页面验证通过');
  });

  test('TEST-009: 验证个人档案页面', async ({ page }) => {
    await loginAndWait(page, 'freelancer');

    await page.goto(`${BASE_URL}/profile`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await screenshot(page, 'test-009-profile');

    const profileContainer = page.locator('[data-testid="profile-container"], .max-w-5xl');
    await expect(profileContainer.first()).toBeVisible({ timeout: 10000 });

    console.log('✓ 个人档案页面验证通过');
  });
});