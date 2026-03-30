import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { DataConsistencyVerifier } from '../e2e-utils/data-consistency-verifier';
import { TestHelper } from '../e2e-utils/test-helpers';

const API_BASE_URL = 'http://localhost:5555/api/v1';
const FRONTEND_URL = 'http://localhost:5137';

interface TestContext {
  adminToken: string;
  hrToken: string;
  freelancerToken: string;
  testWorkLogId: string;
  testInvoiceId: string;
  issues: { id: string; scenario: string; severity: string; description: string }[];
}

const context: TestContext = {
  adminToken: '',
  hrToken: '',
  freelancerToken: '',
  testWorkLogId: '',
  testInvoiceId: '',
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

test.describe.serial('审批流程端到端测试 - 前后端数据一致性验证', () => {
  
  test.beforeAll(async ({ request }) => {
    console.log('\n========================================');
    console.log('  审批流程端到端测试');
    console.log('  前后端数据一致性验证');
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
      throw new Error(`测试失败: 发现 ${context.issues.length} 个问题`);
    } else {
      console.log('✅ 所有测试通过，无问题发现\n');
    }
  });

  test('【APPROVAL-INIT】审批流程数据前置条件检查', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【APPROVAL-INIT】数据前置条件检查        │');
    console.log('└─────────────────────────────────────────┘\n');

    // 获取工时数据 - 使用 HR 专属 API
    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs/hr`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    
    if (!workLogsResponse.ok()) {
      logIssue('APPROVAL-INIT', 'P0', `HR 工时 API 调用失败: HTTP ${workLogsResponse.status()}`);
      throw new Error(`HR 工时 API 调用失败: HTTP ${workLogsResponse.status()}`);
    }
    
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];
    
    const submittedWorkLogs = workLogs.filter((w: any) => w.status === 'submitted');
    const draftWorkLogs = workLogs.filter((w: any) => w.status === 'draft');
    
    logInfo(`HR 公司工时数据: 总计${workLogs.length}条, 待审批${submittedWorkLogs.length}条, 草稿${draftWorkLogs.length}条`);
    
    if (submittedWorkLogs.length === 0) {
      logIssue('APPROVAL-INIT', 'P0', 'HR 公司没有待审批工时数据，请先运行 init-approval-test-data.ts');
      throw new Error('HR 公司没有待审批工时数据');
    }
    
    context.testWorkLogId = submittedWorkLogs[0]._id;
    logSuccess(`测试工时ID(待审批): ${context.testWorkLogId}`);

    // 获取发票数据 - 使用 HR 专属 API
    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices/company`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    
    if (!invoicesResponse.ok()) {
      logIssue('APPROVAL-INIT', 'P0', `HR 发票 API 调用失败: HTTP ${invoicesResponse.status()}`);
      throw new Error(`HR 发票 API 调用失败: HTTP ${invoicesResponse.status()}`);
    }
    
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];
    
    const submittedInvoices = invoices.filter((i: any) => i.status === 'submitted');
    const draftInvoices = invoices.filter((i: any) => i.status === 'draft');
    
    logInfo(`HR 公司发票数据: 总计${invoices.length}条, 待审批${submittedInvoices.length}条, 草稿${draftInvoices.length}条`);
    
    if (submittedInvoices.length === 0) {
      logIssue('APPROVAL-INIT', 'P0', 'HR 公司没有待审批发票数据，请先运行 init-approval-test-data.ts');
      throw new Error('HR 公司没有待审批发票数据');
    }
    
    context.testInvoiceId = submittedInvoices[0]._id;
    logSuccess(`测试发票ID(待审批): ${context.testInvoiceId}`);

    logSuccess('数据前置条件检查通过\n');
  });

  test('【WL-APPROVE】HR - 工时审批通过流程', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【WL-APPROVE】工时审批通过流程          │');
    console.log('└─────────────────────────────────────────┘\n');

    if (!context.testWorkLogId) {
      logIssue('WL-APPROVE', 'P0', '没有待审批工时ID');
      throw new Error('没有待审批工时ID');
    }

    // 使用 Freelancer token 获取工时详情（因为 HR 无法直接访问单个工时详情）
    const beforeResponse = await request.get(`${API_BASE_URL}/work-logs/${context.testWorkLogId}`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    
    if (!beforeResponse.ok()) {
      logIssue('WL-APPROVE', 'P0', `获取工时信息失败: HTTP ${beforeResponse.status()}`);
      throw new Error(`获取工时信息失败: HTTP ${beforeResponse.status()}`);
    }
    
    const beforeData = await beforeResponse.json();
    const beforeWorkLog = beforeData.data || beforeData;
    
    logInfo(`工时ID: ${context.testWorkLogId}`);
    logInfo(`审批前状态: ${beforeWorkLog.status}`);
    
    if (beforeWorkLog.status !== 'submitted') {
      logIssue('WL-APPROVE', 'P0', `工时状态不是submitted: ${beforeWorkLog.status}`);
      throw new Error(`工时状态不是submitted: ${beforeWorkLog.status}`);
    }

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('WL-APPROVE', 'P0', 'HR登录失败');
      throw new Error('HR登录失败');
    }
    logSuccess('HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/work-logs/pending`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    logInfo('导航到工时审批页面');

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs/hr`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data || [];
    logInfo(`后端待审批工时数据: ${workLogs.length} 条`);
    
    const tbody = page.locator('tbody');
    const rowCount = await tbody.locator('tr').count();
    logInfo(`表格行数: ${rowCount}`);
    
    if (rowCount === 0) {
      logIssue('WL-APPROVE', 'P0', '审批页面没有显示工时数据');
      throw new Error('审批页面没有显示工时数据');
    }

    const confirmBtn = page.locator('button[title="确认"], button:has(svg[class*="check"])').first();
    
    if (await confirmBtn.isVisible({ timeout: 5000 })) {
      logInfo('找到确认按钮，执行审批操作');
      
      const responsePromise = page.waitForResponse(resp => 
        resp.url().includes('/work-logs/') && resp.url().includes('/confirm') && resp.request().method() === 'POST'
      );
      
      await confirmBtn.click();
      
      try {
        const response = await responsePromise;
        logInfo(`API响应状态: ${response.status()}`);
      } catch (e) {
        logInfo(`等待API响应: ${e}`);
      }
      
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // 使用 Freelancer token 获取工时详情验证状态变化
      const afterResponse = await request.get(`${API_BASE_URL}/work-logs/${context.testWorkLogId}`, {
        headers: { Authorization: `Bearer ${context.freelancerToken}` }
      });
      
      if (!afterResponse.ok()) {
        logIssue('WL-APPROVE', 'P0', `获取审批后工时信息失败: HTTP ${afterResponse.status()}`);
        throw new Error(`获取审批后工时信息失败: HTTP ${afterResponse.status()}`);
      }
      
      const afterData = await afterResponse.json();
      const afterWorkLog = afterData.data || afterData;
      
      logInfo(`审批后状态: ${afterWorkLog.status}`);
      
      if (afterWorkLog.status === 'confirmed') {
        logSuccess('状态转换成功: submitted → confirmed');
        logSuccess('前后端数据一致: 工时审批通过');
      } else {
        logIssue('WL-APPROVE', 'P0', `状态转换失败: 期望=confirmed, 实际=${afterWorkLog.status}`);
        throw new Error(`状态转换失败: ${afterWorkLog.status}`);
      }
    } else {
      logIssue('WL-APPROVE', 'P0', '未找到审批按钮，页面可能没有正确渲染审批功能');
      throw new Error('未找到审批按钮');
    }

    await TestHelper.logout(page);
    logSuccess('工时审批通过流程验证完成\n');
  });

  test('【INV-APPROVE】HR - 发票审批通过流程', async ({ page, request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【INV-APPROVE】发票审批通过流程          │');
    console.log('└─────────────────────────────────────────┘\n');

    if (!context.testInvoiceId) {
      logIssue('INV-APPROVE', 'P0', '没有待审批发票ID');
      throw new Error('没有待审批发票ID');
    }

    const beforeResponse = await request.get(`${API_BASE_URL}/invoices/${context.testInvoiceId}`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    
    if (!beforeResponse.ok()) {
      logIssue('INV-APPROVE', 'P0', `获取发票信息失败: HTTP ${beforeResponse.status()}`);
      throw new Error(`获取发票信息失败: HTTP ${beforeResponse.status()}`);
    }
    
    const beforeData = await beforeResponse.json();
    const beforeInvoice = beforeData.invoice || beforeData.data || beforeData;
    
    logInfo(`发票ID: ${context.testInvoiceId}`);
    logInfo(`审批前状态: ${beforeInvoice.status}`);
    
    if (beforeInvoice.status !== 'submitted') {
      logIssue('INV-APPROVE', 'P0', `发票状态不是submitted: ${beforeInvoice.status}`);
      throw new Error(`发票状态不是submitted: ${beforeInvoice.status}`);
    }

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    if (!loginResult.success) {
      logIssue('INV-APPROVE', 'P0', 'HR登录失败');
      throw new Error('HR登录失败');
    }
    logSuccess('HR登录成功');

    await page.goto(`${FRONTEND_URL}/company/invoices/review`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    logInfo('导航到发票审批页面');

    const tbody = page.locator('tbody');
    const rowCount = await tbody.locator('tr').count();
    logInfo(`表格行数: ${rowCount}`);
    
    if (rowCount === 0) {
      logIssue('INV-APPROVE', 'P0', '发票审批页面没有显示发票数据');
      throw new Error('发票审批页面没有显示发票数据');
    }

    const approveBtn = page.locator('button[title="通过"], button:has(svg[class*="check"])').first();
    
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
        logInfo(`等待API响应超时: ${e}`);
      }
      
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const afterResponse = await request.get(`${API_BASE_URL}/invoices/${context.testInvoiceId}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      
      if (!afterResponse.ok()) {
        logIssue('INV-APPROVE', 'P0', `获取审批后发票信息失败: HTTP ${afterResponse.status()}`);
        throw new Error(`获取审批后发票信息失败: HTTP ${afterResponse.status()}`);
      }
      
      const afterData = await afterResponse.json();
      const afterInvoice = afterData.invoice || afterData.data || afterData;
      
      logInfo(`审批后状态: ${afterInvoice.status}`);
      
      if (afterInvoice.status === 'approved' || afterInvoice.status === '审核通过') {
        logSuccess('状态转换成功: submitted → approved');
        logSuccess('前后端数据一致: 发票审批通过');
      } else {
        logIssue('INV-APPROVE', 'P0', `状态转换失败: 期望=approved, 实际=${afterInvoice.status}`);
        throw new Error(`状态转换失败: ${afterInvoice.status}`);
      }
    } else {
      logIssue('INV-APPROVE', 'P0', '未找到审批按钮，发票审批功能可能存在问题');
      throw new Error('未找到审批按钮');
    }

    await TestHelper.logout(page);
    logSuccess('发票审批通过流程验证完成\n');
  });

  test('【FLOW-APPROVAL】完整审批业务链路验证', async ({ request }) => {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 【FLOW-APPROVAL】完整审批业务链路验证   │');
    console.log('└─────────────────────────────────────────┘\n');

    logInfo('验证审批流程数据一致性\n');

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    const workLogStatusCounts = {
      draft: workLogs.filter((w: any) => w.status === 'draft').length,
      submitted: workLogs.filter((w: any) => w.status === 'submitted').length,
      confirmed: workLogs.filter((w: any) => w.status === 'confirmed').length,
      rejected: workLogs.filter((w: any) => w.status === 'rejected').length,
    };
    
    logInfo('工时状态分布:');
    logInfo(`  草稿: ${workLogStatusCounts.draft} 条`);
    logInfo(`  待审批: ${workLogStatusCounts.submitted} 条`);
    logInfo(`  已确认: ${workLogStatusCounts.confirmed} 条`);
    logInfo(`  已驳回: ${workLogStatusCounts.rejected} 条`);

    const invoicesResponse = await request.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    const invoiceStatusCounts = {
      draft: invoices.filter((i: any) => i.status === 'draft').length,
      submitted: invoices.filter((i: any) => i.status === 'submitted').length,
      approved: invoices.filter((i: any) => i.status === 'approved').length,
      rejected: invoices.filter((i: any) => i.status === 'rejected').length,
    };
    
    logInfo('发票状态分布:');
    logInfo(`  草稿: ${invoiceStatusCounts.draft} 条`);
    logInfo(`  待审批: ${invoiceStatusCounts.submitted} 条`);
    logInfo(`  已通过: ${invoiceStatusCounts.approved} 条`);
    logInfo(`  已驳回: ${invoiceStatusCounts.rejected} 条`);

    if (workLogStatusCounts.confirmed === 0) {
      logIssue('FLOW-APPROVAL', 'P1', '没有已确认的工时，审批流程可能未成功执行');
    }

    logSuccess('审批业务链路验证完成');
    console.log('\n========================================');
    console.log('  审批流程端到端测试完成');
    console.log('========================================\n');
  });
});
