import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';

interface TestUser {
  email: string;
  password: string;
  role: string;
  expectedMenuItems: string[];
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
    expectedMenuItems: ['首页', '我的项目', '浏览项目', '我的申请', '收藏职位', '工时管理', '发票管理', '消息'],
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
    expectedMenuItems: ['首页', '我的项目', '发布职位', '申请管理', '工时管理', '发票管理', '消息'],
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
    expectedMenuItems: ['首页', '我的项目', '发布职位', '申请管理', '工时管理', '发票管理', '消息', '系统管理'],
  },
};

class UnifiedMenuTester {
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

  static async verifyNavigationMenu(page: Page, expectedItems: string[]): Promise<{
    passed: boolean;
    missing: string[];
    extra: string[];
  }> {
    const nav = page.locator('nav[aria-label="Global"]').first();
    const isVisible = await nav.isVisible({ timeout: 5000 });
    
    if (!isVisible) {
      return { passed: false, missing: expectedItems, extra: [] };
    }

    const foundItems: string[] = [];
    const menuLinks = nav.locator('a, button');
    const count = await menuLinks.count();
    
    for (let i = 0; i < count; i++) {
      try {
        const text = await menuLinks.nth(i).textContent();
        if (text && text.trim()) {
          foundItems.push(text.trim());
        }
      } catch (e) {
        // Ignore errors
      }
    }

    const missing = expectedItems.filter(item => !foundItems.includes(item));
    const extra = foundItems.filter(item => !expectedItems.includes(item) && item.length > 0);

    return {
      passed: missing.length === 0,
      missing,
      extra,
    };
  }

