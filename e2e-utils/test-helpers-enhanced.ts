import { Page, APIRequestContext, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  userId?: string;
  token?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  freelancer1: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'Job Seeker',
  },
  freelancer2: {
    email: 'freelancer2@test.com',
    password: 'Test1234!',
    role: 'Job Seeker',
  },
  hr1: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'HR Recruiter',
  },
  hr2: {
    email: 'hr2@test.com',
    password: 'Test1234!',
    role: 'HR Recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'Administrator',
  },
};

export interface ConsoleError {
  type: string;
  text: string;
  timestamp: string;
  page?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  timestamp: string;
}

export class TestHelper {
  private static consoleErrors: ConsoleError[] = [];
  private static networkRequests: NetworkRequest[] = [];

  /**
   * 设置页面监控 - 捕获控制台错误和网络请求
   */
  static async setupPageMonitoring(page: Page): Promise<void> {
    this.consoleErrors = [];
    this.networkRequests = [];

    // 监控控制台错误
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || type === 'warning') {
        this.consoleErrors.push({
          type,
          text,
          timestamp: new Date().toISOString(),
          page: page.url(),
        });
        console.log(`[控制台${type.toUpperCase()}] ${text}`);
      }
    });

    // 监控网络请求
    page.on('request', request => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        status: 0,
        timestamp: new Date().toISOString(),
      });
    });

    page.on('response', async response => {
      const lastRequest = this.networkRequests[this.networkRequests.length - 1];
      if (lastRequest && lastRequest.url === response.url()) {
        lastRequest.status = response.status();
        
        if (response.status() >= 400) {
          try {
            const body = await response.text();
            console.log(`[网络错误 ${response.status()}] ${response.url()}: ${body}`);
          } catch {
            console.log(`[网络错误 ${response.status()}] ${response.url()}`);
          }
        }
      }
    });

    // 监控页面错误
    page.on('pageerror', error => {
      this.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        timestamp: new Date().toISOString(),
        page: page.url(),
      });
      console.log(`[页面错误] ${error.message}`);
    });
  }

  /**
   * 获取控制台错误
   */
  static getConsoleErrors(): ConsoleError[] {
    return this.consoleErrors;
  }

  /**
   * 获取网络请求
   */
  static getNetworkRequests(): NetworkRequest[] {
    return this.networkRequests;
  }

  /**
   * 清除错误记录
   */
  static clearErrors(): void {
    this.consoleErrors = [];
    this.networkRequests = [];
  }

  /**
   * 登录并验证
   */
  static async loginAsUser(page: Page, user: TestUser): Promise<{
    success: boolean;
    errors: ConsoleError[];
    userId?: string;
  }> {
    this.clearErrors();
    
    try {
      console.log(`\n📝 开始登录：${user.email}`);
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      
      const loginButton = page.locator('[data-testid="login-submit-btn"]');
      await loginButton.click();
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('/login');
      
      if (isLoggedIn) {
        console.log(`  ✅ 登录成功：${user.email}`);
        console.log(`     当前 URL: ${currentUrl}`);
        
        if (this.consoleErrors.length > 0) {
          console.log(`  ⚠️ 登录过程中有 ${this.consoleErrors.length} 个控制台错误`);
          this.consoleErrors.forEach(err => {
            console.log(`     - [${err.type}] ${err.text}`);
          });
        }
        
        return {
          success: true,
          errors: [...this.consoleErrors],
        };
      } else {
        console.log(`  ❌ 登录失败：${user.email}`);
        return {
          success: false,
          errors: [...this.consoleErrors],
        };
      }
    } catch (error) {
      console.error(`登录失败：${user.email}`, error);
      return {
        success: false,
        errors: [...this.consoleErrors],
      };
    }
  }

  /**
   * 导航到页面并验证
   */
  static async navigateToPage(
    page: Page, 
    urlPath: string, 
    expectedUrlPattern?: RegExp,
    timeout: number = 10000
  ): Promise<{
    success: boolean;
    errors: ConsoleError[];
    actualUrl: string;
  }> {
    console.log(`\n📝 导航到：${urlPath}`);
    this.clearErrors();
    
    try {
      await page.goto(`${BASE_URL}${urlPath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const actualUrl = page.url();
      console.log(`  ✅ 页面加载完成：${actualUrl}`);
      
      if (expectedUrlPattern && !expectedUrlPattern.test(actualUrl)) {
        console.log(`  ❌ URL 不匹配！期望：${expectedUrlPattern}, 实际：${actualUrl}`);
        return {
          success: false,
          errors: [...this.consoleErrors],
          actualUrl,
        };
      }
      
      if (this.consoleErrors.length > 0) {
        console.log(`  ⚠️ 页面加载有 ${this.consoleErrors.length} 个错误`);
        this.consoleErrors.forEach(err => {
          console.log(`     - [${err.type}] ${err.text}`);
        });
      }
      
      return {
        success: true,
        errors: [...this.consoleErrors],
        actualUrl,
      };
    } catch (error) {
      console.log(`  ❌ 导航失败：${urlPath}`, error);
      return {
        success: false,
        errors: [...this.consoleErrors],
        actualUrl: page.url(),
      };
    }
  }

  /**
   * 等待并验证元素存在
   */
  static async verifyElementExists(
    page: Page, 
    selector: string, 
    description: string,
    timeout: number = 5000
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout });
      console.log(`  ✅ ${description} 存在：${selector}`);
      return { exists: true };
    } catch (error) {
      console.log(`  ❌ ${description} 不存在：${selector}`);
      return { 
        exists: false, 
        error: `元素 ${selector} 在 ${timeout}ms 内未出现`,
      };
    }
  }

  /**
   * 填写表单并提交
   */
  static async fillFormAndSubmit(
    page: Page,
    formData: Record<string, string>,
    submitSelector: string,
    successMessage?: string
  ): Promise<{
    success: boolean;
    errors: ConsoleError[];
  }> {
    this.clearErrors();
    
    try {
      console.log(`\n📝 填写表单并提交`);
      
      for (const [selector, value] of Object.entries(formData)) {
        const input = page.locator(selector);
        await input.waitFor({ state: 'visible', timeout: 5000 });
        await input.fill(value);
        console.log(`  ✅ 填写：${selector} = ${value}`);
      }
      
      const submitButton = page.locator(submitSelector);
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      console.log(`  ✅ 表单提交成功`);
      
      if (successMessage) {
        const messageElement = page.locator(`text=${successMessage}`);
        const hasMessage = await messageElement.isVisible().catch(() => false);
        if (hasMessage) {
          console.log(`  ✅ 显示成功消息：${successMessage}`);
        }
      }
      
      if (this.consoleErrors.length > 0) {
        console.log(`  ⚠️ 表单提交有 ${this.consoleErrors.length} 个错误`);
        this.consoleErrors.forEach(err => {
          console.log(`     - [${err.type}] ${err.text}`);
        });
      }
      
      return {
        success: true,
        errors: [...this.consoleErrors],
      };
    } catch (error) {
      console.log(`  ❌ 表单提交失败`, error);
      return {
        success: false,
        errors: [...this.consoleErrors],
      };
    }
  }

  /**
   * 通用登出方法
   */
  static async logout(page: Page): Promise<void> {
    try {
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('登出过程发生异常:', error);
    }
  }

  /**
   * 调用 API 获取数据
   */
  static async getAPIData(request: APIRequestContext, url: string): Promise<any> {
    const response = await request.get(url);
    return response.json();
  }

  /**
   * 调用 API 提交数据
   */
  static async postAPIData(request: APIRequestContext, url: string, data: any): Promise<any> {
    const response = await request.post(url, { data });
    return response.json();
  }

  /**
   * 验证数据库数据
   */
  static async verifyDataInDatabase(
    request: APIRequestContext, 
    collection: string, 
    query: any
  ): Promise<any[]> {
    const response = await request.get(`${API_URL}/admin/${collection}?${new URLSearchParams(query)}`);
    const json = await response.json();
    return json.data || [];
  }

  /**
   * 截图
   */
  static async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `./e2e-test-screenshots/${timestamp}-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  /**
   * 等待 API 响应
   */
  static async waitForAPIResponse(page: Page, urlPattern: RegExp): Promise<any> {
    const response = await page.waitForResponse(resp => urlPattern.test(resp.url()));
    return response.json();
  }
}

export class DataVerifier {
  /**
   * 验证项目状态
   */
  static async verifyProjectStatus(
    request: APIRequestContext, 
    projectId: string, 
    expectedStatus: string
  ): Promise<{ valid: boolean; actual?: string; error?: string }> {
    try {
      const response = await request.get(`${API_URL}/projects/${projectId}`);
      const data = await response.json();
      const actualStatus = data.data?.status;
      
      if (actualStatus === expectedStatus) {
        console.log(`  ✅ 项目状态验证通过：${expectedStatus}`);
        return { valid: true, actual: actualStatus };
      } else {
        console.log(`  ❌ 项目状态不匹配！期望：${expectedStatus}, 实际：${actualStatus}`);
        return { valid: false, actual: actualStatus };
      }
    } catch (error) {
      console.log(`  ❌ 验证项目状态失败：${projectId}`, error);
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 验证工时状态
   */
  static async verifyWorkLogStatus(
    request: APIRequestContext, 
    workLogId: string, 
    expectedStatus: string
  ): Promise<{ valid: boolean; actual?: string; error?: string }> {
    try {
      const response = await request.get(`${API_URL}/work-logs/${workLogId}`);
      const data = await response.json();
      const actualStatus = data.data?.status;
      
      if (actualStatus === expectedStatus) {
        console.log(`  ✅ 工时状态验证通过：${expectedStatus}`);
        return { valid: true, actual: actualStatus };
      } else {
        console.log(`  ❌ 工时状态不匹配！期望：${expectedStatus}, 实际：${actualStatus}`);
        return { valid: false, actual: actualStatus };
      }
    } catch (error) {
      console.log(`  ❌ 验证工时状态失败：${workLogId}`, error);
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 验证发票状态
   */
  static async verifyInvoiceStatus(
    request: APIRequestContext, 
    invoiceId: string, 
    expectedStatus: string
  ): Promise<{ valid: boolean; actual?: string; error?: string }> {
    try {
      const response = await request.get(`${API_URL}/invoices/${invoiceId}`);
      const data = await response.json();
      const actualStatus = data.data?.status;
      
      if (actualStatus === expectedStatus) {
        console.log(`  ✅ 发票状态验证通过：${expectedStatus}`);
        return { valid: true, actual: actualStatus };
      } else {
        console.log(`  ❌ 发票状态不匹配！期望：${expectedStatus}, 实际：${actualStatus}`);
        return { valid: false, actual: actualStatus };
      }
    } catch (error) {
      console.log(`  ❌ 验证发票状态失败：${invoiceId}`, error);
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 验证公司数据存在
   */
  static async verifyCompanyExists(
    request: APIRequestContext, 
    companyName: string
  ): Promise<{ exists: boolean; company?: any }> {
    try {
      const response = await request.get(`${API_URL}/admin/companies`);
      const data = await response.json();
      const companies = data.data?.items || data.data || [];
      
      const company = companies.find((c: any) => c.company_name === companyName);
      
      if (company) {
        console.log(`  ✅ 公司数据验证通过：${companyName}`);
        return { exists: true, company };
      } else {
        console.log(`  ❌ 公司不存在：${companyName}`);
        return { exists: false };
      }
    } catch (error) {
      console.log(`  ❌ 验证公司数据失败：${companyName}`, error);
      return { exists: false };
    }
  }

  /**
   * 验证项目数据存在
   */
  static async verifyProjectExists(
    request: APIRequestContext, 
    projectTitle: string
  ): Promise<{ exists: boolean; project?: any }> {
    try {
      const response = await request.get(`${API_URL}/jobs`);
      const data = await response.json();
      const projects = data.data?.items || data.data || [];
      
      const project = projects.find((p: any) => p.title === projectTitle);
      
      if (project) {
        console.log(`  ✅ 项目数据验证通过：${projectTitle}`);
        return { exists: true, project };
      } else {
        console.log(`  ❌ 项目不存在：${projectTitle}`);
        return { exists: false };
      }
    } catch (error) {
      console.log(`  ❌ 验证项目数据失败：${projectTitle}`, error);
      return { exists: false };
    }
  }

  /**
   * 验证申请数据存在
   */
  static async verifyApplicationExists(
    request: APIRequestContext, 
    freelancerId: string,
    jobId: string
  ): Promise<{ exists: boolean; application?: any }> {
    try {
      const response = await request.get(`${API_URL}/applications?freelancer_id=${freelancerId}&job_id=${jobId}`);
      const data = await response.json();
      const applications = data.data?.items || data.data || [];
      
      if (applications.length > 0) {
        console.log(`  ✅ 申请数据验证通过`);
        return { exists: true, application: applications[0] };
      } else {
        console.log(`  ❌ 申请数据不存在`);
        return { exists: false };
      }
    } catch (error) {
      console.log(`  ❌ 验证申请数据失败`, error);
      return { exists: false };
    }
  }

  /**
   * 验证工时数量
   */
  static async verifyWorkLogCount(
    request: APIRequestContext, 
    freelancerId: string, 
    expectedCount: number
  ): Promise<{ valid: boolean; actual?: number }> {
    try {
      const response = await request.get(`${API_URL}/work-logs?freelancer_id=${freelancerId}`);
      const data = await response.json();
      const actualCount = data.data?.items?.length || 0;
      
      if (actualCount === expectedCount) {
        console.log(`  ✅ 工时数量验证通过：${expectedCount}`);
        return { valid: true, actual: actualCount };
      } else {
        console.log(`  ❌ 工时数量不匹配！期望：${expectedCount}, 实际：${actualCount}`);
        return { valid: false, actual: actualCount };
      }
    } catch (error) {
      console.log(`  ❌ 验证工时数量失败`, error);
      return { valid: false };
    }
  }

  /**
   * 验证发票数量
   */
  static async verifyInvoiceCount(
    request: APIRequestContext, 
    freelancerId: string, 
    expectedCount: number
  ): Promise<{ valid: boolean; actual?: number }> {
    try {
      const response = await request.get(`${API_URL}/invoices?freelancer_id=${freelancerId}`);
      const data = await response.json();
      const actualCount = data.data?.items?.length || 0;
      
      if (actualCount === expectedCount) {
        console.log(`  ✅ 发票数量验证通过：${expectedCount}`);
        return { valid: true, actual: actualCount };
      } else {
        console.log(`  ❌ 发票数量不匹配！期望：${expectedCount}, 实际：${actualCount}`);
        return { valid: false, actual: actualCount };
      }
    } catch (error) {
      console.log(`  ❌ 验证发票数量失败`, error);
      return { valid: false };
    }
  }
}

export class MasterDataChecker {
  static async checkCompanies(
    request: APIRequestContext, 
    minCount: number = 2
  ): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/companies`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkSkillCategories(
    request: APIRequestContext, 
    minCount: number = 2
  ): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/skills`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkSystemConfigs(
    request: APIRequestContext, 
    minCount: number = 20
  ): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/configs`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkAllMasterData(
    request: APIRequestContext
  ): Promise<{ passed: boolean; details: any }> {
    const companies = await this.checkCompanies(request, 2);
    const skills = await this.checkSkillCategories(request, 2);
    const configs = await this.checkSystemConfigs(request, 20);

    const passed = companies.passed && skills.passed && configs.passed;
    
    return {
      passed,
      details: {
        companies,
        skills,
        configs,
      },
    };
  }
}

export class IssueLogger {
  private issues: any[] = [];

  logIssue(issue: {
    category: 'UX' | 'LOGIC' | 'API' | 'UI' | 'PERMISSION' | 'DATA';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    expectedBehavior: string;
    actualBehavior: string;
    steps: string[];
    screenshot?: string;
    page?: string;
    userRole?: string;
    consoleErrors?: ConsoleError[];
    networkErrors?: NetworkRequest[];
  }) {
    const issueRecord = {
      ...issue,
      id: `ISS-${String(this.issues.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    };
    this.issues.push(issueRecord);
    console.log(`\n❗ [ISSUE] ${issueRecord.id}: ${issue.description}`);
    console.log(`   类别：${issue.category} | 严重性：${issue.severity}`);
    console.log(`   页面：${issue.page || 'N/A'}`);
    console.log(`   角色：${issue.userRole || 'N/A'}`);
    
    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      console.log(`   控制台错误 (${issue.consoleErrors.length}):`);
      issue.consoleErrors.forEach(err => {
        console.log(`     - [${err.type}] ${err.text}`);
      });
    }
    
    if (issue.networkErrors && issue.networkErrors.length > 0) {
      console.log(`   网络错误 (${issue.networkErrors.length}):`);
      issue.networkErrors.forEach(err => {
        console.log(`     - [${err.status}] ${err.method} ${err.url}`);
      });
    }
  }

  getIssues(): any[] {
    return this.issues;
  }

  getIssueCount(): number {
    return this.issues.length;
  }

  getCriticalCount(): number {
    return this.issues.filter(i => i.severity === 'CRITICAL').length;
  }

  getHighCount(): number {
    return this.issues.filter(i => i.severity === 'HIGH').length;
  }

  generateReport(): string {
    return JSON.stringify({
      summary: {
        total: this.issues.length,
        critical: this.getCriticalCount(),
        high: this.getHighCount(),
      },
      issues: this.issues,
    }, null, 2);
  }
}
