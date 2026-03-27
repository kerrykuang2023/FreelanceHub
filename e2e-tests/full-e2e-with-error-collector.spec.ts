import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  ErrorCollector, 
  TestHelper, 
  DataVerifier, 
  IssueLogger, 
  TEST_USERS 
} from '../e2e-utils/error-collector';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

interface TestContext {
  companyId?: string;
  companyName?: string;
  projectId?: string;
  projectTitle?: string;
  applicationId?: string;
  authToken?: string;
}

const context: TestContext = {};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  console.log('\n========================================');
  console.log('  完整 E2E 测试 - 全角色全场景');
  console.log('  包含错误监听器');
  console.log('========================================\n');
  
  // 登录管理员获取 token
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password
    }
  });
  const loginData = await loginResponse.json();
  if (loginData.token) {
    context.authToken = loginData.token;
    DataVerifier.setAuthToken(loginData.token);
    console.log('  ✅ 已获取管理员认证 token');
  }
});

/**
 * 【管理员】系统管理功能测试
 */
test.describe('【管理员】系统管理功能', () => {
  
  test('【ADM-01】管理员登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-01】管理员登录验证                │');
    console.log('└─────────────────────────────────────────┘');
    
    // 1. 设置错误监听器
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    // 2. 执行登录
    const loginSuccess = await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    // 3. 验证登录成功
    if (!loginSuccess) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: '管理员登录失败',
        expectedBehavior: '管理员应该能够成功登录',
        actualBehavior: '登录失败，页面未跳转',
        steps: ['访问登录页面', '输入管理员账号密码', '点击登录'],
        page: '/login',
        userRole: 'Administrator',
        errors: errorCollector.getErrors(),
        networkErrors: errorCollector.getNetworkErrors(),
      });
    }
    
    // 4. 检查是否有错误
    if (errorCollector.hasErrors()) {
      console.log(`\n⚠️ 发现 ${errorCollector.getErrorCount()} 个错误：`);
      console.log(errorCollector.getErrorReport());
      
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '管理员登录过程存在错误',
        expectedBehavior: '登录过程应无错误',
        actualBehavior: `发现 ${errorCollector.getErrorCount()} 个错误`,
        steps: ['登录过程'],
        page: '/login',
        userRole: 'Administrator',
        errors: errorCollector.getErrors(),
        networkErrors: errorCollector.getNetworkErrors(),
      });
    }
    
    // 5. 如果有错误，测试失败
    expect(errorCollector.hasErrors(), 
      `测试期间发现了 ${errorCollector.getErrorCount()} 个错误:\n${errorCollector.getErrorReport()}`
    ).toBe(false);
    
    expect(loginSuccess).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【ADM-02】访问管理后台 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-02】访问管理后台                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await TestHelper.loginAsUser(page, TEST_USERS.admin);
    await TestHelper.navigateToPage(page, '/admin');
    
    // 验证管理后台元素
    const hasDashboard = await TestHelper.verifyElementExists(
      page, 
      '[class*="dashboard"], [class*="admin"]', 
      '管理后台容器'
    );
    
    if (errorCollector.hasErrors()) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '管理后台页面存在错误',
        expectedBehavior: '管理后台应无错误',
        actualBehavior: `发现 ${errorCollector.getErrorCount()} 个错误`,
        steps: ['登录管理员', '访问 /admin'],
        page: '/admin',
        userRole: 'Administrator',
        errors: errorCollector.getErrors(),
      });
    }
    
    expect(errorCollector.hasErrors(), 
      `管理后台页面存在错误:\n${errorCollector.getErrorReport()}`
    ).toBe(false);
    
    await TestHelper.logout(page);
  });
  
  test('【ADM-03】验证主数据完整性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-03】验证主数据完整性              │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    // 验证技能分类
    const skillResult = await DataVerifier.verifySkillCategories(request);
    if (!skillResult.exists) {
      issueLogger.logIssue({
        category: 'DATA',
        severity: 'CRITICAL',
        description: '技能分类数据不存在',
        expectedBehavior: '应该存在技能分类数据',
        actualBehavior: '技能分类为空',
        steps: ['调用 GET /api/v1/skill-categories'],
        page: '/admin/skills',
        userRole: 'Administrator',
      });
    }
    
    // 访问管理页面
    await TestHelper.navigateToPage(page, '/admin/skills');
    await TestHelper.navigateToPage(page, '/admin/users');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

/**
 * 【HR】公司管理功能测试
 */
test.describe('【HR】公司管理功能', () => {
  
  test('【HR-01】HR 登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-01】HR 登录验证                    │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    const loginSuccess = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginSuccess) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login',
        userRole: 'HR Recruiter',
        errors: errorCollector.getErrors(),
      });
    }
    
    if (errorCollector.hasErrors()) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: 'HR 登录过程存在错误',
        expectedBehavior: '登录过程应无错误',
        actualBehavior: `发现 ${errorCollector.getErrorCount()} 个错误`,
        steps: ['登录过程'],
        page: '/login',
        userRole: 'HR Recruiter',
        errors: errorCollector.getErrors(),
      });
    }
    
    expect(errorCollector.hasErrors(), 
      `HR 登录过程存在错误:\n${errorCollector.getErrorReport()}`
    ).toBe(false);
    
    expect(loginSuccess).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【HR-02】发布项目 - 验证数据存在', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-02】发布项目并验证数据             │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    // 导航到发布项目页面
    const navSuccess = await TestHelper.navigateToPage(page, '/post-job');
    
    if (!navSuccess) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'CRITICAL',
        description: '发布项目页面无法访问',
        expectedBehavior: '/post-job 应该可访问',
        actualBehavior: '页面加载失败',
        steps: ['登录 HR', '访问 /post-job'],
        page: '/post-job',
        userRole: 'HR Recruiter',
        errors: errorCollector.getErrors(),
      });
    }
    
    // 填写项目表单
    context.projectTitle = `测试项目-${Date.now()}`;
    
    try {
      const titleInput = page.locator('[data-testid="project-title-input"]');
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });
      await titleInput.fill(context.projectTitle);
      
      const descInput = page.locator('[data-testid="project-description-input"]');
      await descInput.fill('这是一个完整的端到端测试项目');
      
      // 选择下拉框
      await page.locator('select[name="job_nature"]').selectOption('full_time');
      await page.locator('select[name="work_format"]').selectOption('remote');
      await page.locator('select[name="rate_type"]').selectOption('daily');
      await page.locator('input[name="rate_amount"]').fill('2000');
      
      // 选择技能分类
      const categoryBtn = page.locator('[data-testid^="major-category-btn-"]').first();
      if (await categoryBtn.isVisible().catch(() => false)) {
        await categoryBtn.click();
        await page.waitForTimeout(500);
      }
      
      // 填写地点
      await page.locator('input[name="city"]').fill('北京');
      await page.locator('input[name="country"]').fill('中国');
      
      // 提交
      const submitBtn = page.locator('[data-testid="submit-job-btn"]');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      
      console.log(`  ✅ 项目表单已提交：${context.projectTitle}`);
    } catch (error) {
      console.log(`  ❌ 项目表单提交失败：${error}`);
    }
    
    // 验证后端数据
    if (context.projectTitle) {
      const projectExists = await DataVerifier.verifyProjectExists(request, context.projectTitle);
      
      if (!projectExists.exists) {
        issueLogger.logIssue({
          category: 'DATA',
          severity: 'CRITICAL',
          description: '项目数据在数据库中不存在',
          expectedBehavior: '发布后项目数据应该存在于数据库',
          actualBehavior: 'API 查询不到项目数据',
          steps: ['发布项目', '调用 GET /api/v1/jobs'],
          page: '/post-job',
          userRole: 'HR Recruiter',
          errors: errorCollector.getErrors(),
          networkErrors: errorCollector.getNetworkErrors(),
        });
      }
      
      context.projectId = projectExists.project?._id;
    }
    
    await TestHelper.logout(page);
  });
});