  static async verifyBreadcrumbs(page: Page): Promise<{
    exists: boolean;
    items: string[];
  }> {
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]').first();
    const exists = await breadcrumbNav.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!exists) {
      return { exists: false, items: [] };
    }

    const items: string[] = [];
    const breadcrumbLinks = breadcrumbNav.locator('a, span');
    const count = await breadcrumbLinks.count();
    
    for (let i = 0; i < count; i++) {
      try {
        const text = await breadcrumbLinks.nth(i).textContent();
        if (text && text.trim()) {
          items.push(text.trim());
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return { exists, items };
  }

  static async measureSpacing(page: Page): Promise<{
    navToBreadcrumb: number | null;
    breadcrumbToContent: number | null;
  }> {
    try {
      const nav = page.locator('nav[aria-label="Global"]').first();
      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]').first();
      
      const navBox = await nav.boundingBox();
      const breadcrumbBox = await breadcrumbNav.boundingBox();
      
      if (!navBox || !breadcrumbBox) {
        return { navToBreadcrumb: null, breadcrumbToContent: null };
      }

      const navToBreadcrumb = breadcrumbBox.y - (navBox.y + navBox.height);
      
      return {
        navToBreadcrumb: Math.round(navToBreadcrumb),
        breadcrumbToContent: null,
      };
    } catch (error) {
      return { navToBreadcrumb: null, breadcrumbToContent: null };
    }
  }

  static async capturePageState(page: Page, testName: string): Promise<void> {
    try {
      await page.screenshot({ 
        path: `test-results/unified-menu-${testName}-${Date.now()}.png`,
        fullPage: false 
      });
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }
}

test.describe('Unified Header Menu Consistency Test Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Freelancer Role - Menu Consistency', () => {
    let user: TestUser;

    test.beforeAll(() => {
      user = TEST_USERS.freelancer;
    });

    test('FREELANCER-MENU-001: Dashboard page menu items', async ({ page }) => {
      console.log('\n📋 Testing Freelancer Dashboard Menu...');
      
      const loginSuccess = await UnifiedMenuTester.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'freelancer-dashboard');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      console.log(`  Menu Items Check: ${menuResult.passed ? '✅' : '❌'}`);
      if (!menuResult.passed) {
        console.log(`    Missing: ${menuResult.missing.join(', ')}`);
        console.log(`    Extra: ${menuResult.extra.join(', ')}`);
      }
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      console.log(`  Breadcrumbs: ${breadcrumbResult.exists ? '✅' : '❌'}`);
      if (breadcrumbResult.exists) {
        console.log(`    Items: ${breadcrumbResult.items.join(' > ')}`);
      }
      expect(breadcrumbResult.exists).toBe(true);

      const spacing = await UnifiedMenuTester.measureSpacing(page);
      console.log(`  Nav to Breadcrumb spacing: ${spacing.navToBreadcrumb}px`);
      expect(spacing.navToBreadcrumb).toBeGreaterThan(0);
      expect(spacing.navToBreadcrumb).toBeLessThan(50);
    });

    test('FREELANCER-MENU-002: Jobs page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Freelancer Jobs Page Menu...');
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'freelancer-jobs');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
      console.log(`  Breadcrumbs: ${breadcrumbResult.items.join(' > ')}`);
    });

    test('FREELANCER-MENU-003: Applications page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Freelancer Applications Page Menu...');
      
      await page.goto(`${BASE_URL}/applications`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'freelancer-applications');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('FREELANCER-MENU-004: Work Logs page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Freelancer Work Logs Page Menu...');
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'freelancer-worklogs');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('FREELANCER-MENU-005: Profile page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Freelancer Profile Page Menu...');
      
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'freelancer-profile');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });
  });

  test.describe('HR Role - Menu Consistency', () => {
    let user: TestUser;

    test.beforeAll(() => {
      user = TEST_USERS.hr;
    });

    test('HR-MENU-001: HR Dashboard page menu items', async ({ page }) => {
      console.log('\n📋 Testing HR Dashboard Menu...');
      
      const loginSuccess = await UnifiedMenuTester.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'hr-dashboard');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      console.log(`  Menu Items Check: ${menuResult.passed ? '✅' : '❌'}`);
      if (!menuResult.passed) {
        console.log(`    Missing: ${menuResult.missing.join(', ')}`);
      }
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
      console.log(`  Breadcrumbs: ${breadcrumbResult.items.join(' > ')}`);
    });

    test('HR-MENU-002: Post Job page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing HR Post Job Page Menu...');
      
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'hr-postjob');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('HR-MENU-003: Company Applications page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing HR Company Applications Page Menu...');
      
      await page.goto(`${BASE_URL}/company/applications`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'hr-applications');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('HR-MENU-004: Work Logs page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing HR Work Logs Page Menu...');
      
      await page.goto(`${BASE_URL}/company/work-logs/pending`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'hr-worklogs');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });
  });

  test.describe('Admin Role - Menu Consistency', () => {
    let user: TestUser;

    test.beforeAll(() => {
      user = TEST_USERS.admin;
    });

    test('ADMIN-MENU-001: Admin Dashboard menu items', async ({ page }) => {
      console.log('\n📋 Testing Admin Dashboard Menu...');
      
      const loginSuccess = await UnifiedMenuTester.loginAsUser(page, user);
      expect(loginSuccess).toBe(true);

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'admin-dashboard');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      console.log(`  Menu Items Check: ${menuResult.passed ? '✅' : '❌'}`);
      if (!menuResult.passed) {
        console.log(`    Missing: ${menuResult.missing.join(', ')}`);
      }
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('ADMIN-MENU-002: Users Management page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Admin Users Management Page Menu...');
      
      await page.goto(`${BASE_URL}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'admin-users');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });

    test('ADMIN-MENU-003: Companies Management page menu consistency', async ({ page }) => {
      console.log('\n📋 Testing Admin Companies Management Page Menu...');
      
      await page.goto(`${BASE_URL}/admin/companies`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await UnifiedMenuTester.capturePageState(page, 'admin-companies');

      const menuResult = await UnifiedMenuTester.verifyNavigationMenu(page, user.expectedMenuItems);
      expect(menuResult.passed).toBe(true);

      const breadcrumbResult = await UnifiedMenuTester.verifyBreadcrumbs(page);
      expect(breadcrumbResult.exists).toBe(true);
    });
  });

  test.describe('Cross-Page Visual Consistency', () => {
    test('VISUAL-001: Verify header height consistency across pages', async ({ page }) => {
      console.log('\n📏 Testing Header Height Consistency...');
      
      const user = TEST_USERS.freelancer;
      await UnifiedMenuTester.loginAsUser(page, user);

      const pages = [
        '/dashboard',
        '/jobs',
        '/applications',
        '/work-logs',
        '/profile',
      ];

      let previousHeight: number | null = null;
      
      for (const pagePath of pages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const nav = page.locator('nav[aria-label="Global"]').first();
        const box = await nav.boundingBox();
        
        if (box) {
          const height = Math.round(box.height);
          console.log(`  ${pagePath}: ${height}px`);
          
          if (previousHeight !== null) {
            expect(Math.abs(height - previousHeight)).toBeLessThan(5);
          }
          previousHeight = height;
        }
      }
    });

    test('VISUAL-002: Verify breadcrumb styling consistency', async ({ page }) => {
      console.log('\n🎨 Testing Breadcrumb Styling Consistency...');
      
      const user = TEST_USERS.freelancer;
      await UnifiedMenuTester.loginAsUser(page, user);

      const pages = [
        '/dashboard',
        '/jobs',
        '/applications',
      ];

      for (const pagePath of pages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]').first();
        const isVisible = await breadcrumbNav.isVisible({ timeout: 3000 });
        
        if (isVisible) {
          const backgroundColor = await breadcrumbNav.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          
          console.log(`  ${pagePath}: bg=${backgroundColor}`);
        }
      }
    });
  });
});
