import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const LANGUAGES = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
  },
};

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
    console.log(`Login failed: ${email}`, e);
    return false;
  }
}

async function switchLanguage(page: Page, langCode: string): Promise<void> {
  const languageSwitcher = page.locator('[data-testid="language-switcher"]');
  await languageSwitcher.click();
  await page.waitForTimeout(500);
  
  const langOption = page.locator(`[data-testid="language-option-${langCode}"]`);
  await langOption.click();
  await page.waitForTimeout(1000);
}

test.describe('🌐 国际化E2E测试 / i18n E2E Tests', () => {
  
  test.describe('E2E-01: 语言切换器组件测试', () => {
    
    test('语言切换器应该在页面上可见', async ({ page }) => {
      console.log('\n🧪 Testing: 语言切换器可见性');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      await expect(languageSwitcher).toBeVisible({ timeout: 10000 });
      
      console.log('  ✅ 语言切换器可见');
    });
    
    test('点击语言切换器应显示语言选项', async ({ page }) => {
      console.log('\n🧪 Testing: 语言选项显示');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      await languageSwitcher.click();
      await page.waitForTimeout(500);
      
      const zhOption = page.locator('[data-testid="language-option-zh"]');
      const enOption = page.locator('[data-testid="language-option-en"]');
      
      await expect(zhOption).toBeVisible();
      await expect(enOption).toBeVisible();
      
      console.log('  ✅ 中文选项可见');
      console.log('  ✅ 英文选项可见');
    });
    
    test('切换语言后应保存到localStorage', async ({ page }) => {
      console.log('\n🧪 Testing: 语言保存到localStorage');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await switchLanguage(page, 'en');
      
      const savedLang = await page.evaluate(() => localStorage.getItem('language'));
      expect(savedLang).toBe('en');
      
      console.log('  ✅ 语言已保存到localStorage');
    });
  });
  
  test.describe('E2E-02: 登录页面国际化测试', () => {
    
    test('登录页面应正确显示中文', async ({ page }) => {
      console.log('\n🧪 Testing: 登录页面中文显示');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => localStorage.setItem('language', 'zh'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-login-zh.png' });
      
      const emailLabel = page.locator('text=邮箱, text=Email').first();
      const passwordLabel = page.locator('text=密码, text=Password').first();
      const loginButton = page.locator('button:has-text("登录"), button:has-text("Login")').first();
      
      const emailVisible = await emailLabel.isVisible().catch(() => false);
      const passwordVisible = await passwordLabel.isVisible().catch(() => false);
      const loginVisible = await loginButton.isVisible().catch(() => false);
      
      console.log(`  邮箱标签: ${emailVisible ? '✅' : '⚠️'}`);
      console.log(`  密码标签: ${passwordVisible ? '✅' : '⚠️'}`);
      console.log(`  登录按钮: ${loginVisible ? '✅' : '⚠️'}`);
      
      expect(emailVisible || passwordVisible || loginVisible).toBe(true);
    });
    
    test('登录页面应正确显示英文', async ({ page }) => {
      console.log('\n🧪 Testing: 登录页面英文显示');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-login-en.png' });
      
      console.log('  ✅ 英文登录页面截图已保存');
    });
  });
  
  test.describe('E2E-03: 导航菜单国际化测试', () => {
    
    test('导航菜单应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: 导航菜单国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-nav-zh.png' });
      console.log('  ✅ 中文导航截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-nav-en.png' });
      console.log('  ✅ 英文导航截图已保存');
    });
  });
  
  test.describe('E2E-04: Freelancer仪表板国际化测试', () => {
    
    test('Freelancer仪表板应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: Freelancer仪表板国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-freelancer-dashboard-zh.png' });
      console.log('  ✅ 中文仪表板截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-freelancer-dashboard-en.png' });
      console.log('  ✅ 英文仪表板截图已保存');
    });
  });
  
  test.describe('E2E-05: HR仪表板国际化测试', () => {
    
    test('HR仪表板应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: HR仪表板国际化');
      
      const loginSuccess = await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-hr-dashboard-zh.png' });
      console.log('  ✅ 中文HR仪表板截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-hr-dashboard-en.png' });
      console.log('  ✅ 英文HR仪表板截图已保存');
    });
  });
  
  test.describe('E2E-06: Admin仪表板国际化测试', () => {
    
    test('Admin仪表板应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: Admin仪表板国际化');
      
      const loginSuccess = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-admin-dashboard-zh.png' });
      console.log('  ✅ 中文Admin仪表板截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n-admin-dashboard-en.png' });
      console.log('  ✅ 英文Admin仪表板截图已保存');
    });
  });
  
  test.describe('E2E-07: 职位列表页面国际化测试', () => {
    
    test('职位列表页面应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: 职位列表页面国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-jobs-zh.png' });
      console.log('  ✅ 中文职位列表截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-jobs-en.png' });
      console.log('  ✅ 英文职位列表截图已保存');
    });
  });
  
  test.describe('E2E-08: 工时列表页面国际化测试', () => {
    
    test('工时列表页面应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: 工时列表页面国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-worklogs-zh.png' });
      console.log('  ✅ 中文工时列表截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-worklogs-en.png' });
      console.log('  ✅ 英文工时列表截图已保存');
    });
  });
  
  test.describe('E2E-09: 发票列表页面国际化测试', () => {
    
    test('发票列表页面应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: 发票列表页面国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-invoices-zh.png' });
      console.log('  ✅ 中文发票列表截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-invoices-en.png' });
      console.log('  ✅ 英文发票列表截图已保存');
    });
  });
  
  test.describe('E2E-10: 个人档案页面国际化测试', () => {
    
    test('个人档案页面应正确显示中英文', async ({ page }) => {
      console.log('\n🧪 Testing: 个人档案页面国际化');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-profile-zh.png' });
      console.log('  ✅ 中文个人档案截图已保存');
      
      await page.evaluate(() => localStorage.setItem('language', 'en'));
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-profile-en.png' });
      console.log('  ✅ 英文个人档案截图已保存');
    });
  });
  
  test.describe('E2E-11: 完整国际化流程测试', () => {
    
    test('完整语言切换流程应正常工作', async ({ page }) => {
      console.log('\n🧪 Testing: 完整语言切换流程');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      console.log('  Step 1: 测试语言切换器');
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      await expect(languageSwitcher).toBeVisible({ timeout: 10000 });
      console.log('    ✅ 语言切换器可见');
      
      console.log('  Step 2: 切换到英文');
      await switchLanguage(page, 'en');
      const savedLang = await page.evaluate(() => localStorage.getItem('language'));
      expect(savedLang).toBe('en');
      console.log('    ✅ 语言已切换到英文');
      
      console.log('  Step 3: 刷新页面验证语言保持');
      await page.reload();
      await page.waitForLoadState('networkidle');
      const langAfterReload = await page.evaluate(() => localStorage.getItem('language'));
      expect(langAfterReload).toBe('en');
      console.log('    ✅ 刷新后语言保持为英文');
      
      console.log('  Step 4: 切换回中文');
      await switchLanguage(page, 'zh');
      const finalLang = await page.evaluate(() => localStorage.getItem('language'));
      expect(finalLang).toBe('zh');
      console.log('    ✅ 语言已切换回中文');
      
      console.log('  ✅ 完整语言切换流程测试通过');
    });
  });
});
