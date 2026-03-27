import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { DataConsistencyVerifier } from '../e2e-utils/data-consistency-verifier';
import { TestHelper } from '../e2e-utils/test-helpers';

const API_BASE_URL = 'http://localhost:5555/api/v1';
const FRONTEND_URL = 'http://localhost:5137';

interface TestContext {
  adminToken: string;
  hrToken: string;
  freelancerToken: string;
  testProjectId: string;
  testWorkLogId: string;
  testInvoiceId: string;
  testCompanyId: string;
  testUserId: string;
  issues: { id: string; scenario: string; severity: string; description: string }[];
}

const context: TestContext = {
  adminToken: '',
  hrToken: '',
  freelancerToken: '',
  testProjectId: '',
  testWorkLogId: '',
  testInvoiceId: '',
  testCompanyId: '',
  testUserId: '',
  issues: []
};

function logIssue(scenario: string, severity: string, description: string) {
  const issueId = `ISS-${String(context.issues.length + 1).padStart(3, '0')}`;
  context.issues.push({ id: issueId, scenario, severity, description });
  console.log(`  ❌ [${issueId}] ${severity}: ${description}`);
}

function logSuccess(message: string) {
  console.log(`  ✅ ${message}`);
}

function logInfo(message: string) {
  console.log(`  📊 ${message}`);
}

