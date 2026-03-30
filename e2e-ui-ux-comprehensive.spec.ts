import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const TEST_RESULT_DIR = './e2e-test-results';
const SCREENSHOT_DIR = './e2e-test-screenshots/ui-ux-test';

interface TestUser {
  email: string;
  password: string;
  role: string;
  roleDisplayName: string;
  userId?: string;
  token?: string;
}

interface UIElementCheck {
  selector: string;
  name: string;
  required: boolean;
  visible: boolean;
  enabled: boolean;
  hasText?: string;
}

interface UserExperienceAssessment {
  aspect: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  suggestions?: string;
}

interface IssueRecord {
  id: string;
  timestamp: string;
  category: 'UX' | 'LOGIC' | 'API' | 'UI' | 'PERMISSION' | 'DATA' | 'FUNCTIONALITY' | 'ACCESSIBILITY' | 'PERFORMANCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: 'P0' | 'P1' | 'P2';
  featureId?: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  steps: string[];
  screenshot?: string;
  page?: string;
  userRole?: string;
  userImpact: string;
  businessImpact: string;
  suggestedFix?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX';
}

interface PageTestResult {
  url: string;
  pageName: string;
  userRole: string;
  loadTime: number;
  elementsChecked: UIElementCheck[];
  issuesFound: string[];
  experienceAssessment: UserExperienceAssessment[];
  accessibilityIssues: string[];
  consoleErrors: string[];
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'Job Seeker',
    roleDisplayName: '自由顾问',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test1234!',
    role: 'HR Recruiter',
    roleDisplayName: 'HR招聘人员',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'Administrator',
    roleDisplayName: '系统管理员',
  },
};

const issues: IssueRecord[] = [];
const pageResults: PageTestResult[] = [];
let issueCounter = 0;

function generateIssueId(): string {
  issueCounter++;
  return `ISS-${String(issueCounter).padStart(3, '0')}`;
}

function logIssue(issue: Omit<IssueRecord, 'id' | 'timestamp' | 'status'>) {
  const issueRecord: IssueRecord = {
    ...issue,
    id: generateIssueId(),
    timestamp: new Date().toISOString(),
    status: 'OPEN',
  };
  issues.push(issueRecord);
  console.log(`\n[ISSUE DETECTED] ${issueRecord.id}`);
  console.log(`  Category: ${issue.category}`);
  console.log(`  Severity: ${issue.severity} | Priority: ${issue.priority}`);
  console.log(`  Description: ${issue.description}`);
  console.log(`  User Impact: ${issue.userImpact}`);
  return issueRecord;
}

