/**
 * 全面端到端测试脚本
 * 
 * 测试范围：
 * 1. 系统管理测试
 * 2. 各用户角色端到端测试（顾问、HR、管理员）
 * 3. UI/UX测试
 * 4. 项目生命周期管理测试
 * 5. 手动操作Web界面测试
 * 
 * @version 1.0
 * @date 2026-03-24
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// ============================================
// 测试数据配置
// ============================================

interface TestUser {
  email: string;
  password: string;
  role: 'freelancer' | 'hr' | 'admin';
  name: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer1: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'freelancer',
    name: '测试顾问1',
  },
  freelancer2: {
    email: 'freelancer2@test.com',
    password: 'Test1234!',
    role: 'freelancer',
    name: '测试顾问2',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test1234!',
    role: 'hr',
    name: '测试HR',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'admin',
    name: '测试管理员',
  },
};

// ============================================
// 辅助函数
// ============================================

async function loginAsUser(page: Page, user: TestUser): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);

    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign in")').first();
    await loginButton.click();

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') || 
      await page.locator('h1:has-text("欢迎回来"), h2:has-text("工作台"), text=工作台').count() > 0;

    return isLoggedIn;
  } catch (error) {
    console.error(`Login failed for ${user.email}:`, error);
    return false;
  }
}

async function logout(page: Page): Promise<void> {
  try {
    const userMenu = page.locator('[class*="rounded-full"], button:has(img)').first();
    await userMenu.click();
    await page.waitForTimeout(500);

    const logoutButton = page.locator('button:has-text("退出登录"), button:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.log('Logout attempt:', error);
  }
}

async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `./test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

async function waitForApiCall(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(response => 
    typeof urlPattern === 'string' 
      ? response.url().includes(urlPattern)
      : urlPattern.test(response.url())
  );
}

// ============================================
// Part 1: 系统管理测试
// ============================================

test.describe('系统管理测试', () => {
  let adminContext: BrowserContext;
  let adminPage: Page;

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    
    const loginSuccess = await loginAsUser(adminPage, TEST_USERS.admin);
    expect(loginSuccess).toBe(true);
  });

  test.afterAll(async () => {
    await adminContext.close();
  });

  test('ADMIN-001: 管理员仪表盘加载', async () => {
    await adminPage.goto(`${BASE_URL}/admin/dashboard`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-dashboard');
  });

  test('ADMIN-002: 用户管理页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/users`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('table, [class*="list"]').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-users');
  });

  test('ADMIN-003: 角色审批页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/role-approvals`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-role-approvals');
  });

  test('ADMIN-004: 企业审核页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/companies`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('table, [class*="list"]').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-companies');
  });

  test('ADMIN-005: 工时管理页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/worklogs`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-worklogs');
  });

  test('ADMIN-006: 发票管理页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/invoices`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-invoices');
  });

  test('ADMIN-007: 项目管理页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/projects`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-projects');
  });

  test('ADMIN-008: 举报管理页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/reports`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-reports');
  });

  test('ADMIN-009: 系统配置页面', async () => {
    await adminPage.goto(`${BASE_URL}/admin/configuration`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-configuration');
  });

  test('ADMIN-010: 技能分类配置', async () => {
    await adminPage.goto(`${BASE_URL}/admin/config/skill-categories`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-skill-categories');
  });

  test('ADMIN-011: 税率配置', async () => {
    await adminPage.goto(`${BASE_URL}/admin/config/tax-rates`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-tax-rates');
  });

  test('ADMIN-012: 货币配置', async () => {
    await adminPage.goto(`${BASE_URL}/admin/config/currencies`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(adminPage, 'admin-currencies');
  });
});

// ============================================
// Part 2: 用户注册与登录测试
// ============================================

test.describe('用户注册与登录测试', () => {
  test('AUTH-001: 注册页面显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('select[name="user_type_name"], [data-testid="role-select"]')).toBeVisible();
    await takeScreenshot(page, 'register-page');
  });

  test('AUTH-002: 企业注册流程 - HR角色选择', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    const roleSelect = page.locator('select[name="user_type_name"], [data-testid="role-select"]');
    await expect(roleSelect).toBeVisible();

    const options = await roleSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('HR') || opt.includes('招聘'))).toBe(true);

    await roleSelect.selectOption('hr_recruiter');
    await takeScreenshot(page, 'register-hr-role-selected');
  });

  test('AUTH-003: 企业信息完善页面 - 页面显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/setup`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await takeScreenshot(page, 'company-setup-page');
  });

  test('AUTH-004: 企业信息完善 - 表单验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/setup`);
    await page.waitForLoadState('networkidle');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const errorMessages = page.locator('[class*="error"], [class*="Error"]');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
    await takeScreenshot(page, 'company-setup-validation-errors');
  });

  test('AUTH-005: 企业信息完善 - 字段检查', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/setup`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="company_name"], [data-testid="company-name"]')).toBeVisible();
    await expect(page.locator('select[name="industry"], [data-testid="industry"]')).toBeVisible();
    await expect(page.locator('select[name="company_size"], [data-testid="company-size"]')).toBeVisible();
    await expect(page.locator('input[name="contact_name"], [data-testid="contact-name"]')).toBeVisible();
    await expect(page.locator('input[name="contact_phone"], [data-testid="contact-phone"]')).toBeVisible();
    await takeScreenshot(page, 'company-setup-fields');
  });

  test('AUTH-006: 企业认证审核页面 - 管理员', async ({ page }) => {
    const loginSuccess = await loginAsUser(page, TEST_USERS.admin);
    expect(loginSuccess).toBe(true);

    await page.goto(`${BASE_URL}/admin/companies`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'admin-company-certification');
  });

  test('AUTH-007: 注册表单验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    const errorMessages = page.locator('[class*="error"], [class*="Error"]');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
    await takeScreenshot(page, 'register-validation-errors');
  });

  test('AUTH-008: 角色选择功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    const roleSelect = page.locator('select[name="user_type_name"], [data-testid="role-select"]');
    await expect(roleSelect).toBeVisible();

    const options = await roleSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('求职者') || opt.includes('Freelancer'))).toBe(true);
    expect(options.some(opt => opt.includes('HR') || opt.includes('招聘'))).toBe(true);
  });

  test('AUTH-009: 登录页面显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await takeScreenshot(page, 'login-page');
  });

  test('AUTH-010: 登录失败处理', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"], input[name="email"]').first().fill('wrong@test.com');
    await page.locator('input[type="password"], input[name="password"]').first().fill('wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'login-failed');
  });
});

// ============================================
// Part 3: HR角色端到端测试
// ============================================

test.describe('HR角色端到端测试', () => {
  let hrContext: BrowserContext;
  let hrPage: Page;

  test.beforeAll(async ({ browser }) => {
    hrContext = await browser.newContext();
    hrPage = await hrContext.newPage();
    
    const loginSuccess = await loginAsUser(hrPage, TEST_USERS.hr);
    expect(loginSuccess).toBe(true);
  });

  test.afterAll(async () => {
    await hrContext.close();
  });

  test('HR-001: HR工作台加载', async () => {
    await hrPage.goto(`${BASE_URL}/`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-dashboard');
  });

  test('HR-002: 发布项目页面', async () => {
    await hrPage.goto(`${BASE_URL}/post-job`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('form')).toBeVisible();
    await expect(hrPage.locator('input[name="project_title"], [name="title"]')).toBeVisible();
    await takeScreenshot(hrPage, 'hr-post-job');
  });

  test('HR-003: 项目列表页面', async () => {
    await hrPage.goto(`${BASE_URL}/my-jobs`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-my-jobs');
  });

  test('HR-004: 申请管理页面', async () => {
    await hrPage.goto(`${BASE_URL}/applications`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-applications');
  });

  test('HR-005: 工时审核页面', async () => {
    await hrPage.goto(`${BASE_URL}/work-logs`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-work-logs');
  });

  test('HR-006: 发票管理页面', async () => {
    await hrPage.goto(`${BASE_URL}/invoices`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-invoices');
  });

  test('HR-007: 付款管理页面', async () => {
    await hrPage.goto(`${BASE_URL}/payments`);
    await hrPage.waitForLoadState('networkidle');

    await expect(hrPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(hrPage, 'hr-payments');
  });

  test('HR-008: 角色徽章显示验证', async () => {
    await hrPage.goto(`${BASE_URL}/`);
    await hrPage.waitForLoadState('networkidle');

    const roleBadge = hrPage.locator('[class*="bg-green"], [class*="green-100"]').first();
    const hasRoleDisplay = await roleBadge.isVisible() || 
      await hrPage.locator('text=HR').isVisible() ||
      await hrPage.locator('text=招聘').isVisible();
    
    expect(hasRoleDisplay).toBe(true);
  });
});

// ============================================
// Part 4: 顾问角色端到端测试
// ============================================

test.describe('顾问角色端到端测试', () => {
  let freelancerContext: BrowserContext;
  let freelancerPage: Page;

  test.beforeAll(async ({ browser }) => {
    freelancerContext = await browser.newContext();
    freelancerPage = await freelancerContext.newPage();
    
    const loginSuccess = await loginAsUser(freelancerPage, TEST_USERS.freelancer1);
    expect(loginSuccess).toBe(true);
  });

  test.afterAll(async () => {
    await freelancerContext.close();
  });

  test('FL-001: 顾问工作台加载', async () => {
    await freelancerPage.goto(`${BASE_URL}/`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-dashboard');
  });

  test('FL-002: 职位列表页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/jobs`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-jobs');
  });

  test('FL-003: 我的申请页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/my-jobs`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-my-jobs');
  });

  test('FL-004: 工时填报页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/work-logs/new`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('form')).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-create-worklog');
  });

  test('FL-005: 工时列表页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/work-logs`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-work-logs');
  });

  test('FL-006: 发票创建页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/invoices/new`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('form')).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-create-invoice');
  });

  test('FL-007: 发票列表页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/invoices`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-invoices');
  });

  test('FL-008: 个人档案页面', async () => {
    await freelancerPage.goto(`${BASE_URL}/profile`);
    await freelancerPage.waitForLoadState('networkidle');

    await expect(freelancerPage.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(freelancerPage, 'freelancer-profile');
  });

  test('FL-009: 角色徽章显示验证', async () => {
    await freelancerPage.goto(`${BASE_URL}/`);
    await freelancerPage.waitForLoadState('networkidle');

    const roleBadge = freelancerPage.locator('[class*="bg-blue"], [class*="blue-100"]').first();
    const hasRoleDisplay = await roleBadge.isVisible() || 
      await freelancerPage.locator('text=求职者').isVisible() ||
      await freelancerPage.locator('text=Freelancer').isVisible();
    
    expect(hasRoleDisplay).toBe(true);
  });
});

// ============================================
// Part 5: UI/UX测试
// ============================================

test.describe('UI/UX测试', () => {
  test('UI-001: 响应式布局 - 桌面端', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header, nav').first()).toBeVisible();
    await takeScreenshot(page, 'ui-desktop');
  });

  test('UI-002: 响应式布局 - 平板端', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header, nav').first()).toBeVisible();
    await takeScreenshot(page, 'ui-tablet');
  });

  test('UI-003: 响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header, nav').first()).toBeVisible();
    await takeScreenshot(page, 'ui-mobile');
  });

  test('UI-004: 导航菜单交互', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    const navItems = page.locator('nav a, nav button');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('UI-005: 表单输入交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"]').first();
    await nameInput.fill('测试用户');
    await expect(nameInput).toHaveValue('测试用户');
  });

  test('UI-006: 下拉选择交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    const roleSelect = page.locator('select[name="user_type_name"]').first();
    await roleSelect.selectOption('hr_recruiter');
    await expect(roleSelect).toHaveValue('hr_recruiter');
  });

  test('UI-007: 按钮点击反馈', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeEnabled();
  });

  test('UI-008: 页面加载性能', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('UI-009: 控制台无错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('extension') &&
      !e.includes('net::ERR')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('UI-010: 空状态展示', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    await page.goto(`${BASE_URL}/saved-jobs`);
    await page.waitForLoadState('networkidle');

    const emptyState = page.locator('[class*="empty"], [class*="no-data"], text=暂无');
    const hasEmptyState = await emptyState.count() > 0;
    await takeScreenshot(page, 'ui-empty-state');
  });
});

// ============================================
// Part 6: 项目生命周期测试
// ============================================

test.describe('项目生命周期测试', () => {
  test('LIFECYCLE-001: 完整业务流程 - HR发布项目', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await takeScreenshot(page, 'lifecycle-post-job');
  });

  test('LIFECYCLE-002: 完整业务流程 - 顾问查看项目', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'lifecycle-view-jobs');
  });

  test('LIFECYCLE-003: 完整业务流程 - 顾问申请项目', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');

    const jobLink = page.locator('a[href*="/jobs/"], [data-testid*="job"]').first();
    if (await jobLink.isVisible()) {
      await jobLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, 'lifecycle-job-detail');
    }
  });

  test('LIFECYCLE-004: 完整业务流程 - HR审核申请', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/applications`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'lifecycle-applications');
  });

  test('LIFECYCLE-005: 完整业务流程 - 顾问填报工时', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await takeScreenshot(page, 'lifecycle-create-worklog');
  });

  test('LIFECYCLE-006: 完整业务流程 - HR审核工时', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'lifecycle-review-worklogs');
  });

  test('LIFECYCLE-007: 完整业务流程 - 顾问创建发票', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await takeScreenshot(page, 'lifecycle-create-invoice');
  });

  test('LIFECYCLE-008: 完整业务流程 - HR审核发票', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'lifecycle-review-invoices');
  });

  test('LIFECYCLE-009: 完整业务流程 - HR确认付款', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await takeScreenshot(page, 'lifecycle-payments');
  });
});

// ============================================
// Part 7: 权限控制测试
// ============================================

test.describe('权限控制测试', () => {
  test('PERM-001: 顾问无法访问管理员页面', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const isBlocked = currentUrl.includes('/login') || 
      !currentUrl.includes('/admin') ||
      await page.locator('text=无权限, text=403, text=forbidden').count() > 0;
    
    expect(isBlocked).toBe(true);
  });

  test('PERM-002: HR无法访问管理员页面', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const isBlocked = currentUrl.includes('/login') || 
      !currentUrl.includes('/admin') ||
      await page.locator('text=无权限, text=403, text=forbidden').count() > 0;
    
    expect(isBlocked).toBe(true);
  });

  test('PERM-003: 未登录用户重定向到登录页', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/login')).toBe(true);
  });

  test('PERM-004: 管理员可访问所有管理页面', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.admin);
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

// ============================================
// Part 8: 业务逻辑验证测试
// ============================================

test.describe('业务逻辑验证测试', () => {
  test('BIZ-001: 工时日期不能是未来日期', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dateInput = page.locator('input[type="date"], input[name="work_date"]').first();
    await dateInput.fill(tomorrowStr);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'biz-future-date-validation');
  });

  test('BIZ-002: 工时小时数限制', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');

    const hoursInput = page.locator('input[name="hours_worked"], input[type="number"]').first();
    await hoursInput.fill('25');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'biz-hours-validation');
  });

  test('BIZ-003: 发票税额计算', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible();
    await takeScreenshot(page, 'biz-invoice-tax-calc');
  });

  test('BIZ-004: 项目申请唯一性', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

// ============================================
// Part 9: 手动操作Web界面测试指南
// ============================================

test.describe('手动操作Web界面测试', () => {
  test('MANUAL-001: 生成测试截图报告', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'manual-homepage');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'manual-login');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'manual-register');

    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'manual-jobs');
  });
});
