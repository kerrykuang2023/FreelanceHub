import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('页面实际状态检查', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  });

  test('01-检查首页', async () => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    console.log('首页内容:', bodyText?.substring(0, 500));
    
    const errors = await page.locator('.error, [class*="error"], .alert-danger').allTextContents();
    console.log('错误信息:', errors);
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-01-homepage.png', fullPage: true });
  });

  test('02-检查登录页面', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    console.log('登录页内容:', bodyText?.substring(0, 500));
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-02-login.png', fullPage: true });
  });

  test('03-检查工时管理页面', async () => {
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    console.log('工时页内容:', bodyText?.substring(0, 500));
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-03-worklogs.png', fullPage: true });
  });

  test('04-检查发票管理页面', async () => {
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-04-invoices.png', fullPage: true });
  });

  test('05-检查消息中心页面', async () => {
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-05-messages.png', fullPage: true });
  });

  test('06-检查项目管理页面', async () => {
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-06-projects.png', fullPage: true });
  });

  test('07-检查个人档案页面', async () => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-07-profile.png', fullPage: true });
  });

  test('08-检查管理员配置页面', async () => {
    await page.goto(`${BASE_URL}/admin/configuration`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'e2e-test-screenshots/check-08-admin-config.png', fullPage: true });
  });
});
