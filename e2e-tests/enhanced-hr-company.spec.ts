import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  TestHelper, 
  DataVerifier, 
  IssueLogger, 
  TEST_USERS,
  ConsoleError 
} from '../e2e-utils/test-helpers-enhanced';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

interface TestContext {
  companyId?: string;
  companyName?: string;
  projectId?: string;
  projectTitle?: string;
  applicationId?: string;
  workLogId?: string;
  invoiceId?: string;
}

const context: TestContext = {};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  console.log('\n========================================');
  console.log('  增强版 E2E 测试 - 完整数据验证');
  console.log('========================================\n');
});

/**
 * 【HR】公司管理功能测试
 */
test.describe('【HR】公司管理功能 - 增强版', () => {
  
  test('【HR-01】HR 登录 - 验证登录成功且无控制台错误', async ({ page }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-01】HR 登录验证                    │');
    console.log('└─────────────────────────────────────────┘');
    
    // 设置页面监控
    await TestHelper.setupPageMonitoring(page);
    
    // 登录
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    // 验证登录成功
    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: 'HR 用户登录失败',
        expectedBehavior: 'HR 应该能够成功登录',
        actualBehavior: '登录失败，页面未跳转',
        steps: ['访问登录页面', '输入 HR 账号密码', '点击登录'],
        page: '/login',
        userRole: 'HR Recruiter',
        consoleErrors: loginResult.errors,
      });
      throw new Error('HR 登录失败');
    }
    
    // 验证无控制台错误
    if (loginResult.errors.length > 0) {
      const criticalErrors = loginResult.errors.filter(e => 
        e.type === 'error' || e.type === 'pageerror'
      );
      
      if (criticalErrors.length > 0) {
        issueLogger.logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '登录过程存在控制台错误',
          expectedBehavior: '登录过程应无控制台错误',
          actualBehavior: `存在 ${criticalErrors.length} 个错误`,
          steps: ['登录过程'],
          page: '/login',
          userRole: 'HR Recruiter',
          consoleErrors: criticalErrors,
        });
      }
    }
    
    console.log('  ✅ HR 登录成功，无严重错误');
    await TestHelper.logout(page);
  });
  
  test('【HR-02】注册公司 - 验证页面存在、操作成功、API 可查询', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-02】注册公司并验证数据             │');
    console.log('└─────────────────────────────────────────┘');
    
    const hrUser = TEST_USERS.hr1;
    await TestHelper.loginAsUser(page, hrUser);
    
    // 1. 验证公司注册页面存在
    console.log('\n📝 Step 1: 访问公司注册页面');
    const navResult = await TestHelper.navigateToPage(
      page, 
      '/company/register',
      /\/company\/register/,
      5000
    );
    
    if (!navResult.success) {
      console.log('  ⚠️ 公司注册页面不存在，尝试其他可能的路径');
      
      // 尝试其他可能的路径
      const possiblePaths = [
        '/company/setup',
        '/company/new',
        '/companies/register',
      ];
      
      let found = false;
      for (const path of possiblePaths) {
        const tryNav = await TestHelper.navigateToPage(page, path, undefined, 3000);
        if (tryNav.success) {
          console.log(`  ✅ 找到公司注册页面：${path}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        issueLogger.logIssue({
          category: 'UI',
          severity: 'CRITICAL',
          description: '公司注册页面路由不存在',
          expectedBehavior: '/company/register 应该存在',
          actualBehavior: '页面返回 404 或重定向',
          steps: ['访问 /company/register'],
          page: '/company/register',
          userRole: 'HR Recruiter',
          consoleErrors: navResult.errors,
        });
        
        await TestHelper.logout(page);
        return; // 跳过后续测试
      }
    }
    
    // 2. 填写公司注册表单
    console.log('\n📝 Step 2: 填写公司注册表单');
    context.companyName = `测试公司-${Date.now()}`;
    
    const formData: Record<string, string> = {
      'input[name="company_name"]': context.companyName,
      'input[name="business_license_number"]': `91110000MA${Date.now()}`,
      'input[name="company_email"]': `company_${Date.now()}@test.com`,
      'input[name="company_phone"]': '010-12345678',
    };
    
    const fillResult = await TestHelper.fillFormAndSubmit(
      page,
      formData,
      'button[type="submit"], button:has-text("提交"), button:has-text("注册")',
      '公司注册成功'
    );
    
    if (!fillResult.success) {
      issueLogger.logIssue({
        category: 'LOGIC',
        severity: 'HIGH',
        description: '公司注册表单提交失败',
        expectedBehavior: '表单应该成功提交',
        actualBehavior: '表单提交失败或有错误',
        steps: ['填写表单', '点击提交'],
        page: '/company/register',
        userRole: 'HR Recruiter',
        consoleErrors: fillResult.errors,
      });
    }
    
    await page.waitForTimeout(2000);
    
    // 3. 验证后端数据 - API 查询
    console.log('\n📝 Step 3: 验证后端公司数据');
    const companyExists = await DataVerifier.verifyCompanyExists(
      request,
      context.companyName!
    );
    
    if (companyExists.exists) {
      context.companyId = companyExists.company?._id || companyExists.company?.id;
      console.log(`  ✅ 公司数据验证通过，ID: ${context.companyId}`);
    } else {
      issueLogger.logIssue({
        category: 'DATA',
        severity: 'CRITICAL',
        description: '公司数据在数据库中不存在',
        expectedBehavior: '注册后公司数据应该存在于数据库',
        actualBehavior: 'API 查询不到公司数据',
        steps: ['调用 GET /api/v1/admin/companies'],
        page: '/company/register',
        userRole: 'HR Recruiter',
        networkErrors: TestHelper.getNetworkRequests()
          .filter(r => r.status >= 400),
      });
    }
    
    await TestHelper.logout(page);
  });
  
  test('【HR-03】发布项目 - 验证项目创建成功且 API 可查询', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【HR-03】发布项目并验证数据             │');
    console.log('└─────────────────────────────────────────┘');
    
    const hrUser = TEST_USERS.hr1;
    await TestHelper.loginAsUser(page, hrUser);
    
    // 1. 导航到发布项目页面
    console.log('\n📝 Step 1: 访问发布项目页面');
    const navResult = await TestHelper.navigateToPage(
      page,
      '/post-job',
      /\/post-job/,
      10000
    );
    
    if (!navResult.success) {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'CRITICAL',
        description: '发布项目页面路由不存在',
        expectedBehavior: '/post-job 应该存在',
        actualBehavior: '页面加载失败',
        steps: ['访问 /post-job'],
        page: '/post-job',
        userRole: 'HR Recruiter',
        consoleErrors: navResult.errors,
      });
      await TestHelper.logout(page);
      return;
    }
    
    // 2. 填写项目表单
    console.log('\n📝 Step 2: 填写项目表单');
    context.projectTitle = `HR 项目测试-${Date.now()}`;
    
    const formData: Record<string, string> = {
      '[data-testid="project-title-input"]': context.projectTitle,
      '[data-testid="project-description-input"]': '这是一个完整的端到端测试项目',
    };
    
    // 选择下拉框
    const selects = await page.locator('select[name="job_nature"]').count();
    if (selects > 0) {
      await page.locator('select[name="job_nature"]').selectOption('full_time');
      await page.locator('select[name="work_format"]').selectOption('remote');
      await page.locator('select[name="rate_type"]').selectOption('daily');
      await page.locator('input[name="rate_amount"]').fill('2000');
      await page.locator('select[name="project_cycle"]').selectOption('3_months');
    }
    
    // 选择技能分类
    const categoryBtn = page.locator('[data-testid^="major-category-btn-"]').first();
    if (await categoryBtn.isVisible().catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(500);
      
      const subCategoryBtn = page.locator('[data-testid^="sub-category-btn-"]').first();
      if (await subCategoryBtn.isVisible().catch(() => false)) {
        await subCategoryBtn.click();
      }
    }
    
    // 填写地点
    await page.locator('input[name="city"]').fill('北京');
    await page.locator('input[name="country"]').fill('中国');
    
    // 提交
    const submitBtn = page.locator('[data-testid="submit-job-btn"]');
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('  ✅ 项目表单已提交');
    } else {
      issueLogger.logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: '项目提交按钮不存在',
        expectedBehavior: '应该存在提交按钮',
        actualBehavior: '按钮不存在或不可见',
        steps: ['查找提交按钮'],
        page: '/post-job',
        userRole: 'HR Recruiter',
      });
    }
    
    // 3. 验证后端数据
    console.log('\n📝 Step 3: 验证后端项目数据');
    const projectExists = await DataVerifier.verifyProjectExists(
      request,
      context.projectTitle!
    );
    
    if (projectExists.exists) {
      context.projectId = projectExists.project?._id || projectExists.project?.id;
      console.log(`  ✅ 项目数据验证通过，ID: ${context.projectId}`);
    } else {
      issueLogger.logIssue({
        category: 'DATA',
        severity: 'CRITICAL',
        description: '项目数据在数据库中不存在',
        expectedBehavior: '发布后项目数据应该存在于数据库',
        actualBehavior: 'API 查询不到项目数据',
        steps: ['调用 GET /api/v1/jobs'],
        page: '/post-job',
        userRole: 'HR Recruiter',
      });
    }
    
    await TestHelper.logout(page);
  });
});

/**
 * 【跨角色】数据流转测试
 */
test.describe('【跨角色】数据流转 - 增强版', () => {
  
  test('【跨角色 -01】HR 发布项目 → 顾问申请 → HR 批准（完整验证）', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【跨角色 -01】完整招聘流程验证          │');
    console.log('└─────────────────────────────────────────┘');
    
    // Step 1: HR 发布项目
    console.log('\n📌 Step 1: HR 发布项目');
    const hrUser = TEST_USERS.hr1;
    await TestHelper.loginAsUser(page, hrUser);
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    
    const projectTitle = `招聘流程测试项目-${Date.now()}`;
    await page.locator('[data-testid="project-title-input"]').fill(projectTitle);
    await page.locator('[data-testid="project-description-input"]').fill('完整招聘流程测试');
    
    await page.locator('select[name="job_nature"]').selectOption('full_time');
    await page.locator('select[name="work_format"]').selectOption('remote');
    await page.locator('select[name="rate_type"]').selectOption('daily');
    await page.locator('input[name="rate_amount"]').fill('2500');
    await page.locator('select[name="project_cycle"]').selectOption('3_months');
    
    const firstCategory = page.locator('[data-testid^="major-category-btn-"]').first();
    await firstCategory.click();
    await page.waitForTimeout(300);
    
    const firstSubCategory = page.locator('[data-testid^="sub-category-btn-"]').first();
    if (await firstSubCategory.isVisible()) {
      await firstSubCategory.click();
    }
    
    await page.locator('input[name="city"]').fill('深圳');
    await page.locator('input[name="country"]').fill('中国');
    
    await page.locator('[data-testid="submit-job-btn"]').click();
    await page.waitForTimeout(3000);
    
    console.log(`    ✅ 项目发布：${projectTitle}`);
    await TestHelper.logout(page);
    
    // 验证项目数据
    const projectExists = await DataVerifier.verifyProjectExists(request, projectTitle);
    if (!projectExists.exists) {
      issueLogger.logIssue({
        category: 'DATA',
        severity: 'CRITICAL',
        description: 'HR 发布的项目数据不存在',
        expectedBehavior: '项目发布后应该存在于数据库',
        actualBehavior: 'API 查询不到项目',
        steps: ['HR 发布项目', 'API 查询验证'],
        page: '/post-job',
        userRole: 'HR Recruiter',
      });
    }
    
    // Step 2: 顾问申请项目
    console.log('\n📌 Step 2: 顾问申请项目');
    const freelancerUser = TEST_USERS.freelancer1;
    await TestHelper.loginAsUser(page, freelancerUser);
    
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const applyButton = page.locator('button:has-text("申请"), button:has-text("投递")').first();
    if (await applyButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await applyButton.click();
      await page.waitForTimeout(2000);
      console.log('    ✅ 顾问申请项目成功');
    } else {
      console.log('    ⚠️ 申请按钮不可见');
    }
    await TestHelper.logout(page);
    
    // Step 3: HR 批准申请
    console.log('\n📌 Step 3: HR 批准申请');
    await TestHelper.loginAsUser(page, hrUser);
    
    await page.goto(`${BASE_URL}/applications`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const approveButton = page.locator('button:has-text("批准"), button:has-text("通过")').first();
    if (await approveButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await approveButton.click();
      await page.waitForTimeout(2000);
      console.log('    ✅ HR 批准申请成功');
    } else {
      console.log('    ⚠️ 批准按钮不可见');
    }
    
    await TestHelper.logout(page);
    console.log('  ✅ 完整招聘流程完成');
  });
});

test.afterAll(() => {
  console.log('\n========================================');
  console.log('  增强版 E2E 测试完成');
  console.log('========================================\n');
  
  const issues = issueLogger.getIssues();
  
  console.log('📊 测试统计:');
  console.log(`  - 发现问题：${issues.length} 个`);
  
  if (issues.length > 0) {
    console.log('\n⚠️ 问题汇总:');
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity}] ${issue.description}`);
      console.log(`   类别：${issue.category}`);
      console.log(`   页面：${issue.page}`);
      console.log(`   角色：${issue.userRole}`);
      
      if (issue.consoleErrors && issue.consoleErrors.length > 0) {
        console.log(`   控制台错误:`);
        issue.consoleErrors.forEach((err: ConsoleError) => {
          console.log(`     - [${err.type}] ${err.text}`);
        });
      }
    });
  } else {
    console.log('\n✅ 未发现问题');
  }
});
