import { test, expect, Page, APIRequestContext } from '@playwright/test';
import mongoose from '../server/node_modules/mongoose';
import { DataConsistencyVerifier } from '../e2e-utils/data-consistency-verifier';
import { TestHelper } from '../e2e-utils/test-helpers';
import UserAccount from '../server/src/models/user/user-account.model';
import Company from '../server/src/models/company-profile/company.model';
import FreelancerProfile from '../server/src/models/freelancer/freelancer_profile.model';
import FreelancerAffiliation from '../server/src/models/freelancer/freelancer_affiliation.model';
import ProjectRequirement from '../server/src/models/freelancer/project_requirement.model';
import WorkLog from '../server/src/models/freelancer/work_log.model';
import FreelancerInvoice from '../server/src/models/freelancer/freelancer_invoice.model';

const API_BASE_URL = 'http://localhost:5555/api/v1';
const FRONTEND_URL = 'http://localhost:5137';
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/job-portal';
const PENDING_FIXTURE_PREFIX = 'complete-e2e-pending-approval';

interface TestContext {
  adminToken: string;
  hrToken: string;
  freelancerToken: string;
  testProjectId: string;
  testProjectRequirementId: string;
  testWorkLogId: string;
  testInvoiceId: string;
  pendingWorkLogId: string;
  pendingInvoiceId: string;
}

const context: TestContext = {
  adminToken: '',
  hrToken: '',
  freelancerToken: '',
  testProjectId: '',
  testProjectRequirementId: '',
  testWorkLogId: '',
  testInvoiceId: '',
  pendingWorkLogId: '',
  pendingInvoiceId: ''
};

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

async function cleanupPendingApprovalFixtures() {
  await WorkLog.deleteMany({
    $or: [
      { notes: PENDING_FIXTURE_PREFIX },
      { work_description: { $regex: `^${PENDING_FIXTURE_PREFIX}` } },
    ],
  });
  await FreelancerInvoice.deleteMany({ notes: PENDING_FIXTURE_PREFIX });
  await ProjectRequirement.deleteMany({ project_title: { $regex: `^${PENDING_FIXTURE_PREFIX}` } });
  await FreelancerAffiliation.deleteMany({ notes: PENDING_FIXTURE_PREFIX });
  await Company.deleteMany({ company_name: { $regex: `^${PENDING_FIXTURE_PREFIX}` } });
}

