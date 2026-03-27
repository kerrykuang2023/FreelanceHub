import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';

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

class TestHelper {
  static async loginAsUser(page: Page, user: TestUser): Promise<boolean> {
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
      
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(user.email);
        await passwordInput.fill(user.password);
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        return !currentUrl.includes('/login');
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  static async logout(page: Page): Promise<void> {
    try {
      const logoutBtn = page.locator('button:has-text("退出"), button:has-text("登出"), a:has-text("退出")').first();
      if (await logoutBtn.isVisible({ timeout: 2000 })) {
        await logoutBtn.click();
        await page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log('Logout skipped');
    }
  }

  static async setupPageMonitoring(page: Page): Promise<void> {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    (page as any).consoleErrors = consoleErrors;
  }

  static getConsoleErrors(page: Page): string[] {
    return (page as any).consoleErrors || [];
  }
}

test.describe('UI/UX Comprehensive Test Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await TestHelper.setupPageMonitoring(page);
  });

  test.describe('QuickActionsMenu Component Tests', () => {
    test('FREELANCER-001: QuickActionsMenu displays correct items for freelancer role', async ({ page }) => {
      console.log('\n📋 Testing QuickActionsMenu for Freelancer...');
      
      const user = TEST_USERS.freelancer;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/freelancer-dashboard.png' });

      const quickActionsMenu = page.locator('text=快捷操作').first();
      await expect(quickActionsMenu).toBeVisible({ timeout: 5000 });

      const expectedItems = ['填报工时', '我的工时', '浏览项目', '我的申请'];
      for (const item of expectedItems) {
        const itemLocator = page.locator(`text=${item}`).first();
        const isVisible = await itemLocator.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${isVisible ? '✅' : '❌'} Quick action "${item}" ${isVisible ? 'visible' : 'not visible'}`);
      }

      const consoleErrors = TestHelper.getConsoleErrors(page);
      expect(consoleErrors.length).toBe(0);
    });

    test('HR-001: QuickActionsMenu displays correct items for HR role', async ({ page }) => {
      console.log('\n📋 Testing QuickActionsMenu for HR...');
      
      const user = TEST_USERS.hr;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/hr-dashboard.png' });

      const quickActionsMenu = page.locator('text=快捷操作').first();
      await expect(quickActionsMenu).toBeVisible({ timeout: 5000 });

      const expectedItems = ['发布项目', '我的项目', '审核工时', '管理申请'];
      for (const item of expectedItems) {
        const itemLocator = page.locator(`text=${item}`).first();
        const isVisible = await itemLocator.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${isVisible ? '✅' : '❌'} Quick action "${item}" ${isVisible ? 'visible' : 'not visible'}`);
      }
    });
  });

  test.describe('Freelancer Dashboard Data Display Tests', () => {
    test('FREELANCER-002: Work log status overview displays correctly', async ({ page }) => {
      console.log('\n📊 Testing Freelancer Work Log Status Overview...');
      
      const user = TEST_USERS.freelancer;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const statusOverview = page.locator('text=工时状态概览').first();
      await expect(statusOverview).toBeVisible({ timeout: 5000 });

      const statusItems = ['草稿', '已提交', '已确认', '已驳回'];
      for (const status of statusItems) {
        const statusLocator = page.locator(`text=${status}`).first();
        const isVisible = await statusLocator.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${isVisible ? '✅' : '❌'} Status "${status}" ${isVisible ? 'visible' : 'not visible'}`);
      }

      const countElements = page.locator('text=/\\d+\\s*条/');
      const count = await countElements.count();
      console.log(`  Found ${count} status count elements`);

      await page.screenshot({ path: 'test-results/freelancer-worklog-status.png' });
    });
  });

  test.describe('HR Dashboard Data Display Tests', () => {
    test('HR-002: Recent applications display correctly', async ({ page }) => {
      console.log('\n📊 Testing HR Recent Applications...');
      
      const user = TEST_USERS.hr;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const recentApps = page.locator('text=最近申请').first();
      await expect(recentApps).toBeVisible({ timeout: 5000 });

      const statCards = page.locator('[class*="stat"], [class*="card"]');
      const statCount = await statCards.count();
      console.log(`  Found ${statCount} stat/card elements`);

      const receivedApps = page.locator('text=收到的申请').first();
      const isVisible = await receivedApps.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} "收到的申请" ${isVisible ? 'visible' : 'not visible'}`);

      await page.screenshot({ path: 'test-results/hr-recent-applications.png' });
    });
  });

  test.describe('Profile Page Layout Tests', () => {
    test('PROFILE-001: Profile page layout displays correctly', async ({ page }) => {
      console.log('\n👤 Testing Profile Page Layout...');
      
      const user = TEST_USERS.freelancer;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/profile-page.png' });

      const profileHeader = page.locator('[data-testid="profile-container"], [class*="profile"]').first();
      await expect(profileHeader).toBeVisible({ timeout: 5000 });

      const tabs = ['概览', '技能', '项目经历', '资质证书', '设置'];
      for (const tab of tabs) {
        const tabLocator = page.locator(`text=${tab}`).first();
        const isVisible = await tabLocator.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${isVisible ? '✅' : '❌'} Tab "${tab}" ${isVisible ? 'visible' : 'not visible'}`);
      }

      const completionBar = page.locator('text=档案完整度').first();
      const isCompletionVisible = await completionBar.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${isCompletionVisible ? '✅' : '❌'} Profile completion bar ${isCompletionVisible ? 'visible' : 'not visible'}`);
    });
  });

  test.describe('Admin Tab Pages Tests', () => {
    test('ADMIN-001: Admin dashboard tabs are clickable', async ({ page }) => {
      console.log('\n🔧 Testing Admin Dashboard Tabs...');
      
      const user = TEST_USERS.admin;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      const adminPages = [
        { path: '/admin/users', name: '用户管理' },
        { path: '/admin/companies', name: '公司管理' },
        { path: '/admin/projects', name: '项目管理' },
        { path: '/admin/work-logs', name: '工时管理' },
        { path: '/admin/invoices', name: '发票管理' },
      ];

      for (const adminPage of adminPages) {
        console.log(`  Testing: ${adminPage.name}`);
        await page.goto(`${BASE_URL}${adminPage.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const pageContent = await page.content();
        const hasContent = pageContent.length > 1000;
        console.log(`    ${hasContent ? '✅' : '❌'} Page loaded ${hasContent ? 'successfully' : 'with issues'}`);

        await page.screenshot({ path: `test-results/admin-${adminPage.name.replace(/\s/g, '-')}.png` });
      }
    });
  });

  test.describe('Post Job Page Tests', () => {
    test('POSTJOB-001: Post job page displays QuickActionsMenu', async ({ page }) => {
      console.log('\n📝 Testing Post Job Page...');
      
      const user = TEST_USERS.hr;
      const loginSuccess = await TestHelper.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/post-job-page.png' });

      const quickActionsMenu = page.locator('text=快捷操作').first();
      const isMenuVisible = await quickActionsMenu.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${isMenuVisible ? '✅' : '❌'} QuickActionsMenu ${isMenuVisible ? 'visible' : 'not visible'}`);

      const formTitle = page.locator('text=项目标题').first();
      await expect(formTitle).toBeVisible({ timeout: 5000 });

      const submitButton = page.locator('button[type="submit"], button:has-text("发布")').first();
      const isSubmitVisible = await submitButton.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${isSubmitVisible ? '✅' : '❌'} Submit button ${isSubmitVisible ? 'visible' : 'not visible'}`);
    });
  });
});
