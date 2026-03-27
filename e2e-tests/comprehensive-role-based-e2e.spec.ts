import { test, expect, Page, APIRequestContext, TestInfo } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const API_URL = process.env.API_URL || 'http://localhost:5555/api/v1';

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
    name: '自由顾问'
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
    name: 'HR招聘官'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
    name: '系统管理员'
  }
};

interface TestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  apiValidations: { endpoint: string; success: boolean }[];
  consoleErrors: string[];
  networkErrors: string[];
}

class ComprehensiveTestHelper {
  static results: TestResult[] = [];
  static currentResult: TestResult | null = null;
  static consoleErrors: string[] = [];
  static networkErrors: string[] = [];

  static startTest(testName: string) {
    this.currentResult = {
      testName,
      passed: true,
      errors: [],
      apiValidations: [],
      consoleErrors: [],
      networkErrors: []
    };
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  static endTest(passed: boolean = true) {
    if (this.currentResult) {
      this.currentResult.passed = passed;
      this.currentResult.consoleErrors = [...this.consoleErrors];
      this.currentResult.networkErrors = [...this.networkErrors];
      this.results.push(this.currentResult);
    }
  }

  static setupPageMonitoring(page: Page) {
    this.consoleErrors = [];
    this.networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      this.consoleErrors.push(`[pageerror] ${error.message}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        this.networkErrors.push(`[${response.status()}] ${response.url()}`);
      }
    });
  }

  static async login(page: Page, email: string, password: string): Promise<boolean> {
    console.log(`\n🔐 登录: ${email}`);
    
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(email);

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(password);

      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const success = !currentUrl.includes('/login');
      console.log(`  ${success ? '✅' : '❌'} 登录${success ? '成功' : '失败'}`);
      
      return success;
    } catch (e: any) {
      console.log(`  ❌ 登录失败: ${e.message}`);
      return false;
    }
  }

  static async logout(page: Page) {
    try {
      // 先尝试点击用户头像区域
      const userMenuSelectors = [
        '[class*="rounded-full"]',
        'button:has(img)',
        '[data-testid="user-menu"]',
        '.user-avatar',
        'button[aria-label*="用户"]'
      ];
      
      let menuClicked = false;
      for (const selector of userMenuSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            await element.click();
            menuClicked = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!menuClicked) {
        console.log(`  ⚠️ 未找到用户菜单，尝试直接退出`);
        // 尝试直接访问退出登录API或路由
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        console.log(`  🚪 已退出登录（通过导航）`);
        return;
      }
      
      await page.waitForTimeout(300);
      
      // 尝试点击退出按钮
      const logoutSelectors = [
        'button:has-text("退出")',
        'text=退出登录',
        '[data-testid="logout-btn"]',
        'a:has-text("退出")'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            await element.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            console.log(`  🚪 已退出登录`);
            return;
          }
        } catch {
          continue;
        }
      }
      
      // 如果找不到退出按钮，直接导航到登录页
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      console.log(`  🚪 已退出登录（通过导航）`);
    } catch (e) {
      console.log(`  ⚠️ 退出登录失败，继续测试`);
      // 强制导航到登录页
      await page.goto(`${BASE_URL}/login`).catch(() => {});
    }
  }

  static async verifyAPIResponse(
    request: APIRequestContext,
    endpoint: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await request.get(`${API_URL}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok()) {
        console.log(`  ❌ API ${endpoint}: ${response.status()}`);
        return { success: false, error: `API返回 ${response.status()}` };
      }

      if (this.currentResult) {
        this.currentResult.apiValidations.push({ endpoint, success: true });
      }

      console.log(`  ✅ API ${endpoint}`);
      return { success: true, data };
    } catch (e: any) {
      console.log(`  ❌ API ${endpoint}: ${e.message}`);
      if (this.currentResult) {
        this.currentResult.apiValidations.push({ endpoint, success: false });
      }
      return { success: false, error: e.message };
    }
  }

  static async navigateToPage(page: Page, path: string, name: string): Promise<boolean> {
    try {
      console.log(`\n📄 访问: ${name} (${path})`);
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      console.log(`  ✅ 页面加载成功`);
      return true;
    } catch (e: any) {
      console.log(`  ❌ 页面加载失败: ${e.message}`);
      return false;
    }
  }

