import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';
const SCREENSHOT_DIR = './e2e-test-screenshots/business-flow';

interface TestUser {
  email: string;
  password: string;
  role: string;
  roleDisplayName: string;
}

interface FlowStep {
  step: number;
  action: string;
  description: string;
  screenshot?: string;
  success: boolean;
  timestamp: string;
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

const flowSteps: FlowStep[] = [];
let stepCounter = 0;

function logStep(action: string, description: string, success: boolean = true): FlowStep {
  stepCounter++;
  const step: FlowStep = {
    step: stepCounter,
    action,
    description,
    success,
    timestamp: new Date().toISOString(),
  };
  flowSteps.push(step);
  
  const status = success ? '✅' : '❌';
  console.log(`\n${status} [步骤 ${step.step}] ${action}`);
  console.log(`   描述: ${description}`);
  console.log(`   时间: ${step.timestamp}`);
  
  return step;
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${SCREENSHOT_DIR}/${timestamp}-${name}.png`;
  try {
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`   📷 截图已保存: ${filename}`);
    return filename;
  } catch (e) {
    console.log(`   ⚠️ 截图失败: ${e}`);
    return '';
  }
}

async function clickButton(page: Page, selector: string, buttonName: string): Promise<boolean> {
  console.log(`\n   🔘 准备点击按钮: ${buttonName}`);
  console.log(`   选择器: ${selector}`);
  
  try {
    const button = page.locator(selector).first();
    await button.waitFor({ state: 'visible', timeout: 8000 });
    
    const isDisabled = await button.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log(`   ⚠️ 按钮被禁用: ${buttonName}`);
      logStep(`点击按钮: ${buttonName}`, `按钮被禁用，无法点击`, false);
      return false;
    }
    
    await button.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    await button.hover();
    await page.waitForTimeout(300);
    
    console.log(`   👆 执行点击操作...`);
    await button.click({ force: false, timeout: 5000 });
    await page.waitForTimeout(500);
    
    logStep(`点击按钮: ${buttonName}`, `成功点击按钮，选择器: ${selector}`, true);
    return true;
  } catch (e) {
    console.log(`   ❌ 点击失败: ${e}`);
    logStep(`点击按钮: ${buttonName}`, `点击失败: ${e}`, false);
    return false;
  }
}

async function fillInput(page: Page, selector: string, value: string, fieldName: string): Promise<boolean> {
  console.log(`\n   ⌨️ 准备填写输入框: ${fieldName}`);
  console.log(`   选择器: ${selector}`);
  console.log(`   值: ${value}`);
  
  try {
    const input = page.locator(selector).first();
    await input.waitFor({ state: 'visible', timeout: 8000 });
    
    await input.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    await input.click();
    await page.waitForTimeout(100);
    
    await input.fill('');
    await page.waitForTimeout(100);
    
    console.log(`   ✏️ 输入值: ${value}`);
    await input.fill(value);
    await page.waitForTimeout(200);
    
    const actualValue = await input.inputValue();
    console.log(`   ✅ 实际输入值: ${actualValue}`);
    
    logStep(`填写输入框: ${fieldName}`, `成功填写值: ${value}`, true);
    return true;
  } catch (e) {
    console.log(`   ❌ 填写失败: ${e}`);
    logStep(`填写输入框: ${fieldName}`, `填写失败: ${e}`, false);
    return false;
  }
}

async function selectOption(page: Page, selector: string, value: string, fieldName: string): Promise<boolean> {
  console.log(`\n   📋 准备选择下拉框: ${fieldName}`);
  console.log(`   选择器: ${selector}`);
  console.log(`   值: ${value}`);
  
  try {
    const select = page.locator(selector).first();
    await select.waitFor({ state: 'visible', timeout: 5000 });
    
    if (value === 'first') {
      await select.selectOption({ index: 1 });
    } else {
      await select.selectOption(value);
    }
    await page.waitForTimeout(200);
    
    logStep(`选择下拉框: ${fieldName}`, `成功选择值: ${value}`, true);
    return true;
  } catch (e) {
    logStep(`选择下拉框: ${fieldName}`, `选择失败: ${e}`, false);
    return false;
  }
}

async function loginAsUser(page: Page, user: TestUser): Promise<boolean> {
  console.log('\n' + '='.repeat(80));
  console.log(`🔐 登录操作 - 用户: ${user.roleDisplayName}`);
  console.log(`   邮箱: ${user.email}`);
  console.log('='.repeat(80));
  
  logStep('开始登录', `用户: ${user.roleDisplayName} (${user.email})`);
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await takeScreenshot(page, `login-page-${user.role}`);
  
  console.log('\n   🔍 查找邮箱输入框...');
  const emailInput = page.locator('[data-testid="email-input"]').first();
  
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    console.log('   ✅ 邮箱输入框已找到');
  } catch (e) {
    console.log('   ❌ 邮箱输入框等待超时，尝试备用选择器...');
    const altEmailInput = page.locator('input[name="email"]').first();
    try {
      await altEmailInput.waitFor({ state: 'visible', timeout: 5000 });
      console.log('   ✅ 备用邮箱输入框已找到');
    } catch (e2) {
      logStep('登录失败', `邮箱输入框不可见: ${e2}`, false);
      await takeScreenshot(page, `login-error-${user.role}`);
      return false;
    }
  }
  
  console.log('\n   ⌨️ 填写登录表单...');
  
  await fillInput(page, '[data-testid="email-input"]', user.email, '邮箱');
  await page.waitForTimeout(300);
  
  await fillInput(page, '[data-testid="password-input"]', user.password, '密码');
  await page.waitForTimeout(300);
  
  await takeScreenshot(page, `login-filled-${user.role}`);
  
  console.log('\n   🔘 点击登录按钮...');
  await clickButton(page, '[data-testid="login-submit-btn"]', '登录按钮');
  
  console.log('   ⏳ 等待登录响应...');
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login');
  
  if (isLoggedIn) {
    logStep('登录成功', `已跳转到: ${currentUrl}`);
    await takeScreenshot(page, `login-success-${user.role}`);
    return true;
  } else {
    const errorMsg = await page.locator('[class*="error"], [class*="alert"]').textContent().catch(() => '');
    logStep('登录失败', `仍停留在登录页面: ${currentUrl}, 错误信息: ${errorMsg}`, false);
    await takeScreenshot(page, `login-failed-${user.role}`);
    return false;
  }
}

async function logoutUser(page: Page): Promise<void> {
  console.log('\n' + '-'.repeat(40));
  console.log('🚪 登出操作');
  console.log('-'.repeat(40));
  
  logStep('开始登出', '准备退出当前用户');
  
  try {
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    logStep('登出成功', '已清除cookies并导航到登录页面');
  } catch (error) {
    logStep('登出异常', `${error}`, false);
  }
}

test.describe('跨角色业务流程显式测试', () => {
  test.setTimeout(120000);
  
  test.afterAll(async () => {
    const fs = require('fs');
    const reportPath = `./e2e-test-results/business-flow-report-${Date.now()}.json`;
    if (!fs.existsSync('./e2e-test-results')) {
      fs.mkdirSync('./e2e-test-results', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      testRun: {
        startTime: new Date().toISOString(),
        baseUrl: BASE_URL,
        apiUrl: API_URL,
      },
      flowSteps,
      summary: {
        totalSteps: flowSteps.length,
        successSteps: flowSteps.filter(s => s.success).length,
        failedSteps: flowSteps.filter(s => !s.success).length,
      },
    }, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 跨角色业务流程测试报告');
    console.log('='.repeat(80));
    console.log(`总步骤数: ${flowSteps.length}`);
    console.log(`成功步骤: ${flowSteps.filter(s => s.success).length}`);
    console.log(`失败步骤: ${flowSteps.filter(s => !s.success).length}`);
    console.log('='.repeat(80));
    console.log(`报告文件: ${reportPath}`);
    console.log('='.repeat(80));
  });

  test('流程一: HR创建项目 → 顾问申请 → HR审批', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('📋 流程一: HR创建项目 → 顾问申请 → HR审批');
    console.log('═'.repeat(80));
    
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    
    console.log('\n📍 步骤1: HR登录');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: HR访问发布项目页面');
    logStep('导航到发布项目页面', '准备发布新项目');
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow1-hr-post-job-page');
    
    console.log('\n📍 步骤3: HR填写项目信息');
    
    const projectTitle = `E2E测试项目_${Date.now()}`;
    
    await fillInput(page, 'input[name="project_title"], input[name="title"]', projectTitle, '项目标题');
    
    const descTextarea = page.locator('textarea[name="project_description"], textarea[name="description"]').first();
    if (await descTextarea.count() > 0) {
      await fillInput(page, 'textarea[name="project_description"], textarea[name="description"]', '这是一个E2E自动化测试创建的项目，用于验证跨角色业务流程。', '项目描述');
    }
    
    const majorCategorySelect = page.locator('select[name="project_major_categories"], select[name="major_category"]').first();
    if (await majorCategorySelect.count() > 0) {
      await selectOption(page, 'select[name="project_major_categories"], select[name="major_category"]', 'first', '技能大类');
    }
    
    const subCategorySelect = page.locator('select[name="project_sub_categories"], select[name="sub_category"]').first();
    if (await subCategorySelect.count() > 0) {
      await selectOption(page, 'select[name="project_sub_categories"], select[name="sub_category"]', 'first', '技能子类');
    }
    
    await takeScreenshot(page, 'flow1-hr-post-job-filled');
    
    console.log('\n📍 步骤4: HR提交项目');
    
    await clickButton(page, 'button[type="submit"]', '发布项目按钮');
    
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'flow1-hr-post-job-submitted');
    
    logStep('项目创建', `项目标题: ${projectTitle}`);
    
    console.log('\n📍 步骤5: HR登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤6: 顾问登录');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤7: 顾问浏览项目列表');
    logStep('导航到项目列表页面', '准备浏览可申请的项目');
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow1-freelancer-jobs-list');
    
    const jobCards = await page.locator('[class*="job-card"], [class*="project-card"], article').count();
    console.log(`   📊 找到 ${jobCards} 个项目`);
    
    console.log('\n📍 步骤8: 顾问查看项目详情');
    
    const jobLinks = page.locator('a[href*="/jobs/"], a[href*="/project/"]');
    const jobLinkCount = await jobLinks.count();
    
    if (jobLinkCount > 0) {
      await jobLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'flow1-freelancer-job-detail');
      
      logStep('查看项目详情', '已打开项目详情页面');
      
      console.log('\n📍 步骤9: 顾问申请项目');
      
      const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply"), a:has-text("申请")').first();
      if (await applyButton.count() > 0) {
        const isDisabled = await applyButton.isDisabled();
        
        if (!isDisabled) {
          await clickButton(page, 'button:has-text("申请"), button:has-text("Apply")', '申请项目按钮');
          
          await page.waitForTimeout(2000);
          await takeScreenshot(page, 'flow1-freelancer-apply-submitted');
          
          logStep('申请项目', '已提交项目申请');
        } else {
          logStep('申请项目', '项目已申请过，按钮被禁用', false);
        }
      }
    } else {
      logStep('浏览项目', '项目列表为空', false);
    }
    
    console.log('\n📍 步骤10: 顾问登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤11: HR登录审批');
    const hrLoggedIn2 = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn2).toBe(true);
    
    console.log('\n📍 步骤12: HR查看申请列表');
    logStep('导航到申请管理页面', '准备审批顾问申请');
    
    await page.goto(`${BASE_URL}/applications`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow1-hr-applications-list');
    
    console.log('\n📍 步骤13: HR审批申请');
    
    const approveButton = page.locator('button:has-text("批准"), button:has-text("通过"), button:has-text("Approve")').first();
    if (await approveButton.count() > 0) {
      await clickButton(page, 'button:has-text("批准"), button:has-text("通过")', '批准申请按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow1-hr-application-approved');
      
      logStep('审批申请', '已批准顾问申请');
    } else {
      logStep('审批申请', '未找到待审批的申请', false);
    }
  });

  test('流程二: 顾问填报工时 → HR审核', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('⏱️ 流程二: 顾问填报工时 → HR审核');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: 顾问登录');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: 顾问访问工时管理页面');
    logStep('导航到工时管理页面', '准备查看工时记录');
    
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow2-freelancer-worklogs-list');
    
    console.log('\n📍 步骤3: 顾问点击创建工时');
    
    await clickButton(page, 'a[href="/work-logs/new"], button:has-text("填报工时")', '填报工时按钮');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow2-freelancer-create-worklog-page');
    
    console.log('\n📍 步骤4: 顾问填写工时表单');
    
    const projectSelect = page.locator('select#project_requirement_id, select[name="project_requirement_id"]').first();
    if (await projectSelect.count() > 0) {
      await selectOption(page, 'select#project_requirement_id, select[name="project_requirement_id"]', 'first', '项目选择');
    }
    
    const dateInput = page.locator('input#work_date, input[name="work_date"]').first();
    if (await dateInput.count() > 0) {
      const today = new Date().toISOString().split('T')[0];
      await fillInput(page, 'input#work_date, input[name="work_date"]', today, '工作日期');
    }
    
    const hoursInput = page.locator('input#hours_worked, input[name="hours_worked"]').first();
    if (await hoursInput.count() > 0) {
      await fillInput(page, 'input#hours_worked, input[name="hours_worked"]', '8', '工作时长');
    }
    
    const workTypeSelect = page.locator('select[name="work_type"], #work_type').first();
    if (await workTypeSelect.count() > 0) {
      await selectOption(page, 'select[name="work_type"], #work_type', 'first', '工作类型');
    }
    
    const descInput = page.locator('textarea#work_description, textarea[name="work_description"]').first();
    if (await descInput.count() > 0) {
      await fillInput(page, 'textarea#work_description, textarea[name="work_description"]', 'E2E测试工时记录 - 完成模块开发和测试工作', '工作描述');
    }
    
    await takeScreenshot(page, 'flow2-freelancer-worklog-filled');
    
    console.log('\n📍 步骤5: 顾问提交工时');
    
    await clickButton(page, 'button[type="submit"]', '提交工时按钮');
    
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'flow2-freelancer-worklog-submitted');
    
    logStep('提交工时', '工时记录已提交');
    
    console.log('\n📍 步骤6: 顾问登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤7: HR登录审核');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    console.log('\n📍 步骤8: HR访问待审核工时页面');
    logStep('导航到待审核工时页面', '准备审核顾问提交的工时');
    
    await page.goto(`${BASE_URL}/company/work-logs/pending`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow2-hr-pending-worklogs');
    
    console.log('\n📍 步骤9: HR审核工时');
    
    const confirmButton = page.locator('button[title="确认"], button:has-text("确认")').first();
    if (await confirmButton.count() > 0) {
      await clickButton(page, 'button[title="确认"], button:has-text("确认")', '确认工时按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow2-hr-worklog-confirmed');
      
      logStep('审核工时', '工时已确认');
    } else {
      const tableRows = await page.locator('table tbody tr').count();
      if (tableRows === 0) {
        logStep('审核工时', '没有待审核的工时记录', false);
      }
    }
  });

  test('流程三: 顾问创建发票 → HR审核', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('📄 流程三: 顾问创建发票 → HR审核');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: 顾问登录');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: 顾问访问发票管理页面');
    logStep('导航到发票管理页面', '准备查看发票记录');
    
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow3-freelancer-invoices-list');
    
    console.log('\n📍 步骤3: 顾问点击创建发票');
    
    await clickButton(page, 'a[href="/invoices/new"], button:has-text("创建发票")', '创建发票按钮');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow3-freelancer-create-invoice-page');
    
    console.log('\n📍 步骤4: 顾问填写发票表单');
    
    const companySelect = page.locator('select[name="company_id"], select[id*="company"]').first();
    if (await companySelect.count() > 0) {
      await selectOption(page, 'select[name="company_id"], select[id*="company"]', 'first', '公司选择');
    }
    
    const invoiceTypeSelect = page.locator('select[name="invoice_type"], select[id*="invoice-type"]').first();
    if (await invoiceTypeSelect.count() > 0) {
      await selectOption(page, 'select[name="invoice_type"], select[id*="invoice-type"]', 'first', '发票类型');
    }
    
    await takeScreenshot(page, 'flow3-freelancer-invoice-filled');
    
    console.log('\n📍 步骤5: 顾问提交发票');
    
    await clickButton(page, 'button[type="submit"], button:has-text("保存")', '保存发票按钮');
    
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'flow3-freelancer-invoice-submitted');
    
    logStep('提交发票', '发票已创建');
    
    console.log('\n📍 步骤6: 顾问登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤7: HR登录审核');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    console.log('\n📍 步骤8: HR访问发票审核页面');
    logStep('导航到发票审核页面', '准备审核顾问提交的发票');
    
    await page.goto(`${BASE_URL}/company/invoices/review`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow3-hr-invoices-review');
    
    console.log('\n📍 步骤9: HR审核发票');
    
    const approveButton = page.locator('button:has-text("审核"), button:has-text("批准")').first();
    if (await approveButton.count() > 0) {
      await clickButton(page, 'button:has-text("审核"), button:has-text("批准")', '审核发票按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow3-hr-invoice-approved');
      
      logStep('审核发票', '发票已审核');
    } else {
      logStep('审核发票', '没有待审核的发票', false);
    }
  });

  test('流程四: HR确认付款 → 顾问确认收款', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('💰 流程四: HR确认付款 → 顾问确认收款');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: HR登录');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: HR访问付款页面');
    logStep('导航到付款页面', '准备确认付款');
    
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow4-hr-payments-page');
    
    console.log('\n📍 步骤3: HR确认付款');
    
    const payButton = page.locator('button:has-text("付款"), button:has-text("确认付款")').first();
    if (await payButton.count() > 0) {
      await clickButton(page, 'button:has-text("付款"), button:has-text("确认付款")', '确认付款按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow4-hr-payment-confirmed');
      
      logStep('确认付款', '付款已确认');
    } else {
      logStep('确认付款', '没有待付款的发票', false);
    }
    
    console.log('\n📍 步骤4: HR登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤5: 顾问登录确认收款');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤6: 顾问访问发票页面确认收款');
    logStep('导航到发票页面', '准备确认收款');
    
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow4-freelancer-invoices');
    
    console.log('\n📍 步骤7: 顾问确认收款');
    
    const confirmReceiptButton = page.locator('button:has-text("确认收款"), button:has-text("已收款")').first();
    if (await confirmReceiptButton.count() > 0) {
      await clickButton(page, 'button:has-text("确认收款"), button:has-text("已收款")', '确认收款按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow4-freelancer-receipt-confirmed');
      
      logStep('确认收款', '收款已确认');
    } else {
      logStep('确认收款', '没有待确认收款的发票', false);
    }
  });

  test('流程五: 项目完成后双方互评', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('⭐ 流程五: 项目完成后双方互评');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: HR登录评价顾问');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: HR访问评价页面');
    logStep('导航到评价页面', '准备评价顾问');
    
    await page.goto(`${BASE_URL}/ratings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow5-hr-ratings-page');
    
    console.log('\n📍 步骤3: HR创建评价');
    
    const createRatingButton = page.locator('button:has-text("评价"), button:has-text("写评价")').first();
    if (await createRatingButton.count() > 0) {
      await clickButton(page, 'button:has-text("评价"), button:has-text("写评价")', '创建评价按钮');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'flow5-hr-create-rating-page');
      
      const starRating = page.locator('[class*="star"], [data-testid="rating"]').first();
      if (await starRating.count() > 0) {
        await clickButton(page, '[class*="star"], [data-testid="rating"]', '评分星级');
      }
      
      const commentInput = page.locator('textarea[name="comment"], textarea[name="review"]').first();
      if (await commentInput.count() > 0) {
        await fillInput(page, 'textarea[name="comment"], textarea[name="review"]', 'E2E测试评价 - 顾问工作认真负责，技术能力强', '评价内容');
      }
      
      await clickButton(page, 'button[type="submit"]', '提交评价按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow5-hr-rating-submitted');
      
      logStep('提交评价', 'HR评价已提交');
    } else {
      logStep('创建评价', '没有可评价的项目', false);
    }
    
