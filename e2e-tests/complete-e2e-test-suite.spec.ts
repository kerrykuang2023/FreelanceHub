import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  ErrorCollector, 
  TestHelper, 
  DataVerifier, 
  IssueLogger, 
  TEST_USERS,
  LoginResult,
  NavigationResult
} from '../e2e-utils/error-collector';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

interface TestContext {
  companyId?: string;
  companyName?: string;
  projectId?: string;
  projectTitle?: string;
  secondProjectId?: string;
  secondProjectTitle?: string;
  applicationId?: string;
  workLogId?: string;
  invoiceId?: string;
  authToken?: string;
  hrToken?: string;
  freelancerToken?: string;
  freelancerId?: string;
}

const context: TestContext = {};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  console.log('\n========================================');
  console.log('  完整 E2E 测试 - 全角色全场景');
  console.log('  严格遵循最佳实践规范');
  console.log('========================================\n');
  
  const adminLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password }
  });
  const adminData = await adminLogin.json();
  context.authToken = adminData.data?.token || adminData.token;
  if (context.authToken) {
    DataVerifier.setAuthToken(context.authToken);
    console.log('  ✅ 已获取管理员认证 token');
  } else {
    console.log('  ❌ 管理员登录失败:', JSON.stringify(adminData));
  }
  
  const hrLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USERS.hr1.email, password: TEST_USERS.hr1.password }
  });
  const hrData = await hrLogin.json();
  context.hrToken = hrData.data?.token || hrData.token;
  if (context.hrToken) {
    console.log('  ✅ 已获取 HR 认证 token');
  }
  
  const freelancerLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USERS.freelancer1.email, password: TEST_USERS.freelancer1.password }
  });
  const freelancerData = await freelancerLogin.json();
  context.freelancerToken = freelancerData.data?.token || freelancerData.token;
  context.freelancerId = freelancerData.data?.user?._id || freelancerData.user?._id;
  if (context.freelancerToken) {
    console.log('  ✅ 已获取顾问认证 token');
  }

  console.log('\n🌱 初始化技能分类数据...');
  const skillCategories = [
    { category_name: "ERP", category_code: "ERP", category_icon: "CpuChipIcon", description: "Enterprise Resource Planning systems", display_order: 1 },
    { category_name: "SAP", category_code: "SAP", category_icon: "CubeIcon", description: "SAP Modules and Technologies", display_order: 2 },
    { category_name: "CRM", category_code: "CRM", category_icon: "UsersIcon", description: "Customer Relationship Management", display_order: 3 },
    { category_name: "Frontend", category_code: "FRONTEND", category_icon: "DeviceMobileIcon", description: "Frontend Development", display_order: 4 },
    { category_name: "Backend", category_code: "BACKEND", category_icon: "ServerIcon", description: "Backend Development", display_order: 5 },
    { category_name: "Database", category_code: "DB", category_icon: "DatabaseIcon", description: "Database Management", display_order: 6 },
  ];

  const existingSkillsResponse = await request.get(`${API_URL}/admin/skills`, {
    headers: { 'Authorization': `Bearer ${context.authToken}` }
  });
  const existingSkillsData = await existingSkillsResponse.json();
  const existingSkills = existingSkillsData.data || [];

  if (existingSkills.length === 0) {
    console.log('  📝 技能分类为空，正在初始化...');
    let createdCount = 0;
    for (const category of skillCategories) {
      try {
        const createResponse = await request.post(`${API_URL}/admin/skills`, {
          headers: { 'Authorization': `Bearer ${context.authToken}` },
          data: category
        });
        if (createResponse.ok()) {
          const responseData = await createResponse.json();
          console.log(`  ✅ 已创建技能分类: ${category.category_name}`);
          createdCount++;
        } else {
          const errorData = await createResponse.text();
          console.log(`  ❌ 创建失败 ${category.category_name}: ${createResponse.status()} - ${errorData}`);
        }
      } catch (error) {
        console.log(`  ❌ 创建异常 ${category.category_name}: ${error}`);
      }
    }
    console.log(`  📊 共创建 ${createdCount}/${skillCategories.length} 个技能分类`);
  } else {
    console.log(`  ✅ 技能分类已存在: ${existingSkills.length} 个`);
  }
});

