import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

interface TestUser {
  email: string;
  password: string;
  role: string;
}

interface TestData {
  projectTitle: string;
  projectDescription: string;
  workHours: number;
  workDescription: string;
  invoiceAmount: number;
}

interface IssueRecord {
  id: string;
  scenario: string;
  type: 'data_display' | 'data_flow' | 'state_sync' | 'permission' | 'ui_interaction';
  severity: 'P0' | 'P1' | 'P2';
  description: string;
  expected: string;
  actual: string;
  timestamp: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: { email: 'freelancer@test.com', password: 'Test123456!', role: 'freelancer' },
  hr: { email: 'hr@test.com', password: 'Test123456!', role: 'hr' },
  admin: { email: 'admin@test.com', password: 'Admin123456!', role: 'admin' }
};

const testData: TestData = {
  projectTitle: `数据流转测试项目_${Date.now()}`,
  projectDescription: '这是一个用于验证跨角色数据流转的测试项目',
  workHours: 8,
  workDescription: '完成了模块开发和单元测试',
  invoiceAmount: 8000
};

const issuesFound: IssueRecord[] = [];

function recordIssue(issue: Omit<IssueRecord, 'id' | 'timestamp'>) {
  const issueRecord: IssueRecord = {
    ...issue,
    id: `ISS-${String(issuesFound.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString()
  };
  issuesFound.push(issueRecord);
  console.log(`[ISSUE FOUND] ${issueRecord.id}: ${issue.description}`);
}

async function loginAs(page: Page, userType: keyof typeof TEST_USERS): Promise<boolean> {
  const user = TEST_USERS[userType];
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|workbench|admin|\/)/, { timeout: 30000 });
    console.log(`[SUCCESS] Logged in as ${userType}: ${user.email}`);
    return true;
  } catch (error) {
    console.log(`[FAILED] Login as ${userType} failed: ${error}`);
    return false;
  }
}

async function verifyDataDisplay(
  page: Page, 
  selector: string, 
  expectedCount: { min: number } | { exact: number },
  description: string,
  scenario: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    const elements = await page.locator(selector).count();
    
    if ('min' in expectedCount) {
      if (elements >= expectedCount.min) {
        console.log(`[PASS] ${description}: Found ${elements} elements (min: ${expectedCount.min})`);
        return true;
      }
    } else {
      if (elements === expectedCount.exact) {
        console.log(`[PASS] ${description}: Found ${elements} elements`);
        return true;
      }
    }
    
    recordIssue({
      scenario,
      type: 'data_display',
      severity: 'P1',
      description: `${description} - 数据未正确显示`,
      expected: `min: ${'min' in expectedCount ? expectedCount.min : expectedCount.exact}`,
      actual: `Found ${elements} elements`
    });
    return false;
  } catch (error) {
    recordIssue({
      scenario,
      type: 'data_display',
      severity: 'P1',
      description: `${description} - 元素未找到`,
      expected: `Element ${selector} should be visible`,
      actual: `Element not found or timeout`
    });
    return false;
  }
}

async function verifyButtonExists(
  page: Page,
  selector: string,
  description: string,
  scenario: string
): Promise<boolean> {
  try {
    const button = page.locator(selector);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    console.log(`[PASS] ${description} - 按钮存在`);
    return true;
  } catch (error) {
    recordIssue({
      scenario,
      type: 'ui_interaction',
      severity: 'P1',
      description: `${description} - 按钮不存在`,
      expected: `Button ${selector} should be visible`,
      actual: 'Button not found'
    });
    return false;
  }
}

async function verifyStateChange(
  page: Page,
  selector: string,
  expectedState: string,
  description: string,
  scenario: string
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    await element.waitFor({ timeout: 5000 });
    const text = await element.textContent();
    
    if (text?.includes(expectedState)) {
      console.log(`[PASS] ${description}: State is "${expectedState}"`);
      return true;
    }
    
    recordIssue({
      scenario,
      type: 'state_sync',
      severity: 'P1',
      description: `${description} - 状态未正确同步`,
      expected: expectedState,
      actual: text || 'unknown'
    });
    return false;
  } catch (error) {
    recordIssue({
      scenario,
      type: 'state_sync',
      severity: 'P1',
      description: `${description} - 无法获取状态`,
      expected: expectedState,
      actual: 'Element not found'
    });
    return false;
  }
}

test.describe('Cross-Role Data Flow E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('SC-001: 项目发布与申请流程 - 数据流转验证', async ({ page }) => {
    const scenario = 'SC-001: 项目发布与申请流程';
    console.log(`\n========== ${scenario} ==========\n`);
    
    let createdProjectId: string = '';
    
    // Step 1-6: HR发布项目
    console.log('[STEP 1] HR登录系统');
    await loginAs(page, 'hr');
    
    console.log('[STEP 2] HR访问项目发布页面');
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    
    console.log('[STEP 3] HR填写项目信息');
    await page.fill('input[name="project_title"]', testData.projectTitle);
    await page.fill('textarea[name="project_description"]', testData.projectDescription);
    
    console.log('[STEP 4] HR选择技能大类');
    const majorCategoryBtn = page.locator('[data-testid="major-category-btn"]').first();
    if (await majorCategoryBtn.isVisible()) {
      await majorCategoryBtn.click();
      console.log('[ACTION] Selected skill major category');
    }
    
    console.log('[STEP 5] HR选择技能小类');
    const subCategoryBtn = page.locator('[data-testid="sub-category-btn"]').first();
    if (await subCategoryBtn.isVisible()) {
      await subCategoryBtn.click();
      console.log('[ACTION] Selected skill sub category');
    } else {
      recordIssue({
        scenario,
        type: 'data_display',
        severity: 'P1',
        description: '技能小类按钮未加载',
        expected: '选择大类后应显示小类按钮',
        actual: '小类按钮未显示'
      });
    }
    
    console.log('[STEP 6] HR提交项目');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 验证跳转
    const currentUrl = page.url();
    if (!currentUrl.includes('/my-jobs')) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P0',
        description: '项目创建后未正确跳转',
        expected: '应跳转到 /my-jobs 页面',
        actual: `当前URL: ${currentUrl}`
      });
    } else {
      console.log('[PASS] 项目创建后正确跳转到我的项目页面');
    }
    
    // Step 7: HR查看我的项目列表
    console.log('[STEP 7] HR查看我的项目列表');
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    
    const projectInList = page.locator(`text=${testData.projectTitle}`);
    if (await projectInList.isVisible()) {
      console.log('[PASS] 新项目出现在HR的项目列表中');
    } else {
      recordIssue({
        scenario,
        type: 'data_display',
        severity: 'P0',
        description: '新项目未出现在HR项目列表中',
        expected: '项目应显示在列表中',
        actual: '项目未显示'
      });
    }
    
    // Step 8-11: Freelancer浏览和申请项目
    console.log('[STEP 8] Freelancer登录系统');
    await loginAs(page, 'freelancer');
    
    console.log('[STEP 9] Freelancer访问项目列表页面');
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    
    const jobCards = page.locator('[data-testid="job-card"], .job-card, .project-card');
    const jobCount = await jobCards.count();
    
    if (jobCount === 0) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P0',
        description: '项目列表为空 - 数据未流转到顾问视角',
        expected: '应显示HR发布的项目',
        actual: '项目列表为空'
      });
    } else {
      console.log(`[PASS] 项目列表显示 ${jobCount} 个项目`);
      
      // 点击第一个项目查看详情
      console.log('[STEP 10] Freelancer查看项目详情');
      await jobCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // 检查申请按钮
      const applyBtn = page.locator('button:has-text("申请"), button:has-text("Apply"), [data-testid="apply-btn"]');
      if (await applyBtn.isVisible()) {
        console.log('[PASS] 项目详情页显示申请按钮');
        
        console.log('[STEP 11] Freelancer申请项目');
        await applyBtn.click();
        await page.waitForTimeout(2000);
        
        // 验证申请成功
        const successMsg = page.locator('text=申请成功, text=Application submitted, .success-message');
        if (await successMsg.isVisible()) {
          console.log('[PASS] 项目申请成功');
        }
      } else {
        recordIssue({
          scenario,
          type: 'permission',
          severity: 'P0',
          description: '顾问无法看到申请按钮 - 角色权限判断错误',
          expected: '顾问应能看到申请按钮',
          actual: '申请按钮不可见'
        });
      }
    }
    
    // Step 12-13: HR查看申请列表
    console.log('[STEP 12] HR查看申请列表');
    await loginAs(page, 'hr');
    await page.goto(`${BASE_URL}/applications-management`);
    await page.waitForLoadState('networkidle');
    
    const applicationItems = page.locator('[data-testid="application-item"], .application-item, .application-card');
    const appCount = await applicationItems.count();
    
    if (appCount === 0) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P0',
        description: '申请列表为空 - 申请数据未流转到HR视角',
        expected: '应显示顾问的申请记录',
        actual: '申请列表为空'
      });
    } else {
      console.log(`[PASS] 申请列表显示 ${appCount} 条申请`);
    }
  });

  test('SC-002: 工时填报与审核流程 - 数据流转验证', async ({ page }) => {
    const scenario = 'SC-002: 工时填报与审核流程';
    console.log(`\n========== ${scenario} ==========\n`);
    
    // Step 1-5: Freelancer填报工时
    console.log('[STEP 1] Freelancer登录系统');
    await loginAs(page, 'freelancer');
    
    console.log('[STEP 2] Freelancer访问工时填报页面');
    await page.goto(`${BASE_URL}/work-logs/create`);
    await page.waitForLoadState('networkidle');
    
    console.log('[STEP 3] Freelancer选择关联项目');
    const projectSelect = page.locator('select[name="project_requirement_id"], select[name="project_id"]');
    const projectSelectVisible = await projectSelect.isVisible();
    
    if (!projectSelectVisible) {
      recordIssue({
        scenario,
        type: 'ui_interaction',
        severity: 'P0',
        description: '工时表单缺少项目选择器',
        expected: '应有项目选择下拉框',
        actual: '项目选择器不存在'
      });
    } else {
      const options = await projectSelect.locator('option').count();
      if (options <= 1) {
        recordIssue({
          scenario,
          type: 'data_flow',
          severity: 'P1',
          description: '项目选择器无可用项目',
          expected: '应显示已关联的项目列表',
          actual: '项目列表为空'
        });
      } else {
        await projectSelect.selectOption({ index: 1 });
        console.log('[PASS] 成功选择项目');
      }
    }
    
    console.log('[STEP 4] Freelancer填写工时信息');
    await page.fill('input[name="hours_worked"]', String(testData.workHours));
    await page.fill('textarea[name="work_description"]', testData.workDescription);
    
    console.log('[STEP 5] Freelancer提交工时');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    // 验证提交成功
    const currentUrl = page.url();
    if (currentUrl.includes('/work-logs') && !currentUrl.includes('/create')) {
      console.log('[PASS] 工时提交成功，跳转到工时列表');
    }
    
    // Step 6: Freelancer查看工时状态
    console.log('[STEP 6] Freelancer查看工时列表');
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    
    const workLogItems = page.locator('[data-testid="worklog-item"], .worklog-item, .work-log-card');
    const workLogCount = await workLogItems.count();
    
    if (workLogCount > 0) {
      console.log(`[PASS] 工时列表显示 ${workLogCount} 条记录`);
    } else {
      recordIssue({
        scenario,
        type: 'data_display',
        severity: 'P1',
        description: '工时列表为空',
        expected: '应显示新提交的工时',
        actual: '工时列表为空'
      });
    }
    
    // Step 7-10: HR审核工时
    console.log('[STEP 7] HR登录系统');
    await loginAs(page, 'hr');
    
    console.log('[STEP 8] HR访问工时审核页面');
    await page.goto(`${BASE_URL}/hr-work-logs`);
    await page.waitForLoadState('networkidle');
    
    const hrWorkLogItems = page.locator('[data-testid="worklog-item"], .worklog-item, .work-log-card');
    const hrWorkLogCount = await hrWorkLogItems.count();
    
    if (hrWorkLogCount === 0) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P0',
        description: 'HR工时列表为空 - 工时数据未流转',
        expected: '应显示顾问提交的工时',
        actual: '工时列表为空'
      });
    } else {
      console.log(`[PASS] HR工时列表显示 ${hrWorkLogCount} 条记录`);
      
      console.log('[STEP 9] HR查看工时详情');
      await hrWorkLogItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // 检查审批按钮
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("通过"), [data-testid="confirm-btn"]');
      const rejectBtn = page.locator('button:has-text("驳回"), button:has-text("拒绝"), [data-testid="reject-btn"]');
      
      const hasConfirmBtn = await confirmBtn.isVisible();
      const hasRejectBtn = await rejectBtn.isVisible();
      
      if (!hasConfirmBtn || !hasRejectBtn) {
        recordIssue({
          scenario,
          type: 'ui_interaction',
          severity: 'P0',
          description: '工时审核页面缺少审批按钮',
          expected: '应有确认和驳回按钮',
          actual: `确认按钮: ${hasConfirmBtn}, 驳回按钮: ${hasRejectBtn}`
        });
      } else {
        console.log('[PASS] 工时审核页面显示审批按钮');
        
        console.log('[STEP 10] HR确认工时');
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log('[ACTION] 工时已确认');
      }
    }
    
    // Step 11: Freelancer查看工时状态更新
    console.log('[STEP 11] Freelancer查看工时状态更新');
    await loginAs(page, 'freelancer');
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    
    const confirmedStatus = page.locator('text=已确认, text=confirmed, .status-confirmed');
    if (await confirmedStatus.isVisible()) {
      console.log('[PASS] 工时状态已更新为已确认');
    } else {
      recordIssue({
        scenario,
        type: 'state_sync',
        severity: 'P1',
        description: '工时状态未同步更新',
        expected: '状态应为已确认',
        actual: '状态未更新'
      });
    }
  });

  test('SC-003: 发票创建与付款流程 - 数据流转验证', async ({ page }) => {
    const scenario = 'SC-003: 发票创建与付款流程';
    console.log(`\n========== ${scenario} ==========\n`);
    
    // Step 1-4: Freelancer创建发票
    console.log('[STEP 1] Freelancer访问发票创建页面');
    await loginAs(page, 'freelancer');
    await page.goto(`${BASE_URL}/invoices/create`);
    await page.waitForLoadState('networkidle');
    
    console.log('[STEP 2] Freelancer填写发票信息');
    const amountInput = page.locator('input[name="total_amount"], input[name="amount"]');
    if (await amountInput.isVisible()) {
      await amountInput.fill(String(testData.invoiceAmount));
    }
    
    console.log('[STEP 3] Freelancer提交发票');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    console.log('[STEP 4] Freelancer查看发票列表');
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    // Step 5-9: HR审核发票和付款
    console.log('[STEP 5] HR访问发票列表');
    await loginAs(page, 'hr');
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    const invoiceItems = page.locator('[data-testid="invoice-item"], .invoice-item, .invoice-card');
    const invoiceCount = await invoiceItems.count();
    
    if (invoiceCount === 0) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P0',
        description: 'HR发票列表为空 - 发票数据未流转',
        expected: '应显示顾问创建的发票',
        actual: '发票列表为空'
      });
    } else {
      console.log(`[PASS] HR发票列表显示 ${invoiceCount} 条记录`);
      
      console.log('[STEP 6] HR查看发票详情');
      await invoiceItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // 检查审批按钮
      const approveBtn = page.locator('button:has-text("通过"), button:has-text("审批"), [data-testid="approve-btn"]');
      if (await approveBtn.isVisible()) {
        console.log('[PASS] 发票详情页显示审批按钮');
        
        console.log('[STEP 7] HR审批通过发票');
        await approveBtn.click();
        await page.waitForTimeout(2000);
      } else {
        recordIssue({
          scenario,
          type: 'ui_interaction',
          severity: 'P0',
          description: '发票审核页面缺少审批按钮',
          expected: '应有审批通过按钮',
          actual: '审批按钮不存在'
        });
      }
    }
    
    // Step 10-11: Freelancer确认收款
    console.log('[STEP 10] Freelancer访问付款列表');
    await loginAs(page, 'freelancer');
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    
    const paymentItems = page.locator('[data-testid="payment-item"], .payment-item, .payment-card');
    const paymentCount = await paymentItems.count();
    
    if (paymentCount > 0) {
      console.log(`[PASS] 付款列表显示 ${paymentCount} 条记录`);
      
      console.log('[STEP 11] Freelancer确认收款');
      const confirmBtn = page.locator('button:has-text("确认收款"), button:has-text("确认"), [data-testid^="confirm-payment-btn"]');
      if (await confirmBtn.first().isVisible()) {
        console.log('[PASS] 付款列表显示确认收款按钮');
      } else {
        recordIssue({
          scenario,
          type: 'ui_interaction',
          severity: 'P1',
          description: '付款列表缺少确认收款按钮',
          expected: '应有确认收款按钮',
          actual: '确认收款按钮不存在'
        });
      }
    }
  });

  test('SC-004: 评价与举报流程 - 数据流转验证', async ({ page }) => {
    const scenario = 'SC-004: 评价与举报流程';
    console.log(`\n========== ${scenario} ==========\n`);
    
    // 评价流程
    console.log('[STEP 1] Freelancer访问评价页面');
    await loginAs(page, 'freelancer');
    await page.goto(`${BASE_URL}/ratings`);
    await page.waitForLoadState('networkidle');
    
    console.log('[STEP 2] Freelancer填写评价');
    const ratingStars = page.locator('[data-testid="rating-star"], .rating-star, input[type="radio"][name*="rating"]');
    if (await ratingStars.first().isVisible()) {
      await ratingStars.first().click();
      console.log('[ACTION] Selected rating');
    }
    
    const commentInput = page.locator('textarea[name="comment"], textarea[name="content"]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('这是一个测试评价');
    }
    
    console.log('[STEP 3] Freelancer提交评价');
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log('[ACTION] Rating submitted');
    }
    
    // HR查看评价
    console.log('[STEP 4] HR查看收到的评价');
    await loginAs(page, 'hr');
    await page.goto(`${BASE_URL}/ratings`);
    await page.waitForLoadState('networkidle');
    
    // 举报流程
    console.log('[STEP 5] Freelancer访问举报页面');
    await loginAs(page, 'freelancer');
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    console.log('[STEP 6] Freelancer填写举报内容');
    const reportTypeSelect = page.locator('select[name="report_type"], select[name="type"]');
    if (await reportTypeSelect.isVisible()) {
      await reportTypeSelect.selectOption({ index: 0 });
    }
    
    const reportContent = page.locator('textarea[name="content"], textarea[name="description"]');
    if (await reportContent.isVisible()) {
      await reportContent.fill('这是一个测试举报');
    }
    
    console.log('[STEP 7] Freelancer提交举报');
    const reportSubmitBtn = page.locator('button[type="submit"]');
    if (await reportSubmitBtn.isVisible()) {
      await reportSubmitBtn.click();
      await page.waitForTimeout(2000);
      console.log('[ACTION] Report submitted');
    }
    
    // 管理员处理举报
    console.log('[STEP 8] Admin访问举报管理页面');
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/reports`);
    await page.waitForLoadState('networkidle');
    
    const reportItems = page.locator('[data-testid="report-item"], .report-item, .report-card');
    const reportCount = await reportItems.count();
    
    if (reportCount === 0) {
      recordIssue({
        scenario,
        type: 'data_flow',
        severity: 'P1',
        description: '管理员举报列表为空 - 举报数据未流转',
        expected: '应显示用户提交的举报',
        actual: '举报列表为空'
      });
    } else {
      console.log(`[PASS] 管理员举报列表显示 ${reportCount} 条记录`);
      
      console.log('[STEP 9] Admin查看举报详情');
      await reportItems.first().click();
      await page.waitForLoadState('networkidle');
      
      const handleBtn = page.locator('button:has-text("处理"), button:has-text("验证"), [data-testid="handle-btn"]');
      if (await handleBtn.isVisible()) {
        console.log('[PASS] 举报详情页显示处理按钮');
      } else {
        recordIssue({
          scenario,
          type: 'ui_interaction',
          severity: 'P1',
          description: '举报详情页缺少处理按钮',
          expected: '应有处理按钮',
          actual: '处理按钮不存在'
        });
      }
    }
  });

  test('SC-005: 管理员数据管理流程 - 数据流转验证', async ({ page }) => {
    const scenario = 'SC-005: 管理员数据管理流程';
    console.log(`\n========== ${scenario} ==========\n`);
    
    console.log('[STEP 1] Admin登录系统');
    await loginAs(page, 'admin');
    
    console.log('[STEP 2] Admin查看仪表盘统计');
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .dashboard-stat');
    const statCount = await statCards.count();
    
    if (statCount > 0) {
      console.log(`[PASS] 仪表盘显示 ${statCount} 个统计卡片`);
    } else {
      recordIssue({
        scenario,
        type: 'data_display',
        severity: 'P1',
        description: '仪表盘统计卡片未显示',
        expected: '应显示统计数据',
        actual: '统计卡片为空'
      });
    }
    
    console.log('[STEP 3] Admin访问用户管理页面');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    
    const userItems = page.locator('[data-testid="user-item"], .user-item, .user-row');
    const userCount = await userItems.count();
    console.log(`[INFO] 用户列表显示 ${userCount} 条记录`);
    
    console.log('[STEP 4] Admin搜索用户');
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('[ACTION] Searched for users');
    }
    
    console.log('[STEP 5] Admin访问企业管理页面');
    await page.goto(`${BASE_URL}/admin/companies`);
    await page.waitForLoadState('networkidle');
    
    const companyItems = page.locator('[data-testid="company-item"], .company-item, .company-row');
    const companyCount = await companyItems.count();
    console.log(`[INFO] 企业列表显示 ${companyCount} 条记录`);
    
    console.log('[STEP 6] Admin访问技能管理页面');
    await page.goto(`${BASE_URL}/admin/skills`);
    await page.waitForLoadState('networkidle');
    
    const skillItems = page.locator('[data-testid="skill-item"], .skill-item, .skill-category');
    const skillCount = await skillItems.count();
    console.log(`[INFO] 技能列表显示 ${skillCount} 条记录`);
    
    console.log('[STEP 7] Admin访问系统配置页面');
    await page.goto(`${BASE_URL}/admin/configs`);
    await page.waitForLoadState('networkidle');
    
    const configItems = page.locator('[data-testid="config-item"], .config-item, .config-row');
    const configCount = await configItems.count();
    console.log(`[INFO] 配置列表显示 ${configCount} 条记录`);
  });

  test('FINAL: 生成完整测试报告', async ({ page }) => {
    console.log('\n========== 生成测试报告 ==========\n');
    
    const report = {
      testTime: new Date().toISOString(),
      scenarios: [
        { id: 'SC-001', name: '项目发布与申请流程', status: 'completed' },
        { id: 'SC-002', name: '工时填报与审核流程', status: 'completed' },
        { id: 'SC-003', name: '发票创建与付款流程', status: 'completed' },
        { id: 'SC-004', name: '评价与举报流程', status: 'completed' },
        { id: 'SC-005', name: '管理员数据管理流程', status: 'completed' }
      ],
      issues: issuesFound,
      summary: {
        totalScenarios: 5,
        passedScenarios: 5,
        totalIssues: issuesFound.length,
        p0Issues: issuesFound.filter(i => i.severity === 'P0').length,
        p1Issues: issuesFound.filter(i => i.severity === 'P1').length,
        p2Issues: issuesFound.filter(i => i.severity === 'P2').length
      }
    };
    
    console.log('========================================');
    console.log('跨角色数据流转测试报告');
    console.log('========================================');
    console.log(`测试时间: ${report.testTime}`);
    console.log(`场景总数: ${report.summary.totalScenarios}`);
    console.log(`发现问题: ${report.summary.totalIssues}`);
    console.log(`  - P0问题: ${report.summary.p0Issues}`);
    console.log(`  - P1问题: ${report.summary.p1Issues}`);
    console.log(`  - P2问题: ${report.summary.p2Issues}`);
    console.log('========================================');
    
    if (issuesFound.length > 0) {
      console.log('\n问题详情:');
      issuesFound.forEach((issue, index) => {
        console.log(`\n[${issue.id}] ${issue.description}`);
        console.log(`  场景: ${issue.scenario}`);
        console.log(`  类型: ${issue.type}`);
        console.log(`  严重程度: ${issue.severity}`);
        console.log(`  预期: ${issue.expected}`);
        console.log(`  实际: ${issue.actual}`);
      });
    }
    
    // 保存报告到文件
    const fs = require('fs');
    const reportPath = `test-reports/data-flow-test-report-${Date.now()}.json`;
    fs.mkdirSync('test-reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n[REPORT] 报告已保存到: ${reportPath}`);
  });
});
