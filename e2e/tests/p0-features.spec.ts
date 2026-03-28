import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('P0 Features User Journey Test', () => {
  test('AUTH-001: User Registration Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/auth-001-register-page.png' });
    
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱" i]');
    const passwordField = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("注册"), button:has-text("Register")');
    
    await expect(emailField.first()).toBeVisible({ timeout: 5000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 5000 });
    
    console.log('AUTH-001: Registration page loaded successfully');
  });

  test('AUTH-002: User Login Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/auth-002-login-page.png' });
    
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱" i]');
    const passwordField = page.locator('input[type="password"]');
    
    await expect(emailField.first()).toBeVisible({ timeout: 5000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 5000 });
    
    console.log('AUTH-002: Login page loaded successfully');
  });

  test('AUTH-003: Password Recovery Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/auth-003-forgot-password-page.png' });
    
    const content = await page.content();
    console.log('AUTH-003: Password recovery page loaded');
  });

  test('PROJ-001: Project Posting Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/proj-001-post-job-page.png' });
    
    const titleInput = page.locator('input[name*="title" i], input[placeholder*="标题" i], input[placeholder*="项目" i]');
    const descriptionInput = page.locator('textarea, input[name*="description" i]');
    
    const hasTitle = await titleInput.count() > 0;
    const hasDescription = await descriptionInput.count() > 0;
    
    console.log(`PROJ-001: Title field: ${hasTitle}, Description field: ${hasDescription}`);
    
    await expect(titleInput.first() || descriptionInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('PROJ-002: Project List Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/proj-002-my-jobs-page.png' });
    
    const searchInput = page.locator('input[type="search" i], input[placeholder*="搜索" i], input[placeholder*="筛选" i]');
    const filterButton = page.locator('button:has-text("筛选"), button:has-text("Filter")');
    const tabs = page.locator('button:has-text("全部"), button:has-text("待审核")');
    
    const hasSearch = await searchInput.count() > 0;
    const hasFilter = await filterButton.count() > 0;
    const hasTabs = await tabs.count() > 0;
    
    console.log(`PROJ-002: Search: ${hasSearch}, Filter: ${hasFilter}, Tabs: ${hasTabs}`);
  });

  test('WORKLOG-001: Work Logs Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/worklog-001-work-logs-page.png' });
    
    const createButton = page.locator('a:has-text("填报"), a:has-text("创建"), a:has-text("新增"), a[href*="new"]');
    const table = page.locator('table');
    
    const hasCreateButton = await createButton.count() > 0;
    const hasTable = await table.count() > 0;
    
    console.log(`WORKLOG-001: Create button: ${hasCreateButton}, Table: ${hasTable}`);
  });

  test('INV-001: Invoices Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/inv-001-invoices-page.png' });
    
    const createButton = page.locator('a:has-text("创建"), a:has-text("新增"), a[href*="new"], button:has-text("创建")');
    const table = page.locator('table');
    
    const hasCreateButton = await createButton.count() > 0;
    const hasTable = await table.count() > 0;
    
    console.log(`INV-001: Create button: ${hasCreateButton}, Table: ${hasTable}`);
  });

  test('MSG-001: Messages Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/msg-001-messages-page.png' });
    
    const tabs = page.locator('button:has-text("全部"), button:has-text("未读")');
    const notificationList = page.locator('[class*="notification"], [class*="message"], [class*="divide-y"]');
    
    const hasTabs = await tabs.count() > 0;
    const hasList = await notificationList.count() > 0;
    
    console.log(`MSG-001: Tabs: ${hasTabs}, List: ${hasList}`);
  });

  test('PROFILE-001: Profile Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-results/profile-001-profile-page.png' });
    
    const profileContent = page.locator('[class*="profile"], form, [class*="user"]');
    const tabs = page.locator('button:has-text("概览"), button:has-text("技能"), button:has-text("设置")');
    
    const hasContent = await profileContent.count() > 0;
    const hasTabs = await tabs.count() > 0;
    
    console.log(`PROFILE-001: Content: ${hasContent}, Tabs: ${hasTabs}`);
  });
});