  static async takeScreenshot(page: Page, testInfo: TestInfo, name: string) {
    try {
      const screenshot = await page.screenshot();
      await testInfo.attach(name, { body: screenshot, contentType: 'image/png' });
      console.log(`  📸 截图: ${name}`);
    } catch (e) {
      console.log(`  ⚠️ 截图失败: ${name}`);
    }
  }

  static generateReport(): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += '📊 E2E测试报告\n';
    report += '='.repeat(80) + '\n\n';

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    report += `总计: ${this.results.length} 个测试\n`;
    report += `通过: ${passed} 个 ✅\n`;
    report += `失败: ${failed} 个 ❌\n\n`;

    for (const result of this.results) {
      report += `${result.passed ? '✅' : '❌'} ${result.testName}\n`;
      
      if (result.apiValidations.length > 0) {
        const apiPassed = result.apiValidations.filter(a => a.success).length;
        report += `   API验证: ${apiPassed}/${result.apiValidations.length} 通过\n`;
      }
      
      if (result.consoleErrors.length > 0) {
        const criticalErrors = result.consoleErrors.filter(e => 
          e.includes('error') && !e.includes('404') && !e.includes('favicon')
        );
        if (criticalErrors.length > 0) {
          report += `   控制台错误: ${criticalErrors.length} 个\n`;
        }
      }
    }

    report += '\n' + '='.repeat(80) + '\n';
    return report;
  }
}

