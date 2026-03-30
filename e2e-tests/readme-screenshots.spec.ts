import { test, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const TEST_USERS = {
  freelancer: { email: 'freelancer@test.com', password: 'Test123456!' },
  hr: { email: 'hr@test.com', password: 'Test123456!' },
  admin: { email: 'admin@test.com', password: 'Test123456!' },
};

async function setLanguage(page: Page, langCode: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((lang) => {
    localStorage.setItem('language', lang);
    localStorage.setItem('i18nextLng', lang);
  }, langCode);
}

async function login(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-submit-btn"]');
    
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
    
    await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    return true;
  } catch (e) {
    return false;
  }
}

test.describe('📸 项目截图采集', () => {
  
  test('截图1: 登录页面 - 中文', async ({ page }) => {
    await setLanguage(page, 'zh');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/login-zh.png', fullPage: true });
    console.log('✅ 登录页面中文截图已保存');
  });
  
  test('截图2: 登录页面 - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/login-en.png', fullPage: true });
    console.log('✅ 登录页面英文截图已保存');
  });
  
  test('截图3: 登录页面 - 日本語', async ({ page }) => {
    await setLanguage(page, 'ja');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/login-ja.png', fullPage: true });
    console.log('✅ 登录页面日文截图已保存');
  });
  
  test('截图4: Freelancer工作台 - 中文', async ({ page }) => {
    await setLanguage(page, 'zh');
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/freelancer-dashboard-zh.png', fullPage: true });
    console.log('✅ Freelancer工作台中文截图已保存');
  });
  
  test('截图5: Freelancer Dashboard - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/freelancer-dashboard-en.png', fullPage: true });
    console.log('✅ Freelancer Dashboard English screenshot saved');
  });
  
  test('截图6: HR Dashboard - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/hr-dashboard-en.png', fullPage: true });
    console.log('✅ HR Dashboard English screenshot saved');
  });
  
  test('截图7: Admin Dashboard - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/admin-dashboard-en.png', fullPage: true });
    console.log('✅ Admin Dashboard English screenshot saved');
  });
  
  test('截图8: Jobs List - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/jobs-list-en.png', fullPage: true });
    console.log('✅ Jobs List English screenshot saved');
  });
  
  test('截图9: Work Logs - English', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/readme/work-logs-en.png', fullPage: true });
    console.log('✅ Work Logs English screenshot saved');
  });
  
  test('截图10: 语言切换器演示', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    await page.waitForTimeout(2000);
    
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await languageSwitcher.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'docs/screenshots/readme/language-switcher.png', fullPage: false });
    console.log('✅ Language Switcher screenshot saved');
  });
});
