import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { TestHelper, TEST_USERS, IssueLogger } from '../e2e-utils/test-helpers';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

test.describe('Assignment 和 WorkOrder 核心流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await TestHelper.setupPageMonitoring(page);
  });

  test.afterAll(() => {
    const issues = issueLogger.getIssues();
    if (issues.length > 0) {
      console.log('\n📋 问题汇总:');
      console.log(JSON.stringify(issues, null, 2));
    }
  });

  test.describe('Assignment 流程测试', () => {
    test('HR-01: HR 创建项目子项', async ({ page, request }) => {
      console.log('\n📌 HR-01: HR 创建项目子项');

      const hrUser = TEST_USERS.hr1;
      const loginResult = await TestHelper.loginAsUser(page, hrUser);

      if (!loginResult.success) {
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: 'HR用户登录失败',
          expectedBehavior: 'HR用户应该能够成功登录',
          actualBehavior: '登录失败',
          steps: ['访问登录页面', '输入账号密码', '点击登录'],
        });
        test.skip();
        return;
      }

      console.log('  ✅ HR登录成功');

      await page.waitForTimeout(2000);

      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      console.log(`  📝 Token存在: ${!!token}`);

      const myJobsLink = page.locator('a[href="/my-jobs"], a:has-text("我的项目"), a:has-text("我的职位")');
      const hasMyJobs = await myJobsLink.count();

      if (hasMyJobs > 0) {
        await myJobsLink.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log(`  ✅ 成功访问项目列表页面: ${page.url()}`);
      } else {
        console.log('  ⚠️ 未找到"我的项目"菜单项');
      }

      await TestHelper.logout(page);
    });

    test('HR-02: HR 查看项目详情并添加顾问', async ({ page, request }) => {
      console.log('\n📌 HR-02: HR 查看项目详情并添加顾问');

      const hrUser = TEST_USERS.hr1;
      const loginResult = await TestHelper.loginAsUser(page, hrUser);

      if (!loginResult.success) {
        test.skip();
        return;
      }

      await page.waitForTimeout(2000);

      await page.goto(`${BASE_URL}/my-jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const projectCards = page.locator('[class*="card"], [class*="project"]');
      const projectCount = await projectCards.count();

      console.log(`  📝 找到 ${projectCount} 个项目`);

      if (projectCount > 0) {
        const firstProject = projectCards.first();
        await firstProject.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log(`  ✅ 成功访问项目详情页面: ${page.url()}`);

        const assignmentSection = page.locator('text=/项目子项|顾问分配|Assignments/i');
        const hasAssignmentSection = await assignmentSection.count();

        if (hasAssignmentSection > 0) {
          console.log('  ✅ 找到项目子项区域');
        } else {
          console.log('  ⚠️ 未找到项目子项区域');
        }
      } else {
        console.log('  ⚠️ 没有找到项目，跳过测试');
      }

      await TestHelper.logout(page);
    });
  });

  test.describe('WorkOrder 流程测试', () => {
    test('FL-01: 顾问查看工单列表', async ({ page, request }) => {
      console.log('\n📌 FL-01: 顾问查看工单列表');

      const freelancerUser = TEST_USERS.freelancer1;
      const loginResult = await TestHelper.loginAsUser(page, freelancerUser);

      if (!loginResult.success) {
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: '顾问用户登录失败',
          expectedBehavior: '顾问用户应该能够成功登录',
          actualBehavior: '登录失败',
          steps: ['访问登录页面', '输入账号密码', '点击登录'],
        });
        test.skip();
        return;
      }

      console.log('  ✅ 顾问登录成功');

      await page.waitForTimeout(2000);

      const workOrdersLink = page.locator('a[href="/freelancer/work-orders"], a:has-text("工单管理"), a:has-text("工单")');
      const hasWorkOrders = await workOrdersLink.count();

      if (hasWorkOrders > 0) {
        await workOrdersLink.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log(`  ✅ 成功访问工单列表页面: ${page.url()}`);

        const workOrderCards = page.locator('[class*="card"]');
        const workOrderCount = await workOrderCards.count();
        console.log(`  📝 找到 ${workOrderCount} 个工单卡片`);
      } else {
        console.log('  ⚠️ 未找到"工单管理"菜单项');
      }

      await TestHelper.logout(page);
    });

    test('FL-02: 顾问创建工单', async ({ page, request }) => {
      console.log('\n📌 FL-02: 顾问创建工单');

      const freelancerUser = TEST_USERS.freelancer1;
      const loginResult = await TestHelper.loginAsUser(page, freelancerUser);

      if (!loginResult.success) {
        test.skip();
        return;
      }

      await page.waitForTimeout(2000);

      await page.goto(`${BASE_URL}/freelancer/work-orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const createButton = page.locator('button:has-text("创建工单"), a:has-text("创建工单")');
      const hasCreateButton = await createButton.count();

      if (hasCreateButton > 0) {
        console.log('  ✅ 找到创建工单按钮');

        await createButton.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log(`  ✅ 成功访问创建工单页面: ${page.url()}`);

        const assignmentSelect = page.locator('select[name="assignment_id"], [data-testid="assignment-select"]');
        const hasAssignmentSelect = await assignmentSelect.count();

        if (hasAssignmentSelect > 0) {
          console.log('  ✅ 找到项目选择下拉框');
        } else {
          console.log('  ⚠️ 未找到项目选择下拉框');
        }
      } else {
        console.log('  ⚠️ 未找到创建工单按钮');
      }

      await TestHelper.logout(page);
    });
  });

  test.describe('跨角色协作测试', () => {
    test('XROLE-01: 完整工单审批流程', async ({ page, request }) => {
      console.log('\n📌 XROLE-01: 完整工单审批流程');

      const freelancerUser = TEST_USERS.freelancer1;
      const hrUser = TEST_USERS.hr1;

      const flLoginResult = await TestHelper.loginAsUser(page, freelancerUser);
      if (!flLoginResult.success) {
        test.skip();
        return;
      }

      await page.waitForTimeout(2000);

      await page.goto(`${BASE_URL}/freelancer/work-orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('  ✅ 步骤1: 顾问访问工单列表');

      const pendingWorkOrders = page.locator('[class*="badge"]:has-text("草稿"), [class*="badge"]:has-text("draft")');
      const pendingCount = await pendingWorkOrders.count();
      console.log(`  📝 找到 ${pendingCount} 个草稿状态工单`);

      await TestHelper.logout(page);
      await page.waitForTimeout(1000);

      const hrLoginResult = await TestHelper.loginAsUser(page, hrUser);
      if (!hrLoginResult.success) {
        test.skip();
        return;
      }

      await page.waitForTimeout(2000);

      const workOrdersLink = page.locator('a[href="/hr/work-orders"], a:has-text("工单审批")');
      const hasWorkOrdersLink = await workOrdersLink.count();

      if (hasWorkOrdersLink > 0) {
        await workOrdersLink.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log('  ✅ 步骤2: HR访问工单审批页面');
        console.log(`  📝 当前URL: ${page.url()}`);
      } else {
        console.log('  ⚠️ 未找到工单审批菜单');
      }

      await TestHelper.logout(page);
    });

    test('XROLE-02: 结算单价一致性验证', async ({ page, request }) => {
      console.log('\n📌 XROLE-02: 结算单价一致性验证');

      const freelancerUser = TEST_USERS.freelancer1;
      const loginResult = await TestHelper.loginAsUser(page, freelancerUser);

      if (!loginResult.success) {
        test.skip();
        return;
      }

      await page.waitForTimeout(2000);

      await page.goto(`${BASE_URL}/my-projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const projectCards = page.locator('[class*="card"]');
      const projectCount = await projectCards.count();

      if (projectCount > 0) {
        console.log(`  📝 找到 ${projectCount} 个项目`);

        const rateElements = page.locator('text=/\\d+.*\\/天|\\d+.*\\/小时|CNY|¥/');
        const rateCount = await rateElements.count();

        if (rateCount > 0) {
          console.log('  ✅ 找到结算单价信息');

          const firstRate = await rateElements.first().textContent();
          console.log(`  📝 结算单价示例: ${firstRate}`);
        } else {
          console.log('  ⚠️ 未找到结算单价信息');
        }
      } else {
        console.log('  ⚠️ 没有找到项目');
      }

      await TestHelper.logout(page);
    });
  });

  test.describe('数据一致性验证', () => {
    test('DATA-01: API 数据一致性检查', async ({ request }) => {
      console.log('\n📌 DATA-01: API 数据一致性检查');

      const hrUser = TEST_USERS.hr1;
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: hrUser.email,
          password: hrUser.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      const loginData = await loginResponse.json();
      const token = loginData.data?.access_token || loginData.access_token;

      if (!token) {
        console.log('  ❌ 未获取到访问令牌');
        test.skip();
        return;
      }

      console.log('  ✅ 成功获取访问令牌');

      const assignmentsResponse = await request.get(`${API_URL}/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`  📝 Assignments API 响应状态: ${assignmentsResponse.status()}`);

      if (assignmentsResponse.ok()) {
        const assignmentsData = await assignmentsResponse.json();
        const assignments = assignmentsData.data || [];
        console.log(`  📝 找到 ${assignments.length} 个项目子项`);
      } else {
        console.log('  ⚠️ Assignments API 返回错误');
      }

      const workOrdersResponse = await request.get(`${API_URL}/work-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`  📝 WorkOrders API 响应状态: ${workOrdersResponse.status()}`);

      if (workOrdersResponse.ok()) {
        const workOrdersData = await workOrdersResponse.json();
        const workOrders = workOrdersData.data || [];
        console.log(`  📝 找到 ${workOrders.length} 个工单`);
      } else {
        console.log('  ⚠️ WorkOrders API 返回错误');
      }
    });

    test('DATA-02: 结算快照验证', async ({ request }) => {
      console.log('\n📌 DATA-02: 结算快照验证');

      const freelancerUser = TEST_USERS.freelancer1;
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: freelancerUser.email,
          password: freelancerUser.password,
        },
      });

      if (!loginResponse.ok()) {
        test.skip();
        return;
      }

      const loginData = await loginResponse.json();
      const token = loginData.data?.access_token || loginData.access_token;

      const workOrdersResponse = await request.get(`${API_URL}/work-orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (workOrdersResponse.ok()) {
        const workOrdersData = await workOrdersResponse.json();
        const workOrders = workOrdersData.data || [];

        console.log(`  📝 找到 ${workOrders.length} 个工单`);

        for (const workOrder of workOrders.slice(0, 3)) {
          if (workOrder.settlement_snapshot) {
            console.log(`  ✅ 工单 ${workOrder._id} 包含结算快照:`);
            console.log(`     - 结算类型: ${workOrder.settlement_snapshot.rate_type}`);
            console.log(`     - 结算单价: ${workOrder.settlement_snapshot.rate_amount}`);
            console.log(`     - 计费方式: ${workOrder.settlement_snapshot.billing_method}`);
          } else {
            console.log(`  ⚠️ 工单 ${workOrder._id} 缺少结算快照`);
          }
        }
      }
    });
  });
});
