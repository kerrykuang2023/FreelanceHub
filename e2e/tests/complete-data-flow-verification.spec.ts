import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface TestData {
  projectTitle: string;
  projectDescription: string;
  workHours: number;
  workDescription: string;
  invoiceAmount: number;
}

interface VerificationResult {
  step: string;
  expected: string;
  actual: string;
  passed: boolean;
  screenshot?: string;
  timestamp: string;
}

const testData: TestData = {
  projectTitle: `数据流转验证项目_${Date.now()}`,
  projectDescription: '这是一个用于验证完整数据流转的测试项目',
  workHours: 8,
  workDescription: '完成了核心功能开发和单元测试',
  invoiceAmount: 8000
};

const verificationResults: VerificationResult[] = [];

function recordResult(step: string, expected: string, actual: string, passed: boolean, screenshot?: string) {
  verificationResults.push({
    step,
    expected,
    actual,
    passed,
    screenshot,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] ${step}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual: ${actual}`);
  if (!passed) {
    console.log(`  ⚠️ DATA FLOW ISSUE DETECTED`);
  }
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const path = `screenshots/data-flow-${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function loginAs(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const loginSuccess = !currentUrl.includes('/login');
    
    if (loginSuccess) {
      const localStorage = await page.evaluate(() => {
        const token = window.localStorage.getItem('access_token');
        return { hasToken: !!token };
      });
      console.log(`  ✅ Login successful: ${email}, hasToken: ${localStorage.hasToken}`);
    } else {
      console.log(`  ❌ Login failed: ${email}, URL: ${currentUrl}`);
    }
    
    return loginSuccess;
  } catch (error) {
    console.log(`  ❌ Login error: ${email}, ${error}`);
    return false;
  }
}

async function logout(page: Page): Promise<void> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('Logout attempted');
  }
}