    console.log('\n📍 步骤4: HR登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤5: 顾问登录评价企业');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤6: 顾问访问评价页面');
    logStep('导航到评价页面', '准备评价企业');
    
    await page.goto(`${BASE_URL}/ratings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow5-freelancer-ratings-page');
    
    console.log('\n📍 步骤7: 顾问创建评价');
    
    const createRatingButton2 = page.locator('button:has-text("评价"), button:has-text("写评价")').first();
    if (await createRatingButton2.count() > 0) {
      await clickButton(page, 'button:has-text("评价"), button:has-text("写评价")', '创建评价按钮');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'flow5-freelancer-create-rating-page');
      
      await clickButton(page, 'button[type="submit"]', '提交评价按钮');
      
      await page.waitForTimeout(2000);
      
      logStep('提交评价', '顾问评价已提交');
    } else {
      logStep('创建评价', '没有可评价的项目', false);
    }
  });

  test('流程六: 用户举报处理', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('🚨 流程六: 用户举报处理');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: 顾问登录提交举报');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    console.log('\n📍 步骤2: 顾问访问举报页面');
    logStep('导航到举报页面', '准备提交举报');
    
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow6-freelancer-reports-page');
    
    console.log('\n📍 步骤3: 顾问创建举报');
    
    const createReportButton = page.locator('button:has-text("举报"), button:has-text("提交举报")').first();
    if (await createReportButton.count() > 0) {
      await clickButton(page, 'button:has-text("举报"), button:has-text("提交举报")', '创建举报按钮');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'flow6-freelancer-create-report-page');
      
      const reportTypeSelect = page.locator('select[name="type"], select[id*="report-type"]').first();
      if (await reportTypeSelect.count() > 0) {
        await selectOption(page, 'select[name="type"], select[id*="report-type"]', 'first', '举报类型');
      }
      
      const descInput = page.locator('textarea[name="description"], textarea[name="reason"]').first();
      if (await descInput.count() > 0) {
        await fillInput(page, 'textarea[name="description"], textarea[name="reason"]', 'E2E测试举报 - 测试举报功能是否正常工作', '举报描述');
      }
      
      await clickButton(page, 'button[type="submit"]', '提交举报按钮');
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'flow6-freelancer-report-submitted');
      
      logStep('提交举报', '举报已提交');
    } else {
      logStep('创建举报', '没有举报入口', false);
    }
    
    console.log('\n📍 步骤4: 顾问登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤5: 管理员登录处理举报');
    const adminLoggedIn = await loginAsUser(page, TEST_USERS.admin);
    expect(adminLoggedIn).toBe(true);
    
    console.log('\n📍 步骤6: 管理员访问举报管理页面');
    logStep('导航到举报管理页面', '准备处理举报');
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow6-admin-dashboard');
    
    console.log('\n📍 步骤7: 管理员处理举报');
    
    const reportsTab = page.locator('button:has-text("举报")');
    if (await reportsTab.count() > 0) {
      await clickButton(page, 'button:has-text("举报")', '举报标签页');
      
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'flow6-admin-reports-list');
      
      const processButton = page.locator('button:has-text("处理"), button:has-text("查看")').first();
      if (await processButton.count() > 0) {
        await clickButton(page, 'button:has-text("处理"), button:has-text("查看")', '处理举报按钮');
        
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'flow6-admin-report-detail');
        
        const resolveButton = page.locator('button:has-text("解决"), button:has-text("验证")').first();
        if (await resolveButton.count() > 0) {
          await clickButton(page, 'button:has-text("解决"), button:has-text("验证")', '解决举报按钮');
          
          await page.waitForTimeout(2000);
          await takeScreenshot(page, 'flow6-admin-report-resolved');
          
          logStep('处理举报', '举报已处理');
        }
      }
    } else {
      logStep('处理举报', '没有举报管理入口', false);
    }
  });

  test('流程七: 权限控制验证', async ({ page }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('🔒 流程七: 权限控制验证');
    console.log('═'.repeat(80));
    
    console.log('\n📍 步骤1: 顾问尝试访问HR页面');
    const freelancerLoggedIn = await loginAsUser(page, TEST_USERS.freelancer);
    expect(freelancerLoggedIn).toBe(true);
    
    logStep('权限测试', '顾问尝试访问HR工作台');
    
    await page.goto(`${BASE_URL}/hr/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow7-freelancer-hr-page-access');
    
    const currentUrl = page.url();
    if (currentUrl.includes('/hr/dashboard')) {
      const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
      if (hasContent) {
        logStep('权限问题', '顾问可以访问HR工作台页面 - 安全漏洞!', false);
      } else {
        logStep('权限正确', '顾问被阻止访问HR工作台');
      }
    } else {
      logStep('权限正确', `顾问被重定向到: ${currentUrl}`);
    }
    
    console.log('\n📍 步骤2: 顾问尝试访问管理员页面');
    
    logStep('权限测试', '顾问尝试访问管理员工作台');
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow7-freelancer-admin-page-access');
    
    const currentUrl2 = page.url();
    if (currentUrl2.includes('/admin/dashboard')) {
      const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
      if (hasContent) {
        logStep('权限问题', '顾问可以访问管理员页面 - 严重安全漏洞!', false);
      } else {
        logStep('权限正确', '顾问被阻止访问管理员页面');
      }
    } else {
      logStep('权限正确', `顾问被重定向到: ${currentUrl2}`);
    }
    
    console.log('\n📍 步骤3: 顾问登出');
    await logoutUser(page);
    
    console.log('\n📍 步骤4: HR尝试访问管理员页面');
    const hrLoggedIn = await loginAsUser(page, TEST_USERS.hr);
    expect(hrLoggedIn).toBe(true);
    
    logStep('权限测试', 'HR尝试访问管理员工作台');
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await takeScreenshot(page, 'flow7-hr-admin-page-access');
    
    const currentUrl3 = page.url();
    if (currentUrl3.includes('/admin/dashboard')) {
      const hasContent = await page.locator('main, [class*="content"]').first().isVisible();
      if (hasContent) {
        logStep('权限问题', 'HR可以访问管理员页面 - 安全漏洞!', false);
      } else {
        logStep('权限正确', 'HR被阻止访问管理员页面');
      }
    } else {
      logStep('权限正确', `HR被重定向到: ${currentUrl3}`);
    }
  });
});