test.describe('🎯 全角色业务流程端到端测试', () => {
  test.describe.configure({ mode: 'serial' });

  test('E2E-001: 自由顾问(Freelancer)完整业务流程', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('自由顾问完整业务流程');
    console.log('\n' + '='.repeat(80));
    console.log('🚀 场景1: 自由顾问完整业务流程');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    // Step 1: 登录
    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.freelancer.email,
      TEST_USERS.freelancer.password
    );
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-login');

    // Step 2: 查看工作台
    await ComprehensiveTestHelper.navigateToPage(page, '/dashboard', '顾问工作台');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/work-logs/summary');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-dashboard');

    // Step 3: 浏览项目列表
    await ComprehensiveTestHelper.navigateToPage(page, '/jobs', '项目列表');
    const jobsAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/jobs');
    const jobCount = jobsAPI.data?.data?.items?.length || jobsAPI.data?.data?.length || 0;
    console.log(`  📋 项目数量: ${jobCount}`);
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-jobs-list');

    // Step 4: 查看个人档案
    await ComprehensiveTestHelper.navigateToPage(page, '/profile', '个人档案');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/auth/me');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-profile');

    // Step 5: 查看工时列表
    await ComprehensiveTestHelper.navigateToPage(page, '/work-logs', '工时列表');
    const workLogsAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/work-logs');
    const workLogCount = workLogsAPI.data?.data?.items?.length || workLogsAPI.data?.data?.length || 0;
    console.log(`  ⏰ 工时记录数: ${workLogCount}`);
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-worklogs');

    // Step 6: 查看发票列表
    await ComprehensiveTestHelper.navigateToPage(page, '/invoices', '发票列表');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/invoices');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'freelancer-invoices');

    console.log('\n📊 测试结果:');
    console.log(`  控制台错误: ${ComprehensiveTestHelper.consoleErrors.length} 个`);
    console.log(`  网络错误: ${ComprehensiveTestHelper.networkErrors.length} 个`);

    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(loginSuccess);
  });

  test('E2E-002: HR招聘官完整业务流程', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('HR招聘官完整业务流程');
    console.log('\n' + '='.repeat(80));
    console.log('👔 场景2: HR招聘官完整业务流程');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    // Step 1: 登录
    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.hr.email,
      TEST_USERS.hr.password
    );
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-login');

    // Step 2: 查看HR工作台
    await ComprehensiveTestHelper.navigateToPage(page, '/hr/dashboard', 'HR工作台');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-dashboard');

    // Step 3: 发布项目页面
    await ComprehensiveTestHelper.navigateToPage(page, '/post-job', '项目发布');
    
    // 检查表单元素
    console.log('\n📋 检查项目发布表单:');
    const formSelectors = [
      { name: '项目标题', selector: 'input[name="project_title"], input[data-testid="project-title-input"]' },
      { name: '项目描述', selector: 'textarea[name="project_description"]' },
      { name: '费率金额', selector: 'input[name="rate_amount"]' },
      { name: '发布按钮', selector: 'button[data-testid="submit-job-btn"], button:has-text("发布项目")' }
    ];

    for (const { name, selector } of formSelectors) {
      const exists = await page.locator(selector).first().isVisible().catch(() => false);
      console.log(`  ${exists ? '✅' : '❌'} ${name}`);
    }
    
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-post-job');

    // Step 4: 查看我的项目
    await ComprehensiveTestHelper.navigateToPage(page, '/my-projects', '我的项目');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/jobs?posted_by=me');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-my-projects');

    // Step 5: 查看申请管理
    await ComprehensiveTestHelper.navigateToPage(page, '/company/applications', '申请管理');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-applications');

    // Step 6: 查看工时审核
    await ComprehensiveTestHelper.navigateToPage(page, '/company/work-logs/pending', '工时审核');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/work-logs?status=submitted');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-pending-worklogs');

    // Step 7: 查看发票管理
    await ComprehensiveTestHelper.navigateToPage(page, '/company/invoices', '发票管理');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'hr-invoices');

    console.log('\n📊 测试结果:');
    console.log(`  控制台错误: ${ComprehensiveTestHelper.consoleErrors.length} 个`);

    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(loginSuccess);
  });

  test('E2E-003: 系统管理员完整业务流程', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('系统管理员完整业务流程');
    console.log('\n' + '='.repeat(80));
    console.log('⚙️ 场景3: 系统管理员完整业务流程');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    // Step 1: 登录
    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-login');

    // Step 2: 查看管理仪表盘
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/dashboard', '管理仪表盘');
    await ComprehensiveTestHelper.verifyAPIResponse(request, '/admin/dashboard/stats');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-dashboard');

    // Step 3: 用户管理
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/users', '用户管理');
    const usersAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/admin/users');
    const userCount = usersAPI.data?.data?.items?.length || usersAPI.data?.data?.length || 0;
    console.log(`  👥 用户数量: ${userCount}`);
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-users');

    // Step 4: 企业管理
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/companies', '企业管理');
    const companiesAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/admin/companies');
    const companyCount = companiesAPI.data?.data?.items?.length || companiesAPI.data?.data?.length || 0;
    console.log(`  🏢 企业数量: ${companyCount}`);
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-companies');

    // Step 5: 项目管理
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/projects', '项目管理');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-projects');

    // Step 6: 工时管理
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/worklogs', '工时管理');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-worklogs');

    // Step 7: 发票管理
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/invoices', '发票管理');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-invoices');

    // Step 8: 系统配置
    await ComprehensiveTestHelper.navigateToPage(page, '/admin/config', '系统配置');
    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'admin-config');

    console.log('\n📊 测试结果:');
    console.log(`  控制台错误: ${ComprehensiveTestHelper.consoleErrors.length} 个`);

    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(loginSuccess);
  });

  test('E2E-004: 数据一致性验证', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('数据一致性验证');
    console.log('\n' + '='.repeat(80));
    console.log('🔍 场景4: 数据一致性验证');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );

    // 验证用户数据一致性
    console.log('\n👥 验证用户数据一致性');
    const usersAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/admin/users');
    if (usersAPI.success) {
      const users = usersAPI.data?.data?.items || usersAPI.data?.data || [];
      console.log(`  📊 API返回用户数: ${users.length}`);
      
      await ComprehensiveTestHelper.navigateToPage(page, '/admin/users', '用户管理');
      const tableRows = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`  📊 页面显示用户数: ${tableRows}`);
      console.log(`  ${tableRows === users.length ? '✅' : '⚠️'} 数据一致性: API=${users.length}, 页面=${tableRows}`);
    }

    // 验证企业数据一致性
    console.log('\n🏢 验证企业数据一致性');
    const companiesAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/admin/companies');
    if (companiesAPI.success) {
      const companies = companiesAPI.data?.data?.items || companiesAPI.data?.data || [];
      console.log(`  📊 API返回企业数: ${companies.length}`);
      
      await ComprehensiveTestHelper.navigateToPage(page, '/admin/companies', '企业管理');
      const tableRows = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`  📊 页面显示企业数: ${tableRows}`);
      console.log(`  ${tableRows === companies.length ? '✅' : '⚠️'} 数据一致性: API=${companies.length}, 页面=${tableRows}`);
    }

    // 验证项目数据一致性
    console.log('\n💼 验证项目数据一致性');
    const jobsAPI = await ComprehensiveTestHelper.verifyAPIResponse(request, '/jobs');
    if (jobsAPI.success) {
      const jobs = jobsAPI.data?.data?.items || jobsAPI.data?.data || [];
      console.log(`  📊 API返回项目数: ${jobs.length}`);
      
      await ComprehensiveTestHelper.navigateToPage(page, '/admin/projects', '项目管理');
      const tableRows = await page.locator('table tbody tr').count().catch(() => 0);
      console.log(`  📊 页面显示项目数: ${tableRows}`);
      console.log(`  ${tableRows === jobs.length ? '✅' : '⚠️'} 数据一致性: API=${jobs.length}, 页面=${tableRows}`);
    }

    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'data-consistency');
    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(loginSuccess);
  });

  test('E2E-005: 权限控制验证', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('权限控制验证');
    console.log('\n' + '='.repeat(80));
    console.log('🔐 场景5: 权限控制验证');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    // 以顾问身份登录
    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.freelancer.email,
      TEST_USERS.freelancer.password
    );

    // 尝试访问管理员页面
    console.log('\n🔒 验证权限控制:');
    
    const restrictedPages = [
      { path: '/admin/dashboard', name: '管理员仪表盘' },
      { path: '/admin/users', name: '用户管理' },
      { path: '/admin/companies', name: '企业管理' }
    ];

    let permissionPassed = 0;
    for (const restrictedPage of restrictedPages) {
      await page.goto(`${BASE_URL}${restrictedPage.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes(restrictedPage.path);
      console.log(`  ${isRedirected ? '✅' : '❌'} ${restrictedPage.name}: ${isRedirected ? '已重定向' : '可访问'}`);
      if (isRedirected) permissionPassed++;
    }

    console.log(`\n📊 权限验证结果: ${permissionPassed}/${restrictedPages.length} 通过`);

    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'permission-check');
    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(permissionPassed === restrictedPages.length);
  });

  test('E2E-006: 控制台错误检测', async ({ page, request }, testInfo) => {
    ComprehensiveTestHelper.startTest('控制台错误检测');
    console.log('\n' + '='.repeat(80));
    console.log('🔍 场景6: 控制台错误检测');
    console.log('='.repeat(80));

    ComprehensiveTestHelper.setupPageMonitoring(page);

    const loginSuccess = await ComprehensiveTestHelper.login(
      page,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );

    const pagesToCheck = [
      { path: '/dashboard', name: '顾问工作台' },
      { path: '/hr/dashboard', name: 'HR工作台' },
      { path: '/admin/dashboard', name: '管理员工作台' },
      { path: '/jobs', name: '项目列表' },
      { path: '/work-logs', name: '工时列表' },
      { path: '/profile', name: '个人档案' },
      { path: '/admin/users', name: '用户管理' },
      { path: '/admin/companies', name: '企业管理' },
      { path: '/admin/projects', name: '项目管理' }
    ];

    const errorReport: Record<string, number> = {};
    let totalCriticalErrors = 0;

    for (const pageInfo of pagesToCheck) {
      ComprehensiveTestHelper.consoleErrors = [];
      
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const criticalErrors = ComprehensiveTestHelper.consoleErrors.filter(e => 
        e.includes('error') && !e.includes('404') && !e.includes('favicon')
      );

      errorReport[pageInfo.name] = criticalErrors.length;
      totalCriticalErrors += criticalErrors.length;
      console.log(`  📄 ${pageInfo.name}: ${criticalErrors.length} 个错误`);
    }

    console.log('\n📊 错误汇总:');
    console.log(`  总计: ${totalCriticalErrors} 个严重错误`);

    await ComprehensiveTestHelper.takeScreenshot(page, testInfo, 'console-errors-report');
    await ComprehensiveTestHelper.logout(page);
    ComprehensiveTestHelper.endTest(totalCriticalErrors === 0);
  });
});

test.afterAll(() => {
  const report = ComprehensiveTestHelper.generateReport();
  console.log(report);
});