// Legacy flow audit: this file records failures without failing tests and still uses retired routes.
// Keep it skipped until it is replaced by deterministic API-seeded cross-role flow specs.
test.describe.skip('Complete Data Flow E2E Verification', () => {
  
  test.beforeAll(async () => {
    console.log('\n========================================');
    console.log('开始完整数据流转验证测试');
    console.log('========================================\n');
  });

  test.afterAll(async () => {
    console.log('\n========================================');
    console.log('数据流转验证测试完成');
    console.log('========================================\n');
    
    console.log('\n📊 验证结果汇总:');
    const passed = verificationResults.filter(r => r.passed).length;
    const failed = verificationResults.filter(r => !r.passed).length;
    console.log(`  通过: ${passed}`);
    console.log(`  失败: ${failed}`);
    console.log(`  通过率: ${((passed / verificationResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的验证步骤:');
      verificationResults.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.step}: ${r.actual}`);
      });
    }
  });

  test('FLOW-1: HR发布项目 → 验证项目创建和状态', async ({ page }) => {
    console.log('\n========== FLOW-1: HR发布项目 ==========\n');
    
    // Step 1: HR登录
    console.log('[STEP 1.1] HR登录系统');
    const hrLoggedIn = await loginAs(page, 'hr@test.com', 'Test123456!');
    recordResult(
      'FLOW-1.1: HR登录',
      '登录成功并跳转到首页',
      hrLoggedIn ? '登录成功' : '登录失败',
      hrLoggedIn
    );
    expect(hrLoggedIn).toBe(true);
    
    // Step 2: 访问项目发布页面
    console.log('[STEP 1.2] HR访问项目发布页面');
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    
    const postJobPageVisible = await page.locator('form, [data-testid="post-job-form"]').isVisible();
    const screenshot1 = await takeScreenshot(page, 'flow1-post-job-page');
    recordResult(
      'FLOW-1.2: 项目发布页面加载',
      '表单页面正常显示',
      postJobPageVisible ? '表单页面正常' : '表单页面异常',
      postJobPageVisible,
      screenshot1
    );
    
    // Step 3: 填写项目信息
    console.log('[STEP 1.3] HR填写项目信息');
    await page.fill('input[name="project_title"]', testData.projectTitle);
    await page.fill('textarea[name="project_description"]', testData.projectDescription);
    
    // 选择技能大类
    const majorCategoryBtn = page.locator('[data-testid^="major-category-btn"]').first();
    if (await majorCategoryBtn.isVisible()) {
      await majorCategoryBtn.click();
      console.log('  选择了技能大类');
    }
    
    // 选择技能小类
    await page.waitForTimeout(500);
    const subCategoryBtn = page.locator('[data-testid^="sub-category-btn"]').first();
    if (await subCategoryBtn.isVisible()) {
      await subCategoryBtn.click();
      console.log('  选择了技能小类');
    }
    
    const screenshot2 = await takeScreenshot(page, 'flow1-form-filled');
    recordResult(
      'FLOW-1.3: 填写项目信息',
      '项目信息填写完成',
      '项目信息已填写',
      true,
      screenshot2
    );
    
    // Step 4: 提交项目
    console.log('[STEP 1.4] HR提交项目');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const projectCreated = currentUrl.includes('/my-jobs') || currentUrl.includes('/jobs');
    const screenshot3 = await takeScreenshot(page, 'flow1-after-submit');
    recordResult(
      'FLOW-1.4: 项目提交后跳转',
      '跳转到我的项目页面',
      `当前URL: ${currentUrl}`,
      projectCreated,
      screenshot3
    );
    
    // Step 5: 验证项目出现在HR的项目列表
    console.log('[STEP 1.5] HR验证项目列表');
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    
    const projectInList = await page.locator(`text=${testData.projectTitle}`).isVisible();
    const screenshot4 = await takeScreenshot(page, 'flow1-my-jobs-list');
    recordResult(
      'FLOW-1.5: 新项目在HR列表中显示',
      '项目出现在列表中',
      projectInList ? '项目已显示' : '项目未显示',
      projectInList,
      screenshot4
    );
  });

  test('FLOW-2: 顾问浏览项目 → 验证数据流转到顾问视角', async ({ page }) => {
    console.log('\n========== FLOW-2: 顾问浏览项目 ==========\n');
    
    // Step 1: 顾问登录
    console.log('[STEP 2.1] 顾问登录系统');
    const freelancerLoggedIn = await loginAs(page, 'freelancer@test.com', 'Test123456!');
    recordResult(
      'FLOW-2.1: 顾问登录',
      '登录成功',
      freelancerLoggedIn ? '登录成功' : '登录失败',
      freelancerLoggedIn
    );
    expect(freelancerLoggedIn).toBe(true);
    
    // Step 2: 访问项目列表
    console.log('[STEP 2.2] 顾问访问项目列表');
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    
    const jobCards = page.locator('[data-testid="job-card"], .job-card, .project-card');
    const jobCount = await jobCards.count();
    const screenshot1 = await takeScreenshot(page, 'flow2-jobs-list');
    
    recordResult(
      'FLOW-2.2: 项目列表显示',
      '显示至少1个项目',
      `显示${jobCount}个项目`,
      jobCount > 0,
      screenshot1
    );
    
    // Step 3: 验证HR发布的项目是否可见
    console.log('[STEP 2.3] 验证HR发布的项目是否可见');
    const projectVisible = await page.locator(`text=${testData.projectTitle}`).isVisible();
    const screenshot2 = await takeScreenshot(page, 'flow2-project-visible');
    
    recordResult(
      'FLOW-2.3: HR发布的项目在顾问视角可见',
      '项目可见',
      projectVisible ? '项目可见' : '项目不可见 - 数据流转问题',
      projectVisible,
      screenshot2
    );
    
    // Step 4: 查看项目详情
    if (jobCount > 0) {
      console.log('[STEP 2.4] 顾问查看项目详情');
      await jobCards.first().click();
      await page.waitForLoadState('networkidle');
      
      const applyBtn = page.locator('button:has-text("申请"), button:has-text("Apply"), [data-testid="apply-btn"]');
      const applyBtnVisible = await applyBtn.isVisible();
      const screenshot3 = await takeScreenshot(page, 'flow2-job-detail');
      
      recordResult(
        'FLOW-2.4: 项目详情页显示申请按钮',
        '申请按钮可见',
        applyBtnVisible ? '申请按钮可见' : '申请按钮不可见',
        applyBtnVisible,
        screenshot3
      );
      
      // Step 5: 申请项目
      if (applyBtnVisible) {
        console.log('[STEP 2.5] 顾问申请项目');
        await applyBtn.click();
        await page.waitForTimeout(2000);
        
        const screenshot4 = await takeScreenshot(page, 'flow2-after-apply');
        recordResult(
          'FLOW-2.5: 项目申请提交',
          '申请成功',
          '申请已提交',
          true,
          screenshot4
        );
      }
    }
  });

  test('FLOW-3: HR审核申请 → 验证申请数据流转', async ({ page }) => {
    console.log('\n========== FLOW-3: HR审核申请 ==========\n');
    
    // Step 1: HR登录
    console.log('[STEP 3.1] HR登录系统');
    const hrLoggedIn = await loginAs(page, 'hr@test.com', 'Test123456!');
    recordResult(
      'FLOW-3.1: HR登录',
      '登录成功',
      hrLoggedIn ? '登录成功' : '登录失败',
      hrLoggedIn
    );
    
    // Step 2: 访问申请管理页面
    console.log('[STEP 3.2] HR访问申请管理页面');
    await page.goto(`${BASE_URL}/applications-management`);
    await page.waitForLoadState('networkidle');
    
    const applicationItems = page.locator('[data-testid="application-item"], .application-item, .application-card');
    const appCount = await applicationItems.count();
    const screenshot1 = await takeScreenshot(page, 'flow3-applications-list');
    
    recordResult(
      'FLOW-3.2: 申请列表显示',
      '显示至少1条申请',
      `显示${appCount}条申请`,
      appCount > 0,
      screenshot1
    );
    
    // Step 3: 验证顾问的申请是否可见
    console.log('[STEP 3.3] 验证顾问的申请是否可见');
    const applicationVisible = appCount > 0;
    recordResult(
      'FLOW-3.3: 顾问申请在HR视角可见',
      '申请可见',
      applicationVisible ? '申请可见' : '申请不可见 - 数据流转问题',
      applicationVisible
    );
    
    // Step 4: 接受申请
    if (appCount > 0) {
      console.log('[STEP 3.4] HR接受申请');
      await applicationItems.first().click();
      await page.waitForLoadState('networkidle');
      
      const acceptBtn = page.locator('button:has-text("接受"), button:has-text("录用"), button:has-text("Accept"), [data-testid="accept-btn"]');
      const acceptBtnVisible = await acceptBtn.isVisible();
      
      if (acceptBtnVisible) {
        await acceptBtn.click();
        await page.waitForTimeout(2000);
        
        const screenshot2 = await takeScreenshot(page, 'flow3-after-accept');
        recordResult(
          'FLOW-3.4: 申请接受成功',
          '申请状态变更为已接受',
          '申请已接受',
          true,
          screenshot2
        );
      } else {
        recordResult(
          'FLOW-3.4: 接受按钮可见',
          '接受按钮可见',
          '接受按钮不可见',
          false
        );
      }
    }
  });

  test('FLOW-4: 顾问填报工时 → 验证工时数据流转', async ({ page }) => {
    console.log('\n========== FLOW-4: 顾问填报工时 ==========\n');
    
    // Step 1: 顾问登录
    console.log('[STEP 4.1] 顾问登录系统');
    const freelancerLoggedIn = await loginAs(page, 'freelancer@test.com', 'Test123456!');
    recordResult(
      'FLOW-4.1: 顾问登录',
      '登录成功',
      freelancerLoggedIn ? '登录成功' : '登录失败',
      freelancerLoggedIn
    );
    
    // Step 2: 访问工时填报页面
    console.log('[STEP 4.2] 顾问访问工时填报页面');
    await page.goto(`${BASE_URL}/work-logs/create`);
    await page.waitForLoadState('networkidle');
    
    const screenshot1 = await takeScreenshot(page, 'flow4-worklog-form');
    
    // Step 3: 检查项目选择器
    console.log('[STEP 4.3] 检查项目选择器');
    const projectSelect = page.locator('select[name="project_requirement_id"], select[name="project_id"]');
    const projectSelectVisible = await projectSelect.isVisible();
    
    recordResult(
      'FLOW-4.3: 工时表单项目选择器',
      '项目选择器可见',
      projectSelectVisible ? '项目选择器可见' : '项目选择器不可见',
      projectSelectVisible,
      screenshot1
    );
    
    if (projectSelectVisible) {
      const options = await projectSelect.locator('option').count();
      const hasProjects = options > 1;
      
      recordResult(
        'FLOW-4.3.1: 项目选择器有可选项目',
        '至少有1个可选项目',
        `有${options - 1}个可选项目`,
        hasProjects
      );
      
      if (hasProjects) {
        await projectSelect.selectOption({ index: 1 });
        
        // 填写工时信息
        await page.fill('input[name="hours_worked"]', String(testData.workHours));
        await page.fill('textarea[name="work_description"]', testData.workDescription);
        
        // 提交工时
        console.log('[STEP 4.4] 顾问提交工时');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        const screenshot2 = await takeScreenshot(page, 'flow4-after-submit');
        recordResult(
          'FLOW-4.4: 工时提交成功',
          '工时提交成功',
          '工时已提交',
          true,
          screenshot2
        );
      }
    }
  });

  test('FLOW-5: HR审核工时 → 验证工时审核流转', async ({ page }) => {
    console.log('\n========== FLOW-5: HR审核工时 ==========\n');
    
    // Step 1: HR登录
    console.log('[STEP 5.1] HR登录系统');
    const hrLoggedIn = await loginAs(page, 'hr@test.com', 'Test123456!');
    recordResult(
      'FLOW-5.1: HR登录',
      '登录成功',
      hrLoggedIn ? '登录成功' : '登录失败',
      hrLoggedIn
    );
    
    // Step 2: 访问工时审核页面
    console.log('[STEP 5.2] HR访问工时审核页面');
    await page.goto(`${BASE_URL}/hr-work-logs`);
    await page.waitForLoadState('networkidle');
    
    const workLogItems = page.locator('[data-testid="worklog-item"], .worklog-item, .work-log-card');
    const workLogCount = await workLogItems.count();
    const screenshot1 = await takeScreenshot(page, 'flow5-hr-worklogs-list');
    
    recordResult(
      'FLOW-5.2: HR工时列表显示',
      '显示至少1条工时',
      `显示${workLogCount}条工时`,
      workLogCount > 0,
      screenshot1
    );
    
    // Step 3: 验证顾问工时是否可见
    console.log('[STEP 5.3] 验证顾问工时是否可见');
    const workLogVisible = workLogCount > 0;
    recordResult(
      'FLOW-5.3: 顾问工时在HR视角可见',
      '工时可见',
      workLogVisible ? '工时可见' : '工时不可见 - 数据流转问题',
      workLogVisible
    );
    
    // Step 4: 确认工时
    if (workLogCount > 0) {
      console.log('[STEP 5.4] HR确认工时');
      await workLogItems.first().click();
      await page.waitForLoadState('networkidle');
      
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("通过"), [data-testid="confirm-btn"]');
      const confirmBtnVisible = await confirmBtn.isVisible();
      
      recordResult(
        'FLOW-5.4: 工时确认按钮可见',
        '确认按钮可见',
        confirmBtnVisible ? '确认按钮可见' : '确认按钮不可见',
        confirmBtnVisible
      );
      
      if (confirmBtnVisible) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        
        const screenshot2 = await takeScreenshot(page, 'flow5-after-confirm');
        recordResult(
          'FLOW-5.5: 工时确认成功',
          '工时状态变更为已确认',
          '工时已确认',
          true,
          screenshot2
        );
      }
    }
  });

  test('FLOW-6: 顾问创建发票 → 验证发票数据流转', async ({ page }) => {
    console.log('\n========== FLOW-6: 顾问创建发票 ==========\n');
    
    // Step 1: 顾问登录
    console.log('[STEP 6.1] 顾问登录系统');
    const freelancerLoggedIn = await loginAs(page, 'freelancer@test.com', 'Test123456!');
    recordResult(
      'FLOW-6.1: 顾问登录',
      '登录成功',
      freelancerLoggedIn ? '登录成功' : '登录失败',
      freelancerLoggedIn
    );
    
    // Step 2: 访问发票创建页面
    console.log('[STEP 6.2] 顾问访问发票创建页面');
    await page.goto(`${BASE_URL}/invoices/create`);
    await page.waitForLoadState('networkidle');
    
    const screenshot1 = await takeScreenshot(page, 'flow6-invoice-form');
    
    // Step 3: 填写发票信息
    const amountInput = page.locator('input[name="total_amount"], input[name="amount"]');
    if (await amountInput.isVisible()) {
      await amountInput.fill(String(testData.invoiceAmount));
      
      console.log('[STEP 6.3] 顾问提交发票');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      const screenshot2 = await takeScreenshot(page, 'flow6-after-submit');
      recordResult(
        'FLOW-6.3: 发票提交成功',
        '发票提交成功',
        '发票已提交',
        true,
        screenshot2
      );
    }
  });

  test('FLOW-7: HR审核发票 → 验证发票审核流转', async ({ page }) => {
    console.log('\n========== FLOW-7: HR审核发票 ==========\n');
    
    // Step 1: HR登录
    console.log('[STEP 7.1] HR登录系统');
    const hrLoggedIn = await loginAs(page, 'hr@test.com', 'Test123456!');
    recordResult(
      'FLOW-7.1: HR登录',
      '登录成功',
      hrLoggedIn ? '登录成功' : '登录失败',
      hrLoggedIn
    );
    
    // Step 2: 访问发票列表
    console.log('[STEP 7.2] HR访问发票列表');
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    const invoiceItems = page.locator('[data-testid="invoice-item"], .invoice-item, .invoice-card');
    const invoiceCount = await invoiceItems.count();
    const screenshot1 = await takeScreenshot(page, 'flow7-hr-invoices-list');
    
    recordResult(
      'FLOW-7.2: HR发票列表显示',
      '显示至少1条发票',
      `显示${invoiceCount}条发票`,
      invoiceCount > 0,
      screenshot1
    );
    
    // Step 3: 验证顾问发票是否可见
    const invoiceVisible = invoiceCount > 0;
    recordResult(
      'FLOW-7.3: 顾问发票在HR视角可见',
      '发票可见',
      invoiceVisible ? '发票可见' : '发票不可见 - 数据流转问题',
      invoiceVisible
    );
  });

  test('FINAL: 生成完整验证报告', async ({ page }) => {
    console.log('\n========== 生成完整验证报告 ==========\n');
    
    const report = {
      testTime: new Date().toISOString(),
      testData,
      verificationResults,
      summary: {
        total: verificationResults.length,
        passed: verificationResults.filter(r => r.passed).length,
        failed: verificationResults.filter(r => !r.passed).length,
        passRate: ((verificationResults.filter(r => r.passed).length / verificationResults.length) * 100).toFixed(1) + '%'
      },
      dataFlowIssues: verificationResults.filter(r => !r.passed).map(r => ({
        step: r.step,
        expected: r.expected,
        actual: r.actual,
        screenshot: r.screenshot
      }))
    };
    
    console.log('\n========================================');
    console.log('完整数据流转验证报告');
    console.log('========================================');
    console.log(`测试时间: ${report.testTime}`);
    console.log(`验证步骤: ${report.summary.total}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`通过率: ${report.summary.passRate}`);
    console.log('========================================');
    
    if (report.dataFlowIssues.length > 0) {
      console.log('\n⚠️ 发现的数据流转问题:');
      report.dataFlowIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.step}`);
        console.log(`   预期: ${issue.expected}`);
        console.log(`   实际: ${issue.actual}`);
        if (issue.screenshot) {
          console.log(`   截图: ${issue.screenshot}`);
        }
      });
    }
    
    // 保存报告
    const fs = require('fs');
    const reportPath = `test-reports/data-flow-verification-report-${Date.now()}.json`;
    fs.mkdirSync('test-reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 报告已保存: ${reportPath}`);
  });
});
