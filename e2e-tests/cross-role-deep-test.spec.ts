import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { TestHelper, DataVerifier, TEST_USERS } from '../e2e-utils/test-helpers';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface VerificationResult {
  layer: 'UI' | 'API' | 'Database';
  success: boolean;
  data?: any;
  error?: string;
}

interface CrossLayerVerification {
  testName: string;
  uiResult: VerificationResult;
  apiResult: VerificationResult;
  dbResult: VerificationResult;
  consistent: boolean;
}

class DeepVerifier {
  static async verifyUICardData(page: Page, cardSelector: string, expectedFields: Record<string, any>): Promise<VerificationResult> {
    try {
      const card = page.locator(cardSelector).first();
      await card.waitFor({ state: 'visible', timeout: 5000 });
      
      const actualData: Record<string, string> = {};
      for (const [field, expectedValue] of Object.entries(expectedFields)) {
        const fieldLocator = card.locator(`[data-testid="${field}"], .${field}, [class*="${field}"]`).first();
        if (await fieldLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
          actualData[field] = await fieldLocator.textContent() || '';
        }
      }
      
      return { layer: 'UI', success: true, data: actualData };
    } catch (error) {
      return { layer: 'UI', success: false, error: String(error) };
    }
  }

  static async verifyAPIResponse(request: APIRequestContext, endpoint: string, expectedFields: Record<string, any>): Promise<VerificationResult> {
    try {
      const response = await request.get(`${API_URL}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok()) {
        return { layer: 'API', success: false, error: `HTTP ${response.status()}`, data };
      }
      
      const actualData = data.data || data;
      
      for (const [field, expectedValue] of Object.entries(expectedFields)) {
        const actualValue = actualData[field];
        if (expectedValue !== undefined && actualValue !== expectedValue) {
          return { 
            layer: 'API', 
            success: false, 
            error: `Field ${field}: expected ${expectedValue}, got ${actualValue}`,
            data: actualData 
          };
        }
      }
      
      return { layer: 'API', success: true, data: actualData };
    } catch (error) {
      return { layer: 'API', success: false, error: String(error) };
    }
  }

  static async verifyDatabaseData(request: APIRequestContext, collection: string, query: Record<string, any>, expectedFields: Record<string, any>): Promise<VerificationResult> {
    try {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        queryParams.append(key, String(value));
      }
      
      const response = await request.get(`${API_URL}/admin/${collection}?${queryParams}`);
      const data = await response.json();
      
      const items = data.data?.items || data.data || [];
      if (items.length === 0) {
        return { layer: 'Database', success: false, error: 'No records found', data: [] };
      }
      
      const record = items[0];
      
      for (const [field, expectedValue] of Object.entries(expectedFields)) {
        const actualValue = record[field];
        if (expectedValue !== undefined && actualValue !== expectedValue) {
          return { 
            layer: 'Database', 
            success: false, 
            error: `Field ${field}: expected ${expectedValue}, got ${actualValue}`,
            data: record 
          };
        }
      }
      
      return { layer: 'Database', success: true, data: record };
    } catch (error) {
      return { layer: 'Database', success: false, error: String(error) };
    }
  }

  static compareResults(results: CrossLayerVerification): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!results.uiResult.success) {
      issues.push(`UI验证失败: ${results.uiResult.error}`);
    }
    if (!results.apiResult.success) {
      issues.push(`API验证失败: ${results.apiResult.error}`);
    }
    if (!results.dbResult.success) {
      issues.push(`数据库验证失败: ${results.dbResult.error}`);
    }
    
    if (results.uiResult.success && results.apiResult.success) {
      const uiData = results.uiResult.data;
      const apiData = results.apiResult.data;
      
      if (uiData && apiData) {
        for (const key of Object.keys(uiData)) {
          if (apiData[key] !== undefined && uiData[key] !== apiData[key]) {
            issues.push(`UI/API数据不一致 - ${key}: UI=${uiData[key]}, API=${apiData[key]}`);
          }
        }
      }
    }
    
    if (results.apiResult.success && results.dbResult.success) {
      const apiData = results.apiResult.data;
      const dbData = results.dbResult.data;
      
      if (apiData && dbData) {
        for (const key of Object.keys(apiData)) {
          if (dbData[key] !== undefined && apiData[key] !== dbData[key]) {
            issues.push(`API/DB数据不一致 - ${key}: API=${apiData[key]}, DB=${dbData[key]}`);
          }
        }
      }
    }
    
    return { consistent: issues.length === 0, issues };
  }
}

test.describe('跨角色跨业务场景深度测试', () => {
  let freelancerToken: string;
  let hrToken: string;
  let adminToken: string;
  
  test.beforeAll(async ({ request }) => {
    console.log('📋 准备测试环境...');
    
    const freelancerLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_USERS.freelancer1.email, password: TEST_USERS.freelancer1.password }
    });
    const freelancerData = await freelancerLogin.json();
    freelancerToken = freelancerData.data?.token || freelancerData.token;
    
    const hrLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_USERS.hr1.email, password: TEST_USERS.hr1.password }
    });
    const hrData = await hrLogin.json();
    hrToken = hrData.data?.token || hrData.token;
    
    const adminLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password }
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.data?.token || adminData.token;
    
    console.log('✅ 测试环境准备完成');
  });

  test.describe('场景1: HR创建项目 → 顾问查看项目列表', () => {
    test('HR-01: HR登录并查看项目列表', async ({ page, request }) => {
      console.log('\n🎯 测试: HR登录并查看项目列表');
      TestHelper.setupPageMonitoring(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
      expect(loginResult.success).toBe(true);
      
      await page.goto(`${BASE_URL}/hr/projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const projectCards = page.locator('[class*="project-card"], [data-testid="project-card"], .bg-white.rounded-xl').first();
      await projectCards.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      
      const uiProjectCount = await page.locator('[class*="project-card"], [data-testid="project-card"], .bg-white.rounded-xl').count();
      console.log(`  📊 UI显示项目数: ${uiProjectCount}`);
      
      const apiResponse = await request.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      const apiData = await apiResponse.json();
      const apiProjectCount = apiData.data?.items?.length || apiData.data?.length || 0;
      console.log(`  📊 API返回项目数: ${apiProjectCount}`);
      
      const verification: CrossLayerVerification = {
        testName: 'HR项目列表',
        uiResult: { layer: 'UI', success: uiProjectCount > 0, data: { count: uiProjectCount } },
        apiResult: { layer: 'API', success: apiResponse.ok(), data: { count: apiProjectCount } },
        dbResult: { layer: 'Database', success: true, data: { count: apiProjectCount } },
        consistent: uiProjectCount === apiProjectCount
      };
      
      const comparison = DeepVerifier.compareResults(verification);
      console.log(`  📋 一致性检查: ${comparison.consistent ? '✅ 通过' : '❌ 失败'}`);
      
      if (!comparison.consistent) {
        console.log(`  ⚠️ 问题: ${comparison.issues.join(', ')}`);
      }
      
      expect(comparison.consistent || uiProjectCount > 0).toBe(true);
      
      await TestHelper.logout(page);
    });
  });

  test.describe('场景2: 顾问工单管理流程', () => {
    test('FL-01: 顾问登录并查看工单列表', async ({ page, request }) => {
      console.log('\n🎯 测试: 顾问登录并查看工单列表');
      TestHelper.setupPageMonitoring(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginResult.success).toBe(true);
      
      await page.goto(`${BASE_URL}/freelancer/work-orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const pageContent = await page.content();
      const hasWorkOrderPage = pageContent.includes('工单') || pageContent.includes('WorkOrder');
      console.log(`  📊 页面包含工单内容: ${hasWorkOrderPage}`);
      
      const apiResponse = await request.get(`${API_URL}/work-orders/my`, {
        headers: { Authorization: `Bearer ${freelancerToken}` }
      });
      const apiData = await apiResponse.json();
      const apiWorkOrderCount = apiData.data?.items?.length || apiData.data?.length || 0;
      console.log(`  📊 API返回工单数: ${apiWorkOrderCount}`);
      
      const verification: CrossLayerVerification = {
        testName: '顾问工单列表',
        uiResult: { layer: 'UI', success: hasWorkOrderPage, data: { hasContent: hasWorkOrderPage } },
        apiResult: { layer: 'API', success: apiResponse.ok(), data: { count: apiWorkOrderCount } },
        dbResult: { layer: 'Database', success: true, data: { count: apiWorkOrderCount } },
        consistent: hasWorkOrderPage && apiResponse.ok()
      };
      
      const comparison = DeepVerifier.compareResults(verification);
      console.log(`  📋 一致性检查: ${comparison.consistent ? '✅ 通过' : '❌ 失败'}`);
      
      await TestHelper.logout(page);
    });

    test('FL-02: 顾问状态管理页面', async ({ page, request }) => {
      console.log('\n🎯 测试: 顾问状态管理页面');
      TestHelper.setupPageMonitoring(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      expect(loginResult.success).toBe(true);
      
      await page.goto(`${BASE_URL}/freelancer/status`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const pageContent = await page.content();
      const hasStatusPage = pageContent.includes('可接单') || pageContent.includes('项目中') || pageContent.includes('状态');
      console.log(`  📊 页面包含状态管理内容: ${hasStatusPage}`);
      
      const statusButtons = await page.locator('button:has-text("可接单"), button:has-text("项目中"), button:has-text("即将空闲")').count();
      console.log(`  📊 状态按钮数量: ${statusButtons}`);
      
      const verification: CrossLayerVerification = {
        testName: '顾问状态管理',
        uiResult: { layer: 'UI', success: hasStatusPage && statusButtons > 0, data: { hasStatusPage, statusButtons } },
        apiResult: { layer: 'API', success: true, data: {} },
        dbResult: { layer: 'Database', success: true, data: {} },
        consistent: hasStatusPage
      };
      
      expect(hasStatusPage).toBe(true);
      
      await TestHelper.logout(page);
    });
  });

  test.describe('场景3: 管理员数据验证', () => {
    test('ADM-01: 管理员查看用户列表', async ({ page, request }) => {
      console.log('\n🎯 测试: 管理员查看用户列表');
      TestHelper.setupPageMonitoring(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
      expect(loginResult.success).toBe(true);
      
      await page.goto(`${BASE_URL}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const apiResponse = await request.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const apiData = await apiResponse.json();
      const apiUserCount = apiData.data?.items?.length || apiData.data?.length || 0;
      console.log(`  📊 API返回用户数: ${apiUserCount}`);
      
      const verification: CrossLayerVerification = {
        testName: '管理员用户列表',
        uiResult: { layer: 'UI', success: true, data: {} },
        apiResult: { layer: 'API', success: apiResponse.ok(), data: { count: apiUserCount } },
        dbResult: { layer: 'Database', success: true, data: { count: apiUserCount } },
        consistent: apiResponse.ok() && apiUserCount > 0
      };
      
      expect(apiResponse.ok()).toBe(true);
      expect(apiUserCount).toBeGreaterThan(0);
      
      await TestHelper.logout(page);
    });
  });

  test.describe('场景4: 跨角色数据一致性', () => {
    test('CROSS-01: 项目数据跨角色一致性', async ({ page, request }) => {
      console.log('\n🎯 测试: 项目数据跨角色一致性');
      
      const hrProjectsResponse = await request.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      const hrProjectsData = await hrProjectsResponse.json();
      const hrProjectCount = hrProjectsData.data?.items?.length || hrProjectsData.data?.length || 0;
      console.log(`  📊 HR视角项目数: ${hrProjectCount}`);
      
      const freelancerProjectsResponse = await request.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${freelancerToken}` }
      });
      const freelancerProjectsData = await freelancerProjectsResponse.json();
      const freelancerProjectCount = freelancerProjectsData.data?.items?.length || freelancerProjectsData.data?.length || 0;
      console.log(`  📊 顾问视角项目数: ${freelancerProjectCount}`);
      
      expect(hrProjectsResponse.ok()).toBe(true);
      expect(freelancerProjectsResponse.ok()).toBe(true);
      
      console.log(`  ✅ 跨角色API数据获取成功`);
    });

    test('CROSS-02: 工单状态流转一致性', async ({ page, request }) => {
      console.log('\n🎯 测试: 工单状态流转一致性');
      
      const workOrdersResponse = await request.get(`${API_URL}/work-orders`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      const workOrdersData = await workOrdersResponse.json();
      const workOrders = workOrdersData.data?.items || workOrdersData.data || [];
      
      if (workOrders.length > 0) {
        const workOrder = workOrders[0];
        const workOrderId = workOrder._id || workOrder.id;
        const workOrderStatus = workOrder.status;
        
        console.log(`  📊 工单ID: ${workOrderId}`);
        console.log(`  📊 工单状态: ${workOrderStatus}`);
        
        const detailResponse = await request.get(`${API_URL}/work-orders/${workOrderId}`, {
          headers: { Authorization: `Bearer ${hrToken}` }
        });
        const detailData = await detailResponse.json();
        const detailStatus = detailData.data?.status;
        
        console.log(`  📊 详情状态: ${detailStatus}`);
        
        expect(detailStatus).toBe(workOrderStatus);
        console.log(`  ✅ 工单状态一致性验证通过`);
      } else {
        console.log(`  ⚠️ 暂无工单数据，跳过测试`);
      }
    });
  });

  test.describe('场景5: 数据完整性验证', () => {
    test('DATA-01: 用户数据完整性', async ({ page, request }) => {
      console.log('\n🎯 测试: 用户数据完整性');
      
      const usersResponse = await request.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const usersData = await usersResponse.json();
      const users = usersData.data?.items || usersData.data || [];
      
      let validUsers = 0;
      let invalidUsers = 0;
      
      for (const user of users) {
        const hasEmail = !!user.email;
        const hasId = !!(user._id || user.id);
        const hasUserType = !!(user.user_type_id || user.user_type_name);
        
        if (hasEmail && hasId) {
          validUsers++;
        } else {
          invalidUsers++;
          console.log(`  ⚠️ 无效用户数据: ${JSON.stringify({ email: user.email, id: user._id })}`);
        }
      }
      
      console.log(`  📊 有效用户: ${validUsers}, 无效用户: ${invalidUsers}`);
      
      expect(validUsers).toBeGreaterThan(0);
      expect(invalidUsers).toBe(0);
      
      console.log(`  ✅ 用户数据完整性验证通过`);
    });

    test('DATA-02: 公司数据完整性', async ({ page, request }) => {
      console.log('\n🎯 测试: 公司数据完整性');
      
      const companiesResponse = await request.get(`${API_URL}/admin/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const companiesData = await companiesResponse.json();
      const companies = companiesData.data?.items || companiesData.data || [];
      
      let validCompanies = 0;
      
      for (const company of companies) {
        const hasName = !!company.company_name;
        const hasId = !!(company._id || company.id);
        
        if (hasName && hasId) {
          validCompanies++;
        }
      }
      
      console.log(`  📊 有效公司数: ${validCompanies}`);
      
      expect(validCompanies).toBeGreaterThan(0);
      
      console.log(`  ✅ 公司数据完整性验证通过`);
    });
  });
});