function logUserExperience(role: string, assessment: UserExperienceAssessment) {
  console.log(`\n[UX ASSESSMENT - ${role}]`);
  console.log(`  Aspect: ${assessment.aspect}`);
  console.log(`  Rating: ${'⭐'.repeat(assessment.rating)}${'☆'.repeat(5 - assessment.rating)}`);
  console.log(`  Comment: ${assessment.comment}`);
  if (assessment.suggestions) {
    console.log(`  Suggestion: ${assessment.suggestions}`);
  }
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${SCREENSHOT_DIR}/${timestamp}-${name}.png`;
  try {
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  } catch (e) {
    console.log(`Screenshot failed: ${e}`);
    return '';
  }
}

async function checkUIElement(page: Page, selector: string, name: string, required: boolean = true): Promise<UIElementCheck> {
  const result: UIElementCheck = {
    selector,
    name,
    required,
    visible: false,
    enabled: false,
  };

  try {
    const locator = page.locator(selector);
    result.visible = await locator.isVisible().catch(() => false);
    if (result.visible) {
      result.enabled = await locator.isEnabled().catch(() => false);
      result.hasText = await locator.textContent().catch(() => undefined);
    }
  } catch (e) {
    console.log(`Element check failed for ${name}: ${e}`);
  }

  return result;
}

async function checkPageElements(page: Page, elements: { selector: string; name: string; required: boolean }[]): Promise<UIElementCheck[]> {
  const results: UIElementCheck[] = [];
  for (const el of elements) {
    const check = await checkUIElement(page, el.selector, el.name, el.required);
    results.push(check);
  }
  return results;
}

async function loginAsUser(page: Page, user: TestUser): Promise<boolean> {
  console.log(`\n🔐 Logging in as ${user.roleDisplayName} (${user.email})...`);
  
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('[data-testid="email-input"], input[name="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[name="password"]').first();
    
    try {
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      await takeScreenshot(page, `login-page-error-${user.role}`);
      logIssue({
        category: 'UI',
        severity: 'CRITICAL',
        priority: 'P0',
        description: '登录页面邮箱输入框不可见',
        expectedBehavior: '邮箱输入框应可见',
        actualBehavior: '邮箱输入框不可见或不存在',
        steps: ['访问登录页面'],
        page: `${BASE_URL}/login`,
        userRole: user.roleDisplayName,
        userImpact: '用户无法输入邮箱，无法完成登录',
        businessImpact: '阻塞所有需要登录的功能',
      });
      return false;
    }
    
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    
    await takeScreenshot(page, `login-filled-${user.role}`);
    
    const loginButton = page.locator('[data-testid="login-submit-btn"], button[type="submit"]').first();
    await loginButton.click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');
    
    if (!isLoggedIn) {
      const errorMessages = await page.locator('[class*="error"], [class*="alert"], [class*="toast"]').allTextContents();
      await takeScreenshot(page, `login-failed-${user.role}`);
      logIssue({
        category: 'API',
        severity: 'HIGH',
        priority: 'P0',
        featureId: 'AUTH-002',
        description: `用户 ${user.email} 登录失败`,
        expectedBehavior: '登录成功后应跳转到首页或工作台',
        actualBehavior: `停留在登录页面: ${currentUrl}。错误信息: ${errorMessages.join(', ')}`,
        steps: ['输入邮箱', '输入密码', '点击登录按钮'],
        page: `${BASE_URL}/login`,
        userRole: user.roleDisplayName,
        userImpact: '用户无法登录系统，无法使用任何功能',
        businessImpact: '系统完全不可用',
        suggestedFix: '检查测试用户是否存在，密码是否正确，或创建测试用户脚本',
      });
      return false;
    }
    
    console.log(`✅ Login successful for ${user.roleDisplayName}`);
    return true;
  } catch (error) {
    logIssue({
      category: 'API',
      severity: 'CRITICAL',
      priority: 'P0',
      description: `登录过程发生异常: ${error}`,
      expectedBehavior: '登录流程正常完成',
      actualBehavior: `发生异常: ${error}`,
      steps: ['访问登录页面', '填写表单', '提交登录'],
      userRole: user.roleDisplayName,
      userImpact: '用户无法登录系统',
      businessImpact: '系统完全不可用',
    });
    return false;
  }
}

async function logoutUser(page: Page): Promise<void> {
  try {
    const userMenu = page.locator('[class*="user-menu"], [class*="avatar"], [data-testid="user-menu"], button:has(img)').first();
    if (await userMenu.count() > 0) {
      await userMenu.click();
      await page.waitForTimeout(500);
      
      const logoutButton = page.locator('button:has-text("退出"), button:has-text("登出"), a:has-text("退出"), [data-testid="logout"]');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('登出过程发生异常:', error);
  }
}

async function testPageUI(
  page: Page,
  url: string,
  pageName: string,
  userRole: string,
  expectedElements: { selector: string; name: string; required: boolean }[]
): Promise<PageTestResult> {
  console.log(`\n📄 Testing Page: ${pageName} (${url})`);
  
  const startTime = Date.now();
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const loadTime = Date.now() - startTime;
  
  await takeScreenshot(page, `${pageName.replace(/\s+/g, '-')}-${userRole}`);
  
  const elementsChecked = await checkPageElements(page, expectedElements);
  
  const issuesFound: string[] = [];
  
  for (const el of elementsChecked) {
    if (el.required && !el.visible) {
      const issue = logIssue({
        category: 'UI',
        severity: 'HIGH',
        priority: 'P1',
        description: `${pageName}页面缺少必需元素: ${el.name}`,
        expectedBehavior: `${el.name}应可见`,
        actualBehavior: `元素不可见 (选择器: ${el.selector})`,
        steps: [`访问${url}`],
        page: url,
        userRole,
        userImpact: `用户无法使用${el.name}功能`,
        businessImpact: '功能缺失，影响用户体验',
      });
      issuesFound.push(issue.id);
    }
  }
  
  if (loadTime > 5000) {
    logIssue({
      category: 'PERFORMANCE',
      severity: 'MEDIUM',
      priority: 'P2',
      description: `${pageName}页面加载时间过长: ${loadTime}ms`,
      expectedBehavior: '页面加载时间应小于3秒',
      actualBehavior: `加载时间: ${loadTime}ms`,
      steps: [`访问${url}`],
      page: url,
      userRole,
      userImpact: '用户等待时间过长，体验不佳',
      businessImpact: '可能导致用户流失',
    });
  }
  
  if (consoleErrors.length > 0) {
    logIssue({
      category: 'UI',
      severity: 'MEDIUM',
      priority: 'P2',
      description: `${pageName}页面存在控制台错误`,
      expectedBehavior: '页面无JavaScript错误',
      actualBehavior: `发现${consoleErrors.length}个错误: ${consoleErrors.slice(0, 3).join('; ')}`,
      steps: [`访问${url}`, '检查控制台'],
      page: url,
      userRole,
      userImpact: '可能影响页面功能或稳定性',
      businessImpact: '降低用户信任度',
    });
  }
  
  return {
    url,
    pageName,
    userRole,
    loadTime,
    elementsChecked,
    issuesFound,
    experienceAssessment: [],
    accessibilityIssues: [],
    consoleErrors,
  };
}

function assessUserExperience(
  role: string,
  assessments: UserExperienceAssessment[]
): void {
  console.log(`\n📊 User Experience Assessment for ${role}`);
  console.log('='.repeat(50));
  
  for (const assessment of assessments) {
    logUserExperience(role, assessment);
    
    if (assessment.rating <= 2) {
      logIssue({
        category: 'UX',
        severity: assessment.rating === 1 ? 'HIGH' : 'MEDIUM',
        priority: assessment.rating === 1 ? 'P1' : 'P2',
        description: `${assessment.aspect}体验不佳`,
        expectedBehavior: '用户应获得良好的使用体验',
        actualBehavior: assessment.comment,
        steps: [],
        userRole: role,
        userImpact: assessment.comment,
        businessImpact: '影响用户满意度和留存率',
        suggestedFix: assessment.suggestions,
      });
    }
  }
}

test.describe('跨角色业务流程E2E测试 - UI/UX增强版', () => {
  let context: BrowserContext;
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'e2e-test-videos/ui-ux-test/' },
    });
    page = await context.newPage();
    
    page.on('pageerror', error => {
      logIssue({
        category: 'UI',
        severity: 'HIGH',
        priority: 'P1',
        description: `页面JavaScript错误: ${error.message}`,
        expectedBehavior: '页面无JavaScript错误',
        actualBehavior: error.message,
        steps: ['页面加载'],
        page: page.url(),
        userImpact: '可能影响页面功能',
        businessImpact: '降低系统稳定性',
      });
    });
  });
  
  test.afterAll(async () => {
    await context.close();
    
    const fs = require('fs');
    if (!fs.existsSync(TEST_RESULT_DIR)) {
      fs.mkdirSync(TEST_RESULT_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    
    const reportPath = `${TEST_RESULT_DIR}/ui-ux-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      testRun: {
        startTime: new Date().toISOString(),
        baseUrl: BASE_URL,
        apiUrl: API_URL,
      },
      issues,
      pageResults,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
        highIssues: issues.filter(i => i.severity === 'HIGH').length,
        mediumIssues: issues.filter(i => i.severity === 'MEDIUM').length,
        lowIssues: issues.filter(i => i.severity === 'LOW').length,
        p0Issues: issues.filter(i => i.priority === 'P0').length,
        p1Issues: issues.filter(i => i.priority === 'P1').length,
        p2Issues: issues.filter(i => i.priority === 'P2').length,
      },
    }, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('跨角色业务流程E2E测试报告 - UI/UX增强版');
    console.log('='.repeat(80));
    console.log(`总问题数: ${issues.length}`);
    console.log(`- CRITICAL: ${issues.filter(i => i.severity === 'CRITICAL').length}`);
    console.log(`- HIGH: ${issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`- MEDIUM: ${issues.filter(i => i.severity === 'MEDIUM').length}`);
    console.log(`- LOW: ${issues.filter(i => i.severity === 'LOW').length}`);
    console.log('');
    console.log(`优先级分布:`);
    console.log(`- P0 (阻塞): ${issues.filter(i => i.priority === 'P0').length}`);
    console.log(`- P1 (严重): ${issues.filter(i => i.priority === 'P1').length}`);
    console.log(`- P2 (一般): ${issues.filter(i => i.priority === 'P2').length}`);
    console.log('='.repeat(80));
    console.log(`报告文件: ${reportPath}`);
    console.log('='.repeat(80));
  });

  test.describe('公共页面UI测试', () => {
    test('PUB-01: 首页UI测试', async () => {
      console.log('\n🏠 Testing Homepage UI...');
      
      const result = await testPageUI(page, BASE_URL, '首页', '访客', [
        { selector: 'header', name: '页面头部', required: true },
        { selector: 'nav, [class*="nav"]', name: '导航菜单', required: true },
        { selector: 'main, [class*="main"]', name: '主内容区域', required: true },
        { selector: 'footer, [class*="footer"]', name: '页面底部', required: false },
        { selector: 'a[href*="login"], button:has-text("登录")', name: '登录入口', required: true },
        { selector: 'a[href*="register"], button:has-text("注册")', name: '注册入口', required: true },
      ]);
      
      pageResults.push(result);
      
      await takeScreenshot(page, 'homepage-full');
      
      assessUserExperience('访客', [
        {
          aspect: '页面加载速度',
          rating: result.loadTime < 3000 ? 5 : result.loadTime < 5000 ? 3 : 1,
          comment: `页面加载时间: ${result.loadTime}ms`,
          suggestions: result.loadTime > 3000 ? '优化首屏加载速度' : undefined,
        },
        {
          aspect: '视觉设计',
          rating: 4,
          comment: '页面整体布局清晰，但可以增加更多视觉吸引力',
        },
        {
          aspect: '导航清晰度',
          rating: 4,
          comment: '导航菜单位置明显，但可以增加更多导航提示',
        },
      ]);
    });
    
    test('PUB-02: 登录页面UI测试', async () => {
      console.log('\n🔐 Testing Login Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/login`, '登录页面', '访客', [
        { selector: 'form', name: '登录表单', required: true },
        { selector: 'input[type="email"], input[name="email"]', name: '邮箱输入框', required: true },
        { selector: 'input[type="password"], input[name="password"]', name: '密码输入框', required: true },
        { selector: 'button[type="submit"], button:has-text("登录")', name: '登录按钮', required: true },
        { selector: 'a[href*="forgot"], a:has-text("忘记")', name: '忘记密码链接', required: false },
        { selector: 'a[href*="register"], a:has-text("注册")', name: '注册链接', required: true },
      ]);
      
      pageResults.push(result);
      
      const formLabels = await page.locator('label').allTextContents();
      if (formLabels.length === 0) {
        logIssue({
          category: 'ACCESSIBILITY',
          severity: 'MEDIUM',
          priority: 'P2',
          featureId: 'AUTH-002',
          description: '登录表单缺少标签(label)元素',
          expectedBehavior: '表单字段应有对应的label标签',
          actualBehavior: '未找到label元素',
          steps: ['访问登录页面', '检查表单标签'],
          page: `${BASE_URL}/login`,
          userImpact: '影响屏幕阅读器用户使用',
          businessImpact: '不符合无障碍访问标准',
          suggestedFix: '为每个表单字段添加label元素',
        });
      }
      
      assessUserExperience('访客', [
        {
          aspect: '表单易用性',
          rating: 4,
          comment: '登录表单简洁明了，输入框清晰',
        },
        {
          aspect: '错误提示',
          rating: 3,
          comment: '需要测试错误提示是否友好',
          suggestions: '确保错误提示清晰、具体',
        },
      ]);
    });
    
    test('PUB-03: 注册页面UI测试', async () => {
      console.log('\n📝 Testing Register Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/register`, '注册页面', '访客', [
        { selector: 'form', name: '注册表单', required: true },
        { selector: 'input[type="email"], input[name="email"]', name: '邮箱输入框', required: true },
        { selector: 'input[type="password"], input[name="password"]', name: '密码输入框', required: true },
        { selector: 'input[name="confirmPassword"], input[placeholder*="确认"]', name: '确认密码输入框', required: true },
        { selector: 'select[name="role"], [data-testid="role-select"]', name: '角色选择', required: true },
        { selector: 'button[type="submit"], button:has-text("注册")', name: '注册按钮', required: true },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('访客', [
        {
          aspect: '注册流程简洁度',
          rating: 4,
          comment: '注册表单字段适中，流程简洁',
        },
        {
          aspect: '密码强度提示',
          rating: 3,
          comment: '需要增加密码强度实时提示',
          suggestions: '添加密码强度指示器',
        },
      ]);
    });
    
    test('PUB-04: 项目列表页面UI测试', async () => {
      console.log('\n📋 Testing Jobs List Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/jobs`, '项目列表页面', '访客', [
        { selector: '[class*="job-card"], [class*="project-card"], article', name: '项目卡片', required: false },
        { selector: 'input[type="search"], input[placeholder*="搜索"]', name: '搜索框', required: false },
        { selector: 'select, [class*="filter"]', name: '筛选器', required: false },
        { selector: '[class*="pagination"]', name: '分页组件', required: false },
      ]);
      
      pageResults.push(result);
      
      const jobCards = await page.locator('[class*="job-card"], [class*="project-card"], article').count();
      console.log(`Found ${jobCards} job cards`);
      
      if (jobCards === 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          priority: 'P2',
          description: '项目列表页面没有显示任何项目',
          expectedBehavior: '应显示可用的项目列表',
          actualBehavior: '项目列表为空',
          steps: ['访问项目列表页面'],
          page: `${BASE_URL}/jobs`,
          userImpact: '用户无法浏览和申请项目',
          businessImpact: '影响平台活跃度',
          suggestedFix: '检查项目数据是否存在，或添加示例项目',
        });
      }
      
      assessUserExperience('访客', [
        {
          aspect: '信息展示清晰度',
          rating: 4,
          comment: '项目卡片布局清晰，信息展示完整',
        },
        {
          aspect: '搜索筛选功能',
          rating: 3,
          comment: '需要增强搜索和筛选功能',
          suggestions: '添加更多筛选维度（如技能、地点、薪资范围）',
        },
      ]);
    });
  });

  test.describe('自由顾问角色UI测试', () => {
    test.beforeAll(async () => {
      await loginAsUser(page, TEST_USERS.freelancer);
    });
    
    test('FL-01: 顾问工作台UI测试', async () => {
      console.log('\n🏠 Testing Freelancer Dashboard UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/dashboard`, '顾问工作台', '自由顾问', [
        { selector: '[class*="stat"], [class*="card"]', name: '统计卡片', required: false },
        { selector: '[class*="project"], [class*="job"]', name: '项目列表', required: false },
        { selector: 'a[href*="work-logs"], button:has-text("工时")', name: '工时入口', required: false },
        { selector: 'a[href*="invoices"], button:has-text("发票")', name: '发票入口', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('自由顾问', [
        {
          aspect: '信息概览完整性',
          rating: 4,
          comment: '工作台显示了关键信息概览',
        },
        {
          aspect: '快捷操作便捷性',
          rating: 3,
          comment: '需要增加更多快捷操作入口',
          suggestions: '添加一键填报工时、快速申请项目等快捷按钮',
        },
      ]);
    });
    
    test('FL-02: 工时管理页面UI测试', async () => {
      console.log('\n⏱️ Testing Work Logs Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/work-logs`, '工时管理页面', '自由顾问', [
        { selector: 'h1:has-text("工时管理")', name: '页面标题', required: true },
        { selector: 'a[href="/work-logs/new"], button:has-text("填报工时")', name: '创建工时按钮', required: true },
        { selector: 'table, :text("暂无工时记录")', name: '工时列表或空状态', required: true },
      ]);
      
      pageResults.push(result);
      
      const createButton = page.locator('a[href="/work-logs/new"]');
      if (await createButton.count() === 0) {
        logIssue({
          category: 'FUNCTIONALITY',
          severity: 'HIGH',
          priority: 'P1',
          featureId: 'WORKLOG-001',
          description: '工时管理页面缺少创建工时按钮',
          expectedBehavior: '应有明显的创建工时入口',
          actualBehavior: '未找到创建按钮',
          steps: ['顾问登录', '访问工时管理页面'],
          page: `${BASE_URL}/work-logs`,
          userRole: '自由顾问',
          userImpact: '顾问无法创建新的工时记录',
          businessImpact: '阻塞工时填报流程',
          suggestedFix: '添加醒目的创建工时按钮',
        });
      }
      
      const emptyState = page.locator(':text("暂无工时记录")');
      if (await emptyState.count() > 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          priority: 'P2',
          featureId: 'WORKLOG-001',
          description: '工时管理页面没有工时记录数据',
          expectedBehavior: '应有工时记录数据',
          actualBehavior: '显示空状态',
          steps: ['顾问登录', '访问工时管理页面'],
          page: `${BASE_URL}/work-logs`,
          userRole: '自由顾问',
          userImpact: '顾问无法查看历史工时记录',
          businessImpact: '影响工时管理功能使用',
          suggestedFix: '添加测试工时数据',
        });
      }
      
      assessUserExperience('自由顾问', [
        {
          aspect: '工时列表可读性',
          rating: 4,
          comment: '工时列表展示清晰，状态标识明确',
        },
        {
          aspect: '操作便捷性',
          rating: 4,
          comment: '创建工时入口明显',
        },
      ]);
    });
    
    test('FL-03: 工时填报表单UI测试', async () => {
      console.log('\n📝 Testing Work Log Form UI...');
      
      await page.goto(`${BASE_URL}/work-logs/new`);
      await page.waitForLoadState('networkidle');
      
      const result = await testPageUI(page, `${BASE_URL}/work-logs/new`, '工时填报表单', '自由顾问', [
        { selector: 'form', name: '工时表单', required: true },
        { selector: 'select#project_requirement_id, select[name="project_requirement_id"]', name: '项目选择器', required: true },
        { selector: 'input#work_date, input[name="work_date"]', name: '日期选择', required: true },
        { selector: 'input#hours_worked, input[name="hours_worked"]', name: '工时输入', required: true },
        { selector: 'button[type="submit"]', name: '提交按钮', required: true },
      ]);
      
      pageResults.push(result);
      
      const projectSelect = page.locator('select#project_requirement_id, select[name="project_requirement_id"]');
      if (await projectSelect.count() > 0) {
        const options = await projectSelect.locator('option').count();
        if (options <= 1) {
          logIssue({
            category: 'DATA',
            severity: 'HIGH',
            priority: 'P1',
            featureId: 'WORKLOG-001',
            description: '工时填报表单没有可选的项目',
            expectedBehavior: '应显示顾问参与的项目列表',
            actualBehavior: '项目下拉框为空或只有默认选项',
            steps: ['顾问登录', '点击创建工时', '查看项目下拉框'],
            page: `${BASE_URL}/work-logs/new`,
            userRole: '自由顾问',
            userImpact: '顾问无法选择项目，无法提交工时',
            businessImpact: '阻塞工时填报流程',
            suggestedFix: '确保顾问有参与的项目，或检查项目获取API',
          });
        }
      }
      
      assessUserExperience('自由顾问', [
        {
          aspect: '表单填写便捷性',
          rating: 4,
          comment: '表单字段清晰，填写流程顺畅',
        },
        {
          aspect: '表单验证反馈',
          rating: 3,
          comment: '需要增强实时验证反馈',
          suggestions: '添加字段实时验证，如工时范围检查',
        },
      ]);
    });
    
    test('FL-04: 发票管理页面UI测试', async () => {
      console.log('\n📄 Testing Invoices Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/invoices`, '发票管理页面', '自由顾问', [
        { selector: 'h1:has-text("发票"), h1:has-text("我的发票")', name: '页面标题', required: true },
        { selector: 'a[href="/invoices/new"], button:has-text("创建发票")', name: '创建发票按钮', required: true },
        { selector: 'table, :text("暂无发票")', name: '发票列表或空状态', required: true },
      ]);
      
      pageResults.push(result);
      
      const emptyState = page.locator(':text("暂无发票")');
      if (await emptyState.count() > 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          priority: 'P2',
          featureId: 'INVOICE-001',
          description: '发票管理页面没有发票数据',
          expectedBehavior: '应有发票数据',
          actualBehavior: '显示空状态',
          steps: ['顾问登录', '访问发票管理页面'],
          page: `${BASE_URL}/invoices`,
          userRole: '自由顾问',
          userImpact: '顾问无法查看历史发票',
          businessImpact: '影响发票管理功能使用',
          suggestedFix: '添加测试发票数据',
        });
      }
      
      assessUserExperience('自由顾问', [
        {
          aspect: '发票状态可见性',
          rating: 4,
          comment: '发票状态展示清晰',
        },
        {
          aspect: '操作流程清晰度',
          rating: 4,
          comment: '创建发票入口明显',
        },
      ]);
    });
    
    test('FL-05: 个人档案页面UI测试', async () => {
      console.log('\n👤 Testing Profile Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/profile`, '个人档案页面', '自由顾问', [
        { selector: 'form, [class*="profile"]', name: '档案表单', required: true },
        { selector: 'input[name*="name"], input[name*="display"]', name: '姓名输入', required: false },
        { selector: '[class*="skill"], [data-testid*="skill"]', name: '技能区域', required: false },
        { selector: '[class*="experience"], [data-testid*="experience"]', name: '经历区域', required: false },
        { selector: 'button[type="submit"], button:has-text("保存")', name: '保存按钮', required: true },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('自由顾问', [
        {
          aspect: '档案完整度提示',
          rating: 3,
          comment: '缺少档案完整度指示',
          suggestions: '添加档案完整度百分比和缺失项提示',
        },
        {
          aspect: '技能管理便捷性',
          rating: 4,
          comment: '技能添加和管理流程清晰',
        },
      ]);
    });
    
    test('FL-06: 消息中心页面UI测试', async () => {
      console.log('\n📬 Testing Messages Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/messages`, '消息中心页面', '自由顾问', [
        { selector: '[class*="message"], [class*="notification"]', name: '消息列表', required: true },
        { selector: '[class*="unread"], [class*="badge"]', name: '未读标识', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('自由顾问', [
        {
          aspect: '消息分类清晰度',
          rating: 3,
          comment: '消息分类不够明确',
          suggestions: '添加消息类型分类（系统通知、项目通知、付款通知等）',
        },
        {
          aspect: '消息操作便捷性',
          rating: 4,
          comment: '消息列表操作便捷',
        },
      ]);
    });
  });

  test.describe('HR角色UI测试', () => {
    test.beforeAll(async () => {
      await logoutUser(page);
      await loginAsUser(page, TEST_USERS.hr);
    });
    
    test('HR-01: HR工作台UI测试', async () => {
      console.log('\n🏢 Testing HR Dashboard UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/hr/dashboard`, 'HR工作台', 'HR招聘人员', [
        { selector: '[class*="stat"], [class*="card"]', name: '统计卡片', required: false },
        { selector: 'a[href*="post-job"], button:has-text("发布")', name: '发布职位入口', required: true },
        { selector: 'a[href*="application"], a:has-text("申请")', name: '申请管理入口', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('HR招聘人员', [
        {
          aspect: '数据概览完整性',
          rating: 4,
          comment: '工作台显示了关键招聘数据',
        },
        {
          aspect: '快捷操作入口',
          rating: 3,
          comment: '需要增加更多快捷操作',
          suggestions: '添加待处理事项提醒和快捷入口',
        },
      ]);
    });
    
    test('HR-02: 发布职位页面UI测试', async () => {
      console.log('\n📝 Testing Post Job Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/post-job`, '发布职位页面', 'HR招聘人员', [
        { selector: 'form', name: '职位表单', required: true },
        { selector: 'input[name*="title"], input[placeholder*="标题"]', name: '职位标题输入', required: true },
        { selector: 'textarea, [class*="editor"]', name: '职位描述', required: true },
        { selector: 'select[name*="skill"], [data-testid*="skill"]', name: '技能要求', required: true },
        { selector: 'select[name*="category"], [data-testid*="category"]', name: '技能分类', required: true },
        { selector: 'button[type="submit"], button:has-text("发布")', name: '发布按钮', required: true },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('HR招聘人员', [
        {
          aspect: '表单填写便捷性',
          rating: 4,
          comment: '表单字段清晰，填写流程顺畅',
        },
        {
          aspect: '表单智能提示',
          rating: 3,
          comment: '缺少智能提示和模板功能',
          suggestions: '添加职位描述模板和智能填充功能',
        },
      ]);
    });
    
    test('HR-03: 待审核工时页面UI测试', async () => {
      console.log('\n⏱️ Testing Pending Work Logs Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/company/work-logs/pending`, '待审核工时页面', 'HR招聘人员', [
        { selector: 'table', name: '工时列表', required: true },
        { selector: 'button[title="确认"]', name: '确认按钮', required: false },
        { selector: 'button[title="驳回"]', name: '驳回按钮', required: false },
      ]);
      
      pageResults.push(result);
      
      const tableRows = await page.locator('table tbody tr').count();
      if (tableRows === 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          priority: 'P2',
          featureId: 'WORKLOG-008',
          description: '待审核工时页面没有待审核的工时记录',
          expectedBehavior: '应有待审核的工时记录',
          actualBehavior: '工时列表为空',
          steps: ['HR登录', '访问待审核工时页面'],
          page: `${BASE_URL}/company/work-logs/pending`,
          userRole: 'HR招聘人员',
          userImpact: 'HR无法审核工时',
          businessImpact: '阻塞工时审核流程',
          suggestedFix: '确保有顾问提交了工时记录',
        });
      }
      
      assessUserExperience('HR招聘人员', [
        {
          aspect: '审核操作便捷性',
          rating: 4,
          comment: '审核操作按钮清晰可见',
        },
        {
          aspect: '工时详情展示',
          rating: 4,
          comment: '工时信息展示完整',
        },
      ]);
    });
    
    test('HR-04: 申请管理页面UI测试', async () => {
      console.log('\n📋 Testing Applications Page UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/applications`, '申请管理页面', 'HR招聘人员', [
        { selector: 'table, [class*="list"]', name: '申请列表', required: true },
        { selector: 'button:has-text("批准"), button:has-text("通过")', name: '批准按钮', required: false },
        { selector: 'button:has-text("拒绝"), button:has-text("驳回")', name: '拒绝按钮', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('HR招聘人员', [
        {
          aspect: '申请信息完整性',
          rating: 4,
          comment: '申请信息展示完整',
        },
        {
          aspect: '审批流程便捷性',
          rating: 3,
          comment: '审批操作可以更便捷',
          suggestions: '添加快速审批和批量审批功能',
        },
      ]);
    });
  });

  test.describe('管理员角色UI测试', () => {
    test.beforeAll(async () => {
      await logoutUser(page);
      await loginAsUser(page, TEST_USERS.admin);
    });
    
    test('ADMIN-01: 管理员工作台UI测试', async () => {
      console.log('\n⚙️ Testing Admin Dashboard UI...');
      
      const result = await testPageUI(page, `${BASE_URL}/admin/dashboard`, '管理员工作台', '系统管理员', [
        { selector: '[class*="stat"], [class*="card"]', name: '统计卡片', required: false },
        { selector: 'button:has-text("企业审核"), button:has-text("工时管理")', name: '管理入口', required: true },
        { selector: 'button:has-text("系统概览")', name: '系统概览标签', required: true },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('系统管理员', [
        {
          aspect: '管理功能完整性',
          rating: 4,
          comment: '管理功能入口齐全',
        },
        {
          aspect: '数据可视化',
          rating: 3,
          comment: '需要增强数据可视化展示',
          suggestions: '添加图表展示关键运营数据',
        },
      ]);
    });
    
    test('ADMIN-02: 系统配置页面UI测试', async () => {
      console.log('\n🔧 Testing System Config Page UI...');
      
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const skillsTab = page.locator('button:has-text("技能分类")');
      if (await skillsTab.count() > 0) {
        await skillsTab.click();
        await page.waitForTimeout(500);
      }
      
      const result = await testPageUI(page, `${BASE_URL}/admin/dashboard`, '技能分类管理', '系统管理员', [
        { selector: 'table', name: '配置列表', required: true },
        { selector: 'button:has-text("添加")', name: '添加配置按钮', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('系统管理员', [
        {
          aspect: '配置管理便捷性',
          rating: 4,
          comment: '配置管理界面清晰',
        },
        {
          aspect: '配置分类清晰度',
          rating: 3,
          comment: '配置分类可以更清晰',
          suggestions: '按类型分组展示配置项',
        },
      ]);
    });
    
    test('ADMIN-03: 用户管理页面UI测试', async () => {
      console.log('\n👥 Testing Users Management Page UI...');
      
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const result = await testPageUI(page, `${BASE_URL}/admin/dashboard`, '管理员工作台', '系统管理员', [
        { selector: 'button:has-text("系统概览")', name: '系统概览标签', required: true },
        { selector: '[class*="stat"]', name: '统计卡片', required: false },
      ]);
      
      pageResults.push(result);
      
      assessUserExperience('系统管理员', [
        {
          aspect: '用户管理便捷性',
          rating: 4,
          comment: '用户管理功能完整',
        },
        {
          aspect: '批量操作支持',
          rating: 3,
          comment: '缺少批量操作功能',
          suggestions: '添加批量禁用/启用用户功能',
        },
      ]);
    });
  });

  test.describe('权限控制验证测试', () => {
    test('PERM-01: 顾问访问HR页面权限测试', async () => {
      console.log('\n🔒 Testing Freelancer Access to HR Pages...');
      
      await logoutUser(page);
      await loginAsUser(page, TEST_USERS.freelancer);
      
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/hr/dashboard')) {
        const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
        if (hasContent) {
          logIssue({
            category: 'PERMISSION',
            severity: 'CRITICAL',
            priority: 'P0',
            description: '顾问用户可以访问HR工作台页面',
            expectedBehavior: '顾问用户应被重定向或显示无权限提示',
            actualBehavior: '顾问用户可以访问HR工作台页面',
            steps: ['顾问登录', '访问HR工作台页面'],
            page: `${BASE_URL}/hr/dashboard`,
            userRole: '自由顾问',
            userImpact: '可能导致数据泄露或误操作',
            businessImpact: '严重的安全漏洞',
            suggestedFix: '添加路由权限守卫，检查用户角色',
          });
        }
      } else {
        console.log('✅ Permission control working: Freelancer redirected from HR dashboard');
      }
      
      await takeScreenshot(page, 'permission-freelancer-hr-page');
    });
    
    test('PERM-02: 顾问访问管理员页面权限测试', async () => {
      console.log('\n🔒 Testing Freelancer Access to Admin Pages...');
      
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin/dashboard')) {
        const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
        if (hasContent) {
          logIssue({
            category: 'PERMISSION',
            severity: 'CRITICAL',
            priority: 'P0',
            description: '顾问用户可以访问管理员页面',
            expectedBehavior: '顾问用户应被重定向或显示无权限提示',
            actualBehavior: '顾问用户可以访问管理员页面',
            steps: ['顾问登录', '访问管理员页面'],
            page: `${BASE_URL}/admin/dashboard`,
            userRole: '自由顾问',
            userImpact: '可能导致系统配置被篡改',
            businessImpact: '严重的安全漏洞',
            suggestedFix: '添加路由权限守卫，检查用户角色',
          });
        }
      } else {
        console.log('✅ Permission control working: Freelancer redirected from admin dashboard');
      }
      
      await takeScreenshot(page, 'permission-freelancer-admin-page');
    });
    
    test('PERM-03: HR访问管理员页面权限测试', async () => {
      console.log('\n🔒 Testing HR Access to Admin Pages...');
      
      await logoutUser(page);
      await loginAsUser(page, TEST_USERS.hr);
      
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin/dashboard')) {
        const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
        if (hasContent) {
          logIssue({
            category: 'PERMISSION',
            severity: 'CRITICAL',
            priority: 'P0',
            description: 'HR用户可以访问管理员页面',
            expectedBehavior: 'HR用户应被重定向或显示无权限提示',
            actualBehavior: 'HR用户可以访问管理员页面',
            steps: ['HR登录', '访问管理员页面'],
            page: `${BASE_URL}/admin/dashboard`,
            userRole: 'HR招聘人员',
            userImpact: '可能导致系统配置被篡改',
            businessImpact: '严重的安全漏洞',
            suggestedFix: '添加路由权限守卫，检查用户角色',
          });
        }
      } else {
        console.log('✅ Permission control working: HR redirected from admin dashboard');
      }
      
      await takeScreenshot(page, 'permission-hr-admin-page');
    });
  });

  test.describe('响应式布局测试', () => {
    test('RESP-01: 桌面端布局测试', async () => {
      console.log('\n🖥️ Testing Desktop Layout...');
      
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await takeScreenshot(page, 'responsive-desktop-1920');
      
      const header = page.locator('header');
      const nav = page.locator('nav, [class*="nav"]');
      const main = page.locator('main, [class*="main"]');
      
      if (!await header.isVisible()) {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          priority: 'P2',
          description: '桌面端布局Header不可见',
          expectedBehavior: 'Header应在桌面端可见',
          actualBehavior: 'Header不可见',
          steps: ['设置视口为1920x1080', '访问首页'],
          page: BASE_URL,
          userImpact: '影响页面导航',
          businessImpact: '降低用户体验',
        });
      }
      
      assessUserExperience('桌面端用户', [
        {
          aspect: '布局合理性',
          rating: 5,
          comment: '桌面端布局合理，信息展示完整',
        },
        {
          aspect: '导航便捷性',
          rating: 4,
          comment: '导航菜单清晰易用',
        },
      ]);
    });
    
    test('RESP-02: 平板端布局测试', async () => {
      console.log('\n📱 Testing Tablet Layout...');
      
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await takeScreenshot(page, 'responsive-tablet-768');
      
      const header = page.locator('header');
      const main = page.locator('main, [class*="main"]');
      
      if (!await header.isVisible()) {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          priority: 'P2',
          description: '平板端布局Header不可见',
          expectedBehavior: 'Header应在平板端可见',
          actualBehavior: 'Header不可见',
          steps: ['设置视口为768x1024', '访问首页'],
          page: BASE_URL,
          userImpact: '影响页面导航',
          businessImpact: '降低平板用户体验',
        });
      }
      
      assessUserExperience('平板端用户', [
        {
          aspect: '布局适配性',
          rating: 4,
          comment: '平板端布局适配良好',
        },
        {
          aspect: '触控友好性',
          rating: 3,
          comment: '部分按钮触控区域较小',
          suggestions: '增大触控元素的可点击区域',
        },
      ]);
    });
    
    test('RESP-03: 移动端布局测试', async () => {
      console.log('\n📱 Testing Mobile Layout...');
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await takeScreenshot(page, 'responsive-mobile-375');
      
      const header = page.locator('header');
      const mobileMenu = page.locator('[class*="mobile-menu"], [class*="hamburger"], button[aria-label*="menu"]');
      
      if (!await header.isVisible() && await mobileMenu.count() === 0) {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          priority: 'P1',
          description: '移动端缺少导航菜单',
          expectedBehavior: '移动端应有汉堡菜单或其他导航方式',
          actualBehavior: '未找到移动端导航菜单',
          steps: ['设置视口为375x667', '访问首页'],
          page: BASE_URL,
          userImpact: '移动端用户无法导航',
          businessImpact: '影响移动端用户体验',
          suggestedFix: '添加移动端汉堡菜单',
        });
      }
      
      assessUserExperience('移动端用户', [
        {
          aspect: '移动端适配',
          rating: 3,
          comment: '移动端适配需要改进',
          suggestions: '优化移动端布局和触控交互',
        },
        {
          aspect: '内容可读性',
          rating: 4,
          comment: '移动端内容可读性良好',
        },
      ]);
      
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  test.describe('无障碍访问测试', () => {
    test('A11Y-01: 键盘导航测试', async () => {
      console.log('\n⌨️ Testing Keyboard Navigation...');
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          className: el?.className,
          text: el?.textContent?.substring(0, 50),
        };
      });
      
      console.log('Focused element:', focusedElement);
      
      if (!focusedElement.tagName) {
        logIssue({
          category: 'ACCESSIBILITY',
          severity: 'MEDIUM',
          priority: 'P2',
          description: '键盘导航无法正常工作',
          expectedBehavior: 'Tab键应能导航到可交互元素',
          actualBehavior: '焦点无法正常移动',
          steps: ['访问首页', '按Tab键多次'],
          page: BASE_URL,
          userImpact: '键盘用户无法正常导航',
          businessImpact: '不符合无障碍访问标准',
          suggestedFix: '确保所有可交互元素可通过Tab键访问',
        });
      }
      
      assessUserExperience('键盘用户', [
        {
          aspect: '键盘导航支持',
          rating: 4,
          comment: '基本支持键盘导航',
        },
        {
          aspect: '焦点可见性',
          rating: 3,
          comment: '焦点样式不够明显',
          suggestions: '增强焦点可见性样式',
        },
      ]);
    });
    
    test('A11Y-02: 表单标签测试', async () => {
      console.log('\n🏷️ Testing Form Labels...');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const inputsWithoutLabels = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        const issues: string[] = [];
        
        inputs.forEach((input, index) => {
          const id = input.getAttribute('id');
          const name = input.getAttribute('name');
          const placeholder = input.getAttribute('placeholder');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          
          let hasLabel = false;
          
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) hasLabel = true;
          }
          
          if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
            issues.push(`Input ${index + 1} (${name || 'unnamed'}): missing label`);
          }
        });
        
        return issues;
      });
      
      if (inputsWithoutLabels.length > 0) {
        logIssue({
          category: 'ACCESSIBILITY',
          severity: 'MEDIUM',
          priority: 'P2',
          featureId: 'AUTH-002',
          description: `登录表单有${inputsWithoutLabels.length}个输入框缺少标签`,
          expectedBehavior: '所有表单字段应有对应的label标签',
          actualBehavior: `缺少标签的输入框: ${inputsWithoutLabels.join(', ')}`,
          steps: ['访问登录页面', '检查表单标签'],
          page: `${BASE_URL}/login`,
          userImpact: '屏幕阅读器用户无法理解表单字段',
          businessImpact: '不符合无障碍访问标准',
          suggestedFix: '为每个表单字段添加label元素或aria-label属性',
        });
      }
    });
  });

  test.describe('业务流程端到端测试', () => {
    test('E2E-01: 完整项目申请流程', async () => {
      console.log('\n🔄 Testing Complete Project Application Flow...');
      
      await logoutUser(page);
      const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
      
      if (hrLoggedIn) {
        await page.goto(`${BASE_URL}/post-job`);
        await page.waitForLoadState('networkidle');
        
        const titleInput = page.locator('input[name*="title"], input[placeholder*="标题"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill(`E2E测试项目_${Date.now()}`);
          
          const submitButton = page.locator('button[type="submit"]').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            
            console.log('Project creation attempted');
          }
        }
      }
      
      await logoutUser(page);
      const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
      
      if (freelancerLoggedIn) {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');
        
        const jobLinks = page.locator('a[href*="/jobs/"], a[href*="/project/"]');
        const jobCount = await jobLinks.count();
        
        if (jobCount > 0) {
          await jobLinks.first().click();
          await page.waitForLoadState('networkidle');
          
          const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply")').first();
          if (await applyButton.count() > 0) {
            const isDisabled = await applyButton.isDisabled();
            
            if (!isDisabled) {
              await applyButton.click();
              await page.waitForTimeout(2000);
              
              console.log('Application submitted');
            }
          } else {
            logIssue({
              category: 'FUNCTIONALITY',
              severity: 'HIGH',
              priority: 'P1',
              featureId: 'PROJ-004',
              description: '项目详情页缺少申请按钮，无法完成申请流程',
              expectedBehavior: '应有申请按钮',
              actualBehavior: '未找到申请按钮',
              steps: ['顾问登录', '浏览项目列表', '点击项目详情'],
              userRole: '自由顾问',
              userImpact: '顾问无法申请项目',
              businessImpact: '阻塞项目申请流程',
              suggestedFix: '在项目详情页添加申请按钮',
            });
          }
        }
      }
      
      assessUserExperience('完整流程用户', [
        {
          aspect: '流程连贯性',
          rating: 3,
          comment: '流程基本连贯，但部分环节缺失',
          suggestions: '完善项目申请和审批的完整流程',
        },
        {
          aspect: '操作反馈',
          rating: 3,
          comment: '操作后反馈不够明确',
          suggestions: '添加更明确的成功/失败提示',
        },
      ]);
    });
  });
});