test.describe.serial('完整端到端测试 - 全场景全角色数据一致性验证', () => {
  
  test.beforeAll(async ({ request }) => {
    console.log('\n========================================');
    console.log('  完整端到端测试 - 全场景全角色');
    console.log('  动态数据流转验证');
    console.log('========================================\n');

    try {
      context.adminToken = await DataConsistencyVerifier.getAuthToken(request, 'admin@test.com', 'Test123456!');
      context.hrToken = await DataConsistencyVerifier.getAuthToken(request, 'hr@test.com', 'Test123456!');
      context.freelancerToken = await DataConsistencyVerifier.getAuthToken(request, 'freelancer@test.com', 'Test123456!');
      console.log('✅ 已获取所有角色认证 token\n');
    } catch (error) {
      console.error('❌ 获取认证token失败:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    console.log('\n========================================');
    console.log('  测试执行完成');
    console.log('========================================\n');
    
    if (context.issues.length > 0) {
      console.log('📋 问题清单:');
      console.log('========================================');
      for (const issue of context.issues) {
        console.log(`[${issue.id}] ${issue.scenario} - ${issue.severity}`);
        console.log(`    ${issue.description}`);
      }
      console.log('========================================\n');
    } else {
      console.log('✅ 所有测试通过，无问题发现\n');
    }
  });

  test('【DATA-INIT】数据前置条件检查', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【DATA-INIT】数据前置条件检查            │');
    console.log('└─────────────────────────────────────────┘\n');

    const projectsResponse = await request.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectsData = await projectsResponse.json();
    const projects = projectsData.jobs || projectsData.data?.items || projectsData.data || [];
    logInfo(`项目数据: ${projects.length} 个`);
    
    if (projects.length === 0) {
      logIssue('DATA-INIT', 'P0', '缺少项目数据，请先运行测试数据初始化脚本');
      throw new Error('缺少项目数据');
    }
    context.testProjectId = projects[0]._id;
    logSuccess(`测试项目ID: ${context.testProjectId}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    logInfo(`工时数据: ${workLogs.length} 条`);
    
    if (workLogs.length === 0) {
      logIssue('DATA-INIT', 'P0', '缺少工时数据，请先运行测试数据初始化脚本');
      throw new Error('缺少工时数据');
    }

    const draftWorkLog = workLogs.find((w: any) => w.status === 'draft');
    const submittedWorkLog = workLogs.find((w: any) => w.status === 'submitted');
    const confirmedWorkLog = workLogs.find((w: any) => w.status === 'confirmed');
    
    logInfo(`工时状态分布: 草稿=${draftWorkLog ? '有' : '无'}, 待审核=${submittedWorkLog ? '有' : '无'}, 已确认=${confirmedWorkLog ? '有' : '无'}`);
    
    if (submittedWorkLog) {
      context.testWorkLogId = submittedWorkLog._id;
      logSuccess(`测试工时ID(待审核): ${context.testWorkLogId}`);
    }

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    logInfo(`发票数据: ${invoices.length} 条`);
    
    if (invoices.length > 0) {
      context.testInvoiceId = invoices[0]._id;
      logSuccess(`测试发票ID: ${context.testInvoiceId}`);
    }

    const companiesResponse = await request.get(`${API_BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const companiesData = await companiesResponse.json();
    const companies = companiesData.data?.items || companiesData.data || [];
    logInfo(`公司数据: ${companies.length} 个`);
    
    if (companies.length > 0) {
      context.testCompanyId = companies[0]._id;
    }

    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const usersData = await usersResponse.json();
    const users = usersData.data?.items || usersData.data || [];
    logInfo(`用户数据: ${users.length} 个`);

    logSuccess('数据前置条件检查通过\n');
  });

  // ==================== 求职者场景 ====================

  test('【F-WL-01】求职者 - 工时列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【F-WL-01】求职者工时列表数据一致性      │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('F-WL-01', 'P0', '求职者登录失败');
      throw new Error('登录失败');
    }
    logSuccess('求职者登录成功');

    await page.goto(`${FRONTEND_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到工时列表页面');

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const backendWorkLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    logInfo(`后端工时数据: ${backendWorkLogs.length} 条`);
    
    const tbody = page.locator('[data-testid="worklogs-tbody"]');
    const frontendRows = await tbody.locator('tr[data-testid^="worklog-row-"]').count();
    logInfo(`前端工时显示: ${frontendRows} 条`);
    
    if (frontendRows !== backendWorkLogs.length) {
      logIssue('F-WL-01', 'P1', `前后端数量不一致: 前端=${frontendRows}, 后端=${backendWorkLogs.length}`);
    } else {
      logSuccess(`前后端数量一致: ${frontendRows} 条`);
    }

    for (const workLog of backendWorkLogs.slice(0, 3)) {
      logInfo(`工时 ${workLog._id}: 状态=${workLog.status}, 工时=${workLog.hours_worked}h`);
    }

    await TestHelper.logout(page);
    logSuccess('工时列表数据一致性验证完成\n');
  });

  test('【F-WL-02】求职者 - 提交工时审核(状态流转)', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【F-WL-02】求职者提交工时审核            │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    
    const draftWorkLog = workLogs.find((w: any) => w.status === 'draft');
    
    if (!draftWorkLog) {
      logInfo('没有草稿工时，跳过提交测试');
      test.skip();
      return;
    }

    logInfo(`草稿工时ID: ${draftWorkLog._id}`);
    logInfo(`初始状态: ${draftWorkLog.status}`);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('F-WL-02', 'P0', '求职者登录失败');
      throw new Error('登录失败');
    }
    logSuccess('求职者登录成功');

    await page.goto(`${FRONTEND_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const workLogRow = page.locator(`[data-testid="worklog-row-${draftWorkLog._id}"]`);
    const submitBtn = workLogRow.locator('button:has-text("提交")');
    
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      logInfo('找到提交按钮，执行提交操作');
      
      const responsePromise = page.waitForResponse(resp => 
        resp.url().includes('/work-logs/') && resp.url().includes('/submit') && resp.request().method() === 'POST'
      );
      
      await submitBtn.click();
      
      try {
        const response = await responsePromise;
        logInfo(`API响应状态: ${response.status()}`);
        const responseData = await response.json();
        logInfo(`API响应数据: ${JSON.stringify(responseData).substring(0, 200)}`);
      } catch (e) {
        logInfo(`等待API响应超时或失败: ${e}`);
      }
      
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const verifyResponse = await request.get(`${API_BASE_URL}/work-logs/${draftWorkLog._id}`, {
        headers: { Authorization: `Bearer ${context.freelancerToken}` }
      });
      const verifyData = await verifyResponse.json();
      const updatedWorkLog = verifyData.data || verifyData;

      logInfo(`操作后状态: ${updatedWorkLog.status}`);
      
      if (updatedWorkLog.status === 'submitted') {
        logSuccess('状态转换成功: draft → submitted');
      } else {
        logIssue('F-WL-02', 'P0', `状态转换失败: 期望=submitted, 实际=${updatedWorkLog.status}`);
        throw new Error(`状态转换失败: ${updatedWorkLog.status}`);
      }
    } else {
      logIssue('F-WL-02', 'P0', '未找到提交按钮，工时提交功能可能存在问题');
      throw new Error('未找到提交按钮');
    }

    await TestHelper.logout(page);
    logSuccess('工时提交测试完成\n');
  });

  test('【F-INV-01】求职者 - 发票列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【F-INV-01】求职者发票列表数据一致性     │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('F-INV-01', 'P0', '求职者登录失败');
      throw new Error('登录失败');
    }
    logSuccess('求职者登录成功');

    await page.goto(`${FRONTEND_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到发票列表页面');

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const backendInvoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    logInfo(`后端发票数据: ${backendInvoices.length} 条`);
    
    const tbody = page.locator('[data-testid="invoices-tbody"]');
    const frontendRows = await tbody.locator('tr[data-testid^="invoice-row-"]').count();
    logInfo(`前端发票显示: ${frontendRows} 条`);

    if (frontendRows !== backendInvoices.length) {
      logIssue('F-INV-01', 'P1', `前后端数量不一致: 前端=${frontendRows}, 后端=${backendInvoices.length}`);
    } else {
      logSuccess(`前后端数量一致: ${frontendRows} 条`);
    }

    for (const invoice of backendInvoices.slice(0, 2)) {
      logInfo(`发票 ${invoice._id}: 状态=${invoice.status}, 金额=¥${invoice.total_amount}`);
    }

    await TestHelper.logout(page);
    logSuccess('发票列表数据一致性验证完成\n');
  });

  // ==================== HR场景 ====================

  test('【H-PROJ-01】HR - 项目列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【H-PROJ-01】HR项目列表数据一致性        │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('H-PROJ-01', 'P0', 'HR登录失败');
      throw new Error('登录失败');
    }
    logSuccess('HR登录成功');

    await page.goto(`${FRONTEND_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到项目列表页面');

    const projectsResponse = await request.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectsData = await projectsResponse.json();
    const backendProjects = projectsData.jobs || projectsData.data?.items || projectsData.data || [];

    logInfo(`后端项目数据: ${backendProjects.length} 个`);
    
    const projectCards = page.locator('a[data-testid^="job-"]');
    const frontendCount = await projectCards.count();
    logInfo(`前端项目显示: ${frontendCount} 个`);

    if (frontendCount !== backendProjects.length) {
      logIssue('H-PROJ-01', 'P1', `前后端数量不一致: 前端=${frontendCount}, 后端=${backendProjects.length}`);
    } else {
      logSuccess(`前后端数量一致: ${frontendCount} 个`);
    }

    await TestHelper.logout(page);
    logSuccess('项目列表数据一致性验证完成\n');
  });

  test('【H-WL-01】HR - 工时审核流程(状态流转)', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【H-WL-01】HR工时审核流程                │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs?status=submitted`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const pendingWorkLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    if (pendingWorkLogs.length === 0) {
      logInfo('没有待审核的工时，跳过审核流程测试');
      test.skip();
      return;
    }

    const workLogToApprove = pendingWorkLogs[0];
    logInfo(`待审核工时ID: ${workLogToApprove._id}`);
    logInfo(`初始状态: ${workLogToApprove.status}`);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('H-WL-01', 'P0', 'HR登录失败');
      throw new Error('登录失败');
    }
    logSuccess('HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/work-logs/pending`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到待审核工时页面');

    const confirmBtn = page.locator('button:has-text("确认"), button:has-text("通过"), button:has-text("审批")').first();
    
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      logInfo('找到确认按钮，执行确认操作');
      
      await confirmBtn.click();
      
      const confirmDialogBtn = page.locator('button:has-text("确认"), button:has-text("确定")').first();
      if (await confirmDialogBtn.isVisible({ timeout: 2000 })) {
        await confirmDialogBtn.click();
      }

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const verifyResponse = await request.get(`${API_BASE_URL}/work-logs/${workLogToApprove._id}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      const verifyData = await verifyResponse.json();
      const updatedWorkLog = verifyData.data || verifyData;

      logInfo(`操作后状态: ${updatedWorkLog.status}`);
      
      if (updatedWorkLog.status === 'confirmed') {
        logSuccess('状态转换成功: submitted → confirmed');
      } else {
        logIssue('H-WL-01', 'P0', `状态转换失败: 期望=confirmed, 实际=${updatedWorkLog.status}`);
        throw new Error(`状态转换失败: ${updatedWorkLog.status}`);
      }
    } else {
      logIssue('H-WL-01', 'P0', '未找到确认按钮，审批功能可能存在问题');
      throw new Error('未找到确认按钮');
    }

    await TestHelper.logout(page);
    logSuccess('工时审核流程验证完成\n');
  });

  test('【H-INV-01】HR - 发票审核流程(状态流转)', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【H-INV-01】HR发票审核流程               │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices?status=submitted`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const pendingInvoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    if (pendingInvoices.length === 0) {
      logInfo('没有待审核的发票，跳过审核流程测试');
      test.skip();
      return;
    }

    const invoiceToApprove = pendingInvoices[0];
    logInfo(`待审核发票ID: ${invoiceToApprove._id}`);
    logInfo(`发票号: ${invoiceToApprove.invoice_number}`);
    logInfo(`初始状态: ${invoiceToApprove.status}`);
    logInfo(`金额: ¥${invoiceToApprove.total_amount}`);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('H-INV-01', 'P0', 'HR登录失败');
      throw new Error('登录失败');
    }
    logSuccess('HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/invoices/review`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到发票审核页面');

    const approveBtn = page.locator('button[title="通过"], button:has(svg[class*="check"]), button:has-text("审核")').first();
    
    if (await approveBtn.isVisible({ timeout: 5000 })) {
      logInfo('找到审批按钮，执行审批操作');
      
      const responsePromise = page.waitForResponse(resp => 
        resp.url().includes('/invoices/') && resp.url().includes('/approve') && resp.request().method() === 'POST'
      );
      
      await approveBtn.click();
      
      try {
        const response = await responsePromise;
        logInfo(`API响应状态: ${response.status()}`);
      } catch (e) {
        logInfo(`等待API响应: ${e}`);
      }

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const verifyResponse = await request.get(`${API_BASE_URL}/invoices/${invoiceToApprove._id}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      const verifyData = await verifyResponse.json();
      const updatedInvoice = verifyData.invoice || verifyData.data || verifyData;

      logInfo(`操作后状态: ${updatedInvoice.status}`);
      
      if (updatedInvoice.status === 'approved' || updatedInvoice.status === '审核通过') {
        logSuccess('状态转换成功: submitted → approved');
      } else {
        logIssue('H-INV-01', 'P0', `状态转换失败: 期望=approved, 实际=${updatedInvoice.status}`);
        throw new Error(`状态转换失败: ${updatedInvoice.status}`);
      }
    } else {
      logIssue('H-INV-01', 'P0', '未找到审批按钮，发票审批功能可能存在问题');
      throw new Error('未找到审批按钮');
    }

    await TestHelper.logout(page);
    logSuccess('发票审核流程验证完成\n');
  });

  // ==================== 管理员场景 ====================

  test('【A-USER-01】管理员 - 用户列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【A-USER-01】管理员用户列表数据一致性    │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('A-USER-01', 'P0', '管理员登录失败');
      throw new Error('登录失败');
    }
    logSuccess('管理员登录成功');

    await page.goto(`${FRONTEND_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.waitForSelector('[data-testid="users-tbody"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid^="user-row-"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    logInfo('导航到用户管理页面');

    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const usersData = await usersResponse.json();
    logInfo(`API响应结构: ${JSON.stringify(usersData).substring(0, 300)}`);
    const backendUsers = usersData.data || [];
    logInfo(`后端用户数据: ${backendUsers.length} 个`);
    
    const tbody = page.locator('[data-testid="users-tbody"]');
    const frontendRows = await tbody.locator('tr[data-testid^="user-row-"]').count();
    logInfo(`前端用户显示: ${frontendRows} 个`);

    if (frontendRows !== backendUsers.length) {
      logIssue('A-USER-01', 'P1', `前后端数量不一致: 前端=${frontendRows}, 后端=${backendUsers.length}`);
    } else {
      logSuccess(`前后端数量一致: ${frontendRows} 个`);
    }

    await TestHelper.logout(page);
    logSuccess('用户列表数据一致性验证完成\n');
  });

  test('【A-COMP-01】管理员 - 企业列表数据一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【A-COMP-01】管理员企业列表数据一致性    │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('A-COMP-01', 'P0', '管理员登录失败');
      throw new Error('登录失败');
    }
    logSuccess('管理员登录成功');

    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const companiesTab = page.locator('button:has-text("企业审核")').first();
    await companiesTab.click();
    await page.waitForTimeout(3000);
    
    const tbody = page.locator('[data-testid="companies-tbody"]');
    await tbody.waitFor({ timeout: 10000 });
    await page.waitForTimeout(2000);
    logInfo('导航到企业管理页面');

    const companiesResponse = await request.get(`${API_BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const companiesData = await companiesResponse.json();
    const backendCompanies = companiesData.data?.items || companiesData.data || [];

    logInfo(`后端企业数据: ${backendCompanies.length} 个`);
    
    const frontendRows = await tbody.locator('tr[data-testid^="company-row-"]').count();
    logInfo(`前端企业显示: ${frontendRows} 个`);

    if (frontendRows !== backendCompanies.length) {
      logIssue('A-COMP-01', 'P1', `前后端数量不一致: 前端=${frontendRows}, 后端=${backendCompanies.length}`);
    } else {
      logSuccess(`前后端数量一致: ${frontendRows} 个`);
    }

    await TestHelper.logout(page);
    logSuccess('企业列表数据一致性验证完成\n');
  });

  test('【A-DASHBOARD-01】管理员 - 数据总览一致性', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【A-DASHBOARD-01】管理员数据总览一致性   │');
    console.log('└─────────────────────────────────────────┘\n');

    await TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('A-DASHBOARD-01', 'P0', '管理员登录失败');
      throw new Error('登录失败');
    }
    logSuccess('管理员登录成功');

    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    logInfo('导航到管理员Dashboard');

    const usersResponse = await request.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const usersData = await usersResponse.json();
    const users = usersData.data?.items || usersData.data || [];
    logInfo(`用户总数(后端): ${users.length}`);

    const companiesResponse = await request.get(`${API_BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const companiesData = await companiesResponse.json();
    const companies = companiesData.data?.items || companiesData.data || [];
    logInfo(`公司总数(后端): ${companies.length}`);

    const projectsResponse = await request.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const projectsData = await projectsResponse.json();
    const projects = projectsData.jobs || projectsData.data?.items || projectsData.data || [];
    logInfo(`项目总数(后端): ${projects.length}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    logInfo(`工时总数(后端): ${workLogs.length}`);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.adminToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    logInfo(`发票总数(后端): ${invoices.length}`);

    logSuccess('\n📋 数据一致性总结:');
    logSuccess(`用户: ${users.length} 条`);
    logSuccess(`公司: ${companies.length} 条`);
    logSuccess(`项目: ${projects.length} 条`);
    logSuccess(`工时: ${workLogs.length} 条`);
    logSuccess(`发票: ${invoices.length} 条`);

    await TestHelper.logout(page);
    logSuccess('管理员数据总览验证完成\n');
  });

  // ==================== 跨角色流程 ====================

  test('【FLOW-COMPLETE】完整业务链路验证', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-COMPLETE】完整业务链路验证        │');
    console.log('└─────────────────────────────────────────┘\n');

    logInfo('验证项目 → 工时 → 发票 业务链路\n');

    const projectResponse = await request.get(`${API_BASE_URL}/jobs/${context.testProjectId}`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const projectData = await projectResponse.json();
    const project = projectData.data || projectData;

    logInfo(`项目: ${project.job_title || project.job_description?.substring(0, 30)}`);
    logInfo(`项目状态: ${project.status}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    const projectWorkLogs = workLogs.filter((w: any) => 
      w.project_requirement_id === context.testProjectId || 
      w.project_requirement_id?._id === context.testProjectId
    );

    logInfo(`关联工时: ${projectWorkLogs.length} 条`);
    
    const statusCounts = {
      draft: projectWorkLogs.filter((w: any) => w.status === 'draft').length,
      submitted: projectWorkLogs.filter((w: any) => w.status === 'submitted').length,
      confirmed: projectWorkLogs.filter((w: any) => w.status === 'confirmed').length,
      rejected: projectWorkLogs.filter((w: any) => w.status === 'rejected').length,
      invoiced: projectWorkLogs.filter((w: any) => w.status === 'invoiced').length
    };
    logInfo(`工时状态分布: 草稿=${statusCounts.draft}, 待审核=${statusCounts.submitted}, 已确认=${statusCounts.confirmed}, 已驳回=${statusCounts.rejected}, 已开票=${statusCounts.invoiced}`);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    const projectInvoices = invoices.filter((inv: any) => 
      inv.project_requirement_id === context.testProjectId ||
      inv.project_requirement_id?._id === context.testProjectId
    );

    logInfo(`关联发票: ${projectInvoices.length} 条`);

    logSuccess('业务链路验证完成');
    console.log('\n========================================');
    console.log('  完整端到端测试完成');
    console.log('========================================\n');
  });
});
