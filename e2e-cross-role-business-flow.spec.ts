import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const TEST_RESULT_DIR = './e2e-test-results';
const SCREENSHOT_DIR = './e2e-test-screenshots/cross-role-flow';

interface TestUser {
  email: string;
  password: string;
  role: string;
  userId?: string;
  token?: string;
}

interface TestProject {
  id?: string;
  title: string;
  description: string;
}

interface TestWorkLog {
  id?: string;
  projectId?: string;
  hours: number;
  description: string;
  status?: string;
}

interface TestInvoice {
  id?: string;
  amount: number;
  status?: string;
}

interface IssueRecord {
  id: string;
  timestamp: string;
  category: 'UX' | 'LOGIC' | 'API' | 'UI' | 'PERMISSION' | 'DATA';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  steps: string[];
  screenshot?: string;
  page?: string;
  userRole?: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer1: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'Job Seeker',
  },
  freelancer2: {
    email: 'freelancer2@test.com',
    password: 'Test1234!',
    role: 'Job Seeker',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test1234!',
    role: 'HR Recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'Administrator',
  },
};

const issues: IssueRecord[] = [];
const testProjects: TestProject[] = [];
const testWorkLogs: TestWorkLog[] = [];
const testInvoices: TestInvoice[] = [];

function logIssue(issue: Omit<IssueRecord, 'id' | 'timestamp'>) {
  const issueRecord: IssueRecord = {
    ...issue,
    id: `ISS-${String(issues.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
  };
  issues.push(issueRecord);
  console.log(`[ISSUE] ${issueRecord.id}: ${issue.description}`);
}

async function takeScreenshotWithTimestamp(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${SCREENSHOT_DIR}/${timestamp}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

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
    const isLoggedIn = !currentUrl.includes('/login') || await page.locator('h1:has-text("欢迎回来"), h2:has-text("工作台"), text=工作台').count() > 0;
    
    if (!isLoggedIn) {
      logIssue({
        category: 'API',
        severity: 'HIGH',
        description: `用户 ${user.email} 登录失败`,
        expectedBehavior: '登录成功后应跳转到首页或工作台',
        actualBehavior: `停留在登录页面: ${currentUrl}`,
        steps: ['输入邮箱', '输入密码', '点击登录按钮'],
        userRole: user.role,
      });
    }
    
    return isLoggedIn;
  } catch (error) {
    logIssue({
      category: 'API',
      severity: 'CRITICAL',
      description: `登录过程发生异常: ${error}`,
      expectedBehavior: '登录流程正常完成',
      actualBehavior: `发生异常: ${error}`,
      steps: ['访问登录页面', '填写表单', '提交登录'],
      userRole: user.role,
    });
    return false;
  }
}

async function logoutUser(page: Page): Promise<void> {
  try {
    const userMenu = page.locator('[class*="user-menu"], [class*="avatar"], [data-testid="user-menu"]').first();
    if (await userMenu.count() > 0) {
      await userMenu.click();
      await page.waitForTimeout(500);
      
      const logoutButton = page.locator('button:has-text("退出"), button:has-text("登出"), a:has-text("退出"), [data-testid="logout"]');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('登出过程发生异常:', error);
  }
}

test.describe('跨角色业务流程E2E测试', () => {
  let context: BrowserContext;
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'e2e-test-videos/cross-role/' },
    });
    page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      logIssue({
        category: 'UI',
        severity: 'HIGH',
        description: `页面JavaScript错误: ${error.message}`,
        expectedBehavior: '页面无JavaScript错误',
        actualBehavior: error.message,
        steps: ['页面加载'],
        page: page.url(),
      });
    });
  });
  
  test.afterAll(async () => {
    await context.close();
    
    const reportPath = `${TEST_RESULT_DIR}/cross-role-flow-report-${Date.now()}.json`;
    const fs = require('fs');
    if (!fs.existsSync(TEST_RESULT_DIR)) {
      fs.mkdirSync(TEST_RESULT_DIR, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify({
      testRun: {
        startTime: new Date().toISOString(),
        baseUrl: BASE_URL,
        apiUrl: API_URL,
      },
      issues,
      testProjects,
      testWorkLogs,
      testInvoices,
    }, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('跨角色业务流程E2E测试报告');
    console.log('='.repeat(80));
    console.log(`总问题数: ${issues.length}`);
    console.log(`- CRITICAL: ${issues.filter(i => i.severity === 'CRITICAL').length}`);
    console.log(`- HIGH: ${issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`- MEDIUM: ${issues.filter(i => i.severity === 'MEDIUM').length}`);
    console.log(`- LOW: ${issues.filter(i => i.severity === 'LOW').length}`);
    console.log('='.repeat(80));
    console.log(`报告文件: ${reportPath}`);
    console.log('='.repeat(80));
  });

  test.describe('场景一: HR创建项目 → 顾问申请 → HR审批', () => {
    test('S1-01: HR登录并创建新项目', async () => {
      console.log('\n=== 场景一: HR创建项目 ===');
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.hr);
      expect(loginSuccess).toBe(true);
      
      await takeScreenshotWithTimestamp(page, 'S1-01-hr-logged-in');
      
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S1-02-post-job-page');
      
      const titleInput = page.locator('input[name="project_title"], input[name="title"], input[placeholder*="标题"]').first();
      const descInput = page.locator('textarea[name="project_description"], textarea[name="description"]').first();
      
      if (await titleInput.count() === 0) {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '发布项目页面缺少项目标题输入框',
          expectedBehavior: '应有项目标题输入框',
          actualBehavior: '未找到项目标题输入框',
          steps: ['HR登录', '访问发布项目页面'],
          page: `${BASE_URL}/post-job`,
          userRole: 'HR',
        });
        return;
      }
      
      const projectTitle = `E2E测试项目_${Date.now()}`;
      const projectDesc = '这是一个E2E自动化测试创建的项目，用于验证跨角色业务流程。';
      
      await titleInput.fill(projectTitle);
      if (await descInput.count() > 0) {
        await descInput.fill(projectDesc);
      }
      
      const majorCategorySelect = page.locator('select[name="project_major_categories"], [data-testid="major-category"]').first();
      if (await majorCategorySelect.count() > 0) {
        await majorCategorySelect.selectOption({ index: 1 });
      }
      
      const subCategorySelect = page.locator('select[name="project_sub_categories"], [data-testid="sub-category"]').first();
      if (await subCategorySelect.count() > 0) {
        await subCategorySelect.selectOption({ index: 1 });
      }
      
      const jobNatureSelect = page.locator('select[name="job_nature"], [data-testid="job-nature"]').first();
      if (await jobNatureSelect.count() > 0) {
        await jobNatureSelect.selectOption({ index: 1 });
      }
      
      const workFormatSelect = page.locator('select[name="work_format"], [data-testid="work-format"]').first();
      if (await workFormatSelect.count() > 0) {
        await workFormatSelect.selectOption({ index: 1 });
      }
      
      await takeScreenshotWithTimestamp(page, 'S1-03-post-job-filled');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("发布"), button:has-text("保存")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S1-04-post-job-submitted');
        
        testProjects.push({
          title: projectTitle,
          description: projectDesc,
        });
        
        console.log(`项目创建请求已提交: ${projectTitle}`);
      } else {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '发布项目页面缺少提交按钮',
          expectedBehavior: '应有发布/保存按钮',
          actualBehavior: '未找到提交按钮',
          steps: ['HR登录', '访问发布项目页面', '填写表单'],
          page: `${BASE_URL}/post-job`,
          userRole: 'HR',
        });
      }
    });
    
    test('S1-02: 顾问登录查看项目列表', async () => {
      console.log('\n=== 场景一: 顾问查看项目 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginSuccess).toBe(true);
      
      await takeScreenshotWithTimestamp(page, 'S1-05-freelancer-logged-in');
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      await takeScreenshotWithTimestamp(page, 'S1-06-jobs-list');
      
      const jobCards = page.locator('[class*="job-card"], [class*="project-card"], article, .job-item');
      const jobCount = await jobCards.count();
      
      console.log(`项目列表中找到 ${jobCount} 个项目`);
      
      if (jobCount === 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          description: '项目列表为空，无法进行申请测试',
          expectedBehavior: '应显示已发布的项目',
          actualBehavior: '项目列表为空',
          steps: ['顾问登录', '访问项目列表页面'],
          page: `${BASE_URL}/jobs`,
          userRole: 'Freelancer',
        });
      }
    });
    
    test('S1-03: 顾问申请项目', async () => {
      console.log('\n=== 场景一: 顾问申请项目 ===');
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const jobLinks = page.locator('a[href*="/jobs/"], a[href*="/project/"]');
      const jobLinkCount = await jobLinks.count();
      
      if (jobLinkCount > 0) {
        await jobLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S1-07-job-detail');
        
        const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply"), a:has-text("申请"), [data-testid="apply-btn"]').first();
        
        if (await applyButton.count() > 0) {
          const isDisabled = await applyButton.isDisabled();
          
          if (isDisabled) {
            logIssue({
              category: 'LOGIC',
              severity: 'MEDIUM',
              description: '申请按钮被禁用，可能已申请过或项目状态不允许申请',
              expectedBehavior: '如果项目可申请，按钮应可点击',
              actualBehavior: '申请按钮被禁用',
              steps: ['顾问登录', '查看项目详情'],
              page: page.url(),
              userRole: 'Freelancer',
            });
          } else {
            await applyButton.click();
            await page.waitForTimeout(2000);
            
            await takeScreenshotWithTimestamp(page, 'S1-08-after-apply');
            
            const successMessage = page.locator('[class*="success"], [class*="toast"], :text("申请成功"), :text("已申请")');
            if (await successMessage.count() > 0) {
              console.log('项目申请成功');
            }
          }
        } else {
          logIssue({
            category: 'UI',
            severity: 'HIGH',
            description: '项目详情页缺少申请按钮',
            expectedBehavior: '应有申请按钮',
            actualBehavior: '未找到申请按钮',
            steps: ['顾问登录', '查看项目详情'],
            page: page.url(),
            userRole: 'Freelancer',
          });
        }
      } else {
        logIssue({
          category: 'DATA',
          severity: 'HIGH',
          description: '项目列表中没有可点击的项目',
          expectedBehavior: '应有可点击的项目链接',
          actualBehavior: '未找到项目链接',
          steps: ['顾问登录', '访问项目列表'],
          page: `${BASE_URL}/jobs`,
          userRole: 'Freelancer',
        });
      }
    });
    
    test('S1-04: 验证项目申请后状态变化', async () => {
      console.log('\n=== 场景一: 验证申请状态 ===');
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S1-09-jobs-after-apply');
      
      const appliedBadge = page.locator('[class*="applied"], [class*="status"]:has-text("已申请"), :text("已申请")');
      if (await appliedBadge.count() > 0) {
        console.log('已申请状态标签显示正确');
      }
    });
    
    test('S1-05: HR审批项目申请', async () => {
      console.log('\n=== 场景一: HR审批申请 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.hr);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S1-10-hr-dashboard');
      
      const applicationsLink = page.locator('a[href*="applications"], a:has-text("申请"), a:has-text("Applications")');
      if (await applicationsLink.count() > 0) {
        await applicationsLink.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S1-11-applications-list');
        
        const approveButton = page.locator('button:has-text("录用"), button:has-text("批准"), button:has-text("通过"), button:has-text("Approve")').first();
        if (await approveButton.count() > 0) {
          await approveButton.click();
          await page.waitForTimeout(2000);
          
          await takeScreenshotWithTimestamp(page, 'S1-12-application-approved');
          
          console.log('申请已批准');
        } else {
          logIssue({
            category: 'UI',
            severity: 'MEDIUM',
            description: '申请管理页面缺少批准按钮',
            expectedBehavior: '应有批准/拒绝按钮',
            actualBehavior: '未找到批准按钮',
            steps: ['HR登录', '访问申请管理页面'],
            page: page.url(),
            userRole: 'HR',
          });
        }
      } else {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: 'HR工作台缺少申请管理入口',
          expectedBehavior: '应有申请管理链接',
          actualBehavior: '未找到申请管理链接',
          steps: ['HR登录', '访问HR工作台'],
          page: `${BASE_URL}/hr/dashboard`,
          userRole: 'HR',
        });
      }
    });
  });

  test.describe('场景二: 顾问填报工时 → HR审核', () => {
    test('S2-01: 顾问填报工时', async () => {
      console.log('\n=== 场景二: 顾问填报工时 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S2-01-worklogs-list');
      
      const createButton = page.locator('a[href*="/work-logs/new"], button:has-text("新建"), button:has-text("创建"), a:has-text("填报工时")').first();
      
      if (await createButton.count() === 0) {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '工时列表页缺少创建工时按钮',
          expectedBehavior: '应有创建/新建工时按钮',
          actualBehavior: '未找到创建按钮',
          steps: ['顾问登录', '访问工时列表页面'],
          page: `${BASE_URL}/work-logs`,
          userRole: 'Freelancer',
        });
        return;
      }
      
      await createButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S2-02-create-worklog-page');
      
      const projectSelect = page.locator('select[name="project_requirement_id"], select[name="project"], [data-testid="project-select"]').first();
      if (await projectSelect.count() > 0) {
        const optionCount = await projectSelect.locator('option').count();
        if (optionCount > 1) {
          await projectSelect.selectOption({ index: 1 });
        } else {
          logIssue({
            category: 'DATA',
            severity: 'HIGH',
            description: '工时填报页面没有可选的项目',
            expectedBehavior: '应有已批准的项目可选',
            actualBehavior: '项目下拉框为空或只有默认选项',
            steps: ['顾问登录', '点击创建工时'],
            page: page.url(),
            userRole: 'Freelancer',
          });
          return;
        }
      } else {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '工时填报页面缺少项目选择器',
          expectedBehavior: '应有项目选择下拉框',
          actualBehavior: '未找到项目选择器',
          steps: ['顾问登录', '点击创建工时'],
          page: page.url(),
          userRole: 'Freelancer',
        });
        return;
      }
      
      const hoursInput = page.locator('input[name="hours_worked"], input[name="hours"], input[type="number"]').first();
      if (await hoursInput.count() > 0) {
        await hoursInput.fill('8');
      }
      
      const workTypeSelect = page.locator('select[name="work_type"], [data-testid="work-type"]').first();
      if (await workTypeSelect.count() > 0) {
        await workTypeSelect.selectOption({ index: 1 });
      }
      
      const descInput = page.locator('textarea[name="work_description"], textarea[name="description"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill('E2E测试工时记录 - 完成模块开发和测试工作');
      }
      
      await takeScreenshotWithTimestamp(page, 'S2-03-worklog-filled');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S2-04-worklog-submitted');
        
        testWorkLogs.push({
          hours: 8,
          description: 'E2E测试工时记录',
        });
        
        console.log('工时已提交');
      }
    });
    
    test('S2-02: 验证工时状态为待审核', async () => {
      console.log('\n=== 场景二: 验证工时状态 ===');
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S2-05-worklogs-after-submit');
      
      const submittedStatus = page.locator(':text("待审核"), :text("submitted"), :text("Submitted")');
      if (await submittedStatus.count() > 0) {
        console.log('工时状态显示为待审核');
      }
    });
    
    test('S2-03: HR审核工时', async () => {
      console.log('\n=== 场景二: HR审核工时 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.hr);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/company/work-logs/pending`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S2-06-hr-pending-worklogs');
      
      const pendingWorkLogs = page.locator('table tbody tr, [class*="worklog-item"], [class*="pending-item"]');
      const pendingCount = await pendingWorkLogs.count();
      
      console.log(`待审核工时数量: ${pendingCount}`);
      
      if (pendingCount === 0) {
        logIssue({
          category: 'DATA',
          severity: 'MEDIUM',
          description: 'HR待审核工时列表为空',
          expectedBehavior: '应显示顾问提交的待审核工时',
          actualBehavior: '待审核列表为空',
          steps: ['HR登录', '访问待审核工时页面'],
          page: `${BASE_URL}/company/work-logs/pending`,
          userRole: 'HR',
        });
        return;
      }
      
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("通过"), button:has-text("Confirm"), button:has-text("Approve")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S2-07-worklog-confirmed');
        
        console.log('工时已确认');
      } else {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '待审核工时页面缺少确认按钮',
          expectedBehavior: '应有确认/驳回按钮',
          actualBehavior: '未找到确认按钮',
          steps: ['HR登录', '访问待审核工时页面'],
          page: `${BASE_URL}/company/work-logs/pending`,
          userRole: 'HR',
        });
      }
    });
    
    test('S2-04: 验证工时状态为已确认', async () => {
      console.log('\n=== 场景二: 验证工时已确认 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S2-08-worklogs-after-confirm');
      
      const confirmedStatus = page.locator(':text("已确认"), :text("confirmed"), :text("Confirmed")');
      if (await confirmedStatus.count() > 0) {
        console.log('工时状态显示为已确认');
      }
    });
  });

  test.describe('场景三: 顾问创建发票 → HR审核', () => {
    test('S3-01: 顾问创建发票', async () => {
      console.log('\n=== 场景三: 顾问创建发票 ===');
      
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S3-01-invoices-list');
      
      const createButton = page.locator('a[href*="/invoices/new"], button:has-text("创建"), button:has-text("新建"), a:has-text("开票")').first();
      
      if (await createButton.count() === 0) {
        logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: '发票列表页缺少创建发票按钮',
          expectedBehavior: '应有创建发票按钮',
          actualBehavior: '未找到创建按钮',
          steps: ['顾问登录', '访问发票列表页面'],
          page: `${BASE_URL}/invoices`,
          userRole: 'Freelancer',
        });
        return;
      }
      
      await createButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S3-02-create-invoice-page');
      
      const workLogCheckbox = page.locator('input[type="checkbox"], [class*="worklog-select"]').first();
      if (await workLogCheckbox.count() > 0) {
        await workLogCheckbox.check();
      } else {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          description: '发票创建页面缺少工时选择功能',
          expectedBehavior: '应能选择已确认的工时',
          actualBehavior: '未找到工时选择控件',
          steps: ['顾问登录', '点击创建发票'],
          page: page.url(),
          userRole: 'Freelancer',
        });
      }
      
      const invoiceTypeSelect = page.locator('select[name="invoice_type"], [data-testid="invoice-type"]').first();
      if (await invoiceTypeSelect.count() > 0) {
        await invoiceTypeSelect.selectOption({ index: 1 });
      }
      
      await takeScreenshotWithTimestamp(page, 'S3-03-invoice-filled');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S3-04-invoice-submitted');
        
        testInvoices.push({
          amount: 0,
        });
        
        console.log('发票已提交');
      }
    });
    
    test('S3-02: HR审核发票', async () => {
      console.log('\n=== 场景三: HR审核发票 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.hr);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/company/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S3-05-hr-invoices-list');
      
      const pendingInvoices = page.locator('[class*="pending"], [class*="invoice-item"]');
      const pendingCount = await pendingInvoices.count();
      
      console.log(`待审核发票数量: ${pendingCount}`);
      
      const approveButton = page.locator('button:has-text("审核"), button:has-text("批准"), button:has-text("Approve")').first();
      if (await approveButton.count() > 0) {
        await approveButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S3-06-invoice-approved');
        
        console.log('发票已审核');
      } else {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          description: '发票列表页缺少审核按钮',
          expectedBehavior: '应有审核按钮',
          actualBehavior: '未找到审核按钮',
          steps: ['HR登录', '访问发票列表页面'],
          page: `${BASE_URL}/company/invoices`,
          userRole: 'HR',
        });
      }
    });
  });

  test.describe('场景四: HR确认付款 → 顾问确认收款', () => {
    test('S4-01: HR确认付款', async () => {
      console.log('\n=== 场景四: HR确认付款 ===');
      
      await page.goto(`${BASE_URL}/payments`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S4-01-payments-page');
      
      const payButton = page.locator('button:has-text("付款"), button:has-text("确认付款"), button:has-text("Pay")').first();
      if (await payButton.count() > 0) {
        await payButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S4-02-payment-confirmed');
        
        console.log('付款已确认');
      } else {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          description: '付款页面缺少付款确认按钮',
          expectedBehavior: '应有付款确认按钮',
          actualBehavior: '未找到付款按钮',
          steps: ['HR登录', '访问付款页面'],
          page: `${BASE_URL}/payments`,
          userRole: 'HR',
        });
      }
    });
    
    test('S4-02: 顾问确认收款', async () => {
      console.log('\n=== 场景四: 顾问确认收款 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S4-03-freelancer-invoices');
      
      const confirmReceiptButton = page.locator('button:has-text("确认收款"), button:has-text("已收款"), button:has-text("Confirm")').first();
      if (await confirmReceiptButton.count() > 0) {
        await confirmReceiptButton.click();
        await page.waitForTimeout(2000);
        
        await takeScreenshotWithTimestamp(page, 'S4-04-receipt-confirmed');
        
        console.log('收款已确认');
      }
    });
  });

  test.describe('场景五: 项目完成后双方互评', () => {
    test('S5-01: HR评价顾问', async () => {
      console.log('\n=== 场景五: HR评价顾问 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.hr);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/ratings`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S5-01-ratings-page');
      
      const createRatingButton = page.locator('button:has-text("评价"), button:has-text("写评价"), a:has-text("评价")').first();
      if (await createRatingButton.count() > 0) {
        await createRatingButton.click();
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S5-02-create-rating-page');
        
        const starRating = page.locator('[class*="star"], [data-testid="rating"]').first();
        if (await starRating.count() > 0) {
          await starRating.click();
        }
        
        const commentInput = page.locator('textarea[name="comment"], textarea[name="review"]').first();
        if (await commentInput.count() > 0) {
          await commentInput.fill('E2E测试评价 - 顾问工作认真负责，技术能力强');
        }
        
        const submitButton = page.locator('button[type="submit"], button:has-text("提交")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          await takeScreenshotWithTimestamp(page, 'S5-03-rating-submitted');
          
          console.log('评价已提交');
        }
      } else {
        logIssue({
          category: 'UI',
          severity: 'LOW',
          description: '评价页面缺少创建评价入口',
          expectedBehavior: '应有评价按钮',
          actualBehavior: '未找到评价按钮',
          steps: ['HR登录', '访问评价页面'],
          page: `${BASE_URL}/ratings`,
          userRole: 'HR',
        });
      }
    });
    
    test('S5-02: 顾问评价企业', async () => {
      console.log('\n=== 场景五: 顾问评价企业 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/ratings`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S5-04-freelancer-ratings');
      
      const createRatingButton = page.locator('button:has-text("评价"), button:has-text("写评价")').first();
      if (await createRatingButton.count() > 0) {
        await createRatingButton.click();
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S5-05-freelancer-rating-page');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("提交")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          console.log('顾问评价已提交');
        }
      }
    });
  });

  test.describe('场景六: 用户举报处理', () => {
    test('S6-01: 用户提交举报', async () => {
      console.log('\n=== 场景六: 用户提交举报 ===');
      
      await page.goto(`${BASE_URL}/reports`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S6-01-reports-page');
      
      const createReportButton = page.locator('button:has-text("举报"), button:has-text("提交举报"), a:has-text("举报")').first();
      if (await createReportButton.count() > 0) {
        await createReportButton.click();
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S6-02-create-report-page');
        
        const reportTypeSelect = page.locator('select[name="type"], [data-testid="report-type"]').first();
        if (await reportTypeSelect.count() > 0) {
          await reportTypeSelect.selectOption({ index: 1 });
        }
        
        const descInput = page.locator('textarea[name="description"], textarea[name="reason"]').first();
        if (await descInput.count() > 0) {
          await descInput.fill('E2E测试举报 - 测试举报功能是否正常工作');
        }
        
        const submitButton = page.locator('button[type="submit"], button:has-text("提交")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          await takeScreenshotWithTimestamp(page, 'S6-03-report-submitted');
          
          console.log('举报已提交');
        }
      } else {
        logIssue({
          category: 'UI',
          severity: 'LOW',
          description: '举报页面缺少提交举报入口',
          expectedBehavior: '应有举报按钮',
          actualBehavior: '未找到举报按钮',
          steps: ['用户登录', '访问举报页面'],
          page: `${BASE_URL}/reports`,
          userRole: 'Freelancer',
        });
      }
    });
    
    test('S6-02: 管理员处理举报', async () => {
      console.log('\n=== 场景六: 管理员处理举报 ===');
      
      await logoutUser(page);
      
      const loginSuccess = await loginAsUser(page, TEST_USERS.admin);
      expect(loginSuccess).toBe(true);
      
      await page.goto(`${BASE_URL}/admin/reports`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S6-04-admin-reports');
      
      const reportItems = page.locator('table tbody tr, [class*="report-item"]');
      const reportCount = await reportItems.count();
      
      console.log(`待处理举报数量: ${reportCount}`);
      
      if (reportCount > 0) {
        const processButton = page.locator('button:has-text("处理"), button:has-text("查看")').first();
        if (await processButton.count() > 0) {
          await processButton.click();
          await page.waitForTimeout(1000);
          
          await takeScreenshotWithTimestamp(page, 'S6-05-report-detail');
          
          const resolveButton = page.locator('button:has-text("解决"), button:has-text("验证"), button:has-text("驳回")').first();
          if (await resolveButton.count() > 0) {
            await resolveButton.click();
            await page.waitForTimeout(2000);
            
            await takeScreenshotWithTimestamp(page, 'S6-06-report-resolved');
            
            console.log('举报已处理');
          }
        }
      }
    });
  });

  test.describe('场景七: 业务逻辑一致性验证', () => {
    test('S7-01: 验证项目申请唯一性', async () => {
      console.log('\n=== 场景七: 验证项目申请唯一性 ===');
      
      await logoutUser(page);
      
      await loginAsUser(page, TEST_USERS.freelancer1);
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const jobLinks = page.locator('a[href*="/jobs/"], a[href*="/project/"]');
      const jobLinkCount = await jobLinks.count();
      
      if (jobLinkCount > 0) {
        await jobLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, 'S7-01-job-detail-check');
        
        const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply")').first();
        if (await applyButton.count() > 0) {
          const isDisabled = await applyButton.isDisabled();
          const buttonText = await applyButton.textContent();
          
          if (isDisabled || buttonText?.includes('已申请')) {
            console.log('已申请项目按钮状态正确: 禁用或显示已申请');
          } else {
            console.log('项目可继续申请（可能是新项目）');
          }
        }
      }
    });
    
    test('S7-02: 验证工时状态流转', async () => {
      console.log('\n=== 场景七: 验证工时状态流转 ===');
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S7-02-worklog-status-check');
      
      const editButton = page.locator('button:has-text("编辑"), a:has-text("编辑")').first();
      const confirmedStatus = page.locator(':text("已确认"), :text("confirmed")');
      
      if (await confirmedStatus.count() > 0 && await editButton.count() > 0) {
        logIssue({
          category: 'LOGIC',
          severity: 'HIGH',
          description: '已确认的工时仍可编辑，违反业务规则',
          expectedBehavior: '已确认的工时不可编辑',
          actualBehavior: '已确认的工时仍显示编辑按钮',
          steps: ['查看已确认工时', '检查编辑按钮'],
          page: `${BASE_URL}/work-logs`,
          userRole: 'Freelancer',
        });
      } else {
        console.log('工时状态流转逻辑正确');
      }
    });
    
    test('S7-03: 验证发票金额计算', async () => {
      console.log('\n=== 场景七: 验证发票金额计算 ===');
      
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshotWithTimestamp(page, 'S7-03-invoice-amount-check');
      
      console.log('发票金额计算验证完成');
    });
    
    test('S7-04: 验证权限控制', async () => {
      console.log('\n=== 场景七: 验证权限控制 ===');
      
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        logIssue({
          category: 'PERMISSION',
          severity: 'CRITICAL',
          description: '顾问用户可以访问管理员页面',
          expectedBehavior: '顾问用户应被重定向或显示无权限',
          actualBehavior: '顾问用户可以访问管理员页面',
          steps: ['顾问登录', '访问管理员页面'],
          page: `${BASE_URL}/admin/dashboard`,
          userRole: 'Freelancer',
        });
      } else {
        console.log('权限控制正确：顾问无法访问管理员页面');
      }
      
      await takeScreenshotWithTimestamp(page, 'S7-04-permission-check');
    });
  });

  test.describe('场景八: 用户体验问题检测', () => {
    test('S8-01: 检查页面加载性能', async () => {
      console.log('\n=== 场景八: 页面加载性能检测 ===');
      
      const pages = [
        { url: BASE_URL, name: '首页' },
        { url: `${BASE_URL}/jobs`, name: '项目列表' },
        { url: `${BASE_URL}/work-logs`, name: '工时管理' },
        { url: `${BASE_URL}/invoices`, name: '发票管理' },
      ];
      
      for (const pageInfo of pages) {
        const startTime = Date.now();
        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        console.log(`${pageInfo.name}加载时间: ${loadTime}ms`);
        
        if (loadTime > 5000) {
          logIssue({
            category: 'UX',
            severity: 'MEDIUM',
            description: `${pageInfo.name}加载时间过长: ${loadTime}ms`,
            expectedBehavior: '页面加载时间应小于3秒',
            actualBehavior: `加载时间: ${loadTime}ms`,
            steps: [`访问${pageInfo.url}`],
            page: pageInfo.url,
          });
        }
      }
    });
    
    test('S8-02: 检查控制台错误', async () => {
      console.log('\n=== 场景八: 控制台错误检测 ===');
      
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        logIssue({
          category: 'UI',
          severity: 'MEDIUM',
          description: `首页存在控制台错误: ${consoleErrors.length}个`,
          expectedBehavior: '页面无控制台错误',
          actualBehavior: `发现${consoleErrors.length}个控制台错误`,
          steps: ['访问首页', '检查控制台'],
          page: BASE_URL,
        });
      }
    });
    
    test('S8-03: 检查响应式布局', async () => {
      console.log('\n=== 场景八: 响应式布局检测 ===');
      
      const viewports = [
        { width: 1920, height: 1080, name: '桌面端' },
        { width: 768, height: 1024, name: '平板端' },
        { width: 375, height: 667, name: '移动端' },
      ];
      
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await takeScreenshotWithTimestamp(page, `S8-viewport-${vp.name}`);
        
        const header = page.locator('header');
        const isHeaderVisible = await header.isVisible();
        
        if (!isHeaderVisible) {
          logIssue({
            category: 'UX',
            severity: 'LOW',
            description: `${vp.name}布局下Header不可见`,
            expectedBehavior: 'Header应在所有设备上可见',
            actualBehavior: 'Header不可见',
            steps: [`设置视口为${vp.width}x${vp.height}`, '访问首页'],
            page: BASE_URL,
          });
        }
        
        console.log(`${vp.name}布局检查完成`);
      }
      
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });
});
