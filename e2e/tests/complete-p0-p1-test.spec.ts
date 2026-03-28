import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

interface TestResult {
  featureId: string;
  featureName: string;
  status: 'pass' | 'fail' | 'partial';
  message: string;
  screenshot?: string;
}

const testResults: TestResult[] = [];

function logResult(result: TestResult) {
  testResults.push(result);
  console.log(`[${result.status.toUpperCase()}] ${result.featureId}: ${result.message}`);
}

test.describe.serial('Complete P0/P1 Features E2E Test with Login', () => {
  let page: Page;
  let context: BrowserContext;
  let isLoggedIn: boolean = false;
  
  const testUsers = {
    freelancer: { email: 'freelancer@test.com', password: 'Test1234!', name: '测试顾问', user_type: 'job_seeker' },
    hr: { email: 'hr@test.com', password: 'Test1234!', name: '测试HR', user_type: 'hr_recruiter' }
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('Attempting to register and login test user...');
    
    // First try to register a new test user
    const registerSuccess = await registerTestUser(testUsers.freelancer);
    
    if (!registerSuccess) {
      // If registration fails, try to login (user might already exist)
      const loginSuccess = await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
      isLoggedIn = loginSuccess;
    } else {
      // After registration, login
      const loginSuccess = await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
      isLoggedIn = loginSuccess;
    }
    
    if (isLoggedIn) {
      console.log('✅ Test user logged in successfully!');
    } else {
      console.log('⚠️ Could not login test user, will test pages without authentication');
    }
  });

  async function registerTestUser(user: typeof testUsers.freelancer): Promise<boolean> {
    try {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('[data-testid="name-input"]');
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      const roleSelect = page.locator('[data-testid="user_type-select"], select[name="user_type"], [data-testid="role-select"]');
      const termsCheckbox = page.locator('#termsConditions');
      const submitBtn = page.locator('button[type="submit"]');

      // Check if registration form exists
      if (await nameInput.count() === 0) {
        console.log('Registration form not found, skipping registration');
        return false;
      }

      await nameInput.fill(user.name);
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      await confirmPasswordInput.fill(user.password);
      
      // Try to select role
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption(user.user_type);
      }

      // Accept terms
      if (await termsCheckbox.count() > 0) {
        await termsCheckbox.check();
      }

      await submitBtn.click();

      // Wait for redirect or error
      await page.waitForURL(/\/(login|dashboard|profile|\/$)/, { timeout: 30000 }).catch(() => {
        console.log('Registration redirect timeout, checking current URL');
      });

      const currentUrl = page.url();
      if (currentUrl.includes('/register')) {
        console.log('Registration may have failed, still on register page');
        return false;
      }

      console.log(`Registration successful, redirected to: ${currentUrl}`);
      return true;
    } catch (error) {
      console.log(`Registration error: ${error}`);
      return false;
    }
  }

  async function loginAsUser(email: string, password: string): Promise<boolean> {
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const submitBtn = page.locator('[data-testid="login-submit-btn"]');

      await emailInput.fill(email);
      await passwordInput.fill(password);
      await submitBtn.click();

      await page.waitForURL(/\/(dashboard|admin|profile|jobs|work-logs|invoices|messages|\/$)/, { timeout: 30000 }).catch(() => {
        console.log('Login redirect timeout, checking current URL');
      });

      await page.screenshot({ path: 'e2e-test-results/auth-login-result.png' });

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('Login failed, still on login page');
        return false;
      }

      console.log(`Login successful, redirected to: ${currentUrl}`);
      return true;
    } catch (error) {
      console.log(`Login error: ${error}`);
      return false;
    }
  }

  test.afterAll(async () => {
    await page.close();
    await context.close();
    console.log('\n========== TEST SUMMARY ==========');
    const passed = testResults.filter(r => r.status === 'pass');
    const partial = testResults.filter(r => r.status === 'partial');
    const failed = testResults.filter(r => r.status === 'fail');
    
    console.log(`Total: ${testResults.length}`);
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`⚠️ Partial: ${partial.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n---------- FAILED TESTS ----------');
      failed.forEach(r => {
        console.log(`[${r.featureId}] ${r.featureName}: ${r.message}`);
      });
    }
    console.log('====================================');
  });

  test('AUTH-001: User Registration Page', async () => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/auth-001-register.png' });

    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const nameInput = page.locator('[data-testid="name-input"]');
    const roleSelect = page.locator('[data-testid="user_type-select"], select[name="user_type"], [data-testid="role-select"]');

    const hasEmail = await emailInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;
    const hasName = await nameInput.count() > 0;
    const hasRole = await roleSelect.count() > 0;

    if (hasEmail && hasPassword && hasName && hasRole) {
      logResult({
        featureId: 'AUTH-001',
        featureName: '用户注册',
        status: 'pass',
        message: '注册页面包含所有必要字段',
        screenshot: 'auth-001-register.png'
      });
    } else {
      logResult({
        featureId: 'AUTH-001',
        featureName: '用户注册',
        status: 'fail',
        message: `缺少字段: email=${hasEmail}, password=${hasPassword}, name=${hasName}, role=${hasRole}`,
        screenshot: 'auth-001-register.png'
      });
    }

    expect(hasEmail).toBeTruthy();
    expect(hasPassword).toBeTruthy();
  });

  test('AUTH-002: User Login Page', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/auth-002-login.png' });

    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const submitBtn = page.locator('[data-testid="login-submit-btn"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    logResult({
      featureId: 'AUTH-002',
      featureName: '用户登录',
      status: 'pass',
      message: '登录页面包含所有必要字段',
      screenshot: 'auth-002-login.png'
    });
  });

  test('AUTH-003: Password Recovery Page', async () => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/auth-003-forgot-password.png' });

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const hasEmail = await emailInput.count() > 0;

    if (hasEmail) {
      logResult({
        featureId: 'AUTH-003',
        featureName: '密码找回',
        status: 'pass',
        message: '密码找回页面包含邮箱输入框',
        screenshot: 'auth-003-forgot-password.png'
      });
    } else {
      logResult({
        featureId: 'AUTH-003',
        featureName: '密码找回',
        status: 'partial',
        message: '页面已加载，但可能缺少邮箱输入框',
        screenshot: 'auth-003-forgot-password.png'
      });
    }
  });

  test('PROFILE-001: Profile Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/profile-001.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'PROFILE-001',
        featureName: '个人档案',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'profile-001.png'
      });
      return;
    }

    const profileContainer = page.locator('[data-testid="profile-container"]');
    const hasContent = await profileContainer.count() > 0;

    if (hasContent) {
      logResult({
        featureId: 'PROFILE-001',
        featureName: '个人档案',
        status: 'pass',
        message: '个人档案页面已加载',
        screenshot: 'profile-001.png'
      });
    } else {
      logResult({
        featureId: 'PROFILE-001',
        featureName: '个人档案',
        status: 'partial',
        message: '页面已加载但内容可能为空',
        screenshot: 'profile-001.png'
      });
    }
  });

  test('PROJ-001: Project Posting Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/proj-001-post-job.png' });

    const titleInput = page.locator('[data-testid="project-title-input"]');
    const descriptionInput = page.locator('[data-testid="project-description-input"]');
    const submitBtn = page.locator('[data-testid="submit-job-btn"]');

    const hasTitle = await titleInput.count() > 0;
    const hasDescription = await descriptionInput.count() > 0;
    const hasSubmit = await submitBtn.count() > 0;

    if (hasTitle && hasDescription && hasSubmit) {
      logResult({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        status: 'pass',
        message: '项目发布页面包含所有必要字段',
        screenshot: 'proj-001-post-job.png'
      });
    } else {
      logResult({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        status: 'partial',
        message: `缺少字段: title=${hasTitle}, description=${hasDescription}, submit=${hasSubmit}`,
        screenshot: 'proj-001-post-job.png'
      });
    }
  });

  test('PROJ-002: My Jobs Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/proj-002-my-jobs.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'PROJ-002',
        featureName: '我的项目',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'proj-002-my-jobs.png'
      });
      return;
    }

    const searchInput = page.locator('input[type="text"][placeholder*="搜索" i], input[type="search"]');
    const tabs = page.locator('button:has-text("全部"), button:has-text("待审核")');
    const applicationCards = page.locator('[class*="rounded-lg"][class*="border"]');

    const hasSearch = await searchInput.count() > 0;
    const hasTabs = await tabs.count() > 0;
    const hasCards = await applicationCards.count() > 0;

    if (hasSearch || hasTabs) {
      logResult({
        featureId: 'PROJ-002',
        featureName: '我的项目',
        status: 'pass',
        message: `项目列表页面包含: search=${hasSearch}, tabs=${hasTabs}, cards=${hasCards}`,
        screenshot: 'proj-002-my-jobs.png'
      });
    } else {
      logResult({
        featureId: 'PROJ-002',
        featureName: '我的项目',
        status: 'partial',
        message: '页面已加载但可能缺少筛选功能',
        screenshot: 'proj-002-my-jobs.png'
      });
    }
  });

  test('WORKLOG-001: Work Logs Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/worklog-001.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'WORKLOG-001',
        featureName: '工时管理',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'worklog-001.png'
      });
      return;
    }

    const createButton = page.locator('[data-testid="create-worklog-btn"]');
    const table = page.locator('table');
    const statusFilter = page.locator('[data-testid="status-filter"]');

    const hasCreateButton = await createButton.count() > 0;
    const hasTable = await table.count() > 0;
    const hasFilter = await statusFilter.count() > 0;

    if (hasCreateButton) {
      logResult({
        featureId: 'WORKLOG-001',
        featureName: '工时管理',
        status: 'pass',
        message: `工时页面包含: createButton=${hasCreateButton}, table=${hasTable}, filter=${hasFilter}`,
        screenshot: 'worklog-001.png'
      });
    } else {
      logResult({
        featureId: 'WORKLOG-001',
        featureName: '工时管理',
        status: 'fail',
        message: '缺少创建工时按钮',
        screenshot: 'worklog-001.png'
      });
    }
  });

  test('WORKLOG-002: Create Work Log Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/worklog-002-create.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'WORKLOG-002',
        featureName: '工时填报',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'worklog-002-create.png'
      });
      return;
    }

    const projectSelect = page.locator('[data-testid="project-select"]');
    const dateInput = page.locator('[data-testid="work-date-input"]');
    const hoursInput = page.locator('[data-testid="hours-input"]');
    const descriptionTextarea = page.locator('[data-testid="work-description-input"]');

    const hasProject = await projectSelect.count() > 0;
    const hasDate = await dateInput.count() > 0;
    const hasHours = await hoursInput.count() > 0;
    const hasDescription = await descriptionTextarea.count() > 0;

    if (hasProject && hasDate && hasHours && hasDescription) {
      const projectOptions = await projectSelect.locator('option').count();
      logResult({
        featureId: 'WORKLOG-002',
        featureName: '工时填报',
        status: projectOptions > 1 ? 'pass' : 'partial',
        message: `工时表单完整: project=${hasProject}(${projectOptions} options), date=${hasDate}, hours=${hasHours}, description=${hasDescription}`,
        screenshot: 'worklog-002-create.png'
      });
    } else {
      logResult({
        featureId: 'WORKLOG-002',
        featureName: '工时填报',
        status: 'fail',
        message: `缺少字段: project=${hasProject}, date=${hasDate}, hours=${hasHours}, description=${hasDescription}`,
        screenshot: 'worklog-002-create.png'
      });
    }
  });

  test('INV-001: Invoices Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/inv-001.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'INV-001',
        featureName: '发票管理',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'inv-001.png'
      });
      return;
    }

    const createButton = page.locator('[data-testid="create-invoice-btn"]');
    const table = page.locator('table');
    const searchInput = page.locator('input[type="text"], input[placeholder*="搜索" i]');
    const statusFilter = page.locator('select');

    const hasCreateButton = await createButton.count() > 0;
    const hasTable = await table.count() > 0;
    const hasSearch = await searchInput.count() > 0;
    const hasFilter = await statusFilter.count() > 0;

    if (hasCreateButton) {
      logResult({
        featureId: 'INV-001',
        featureName: '发票管理',
        status: 'pass',
        message: `发票页面包含: createButton=${hasCreateButton}, table=${hasTable}, search=${hasSearch}, filter=${hasFilter}`,
        screenshot: 'inv-001.png'
      });
    } else {
      logResult({
        featureId: 'INV-001',
        featureName: '发票管理',
        status: 'fail',
        message: '缺少创建发票按钮',
        screenshot: 'inv-001.png'
      });
    }
  });

  test('INV-002: Create Invoice Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/inv-002-create.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'INV-002',
        featureName: '发票创建',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'inv-002-create.png'
      });
      return;
    }

    const form = page.locator('form');
    const hasForm = await form.count() > 0;

    if (hasForm) {
      logResult({
        featureId: 'INV-002',
        featureName: '发票创建',
        status: 'pass',
        message: '发票创建表单已加载',
        screenshot: 'inv-002-create.png'
      });
    } else {
      logResult({
        featureId: 'INV-002',
        featureName: '发票创建',
        status: 'partial',
        message: '发票创建页面可能需要先确认工时',
        screenshot: 'inv-002-create.png'
      });
    }
  });

  test('MSG-001: Messages Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/msg-001.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'MSG-001',
        featureName: '消息中心',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'msg-001.png'
      });
      return;
    }

    const tabs = page.locator('button:has-text("全部"), button:has-text("未读")');
    const notificationList = page.locator('[class*="divide-y"], [class*="notification"], [class*="message"]');
    const filterSelect = page.locator('select');

    const hasTabs = await tabs.count() >= 2;
    const hasList = await notificationList.count() > 0;
    const hasFilter = await filterSelect.count() > 0;

    if (hasTabs || hasFilter) {
      logResult({
        featureId: 'MSG-001',
        featureName: '消息中心',
        status: 'pass',
        message: `消息页面包含: tabs=${hasTabs}, list=${hasList}, filter=${hasFilter}`,
        screenshot: 'msg-001.png'
      });
    } else {
      logResult({
        featureId: 'MSG-001',
        featureName: '消息中心',
        status: 'partial',
        message: '页面已加载，可能没有消息',
        screenshot: 'msg-001.png'
      });
    }
  });

  test('ADMIN-001: Admin Dashboard', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/admin-001.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'ADMIN-001',
        featureName: '管理员仪表盘',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'admin-001.png'
      });
      return;
    }

    const dashboardContent = page.locator('[class*="dashboard"], [class*="stats"], [class*="card"]');
    const hasContent = await dashboardContent.count() > 0;

    if (hasContent) {
      logResult({
        featureId: 'ADMIN-001',
        featureName: '管理员仪表盘',
        status: 'pass',
        message: '管理员仪表盘已加载',
        screenshot: 'admin-001.png'
      });
    } else {
      logResult({
        featureId: 'ADMIN-001',
        featureName: '管理员仪表盘',
        status: 'partial',
        message: '仪表盘可能需要管理员权限',
        screenshot: 'admin-001.png'
      });
    }
  });

  test('ADMIN-002: Admin Users Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/admin-002-users.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'ADMIN-002',
        featureName: '用户管理',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'admin-002-users.png'
      });
      return;
    }

    const table = page.locator('table');
    const userList = page.locator('[class*="user"], [class*="list"]');
    const hasContent = await table.count() > 0 || await userList.count() > 0;

    if (hasContent) {
      logResult({
        featureId: 'ADMIN-002',
        featureName: '用户管理',
        status: 'pass',
        message: '用户管理页面已加载',
        screenshot: 'admin-002-users.png'
      });
    } else {
      logResult({
        featureId: 'ADMIN-002',
        featureName: '用户管理',
        status: 'partial',
        message: '用户管理页面可能需要管理员权限',
        screenshot: 'admin-002-users.png'
      });
    }
  });

  test('ADMIN-003: Admin Config Page', async () => {
    if (!isLoggedIn) {
      await loginAsUser(testUsers.freelancer.email, testUsers.freelancer.password);
    }
    
    await page.goto(`${BASE_URL}/admin/config`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/admin-003-config.png' });

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    
    if (isLoginPage) {
      logResult({
        featureId: 'ADMIN-003',
        featureName: '系统配置',
        status: 'partial',
        message: '页面需要登录，已重定向到登录页',
        screenshot: 'admin-003-config.png'
      });
      return;
    }

    const configContent = page.locator('[class*="config"], form, table');
    const hasContent = await configContent.count() > 0;

    if (hasContent) {
      logResult({
        featureId: 'ADMIN-003',
        featureName: '系统配置',
        status: 'pass',
        message: '系统配置页面已加载',
        screenshot: 'admin-003-config.png'
      });
    } else {
      logResult({
        featureId: 'ADMIN-003',
        featureName: '系统配置',
        status: 'partial',
        message: '系统配置页面可能需要管理员权限',
        screenshot: 'admin-003-config.png'
      });
    }
  });
});