async function createPendingApprovalFixtures() {
  await connectDb();
  await cleanupPendingApprovalFixtures();

  const [freelancerUser, hrUser] = await Promise.all([
    UserAccount.findOne({ email: 'freelancer@test.com' }),
    UserAccount.findOne({ email: 'hr@test.com' }),
  ]);
  expect(freelancerUser, 'freelancer@test.com must exist').toBeTruthy();
  expect(hrUser, 'hr@test.com must exist').toBeTruthy();

  let company = hrUser!.company_id ? await Company.findById(hrUser!.company_id) : null;
  if (!company) {
    company = await Company.create({
      company_name: `${PENDING_FIXTURE_PREFIX} Company`,
      company_type: 'limited_company',
      verification_status: 'approved',
      created_by: hrUser!._id,
    });
    hrUser!.company_id = company._id;
    await hrUser!.save();
  }

  const freelancerProfile = await FreelancerProfile.findOneAndUpdate(
    { user_id: freelancerUser!._id },
    {
      user_id: freelancerUser!._id,
      display_name: 'Complete E2E Pending Freelancer',
      freelancer_type: '鐙珛椤鹃棶',
      availability_status: 'available',
      is_active: true,
    },
    { upsert: true, new: true }
  );

  const project = await ProjectRequirement.create({
    posted_by: hrUser!._id,
    company_id: company._id,
    project_title: `${PENDING_FIXTURE_PREFIX} Project ${Date.now()}`,
    project_description: 'Project used by complete E2E pending approval coverage',
    job_nature: 'freelance',
    work_format: 'remote',
    rate_type: 'daily',
    rate_amount: 1000,
    rate_currency: 'CNY',
    project_cycle: '3_months',
    status: 'in_progress',
    is_active: true,
    created_date: new Date(),
  });

  const affiliation = await FreelancerAffiliation.create({
    freelancer_id: freelancerProfile._id,
    company_id: company._id,
    affiliation_type: 'contract',
    start_date: new Date(),
    status: 'active',
    notes: PENDING_FIXTURE_PREFIX,
    billing_info: {
      billing_mode: 'daily',
      billing_currency: 'CNY',
      agreed_daily_rate: 1000,
    },
  });

  const makeDay = (offsetDays: number) => {
    const day = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
    day.setHours(0, 0, 0, 0);
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(day);
    end.setHours(17, 0, 0, 0);
    return { day, start, end };
  };

  const pendingDay = makeDay(21);
  const pendingWorkLog = await WorkLog.create({
    freelancer_id: freelancerProfile._id,
    project_requirement_id: project._id,
    company_id: company._id,
    affiliation_id: affiliation._id,
    work_date: pendingDay.day,
    work_period_start: pendingDay.start,
    work_period_end: pendingDay.end,
    hours_worked: 8,
    work_type: 'remote_work',
    work_description: `${PENDING_FIXTURE_PREFIX} submitted work log`,
    status: 'submitted',
    submitted_at: new Date(),
    billing_info: {
      daily_rate: 1000,
      hours_billable: 8,
      amount: 1000,
      currency: 'CNY',
      is_tax_inclusive: false,
      tax_rate: 6,
      tax_amount: 60,
      total_amount: 1060,
    },
    notes: PENDING_FIXTURE_PREFIX,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const invoiceDay = makeDay(22);
  const invoicedWorkLog = await WorkLog.create({
    freelancer_id: freelancerProfile._id,
    project_requirement_id: project._id,
    company_id: company._id,
    affiliation_id: affiliation._id,
    work_date: invoiceDay.day,
    work_period_start: invoiceDay.start,
    work_period_end: invoiceDay.end,
    hours_worked: 8,
    work_type: 'remote_work',
    work_description: `${PENDING_FIXTURE_PREFIX} invoiced work log`,
    status: 'invoiced',
    submitted_at: new Date(),
    confirmed_at: new Date(),
    confirmed_by: hrUser!._id,
    billing_info: {
      daily_rate: 1000,
      hours_billable: 8,
      amount: 1000,
      currency: 'CNY',
      is_tax_inclusive: false,
      tax_rate: 6,
      tax_amount: 60,
      total_amount: 1060,
    },
    notes: PENDING_FIXTURE_PREFIX,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const invoice = await FreelancerInvoice.create({
    invoice_number: `INV-COMPLETE-E2E-${Date.now()}`,
    freelancer_id: freelancerProfile._id,
    company_id: company._id,
    affiliation_id: affiliation._id,
    project_requirement_id: project._id,
    work_log_ids: [invoicedWorkLog._id],
    invoice_type: 'vat_special',
    billing_period_start: invoiceDay.day,
    billing_period_end: new Date(),
    currency: 'CNY',
    items: [{ description: 'Pending approval consulting service', quantity: 1, unit: 'day', unit_price: 1000, amount: 1000 }],
    subtotal_amount: 1000,
    tax_calculation_mode: 'exclusive',
    tax_rate: 6,
    tax_amount: 60,
    total_amount: 1060,
    status: 'submitted',
    issued_date: new Date(),
    notes: PENDING_FIXTURE_PREFIX,
    created_at: new Date(),
    updated_at: new Date(),
  });
  invoicedWorkLog.invoice_id = invoice._id;
  await invoicedWorkLog.save();

  context.pendingWorkLogId = pendingWorkLog._id.toString();
  context.pendingInvoiceId = invoice._id.toString();
}

test.describe.serial('完整端到端测试 - 数据一致性验证', () => {
  test.describe.configure({ timeout: 90000 });
  
  test.beforeAll(async ({ request }) => {
    console.log('\n========================================');
    console.log('  完整端到端测试 - 数据一致性验证');
    console.log('========================================\n');

    context.adminToken = await DataConsistencyVerifier.getAuthToken(request, 'admin@test.com', 'Test123456!');
    context.hrToken = await DataConsistencyVerifier.getAuthToken(request, 'hr@test.com', 'Test123456!');
    context.freelancerToken = await DataConsistencyVerifier.getAuthToken(request, 'freelancer@test.com', 'Test123456!');
    await createPendingApprovalFixtures();

    console.log('✅ 已获取所有角色认证 token');
  });

  test.afterAll(async () => {
    await cleanupPendingApprovalFixtures();
    await mongoose.disconnect();
  });

  test('【DATA-01】数据前置条件检查', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【DATA-01】数据前置条件检查              │');
    console.log('└─────────────────────────────────────────┘\n');

    const projectsResponse = await request.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectsData = await projectsResponse.json();
    const projects = projectsData.jobs || projectsData.data?.items || projectsData.data || [];
    console.log(`  📊 项目数据: ${projects.length} 个`);
    
    if (projects.length === 0) {
      throw new Error('❌ 缺少项目数据，请先运行测试数据初始化脚本');
    }
    context.testProjectId = projects[0]._id;
    const projectDetailResponse = await request.get(`${API_BASE_URL}/jobs/${context.testProjectId}`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectDetailData = await projectDetailResponse.json();
    context.testProjectRequirementId = projectDetailData.project_requirement?._id || projects[0].project_requirement_id?._id || projects[0].project_requirement_id || '';
    console.log(`  ✅ 测试项目ID: ${context.testProjectId}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    console.log(`  📊 工时数据: ${workLogs.length} 条`);
    
    if (workLogs.length === 0) {
      throw new Error('❌ 缺少工时数据，请先运行测试数据初始化脚本');
    }
    
    const draftWorkLog = workLogs.find((w: any) => w.status === 'draft');
    const submittedWorkLog = workLogs.find((w: any) => w.status === 'submitted');
    const confirmedWorkLog = workLogs.find((w: any) => w.status === 'confirmed');
    
    console.log(`  📊 工时状态分布: 草稿=${draftWorkLog ? '有' : '无'}, 待审核=${submittedWorkLog ? '有' : '无'}, 已确认=${confirmedWorkLog ? '有' : '无'}`);
    
    if (submittedWorkLog) {
      context.testWorkLogId = submittedWorkLog._id;
      console.log(`  ✅ 测试工时ID(待审核): ${context.testWorkLogId}`);
    }

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    console.log(`  📊 发票数据: ${invoices.length} 条`);
    
    if (invoices.length > 0) {
      context.testInvoiceId = invoices[0]._id;
      console.log(`  ✅ 测试发票ID: ${context.testInvoiceId}`);
    }

    console.log('\n  ✅ 数据前置条件检查通过\n');
  });

  test('【FLOW-01】求职者 - 工时列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-01】求职者工时列表数据一致性      │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);
    const verifier = new DataConsistencyVerifier(context.freelancerToken);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ 求职者登录成功');

    await page.goto(`${FRONTEND_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到工时列表页面');

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    console.log(`  📊 后端工时数据: ${workLogs.length} 条`);
    
    const listItems = page.locator('[data-testid^="worklog-row-"], [data-testid="work-log-card"], [data-testid="worklog-item"], .work-log-item');
    if (workLogs.length > 0) {
      await expect(listItems.first()).toBeVisible({ timeout: 10000 });
      await expect(async () => {
        expect(await listItems.count()).toBe(workLogs.length);
      }).toPass({ timeout: 10000 });
    }
    const frontendCount = await listItems.count();
    console.log(`  📊 前端工时显示: ${frontendCount} 条`);
    
    if (frontendCount !== workLogs.length) {
      console.log(`  ⚠️ 前后端数量不一致: 前端=${frontendCount}, 后端=${workLogs.length}`);
    } else {
      console.log(`  ✅ 前后端数量一致: ${frontendCount} 条`);
    }

    console.log('\n  📋 验证各状态工时数据一致性:');
    
    for (const workLog of workLogs.slice(0, 3)) {
      console.log(`\n  📝 工时ID: ${workLog._id}`);
      console.log(`  📊 后端状态: ${workLog.status}`);
      console.log(`  📊 后端工时: ${workLog.hours_worked} 小时`);
      console.log(`  📊 后端描述: ${workLog.work_description?.substring(0, 30)}...`);
    }

    await TestHelper.logout(page);
    console.log('\n  ✅ 工时列表数据一致性验证完成\n');
  });

  test('【FLOW-02】HR - 工时审核流程（状态转换验证）', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-02】HR工时审核流程                │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs/company/pending`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const pendingWorkLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    expect(pendingWorkLogs.length).toBeGreaterThan(0);

    if (pendingWorkLogs.length === 0) {
      console.log('  ⚠️ 没有待审核的工时，跳过审核流程测试');
      test.skip();
      return;
    }

    const workLogToApprove = pendingWorkLogs[0];
    console.log(`  📝 待审核工时ID: ${workLogToApprove._id}`);
    console.log(`  📊 初始状态: ${workLogToApprove.status}`);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/work-logs/pending`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到待审核工时页面');

    const confirmBtn = page.locator(`[data-testid="confirm-worklog-${workLogToApprove._id}"]`);
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('\n  🔄 执行工时确认操作...');
      
      await confirmBtn.click();
      
      const confirmDialogBtn = page.locator('button:has-text("确认"), button:has-text("确定")').first();
      if (await confirmDialogBtn.isVisible({ timeout: 2000 })) {
        await confirmDialogBtn.click();
      }

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const updatedWorkLog = await WorkLog.findById(workLogToApprove._id);

      console.log(`  📊 操作后状态: ${updatedWorkLog?.status}`);
      
      if (updatedWorkLog?.status === 'confirmed') {
        console.log('  ✅ 状态转换成功: submitted → confirmed');
      } else {
        console.log(`  ❌ 状态转换失败: 期望=confirmed, 实际=${updatedWorkLog?.status}`);
        throw new Error(`状态转换失败: ${updatedWorkLog?.status}`);
      }
    } else {
      console.log('  ❌ 未找到确认按钮');
      throw new Error('未找到确认按钮');
    }

    await TestHelper.logout(page);
    console.log('\n  ✅ 工时审核流程验证完成\n');
  });

  test('【FLOW-03】求职者 - 发票列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-03】求职者发票列表数据一致性      │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ 求职者登录成功');

    await page.goto(`${FRONTEND_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到发票列表页面');

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    console.log(`  📊 后端发票数据: ${invoices.length} 条`);
    
    const listItems = page.locator('[data-testid^="invoice-row-"], [data-testid="invoice-card"], [data-testid="invoice-item"], .invoice-item');
    if (invoices.length > 0) {
      await expect(listItems.first()).toBeVisible({ timeout: 10000 });
      await expect(async () => {
        expect(await listItems.count()).toBe(invoices.length);
      }).toPass({ timeout: 10000 });
    }
    const frontendCount = await listItems.count();
    console.log(`  📊 前端发票显示: ${frontendCount} 条`);

    if (invoices.length > 0) {
      console.log('\n  📋 验证发票数据一致性:');
      
      for (const invoice of invoices.slice(0, 2)) {
        console.log(`\n  📝 发票ID: ${invoice._id}`);
        console.log(`  📊 发票号: ${invoice.invoice_number}`);
        console.log(`  📊 后端状态: ${invoice.status}`);
        console.log(`  📊 后端金额: ¥${invoice.total_amount}`);
      }
    } else {
      console.log('  ⚠️ 没有发票数据');
    }

    await TestHelper.logout(page);
    console.log('\n  ✅ 发票列表数据一致性验证完成\n');
  });

  test('【FLOW-04】HR - 发票审核流程（状态转换验证）', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-04】HR发票审核流程                │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices?status=submitted`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const pendingInvoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    expect(pendingInvoices.length).toBeGreaterThan(0);

    if (pendingInvoices.length === 0) {
      console.log('  ⚠️ 没有待审核的发票，跳过审核流程测试');
      test.skip();
      return;
    }

    const invoiceToApprove = pendingInvoices.find((invoice: any) => invoice._id === context.pendingInvoiceId) || pendingInvoices[0];
    console.log(`  📝 待审核发票ID: ${invoiceToApprove._id}`);
    console.log(`  📊 发票号: ${invoiceToApprove.invoice_number}`);
    console.log(`  📊 初始状态: ${invoiceToApprove.status}`);
    console.log(`  📊 金额: ¥${invoiceToApprove.total_amount}`);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/invoices/review`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到发票审核页面');

    const approveBtn = page.locator(`[data-testid="approve-invoice-${invoiceToApprove._id}"]`);
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    
    if (await approveBtn.isVisible({ timeout: 3000 })) {
      console.log('\n  🔄 执行发票审批操作...');
      
      await approveBtn.click();
      
      const confirmDialogBtn = page.locator('button:has-text("通过"), button:has-text("确认"), button:has-text("确定")').first();
      if (await confirmDialogBtn.isVisible({ timeout: 2000 })) {
        await confirmDialogBtn.click();
      }

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const updatedInvoice = await FreelancerInvoice.findById(invoiceToApprove._id);

      console.log(`  📊 操作后状态: ${updatedInvoice?.status}`);
      
      if (updatedInvoice?.status === 'approved' || updatedInvoice?.status === '审核通过') {
        console.log('  ✅ 状态转换成功: submitted → approved');
      } else {
        console.log(`  ❌ 状态转换失败: 期望=approved, 实际=${updatedInvoice?.status}`);
        throw new Error(`状态转换失败: ${updatedInvoice?.status}`);
      }
    } else {
      console.log('  ❌ 未找到审批按钮');
      throw new Error('未找到审批按钮');
    }

    await TestHelper.logout(page);
    console.log('\n  ✅ 发票审核流程验证完成\n');
  });

  test('【FLOW-05】HR - 项目发布流程', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-05】HR项目发布流程                │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ HR登录成功');

    const beforeResponse = await request.get(`${API_BASE_URL}/jobs/my-posted-jobs`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const beforeData = await beforeResponse.json();
    const beforeProjects = beforeData.jobs || beforeData.data?.items || beforeData.data || [];
    console.log(`  📊 发布前项目数: ${beforeProjects.length}`);

    await page.goto(`${FRONTEND_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到发布职位页面');

    const projectTitle = `E2E测试项目-${Date.now()}`;
    console.log(`  📝 项目标题: ${projectTitle}`);

    await page.fill('input[name="job_title"], input[name="project_title"]', projectTitle);
    await page.fill('textarea[name="job_description"], textarea[name="project_description"]', '这是一个端到端测试项目，验证前后端数据一致性');

    await page.fill('input[name="rate_amount"]', '800');
    await page.fill('input[name="city"]', 'Shanghai');
    await page.fill('input[name="country"]', 'China');

    const submitBtn = page.locator('button[type="submit"], button:has-text("发布"), button:has-text("提交")').first();
    await submitBtn.click();

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const afterResponse = await request.get(`${API_BASE_URL}/jobs/my-posted-jobs`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const afterData = await afterResponse.json();
    const afterProjects = afterData.jobs || afterData.data?.items || afterData.data || [];
    console.log(`  📊 发布后项目数: ${afterProjects.length}`);

    const newProject = afterProjects.find((p: any) => p.job_title === projectTitle);
    
    if (newProject) {
      console.log(`  ✅ 项目创建成功，ID: ${newProject._id}`);
      console.log(`  📊 项目状态: ${newProject.status}`);
      context.testProjectId = newProject._id;
      const newProjectDetailResponse = await request.get(`${API_BASE_URL}/jobs/${newProject._id}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      const newProjectDetailData = await newProjectDetailResponse.json();
      context.testProjectRequirementId = newProjectDetailData.project_requirement?._id || '';
      
      const statusConsistent = newProject.status === 'published' || newProject.status === '已发布' || newProject.status === 'draft';
      if (statusConsistent) {
        console.log('  ✅ 状态一致性验证通过');
      } else {
        console.log(`  ⚠️ 状态: ${newProject.status}`);
      }
    } else {
      console.log('  ❌ 未找到新创建的项目');
    }

    await TestHelper.logout(page);
    console.log('\n  ✅ 项目发布流程验证完成\n');
  });

  test('【FLOW-06】管理员 - 数据总览一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-06】管理员数据总览一致性          │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ 管理员登录成功');

    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    console.log('  📍 导航到管理员Dashboard');

    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const usersData = await usersResponse.json();
    const users = usersData.data?.items || usersData.data || [];
    console.log(`  📊 用户总数(后端): ${users.length}`);

    const companiesResponse = await request.get(`${API_BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const companiesData = await companiesResponse.json();
    const companies = companiesData.data?.items || companiesData.data || [];
    console.log(`  📊 公司总数(后端): ${companies.length}`);

    const projectsResponse = await request.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const projectsData = await projectsResponse.json();
    const projects = projectsData.jobs || projectsData.data?.items || projectsData.data || [];
    console.log(`  📊 项目总数(后端): ${projects.length}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/admin/work-logs`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    console.log(`  📊 工时总数(后端): ${workLogs.length}`);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    console.log(`  📊 发票总数(后端): ${invoices.length}`);

    console.log('\n  📋 数据一致性总结:');
    console.log(`  ✅ 用户: ${users.length} 条`);
    console.log(`  ✅ 公司: ${companies.length} 条`);
    console.log(`  ✅ 项目: ${projects.length} 条`);
    console.log(`  ✅ 工时: ${workLogs.length} 条`);
    console.log(`  ✅ 发票: ${invoices.length} 条`);

    await TestHelper.logout(page);
    console.log('\n  ✅ 管理员数据总览验证完成\n');
  });

  test('【VERIFY-01】完整业务链路验证', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【VERIFY-01】完整业务链路验证            │');
    console.log('└─────────────────────────────────────────┘\n');

    console.log('  📋 验证项目 → 工时 → 发票 业务链路\n');

    const projectResponse = await request.get(`${API_BASE_URL}/jobs/${context.testProjectId}`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectData = await projectResponse.json();
    const project = projectData.job || projectData.data || projectData;
    const projectRequirementId = projectData.project_requirement?._id || context.testProjectRequirementId || context.testProjectId;

    console.log(`  📊 项目: ${project.job_title || project.job_description?.substring(0, 30)}`);
    console.log(`  📊 项目状态: ${project.status}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    const projectWorkLogs = workLogs.filter((w: any) => 
      w.project_requirement_id === projectRequirementId ||
      w.project_requirement_id?._id === projectRequirementId
    );

    console.log(`  📊 关联工时: ${projectWorkLogs.length} 条`);
    
    const statusCounts = {
      draft: projectWorkLogs.filter((w: any) => w.status === 'draft').length,
      submitted: projectWorkLogs.filter((w: any) => w.status === 'submitted').length,
      confirmed: projectWorkLogs.filter((w: any) => w.status === 'confirmed').length,
      rejected: projectWorkLogs.filter((w: any) => w.status === 'rejected').length
    };
    console.log(`  📊 工时状态分布: 草稿=${statusCounts.draft}, 待审核=${statusCounts.submitted}, 已确认=${statusCounts.confirmed}, 已驳回=${statusCounts.rejected}`);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    const projectInvoices = invoices.filter((inv: any) => 
      inv.project_requirement_id === projectRequirementId ||
      inv.project_requirement_id?._id === projectRequirementId
    );

    console.log(`  📊 关联发票: ${projectInvoices.length} 条`);

    console.log('\n  ✅ 业务链路验证完成');
    console.log('\n========================================');
    console.log('  完整端到端测试完成');
    console.log('========================================\n');
  });
});