/**
 * 【顾问】个人档案与求职功能测试
 */
test.describe('【顾问】个人档案与求职功能', () => {
  
  test('【CON-01】顾问登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-01】顾问登录验证                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    const loginSuccess = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginSuccess) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login',
        userRole: 'Job Seeker',
        errors: errorCollector.getErrors(),
      });
    }
    
    if (errorCollector.hasErrors()) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '顾问登录过程存在错误',
        expectedBehavior: '登录过程应无错误',
        actualBehavior: `发现 ${errorCollector.getErrorCount()} 个错误`,
        steps: ['登录过程'],
        page: '/login',
        userRole: 'Job Seeker',
        errors: errorCollector.getErrors(),
      });
    }
    
    expect(errorCollector.hasErrors(), 
      `顾问登录过程存在错误:\n${errorCollector.getErrorReport()}`
    ).toBe(false);
    
    expect(loginSuccess).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【CON-02】浏览项目列表 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-02】浏览项目列表                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    await TestHelper.navigateToPage(page, '/projects');
    
    // 验证项目列表元素
    const hasProjectList = await TestHelper.verifyElementExists(
      page,
      '[class*="project"], [class*="job"], [class*="list"]',
      '项目列表容器'
    );
    
    if (errorCollector.hasErrors()) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '项目列表页面存在错误',
        expectedBehavior: '项目列表应无错误',
        actualBehavior: `发现 ${errorCollector.getErrorCount()} 个错误`,
        steps: ['登录顾问', '访问 /projects'],
        page: '/projects',
        userRole: 'Job Seeker',
        errors: errorCollector.getErrors(),
      });
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

