import { test, expect, Page, from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

interface TestIssue {
  featureId: string;
  featureName: string;
  role: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'critical' | 'major' | 'minor';
  screenshot?: string;
}

const issuesFound: TestIssue[] = [];

function logIssue(issue: TestIssue) {
  issuesFound.push(issue);
  console.log(`[ISSUE] ${issue.featureId}: ${issue.description}`);
}

test.describe('Detailed P0 Features Test', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.afterAll(async () => {
    await page.close();
    console.log('\n========== ISSUES SUMMARY ==========');
    issuesFound.forEach((issue, index) => {
      console.log(`\n[${index + 1}] ${issue.featureId} - ${issue.featureName}`);
      console.log(`    Role: ${issue.role}`);
      console.log(`    Severity: ${issue.severity}`);
      console.log(`    Description: ${issue.description}`);
      console.log(`    Expected: ${issue.expectedBehavior}`);
      console.log(`    Actual: ${issue.actualBehavior}`);
    });
    console.log('\n====================================');
  });

  test('PROJ-001: Post Job Page - Check All Fields', async () => {
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/proj-001-post-job.png' });
    
    const titleInput = await page.locator('input[name*="title" i], input[name*="project_title" i], input[placeholder*="标题" i], input[placeholder*="项目名称" i]').first();
    const descriptionInput = await page.locator('textarea, input[name*="description" i], input[placeholder*="描述" i]').first();
    const budgetInput = await page.locator('input[name*="budget" i], input[name*="budget" i], input[placeholder*="预算" i], input[placeholder*="薪资" i]').first();
    const skillsInput = await page.locator('input[name*="skills" i], select[name*="skills" i], input[placeholder*="技能" i]').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("发布"), button:has-text("提交")').first();
    
    if (!titleInput) {
      logIssue({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        role: 'company',
        description: '缺少项目标题输入字段',
        expectedBehavior: '应包含项目标题输入字段',
        actualBehavior: '未找到项目标题输入字段',
        severity: 'critical',
        screenshot: 'detailed/proj-001-post-job.png'
      });
    }
    
    if (!budgetInput) {
      logIssue({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        role: 'company',
        description: '缺少预算/薪资输入字段',
        expectedBehavior: '应包含预算或薪资输入字段',
        actualBehavior: '未找到预算/薪资输入字段',
        severity: 'major',
        screenshot: 'detailed/proj-001-post-job.png'
      });
    }
    
    if (!skillsInput) {
      logIssue({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        role: 'company',
        description: '缺少技能要求输入字段',
        expectedBehavior: '应包含技能要求输入字段',
        actualBehavior: '未找到技能要求输入字段',
        severity: 'major',
        screenshot: 'detailed/proj-001-post-job.png'
      });
    }
    
    if (!submitButton) {
      logIssue({
        featureId: 'PROJ-001',
        featureName: '项目发布',
        role: 'company',
        description: '缺少提交按钮',
        expectedBehavior: '应包含提交按钮',
        actualBehavior: '未找到提交按钮',
        severity: 'critical',
        screenshot: 'detailed/proj-001-post-job.png'
      });
    }
  });

  test('PROJ-002: My Jobs Page - Check Filters', async () => {
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/proj-002-my-jobs.png' });
    
    const statusFilter = await page.locator('select[name*="status" i], select[name*="filter" i]').first();
    const searchInput = await page.locator('input[type="search" i], input[placeholder*="搜索" i]').first();
    const jobCards = await page.locator('[class*="job"], [class*="project"], [class*="card"]').count();
    
    if (!statusFilter && !searchInput) {
      logIssue({
        featureId: 'PROJ-002',
        featureName: '项目列表',
        role: 'freelancer/company',
        description: '缺少筛选和搜索功能',
        expectedBehavior: '应包含状态筛选和搜索功能',
        actualBehavior: `状态筛选: ${!!statusFilter}, 搜索: ${!!searchInput}`,
        severity: 'major',
        screenshot: 'detailed/proj-002-my-jobs.png'
      });
    }
  });

  test('WORKLOG-001: Work Logs Page - Check Create', async () => {
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/worklog-001-work-logs.png' });
    
    const createButton = await page.locator('a[href*="create"], button:has-text("创建"), button:has-text("新增"), a[href*="new"]').first();
    const workLogList = await page.locator('[class*="work-log"], [class*="worklog"], table').count();
    
    if (!createButton) {
      logIssue({
        featureId: 'WORKLOG-001',
        featureName: '工时填报',
        role: 'freelancer',
        description: '缺少创建工时按钮',
        expectedBehavior: '应包含创建工时按钮',
        actualBehavior: '未找到创建工时按钮',
        severity: 'major',
        screenshot: 'detailed/worklog-001-work-logs.png'
      });
    }
  });

  test('INV-001: Invoices Page - Check Create', async () => {
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/inv-001-invoices.png' });
    
    const createButton = await page.locator('a[href*="create"], button:has-text("创建"), button:has-text("新增"), a[href*="new"]').first();
    const invoiceList = await page.locator('[class*="invoice"], table').count();
    
    if (!createButton) {
      logIssue({
        featureId: 'INV-001',
        featureName: '发票创建',
        role: 'freelancer',
        description: '缺少创建发票按钮',
        expectedBehavior: '应包含创建发票按钮',
        actualBehavior: '未找到创建发票按钮',
        severity: 'major',
        screenshot: 'detailed/inv-001-invoices.png'
      });
    }
  });

  test('MSG-001: Messages Page - Check Content', async () => {
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/msg-001-messages.png' });
    
    const messageList = await page.locator('[class*="message"], [class*="notification"], [class*="list"]').count();
    const tabs = await page.locator('button:has-text("全部"), button:has-text("未读"), button:has-text("已读")').count();
    
    if (!messageList && !tabs) {
      logIssue({
        featureId: 'MSG-001',
        featureName: '消息通知',
        role: 'all',
        description: '消息页面缺少消息列表或标签',
        expectedBehavior: '应包含消息列表和状态标签',
        actualBehavior: `消息列表: ${messageList}, 标签: ${tabs}`,
        severity: 'major',
        screenshot: 'detailed/msg-001-messages.png'
      });
    }
  });

  test('PROFILE-001: Profile Page - Check Content', async () => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/detailed/profile-001-profile.png' });
    
    const profileContent = await page.locator('[class*="profile"], [class*="user-info"], form').count();
    const editButton = await page.locator('button:has-text("编辑"), button:has-text("修改"), button:has-text("Edit")').first();
    
    if (!profileContent) {
      logIssue({
        featureId: 'PROFILE-001',
        featureName: '个人档案',
        role: 'freelancer',
        description: '个人档案页面缺少内容',
        expectedBehavior: '应包含用户信息和编辑功能',
        actualBehavior: '页面内容为空或未加载',
        severity: 'critical',
        screenshot: 'detailed/profile-001-profile.png'
      });
    }
  });
});
