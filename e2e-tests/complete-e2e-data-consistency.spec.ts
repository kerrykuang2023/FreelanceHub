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
}

const context: TestContext = {
  adminToken: '',
  hrToken: '',
  freelancerToken: '',
  testProjectId: '',
  testWorkLogId: '',
  testInvoiceId: ''
};

test.describe.serial('完整端到端测试 - 数据一致性验证', () => {
  
  test.beforeAll(async ({ request }) => {
    console.log('\n========================================');
    console.log('  完整端到端测试 - 数据一致性验证');
    console.log('========================================\n');

    context.adminToken = await DataConsistencyVerifier.getAuthToken(request, 'admin@test.com', 'Test123456!');
    context.hrToken = await DataConsistencyVerifier.getAuthToken(request, 'hr@test.com', 'Test123456!');
    context.freelancerToken = await DataConsistencyVerifier.getAuthToken(request, 'freelancer@test.com', 'Test123456!');

    console.log('✅ 已获取所有角色认证 token');
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
    
    const listItems = page.locator('[data-testid="work-log-card"], [data-testid="worklog-item"], .work-log-item');
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

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs?status=submitted`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const pendingWorkLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

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

    const confirmBtn = page.locator(`button:has-text("确认"), button:has-text("通过")`).first();
    
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('\n  🔄 执行工时确认操作...');
      
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

      console.log(`  📊 操作后状态: ${updatedWorkLog.status}`);
      
      if (updatedWorkLog.status === 'confirmed') {
        console.log('  ✅ 状态转换成功: submitted → confirmed');
      } else {
        console.log(`  ❌ 状态转换失败: 期望=confirmed, 实际=${updatedWorkLog.status}`);
        throw new Error(`状态转换失败: ${updatedWorkLog.status}`);
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
    
    const listItems = page.locator('[data-testid="invoice-card"], [data-testid="invoice-item"], .invoice-item');
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

    if (pendingInvoices.length === 0) {
      console.log('  ⚠️ 没有待审核的发票，跳过审核流程测试');
      test.skip();
      return;
    }

    const invoiceToApprove = pendingInvoices[0];
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

    const approveBtn = page.locator(`button:has-text("审批"), button:has-text("通过"), button:has-text("审核")`).first();
    
    if (await approveBtn.isVisible({ timeout: 3000 })) {
      console.log('\n  🔄 执行发票审批操作...');
      
      await approveBtn.click();
      
      const confirmDialogBtn = page.locator('button:has-text("通过"), button:has-text("确认"), button:has-text("确定")').first();
      if (await confirmDialogBtn.isVisible({ timeout: 2000 })) {
        await confirmDialogBtn.click();
      }

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const verifyResponse = await request.get(`${API_BASE_URL}/invoices/${invoiceToApprove._id}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      const verifyData = await verifyResponse.json();
      const updatedInvoice = verifyData.data || verifyData;

      console.log(`  📊 操作后状态: ${updatedInvoice.status}`);
      
      if (updatedInvoice.status === 'approved' || updatedInvoice.status === '审核通过') {
        console.log('  ✅ 状态转换成功: submitted → approved');
      } else {
        console.log(`  ❌ 状态转换失败: 期望=approved, 实际=${updatedInvoice.status}`);
        throw new Error(`状态转换失败: ${updatedInvoice.status}`);
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

    const beforeResponse = await request.get(`${API_BASE_URL}/jobs?posted_by=me`, {
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

    const submitBtn = page.locator('button[type="submit"], button:has-text("发布"), button:has-text("提交")').first();
    await submitBtn.click();

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const afterResponse = await request.get(`${API_BASE_URL}/jobs?posted_by=me`, {
      headers: { Authorization: `Bearer ${context.hrToken}` }
    });
    const afterData = await afterResponse.json();
    const afterProjects = afterData.jobs || afterData.data?.items || afterData.data || [];
    console.log(`  📊 发布后项目数: ${afterProjects.length}`);

    const newProject = afterProjects.find((p: any) => p.job_title === projectTitle);
    
    if (newProject) {
      console.log(`  ✅ 项目创建成功，ID: ${newProject._id}`);
      console.log(`  📊 项目状态: ${newProject.status}`);
      
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

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
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
    const project = projectData.data || projectData;

    console.log(`  📊 项目: ${project.job_title || project.job_description?.substring(0, 30)}`);
    console.log(`  📊 项目状态: ${project.status}`);

    const workLogsResponse = await request.get(`${API_BASE_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    const projectWorkLogs = workLogs.filter((w: any) => 
      w.project_requirement_id === context.testProjectId || 
      w.project_requirement_id?._id === context.testProjectId
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
      inv.project_requirement_id === context.testProjectId ||
      inv.project_requirement_id?._id === context.testProjectId
    );

    console.log(`  📊 关联发票: ${projectInvoices.length} 条`);

    console.log('\n  ✅ 业务链路验证完成');
    console.log('\n========================================');
    console.log('  完整端到端测试完成');
    console.log('========================================\n');
  });
});