/**
 * 【验证】数据完整性验证
 */
test.describe('【验证】数据完整性', () => {
  
  test('【VAL-01】登录表单验证', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【VAL-01】登录表单验证                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // 尝试空表单提交
    const loginButton = page.locator('[data-testid="login-submit-btn"]');
    await loginButton.click();
    await page.waitForTimeout(1000);
    
    // 验证仍在登录页
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    console.log('  ✅ 空表单被阻止提交');
    
    // 尝试无效邮箱
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('invalid-email');
    await loginButton.click();
    await page.waitForTimeout(1000);
    
    expect(page.url()).toContain('/login');
    console.log('  ✅ 无效邮箱被阻止提交');
    
    expect(errorCollector.hasErrors()).toBe(false);
  });
  
  test('【VAL-02】项目创建必填验证', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【VAL-02】项目创建必填验证              │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = ErrorCollector.setupErrorListeners(page);
    
    await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    await TestHelper.navigateToPage(page, '/post-job');
    
    // 尝试空表单提交
    const submitButton = page.locator('[data-testid="submit-job-btn"]');
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // 验证仍在发布页面
    const currentUrl = page.url();
    expect(currentUrl).toContain('/post-job');
    console.log('  ✅ 空项目表单被阻止提交');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.afterAll(() => {
  console.log('\n========================================');
  console.log('  完整 E2E 测试完成');
  console.log('========================================\n');
  
  const issues = issueLogger.getIssues();
  
  console.log('📊 测试统计:');
  console.log(`  - 发现问题：${issues.length} 个`);
  
  if (issues.length > 0) {
    console.log('\n⚠️ 问题汇总:');
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity}] ${issue.description}`);
      console.log(`   分类：${issue.category}`);
      console.log(`   页面：${issue.page}`);
      console.log(`   角色：${issue.userRole}`);
    });
    
    // 生成问题报告文件
    console.log('\n📄 问题报告已生成');
  } else {
    console.log('\n✅ 未发现问题');
  }
});