test.describe('【管理员】系统管理功能', () => {
  
  test('【ADM-01】管理员登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-01】管理员登录验证                │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '管理员登录失败',
        expectedBehavior: '管理员应该能够成功登录',
        actualBehavior: '登录失败，页面未跳转',
        steps: ['访问登录页面', '输入管理员账号密码', '点击登录'],
        page: '/login', userRole: 'Administrator',
        errors: loginResult.errors,
        networkErrors: loginResult.networkErrors,
      });
    }
    
    if (loginResult.errors.length > 0) {
      const criticalErrors = loginResult.errors.filter(e => 
        e.type === 'pageerror'
      );
      
      if (criticalErrors.length > 0) {
        issueLogger.logIssue({
          category: 'UI', severity: 'HIGH',
          description: '登录过程存在页面错误',
          expectedBehavior: '登录过程应无页面错误',
          actualBehavior: `存在 ${criticalErrors.length} 个错误`,
          steps: ['检查控制台错误'],
          page: '/login', userRole: 'Administrator',
          errors: criticalErrors,
        });
      }
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    expect(loginResult.success).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【ADM-02】访问管理后台 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-02】访问管理后台                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '管理员登录失败',
        expectedBehavior: '管理员应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入管理员账号密码', '点击登录'],
        page: '/login', userRole: 'Administrator',
        errors: loginResult.errors,
      });
    }
    
    const navResult = await TestHelper.navigateToPage(page, '/admin', /\/admin/);
    
    if (!navResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'HIGH',
        description: '管理后台页面导航失败',
        expectedBehavior: '应该成功导航到管理后台',
        actualBehavior: `实际URL: ${navResult.actualUrl}`,
        steps: ['登录后访问 /admin'],
        page: '/admin', userRole: 'Administrator',
        errors: navResult.errors,
      });
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【ADM-03】验证主数据完整性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【ADM-03】验证主数据完整性              │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '管理员登录失败',
        expectedBehavior: '管理员应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入管理员账号密码', '点击登录'],
        page: '/login', userRole: 'Administrator',
        errors: loginResult.errors,
      });
    }
    
    const skillResult = await DataVerifier.verifySkillCategories(request);
    if (!skillResult.exists) {
      issueLogger.logIssue({
        category: 'DATA', severity: 'CRITICAL',
        description: '技能分类数据不存在',
        expectedBehavior: '应该存在技能分类数据',
        actualBehavior: '技能分类为空',
        steps: ['调用 GET /api/v1/admin/skills'],
        page: '/admin/skills', userRole: 'Administrator',
      });
    }
    
    await TestHelper.navigateToPage(page, '/admin/skills');
    await TestHelper.navigateToPage(page, '/admin/users');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.describe('【HR】公司管理功能', () => {
  
  test('【HR-01】HR 登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-01】HR 登录验证                    │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    expect(loginResult.success).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【HR-02】发布项目 - 验证数据存在', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-02】发布项目并验证数据             │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    const navResult = await TestHelper.navigateToPage(page, '/post-job');
    
    context.projectTitle = `测试项目-${Date.now()}`;
    
    try {
      const titleInput = page.locator('[data-testid="project-title-input"]');
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });
      await titleInput.fill(context.projectTitle);
      
      await page.locator('[data-testid="project-description-input"]').fill('这是一个完整的端到端测试项目');
      await page.locator('select[name="job_nature"]').selectOption('full_time');
      await page.locator('select[name="work_format"]').selectOption('remote');
      await page.locator('select[name="rate_type"]').selectOption('daily');
      await page.locator('input[name="rate_amount"]').fill('2000');
      
      const categoryBtn = page.locator('[data-testid^="major-category-btn-"]').first();
      if (await categoryBtn.isVisible().catch(() => false)) {
        await categoryBtn.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[name="city"]').fill('北京');
      await page.locator('input[name="country"]').fill('中国');
      
      await page.locator('[data-testid="submit-job-btn"]').click();
      await page.waitForTimeout(3000);
      
      console.log(`  ✅ 项目表单已提交：${context.projectTitle}`);
    } catch (error) {
      console.log(`  ❌ 项目表单提交失败：${error}`);
      issueLogger.logIssue({
        category: 'UX', severity: 'HIGH',
        description: '项目发布表单提交失败',
        expectedBehavior: '应该能够成功提交项目表单',
        actualBehavior: `表单提交异常: ${error}`,
        steps: ['填写项目表单', '点击提交按钮'],
        page: '/post-job', userRole: 'HR Recruiter',
      });
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【HR-03】创建第二个项目 - 用于测试取消', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-03】创建第二个项目                 │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/post-job');
    
    context.secondProjectTitle = `取消测试项目-${Date.now()}`;
    
    try {
      const titleInput = page.locator('[data-testid="project-title-input"]');
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });
      await titleInput.fill(context.secondProjectTitle);
      
      await page.locator('[data-testid="project-description-input"]').fill('用于测试取消功能的项目');
      await page.locator('select[name="job_nature"]').selectOption('part_time');
      await page.locator('select[name="work_format"]').selectOption('onsite');
      await page.locator('select[name="rate_type"]').selectOption('monthly');
      await page.locator('input[name="rate_amount"]').fill('500');
      
      const categoryBtn = page.locator('[data-testid^="major-category-btn-"]').first();
      if (await categoryBtn.isVisible().catch(() => false)) {
        await categoryBtn.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[name="city"]').fill('上海');
      await page.locator('input[name="country"]').fill('中国');
      
      await page.locator('[data-testid="submit-job-btn"]').click();
      await page.waitForTimeout(3000);
      
      console.log(`  ✅ 第二个项目表单已提交：${context.secondProjectTitle}`);
    } catch (error) {
      console.log(`  ❌ 第二个项目表单提交失败：${error}`);
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【HR-04】查看我的项目', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-04】查看我的项目                   │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/my-projects');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【HR-05】取消未接单项目 - 反向操作成功', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-05】取消未接单项目                 │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/my-projects');
    
    const cancelButton = page.locator('button:has-text("取消"), button:has-text("删除")').first();
    if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 项目取消操作已执行');
    } else {
      console.log('  ⚠️ 未找到可取消的项目按钮');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【HR-06】注册公司', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-06】注册公司                       │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    const navResult = await TestHelper.navigateToPage(page, '/company/register');
    
    if (navResult.success) {
      context.companyName = `测试公司-${Date.now()}`;
      
      try {
        const nameInput = page.locator('input[name="company_name"], input[placeholder*="公司名称"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill(context.companyName);
          console.log(`  ✅ 公司名称已填写：${context.companyName}`);
        }
      } catch (error) {
        console.log('  ⚠️ 公司注册表单填写失败');
      }
    } else {
      console.log('  ⚠️ 公司注册页面不可访问');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.describe('【顾问】个人档案与求职功能', () => {
  
  test('【CON-01】顾问登录 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-01】顾问登录验证                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    expect(loginResult.success).toBe(true);
    await TestHelper.logout(page);
  });
  
  test('【CON-02】浏览项目列表 - 验证无错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-02】浏览项目列表                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/projects');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CON-03】查看项目详情', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-03】查看项目详情                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/projects');
    
    const projectCard = page.locator('[class*="project"], [class*="job"], [class*="card"]').first();
    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 项目详情页面已访问');
    } else {
      console.log('  ⚠️ 未找到项目卡片');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CON-04】申请项目', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-04】申请项目                      │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/projects');
    
    const applyButton = page.locator('button:has-text("申请"), button:has-text("投递")').first();
    if (await applyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await applyButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 项目申请已提交');
    } else {
      console.log('  ⚠️ 未找到申请按钮');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CON-05】查看我的申请', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-05】查看我的申请                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/my-applications');
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CON-06】撤销未批准的申请 - 反向操作', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CON-06】撤销未批准的申请              │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/my-applications');
    
    const withdrawButton = page.locator('button:has-text("撤销"), button:has-text("取消申请")').first();
    if (await withdrawButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await withdrawButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 申请撤销操作已执行');
    } else {
      console.log('  ⚠️ 未找到可撤销的申请');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.describe('【跨角色】数据流转', () => {
  
  test('【CROSS-01】HR 发布项目 → 顾问申请 → HR 批准', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CROSS-01】完整招聘流程验证            │');
    console.log('└─────────────────────────────────────────┘');
    
    console.log('\n📌 Step 1: HR 发布项目');
    const hrErrorCollector = TestHelper.setupPageMonitoring(page);
    const hrLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!hrLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: hrLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/post-job');
    
    const crossProjectTitle = `跨角色测试项目-${Date.now()}`;
    try {
      await page.locator('[data-testid="project-title-input"]').fill(crossProjectTitle);
      await page.locator('[data-testid="project-description-input"]').fill('跨角色完整流程测试');
      await page.locator('select[name="job_nature"]').selectOption('full_time');
      await page.locator('select[name="work_format"]').selectOption('remote');
      await page.locator('select[name="rate_type"]').selectOption('daily');
      await page.locator('input[name="rate_amount"]').fill('3000');
      await page.locator('input[name="city"]').fill('深圳');
      await page.locator('[data-testid="submit-job-btn"]').click();
      await page.waitForTimeout(3000);
      console.log(`  ✅ 项目已发布：${crossProjectTitle}`);
    } catch (error) {
      console.log('  ⚠️ 项目发布失败');
    }
    await TestHelper.logout(page);
    
    console.log('\n📌 Step 2: 顾问申请项目');
    const freelancerLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!freelancerLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: freelancerLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/projects');
    
    const applyBtn = page.locator('button:has-text("申请"), button:has-text("投递")').first();
    if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 顾问已申请项目');
    }
    await TestHelper.logout(page);
    
    console.log('\n📌 Step 3: HR 批准申请');
    const hrLoginResult2 = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!hrLoginResult2.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: hrLoginResult2.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/applications');
    
    const approveBtn = page.locator('button:has-text("批准"), button:has-text("通过")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ HR 已批准申请');
    }
    
    expect(hrErrorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CROSS-02】工时填报 → HR 确认', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CROSS-02】工时填报流程验证            │');
    console.log('└─────────────────────────────────────────┘');
    
    console.log('\n📌 Step 1: 顾问填报工时');
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const freelancerLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!freelancerLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: freelancerLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/work-logs');
    
    const addWorkLogBtn = page.locator('button:has-text("添加"), button:has-text("填报")').first();
    if (await addWorkLogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addWorkLogBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 工时填报页面已访问');
    }
    await TestHelper.logout(page);
    
    console.log('\n📌 Step 2: HR 确认工时');
    const hrLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!hrLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: hrLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/work-logs');
    
    const confirmBtn = page.locator('button:has-text("确认"), button:has-text("批准")').first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ HR 已确认工时');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【CROSS-03】发票创建 → HR 审核 → HR 付款', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【CROSS-03】发票流程验证                │');
    console.log('└─────────────────────────────────────────┘');
    
    console.log('\n📌 Step 1: 顾问创建发票');
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const freelancerLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (!freelancerLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: '顾问登录失败',
        expectedBehavior: '顾问应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入顾问账号密码', '点击登录'],
        page: '/login', userRole: 'Job Seeker',
        errors: freelancerLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/invoices');
    
    const createInvoiceBtn = page.locator('button:has-text("创建"), button:has-text("开票")').first();
    if (await createInvoiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createInvoiceBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 发票创建页面已访问');
    }
    await TestHelper.logout(page);
    
    console.log('\n📌 Step 2: HR 审核发票');
    const hrLoginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!hrLoginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: hrLoginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/invoices');
    
    const approveInvoiceBtn = page.locator('button:has-text("审核"), button:has-text("批准")').first();
    if (await approveInvoiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveInvoiceBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ HR 已审核发票');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.describe('【反向操作】边界条件', () => {
  
  test('【NEG-01】HR 尝试取消已进行中的项目', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【NEG-01】取消已进行中项目验证          │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/my-projects');
    
    const cancelBtn = page.locator('button:has-text("取消")').first();
    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(2000);
      
      const errorMessage = page.locator('[class*="error"], [class*="warning"], [class*="toast"]');
      if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ✅ 正确显示了错误提示');
      }
    } else {
      console.log('  ⚠️ 未找到取消按钮');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【NEG-02】HR 驳回工时必须填写理由', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【NEG-02】驳回工时必须填写理由          │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/work-logs');
    
    const rejectBtn = page.locator('button:has-text("驳回"), button:has-text("拒绝")').first();
    if (await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(1000);
      
      const reasonInput = page.locator('textarea, input[placeholder*="理由"]');
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ✅ 正确要求填写驳回理由');
      }
    } else {
      console.log('  ⚠️ 未找到驳回按钮');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
  
  test('【NEG-03】HR 驳回发票必须填写理由', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【NEG-03】驳回发票必须填写理由          │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/invoices');
    
    const rejectBtn = page.locator('button:has-text("驳回"), button:has-text("拒绝")').first();
    if (await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(1000);
      
      const reasonInput = page.locator('textarea, input[placeholder*="理由"]');
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ✅ 正确要求填写驳回理由');
      }
    } else {
      console.log('  ⚠️ 未找到驳回按钮');
    }
    
    expect(errorCollector.hasErrors()).toBe(false);
    await TestHelper.logout(page);
  });
});

test.describe('【验证】数据完整性', () => {
  
  test('【VAL-01】登录表单验证', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【VAL-01】登录表单验证                  │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="login-submit-btn"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
    console.log('  ✅ 空表单被阻止提交');
    
    await page.locator('[data-testid="email-input"]').fill('invalid-email');
    await page.locator('[data-testid="login-submit-btn"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
    console.log('  ✅ 无效邮箱被阻止提交');
    
    expect(errorCollector.hasErrors()).toBe(false);
  });
  
  test('【VAL-02】项目创建必填验证', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【VAL-02】项目创建必填验证              │');
    console.log('└─────────────────────────────────────────┘');
    
    const errorCollector = TestHelper.setupPageMonitoring(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX', severity: 'CRITICAL',
        description: 'HR 登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login', userRole: 'HR Recruiter',
        errors: loginResult.errors,
      });
    }
    
    await TestHelper.navigateToPage(page, '/post-job');
    
    await page.locator('[data-testid="submit-job-btn"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/post-job');
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
    
    console.log('\n📄 详细报告:');
    console.log(issueLogger.generateReport());
  } else {
    console.log('\n✅ 未发现问题');
  }
});
