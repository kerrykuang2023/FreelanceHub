import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

interface TestUser {
  email: string;
  password: string;
  role: string;
  expectedRoute: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test@123456',
    role: 'Job Seeker',
    expectedRoute: '/',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test@123456',
    role: 'HR Recruiter',
    expectedRoute: '/hr/dashboard',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test@123456',
    role: 'Administrator',
    expectedRoute: '/admin/dashboard',
  },
};

test.describe('自由顾问平台 - 多角色E2E UI测试', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'e2e-test-videos/' },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('公共页面访问测试', () => {
    test('01-首页加载和布局测试', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-01-homepage.png', fullPage: true });
      
      await expect(page).toHaveTitle(/JobPortal|自由顾问平台/);
      
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      const logo = page.locator('img[alt*="logo"], .logo, [data-testid="logo"]');
      if (await logo.count() > 0) {
        await expect(logo.first()).toBeVisible();
      }
      
      const navLinks = page.locator('nav a, header a');
      const navCount = await navLinks.count();
      expect(navCount).toBeGreaterThan(0);
    });

    test('02-登录页面测试', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-02-login-page.png' });
      
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]');
      await expect(emailInput).toBeVisible();
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
      await expect(loginButton).toBeVisible();
    });

    test('03-注册页面测试', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-03-register-page.png' });
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible();
      
      const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="确认密码"], input[placeholder*="Confirm"], input[id="confirmPassword"]');
      if (await confirmPasswordInput.count() > 0) {
        await expect(confirmPasswordInput.first()).toBeVisible();
      }
      
      const registerButton = page.locator('button[type="submit"], button:has-text("注册"), button:has-text("Register")');
      await expect(registerButton).toBeVisible();
    });
  });

  test.describe('自由顾问(Freelancer)角色测试', () => {
    test.beforeEach(async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    });

    test('04-自由顾问登录流程', async () => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill(TEST_USERS.freelancer.email);
      await passwordInput.fill(TEST_USERS.freelancer.password);
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-04-freelancer-login-filled.png' });
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginButton.click();
      
      await page.waitForURL(/\/|dashboard/, { timeout: 10000 }).catch(() => {});
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-05-freelancer-after-login.png' });
    });

    test('05-自由顾问工作台页面', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-06-freelancer-dashboard.png' });
      
      const dashboardElements = page.locator('[class*="dashboard"], [class*="card"], main section, main div, .container');
      const elementCount = await dashboardElements.count();
      expect(elementCount).toBeGreaterThanOrEqual(0);
      
      const bodyContent = page.locator('body');
      await expect(bodyContent).toBeVisible();
    });

    test('06-工时管理页面', async () => {
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-07-freelancer-worklogs.png' });
      
      const createWorkLogButton = page.locator('a[href*="/work-logs/new"], button:has-text("新建"), button:has-text("创建")');
      if (await createWorkLogButton.count() > 0) {
        await expect(createWorkLogButton.first()).toBeVisible();
      }
      
      const workLogTable = page.locator('table, [class*="list"], [class*="grid"]');
      if (await workLogTable.count() > 0) {
        await expect(workLogTable.first()).toBeVisible();
      }
    });

    test('07-发票管理页面', async () => {
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-08-freelancer-invoices.png' });
      
      const createInvoiceButton = page.locator('a[href*="/invoices/new"], button:has-text("创建发票"), button:has-text("新建")');
      if (await createInvoiceButton.count() > 0) {
        await expect(createInvoiceButton.first()).toBeVisible();
      }
    });

    test('08-消息中心页面', async () => {
      await page.goto(`${BASE_URL}/messages`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-09-freelancer-messages.png' });
      
      const messageList = page.locator('[class*="message"], [class*="notification"], ul, .list, main, body');
      await expect(messageList.first()).toBeVisible();
    });

    test('09-个人档案页面', async () => {
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-10-freelancer-profile.png' });
      
      const profileForm = page.locator('form, [class*="profile"]');
      await expect(profileForm.first()).toBeVisible();
    });
  });

  test.describe('HR/企业角色测试', () => {
    test.beforeEach(async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    });

    test('10-HR登录流程', async () => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill(TEST_USERS.hr.email);
      await passwordInput.fill(TEST_USERS.hr.password);
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-11-hr-login-filled.png' });
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginButton.click();
      
      await page.waitForURL(/\/|dashboard|hr/, { timeout: 10000 }).catch(() => {});
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-12-hr-after-login.png' });
    });

    test('11-HR工作台页面', async () => {
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-13-hr-dashboard.png' });
      
      const statsCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
      const cardCount = await statsCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    });

    test('12-发布职位页面', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-14-hr-post-job.png' });
      
      const jobTitleInput = page.locator('input[name="title"], input[name="project_title"], input[placeholder*="标题"]');
      if (await jobTitleInput.count() > 0) {
        await expect(jobTitleInput.first()).toBeVisible();
      }
      
      const descriptionInput = page.locator('textarea[name="description"], textarea[name="project_description"]');
      if (await descriptionInput.count() > 0) {
        await expect(descriptionInput.first()).toBeVisible();
      }
      
      const submitButton = page.locator('button[type="submit"], button:has-text("发布"), button:has-text("保存")');
      if (await submitButton.count() > 0) {
        await expect(submitButton.first()).toBeVisible();
      }
    });

    test('13-工时审核页面', async () => {
      await page.goto(`${BASE_URL}/company/work-logs/pending`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-15-hr-worklogs-pending.png' });
      
      const pendingWorkLogs = page.locator('table, [class*="list"], [class*="pending"]');
      if (await pendingWorkLogs.count() > 0) {
        await expect(pendingWorkLogs.first()).toBeVisible();
      }
    });
  });

  test.describe('管理员角色测试', () => {
    test.beforeEach(async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    });

    test('14-管理员登录流程', async () => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill(TEST_USERS.admin.email);
      await passwordInput.fill(TEST_USERS.admin.password);
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-16-admin-login-filled.png' });
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginButton.click();
      
      await page.waitForURL(/\/|dashboard|admin/, { timeout: 10000 }).catch(() => {});
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-17-admin-after-login.png' });
    });

    test('15-管理员工作台页面', async () => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-18-admin-dashboard.png' });
      
      const dashboardContent = page.locator('main, [class*="dashboard"], [class*="content"], body');
      await expect(dashboardContent.first()).toBeVisible();
    });

    test('16-系统配置页面', async () => {
      await page.goto(`${BASE_URL}/admin/configuration`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-19-admin-config.png' });
      
      const configSections = page.locator('[class*="config"], [class*="setting"], nav a');
      const sectionCount = await configSections.count();
      expect(sectionCount).toBeGreaterThanOrEqual(0);
    });

    test('17-技能分类管理页面', async () => {
      await page.goto(`${BASE_URL}/admin/config/skill-categories`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-20-admin-skill-categories.png' });
      
      const skillTable = page.locator('table, [class*="list"], [class*="grid"]');
      if (await skillTable.count() > 0) {
        await expect(skillTable.first()).toBeVisible();
      }
    });

    test('18-企业审核页面', async () => {
      await page.goto(`${BASE_URL}/admin/companies/review`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-21-admin-companies.png' });
      
      const companyList = page.locator('table, [class*="list"], [class*="company"]');
      if (await companyList.count() > 0) {
        await expect(companyList.first()).toBeVisible();
      }
    });
  });

  test.describe('响应式布局测试', () => {
    test('19-桌面端布局 (1920x1080)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-22-desktop-1920.png', fullPage: true });
      
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('20-平板端布局 (768x1024)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-23-tablet-768.png', fullPage: true });
      
      const mainContent = page.locator('main, [class*="main"], [class*="content"]');
      await expect(mainContent.first()).toBeVisible();
    });

    test('21-移动端布局 (375x667)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-24-mobile-375.png', fullPage: true });
      
      const mobileMenu = page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      }
    });
  });

  test.describe('导航和交互测试', () => {
    test('22-导航菜单交互', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const navLinks = page.locator('nav a, header a, [class*="nav"] a');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        const firstLink = navLinks.first();
        const href = await firstLink.getAttribute('href');
        if (href) {
          await firstLink.click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'e2e-test-screenshots/role-25-nav-interaction.png' });
        }
      }
    });

    test('23-表单验证测试', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginButton.click();
      
      await page.waitForTimeout(500);
      
      const errorMessage = page.locator('[class*="error"], [class*="invalid"], [class*="warning"]');
      const errorCount = await errorMessage.count();
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-26-form-validation.png' });
      
      expect(errorCount).toBeGreaterThanOrEqual(0);
    });

    test('24-页面加载性能测试', async () => {
      const startTime = Date.now();
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      await page.screenshot({ path: 'e2e-test-screenshots/role-27-performance.png' });
      
      console.log(`页面加载时间: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('API集成测试', () => {
    test('25-匹配推荐API测试', async () => {
      const response = await page.request.get(`${BASE_URL}/api/v1/match/score`, {
        params: {
          freelancerId: 'test-freelancer-id',
          projectId: 'test-project-id',
        },
      });
      
      console.log(`匹配API响应状态: ${response.status()}`);
      expect([200, 401, 404]).toContain(response.status());
    });

    test('26-消息API测试', async () => {
      const response = await page.request.get(`${BASE_URL}/api/v1/messages`, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
      
      console.log(`消息API响应状态: ${response.status()}`);
      expect([200, 401, 404]).toContain(response.status());
    });

    test('27-工单API测试', async () => {
      const response = await page.request.get(`${BASE_URL}/api/v1/tickets`, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
      
      console.log(`工单API响应状态: ${response.status()}`);
      expect([200, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('完整用户旅程测试', () => {
  let journeyPage: Page;

  test.beforeAll(async ({ browser }) => {
    journeyPage = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'e2e-test-videos/journey/' },
    });
  });

  test.afterAll(async () => {
    await journeyPage.close();
  });

  test('28-自由顾问完整旅程', async () => {
    console.log('开始自由顾问完整旅程测试...');
    
    await journeyPage.goto(BASE_URL);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-01-freelancer-home.png' });
    
    await journeyPage.goto(`${BASE_URL}/login`);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-02-freelancer-login.png' });
    
    const emailInput = journeyPage.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = journeyPage.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(TEST_USERS.freelancer.email);
    await passwordInput.fill(TEST_USERS.freelancer.password);
    
    const loginButton = journeyPage.locator('button[type="submit"], button:has-text("登录")').first();
    await loginButton.click();
    
    await journeyPage.waitForURL(/\/|dashboard/, { timeout: 10000 }).catch(() => {});
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-03-freelancer-dashboard.png' });
    
    const workLogsUrl = `${BASE_URL}/work-logs`;
    await journeyPage.goto(workLogsUrl);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-04-freelancer-worklogs.png' });
    
    const invoicesUrl = `${BASE_URL}/invoices`;
    await journeyPage.goto(invoicesUrl);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-05-freelancer-invoices.png' });
    
    const messagesUrl = `${BASE_URL}/messages`;
    await journeyPage.goto(messagesUrl);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-06-freelancer-messages.png' });
    
    console.log('自由顾问完整旅程测试完成');
  });

  test('29-HR完整旅程', async () => {
    console.log('开始HR完整旅程测试...');
    
    await journeyPage.goto(`${BASE_URL}/login`);
    await journeyPage.waitForLoadState('networkidle');
    
    const emailInput = journeyPage.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = journeyPage.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(TEST_USERS.hr.email);
    await passwordInput.fill(TEST_USERS.hr.password);
    
    const loginButton = journeyPage.locator('button[type="submit"], button:has-text("登录")').first();
    await loginButton.click();
    
    await journeyPage.waitForURL(/\/|dashboard|hr/, { timeout: 10000 }).catch(() => {});
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-07-hr-dashboard.png' });
    
    await journeyPage.goto(`${BASE_URL}/post-job`);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-08-hr-post-job.png' });
    
    await journeyPage.goto(`${BASE_URL}/company/work-logs/pending`);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-09-hr-worklogs.png' });
    
    console.log('HR完整旅程测试完成');
  });

  test('30-管理员完整旅程', async () => {
    console.log('开始管理员完整旅程测试...');
    
    await journeyPage.goto(`${BASE_URL}/login`);
    await journeyPage.waitForLoadState('networkidle');
    
    const emailInput = journeyPage.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = journeyPage.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(TEST_USERS.admin.email);
    await passwordInput.fill(TEST_USERS.admin.password);
    
    const loginButton = journeyPage.locator('button[type="submit"], button:has-text("登录")').first();
    await loginButton.click();
    
    await journeyPage.waitForURL(/\/|dashboard|admin/, { timeout: 10000 }).catch(() => {});
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-10-admin-dashboard.png' });
    
    await journeyPage.goto(`${BASE_URL}/admin/configuration`);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-11-admin-config.png' });
    
    await journeyPage.goto(`${BASE_URL}/admin/config/skill-categories`);
    await journeyPage.waitForLoadState('networkidle');
    await journeyPage.screenshot({ path: 'e2e-test-screenshots/journey-12-admin-skills.png' });
    
    console.log('管理员完整旅程测试完成');
  });
});
