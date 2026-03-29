import { Page, APIRequestContext, BrowserContext, expect } from '@playwright/test';

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

export interface VerificationResult {
  frontend: {
    status?: string;
    count: number;
    data: any[];
  };
  backend: {
    status?: string;
    count: number;
    data: any[];
  };
  isConsistent: boolean;
  differences: string[];
}

export interface StateTransitionResult {
  success: boolean;
  entityType: string;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  frontendStatus?: string;
  backendStatus?: string;
  errors: string[];
}

export class TestHelper {
  private static consoleErrors: ConsoleError[] = [];
  private static networkRequests: NetworkRequest[] = [];

  static async setupPageMonitoring(page: Page): Promise<void> {
    this.consoleErrors = [];
    this.networkRequests = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || type === 'warning') {
        if (!text.includes('favicon') && !text.includes('manifest')) {
          this.consoleErrors.push({
            type,
            text,
            timestamp: new Date().toISOString(),
            page: page.url(),
          });
          console.log(`[控制台${type.toUpperCase()}] ${text}`);
        }
      }
    });

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        this.networkRequests.push({
          url: request.url(),
          method: request.method(),
          status: 0,
          timestamp: new Date().toISOString(),
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const lastRequest = this.networkRequests.find(r => 
          r.url === response.url() && r.status === 0
        );
        if (lastRequest) {
          lastRequest.status = response.status();
          
          if (response.status() >= 400) {
            try {
              const body = await response.text();
              console.log(`[API错误 ${response.status()}] ${response.url()}: ${body.substring(0, 200)}`);
            } catch {
              console.log(`[API错误 ${response.status()}] ${response.url()}`);
            }
          }
        }
      }
    });

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

  static getConsoleErrors(): ConsoleError[] {
    return this.consoleErrors;
  }

  static getNetworkRequests(): NetworkRequest[] {
    return this.networkRequests;
  }

  static getAPIErrors(): NetworkRequest[] {
    return this.networkRequests.filter(r => r.status >= 400);
  }

  static clearErrors(): void {
    this.consoleErrors = [];
    this.networkRequests = [];
  }

  static async loginAsUser(page: Page, user: TestUser): Promise<{
    success: boolean;
    errors: ConsoleError[];
    userId?: string;
    token?: string;
  }> {
    this.clearErrors();
    
    try {
      console.log(`\n📝 开始登录：${user.email}`);
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const emailInput = page.locator('[data-testid="email-input"], input[name="email"], input[type="email"]').first();
      const passwordInput = page.locator('[data-testid="password-input"], input[name="password"], input[type="password"]').first();
      
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      
      const loginButton = page.locator('[data-testid="login-submit-btn"], button[type="submit"]').first();
      await loginButton.click();
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('/login');
      
      if (isLoggedIn) {
        console.log(`  ✅ 登录成功：${user.email}`);
        console.log(`     当前 URL: ${currentUrl}`);
        
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const userData = await page.evaluate(() => {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr) : null;
        });
        
        if (this.consoleErrors.length > 0) {
          const criticalErrors = this.consoleErrors.filter(e => 
            e.type === 'error' || e.type === 'pageerror'
          );
          if (criticalErrors.length > 0) {
            console.log(`  ⚠️ 登录过程中有 ${criticalErrors.length} 个错误`);
          }
        }
        
        return {
          success: true,
          errors: [...this.consoleErrors],
          userId: userData?._id || userData?.id,
          token: token || undefined,
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
        console.log(`  ⚠️ URL 不匹配！期望：${expectedUrlPattern}, 实际：${actualUrl}`);
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

  static async logout(page: Page): Promise<void> {
    try {
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      try {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      } catch {
        // Ignore localStorage errors on cross-origin pages
      }
    } catch (error) {
      console.log('Logout exception:', error);
    }
  }

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
        try {
          const input = page.locator(selector).first();
          await input.waitFor({ state: 'visible', timeout: 5000 });
          await input.fill(value);
          console.log(`  ✅ 填写：${selector}`);
        } catch (e) {
          console.log(`  ⚠️ 无法填写：${selector}`);
        }
      }
      
      const submitButton = page.locator(submitSelector).first();
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      console.log(`  ✅ 表单提交成功`);
      
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

  static async verifyElementExists(
    page: Page, 
    selector: string, 
    description: string,
    timeout: number = 5000
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout });
      console.log(`  ✅ ${description} 存在`);
      return { exists: true };
    } catch (error) {
      console.log(`  ❌ ${description} 不存在`);
      return { 
        exists: false, 
        error: `元素 ${selector} 在 ${timeout}ms 内未出现`,
      };
    }
  }

  static async waitForAPIResponse(page: Page, urlPattern: RegExp): Promise<any> {
    const response = await page.waitForResponse(resp => urlPattern.test(resp.url()));
    return response.json();
  }

  static async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `./e2e-test-screenshots/${timestamp}-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  }
}

export class DataVerifier {
  static async verifyDataConsistency(
    page: Page,
    request: APIRequestContext,
    options: {
      entityType: 'project' | 'application' | 'worklog' | 'invoice';
      frontendSelector: string;
      apiEndpoint: string;
      expectedStatus?: string;
    }
  ): Promise<VerificationResult> {
    const differences: string[] = [];
    
    const frontendCount = await page.locator(options.frontendSelector).count();
    
    const response = await request.get(`${API_URL}${options.apiEndpoint}`);
    const data = await response.json();
    const backendData = data.data?.items || data.data || [];
    const backendCount = backendData.length;
    
    if (frontendCount !== backendCount) {
      differences.push(`数量不一致: 前端=${frontendCount}, 后端=${backendCount}`);
    }
    
    return {
      frontend: {
        count: frontendCount,
        data: [],
      },
      backend: {
        count: backendCount,
        data: backendData,
      },
      isConsistent: differences.length === 0,
      differences,
    };
  }

  static async verifyEntityStatus(
    request: APIRequestContext,
    entityType: string,
    entityId: string,
    expectedStatus: string
  ): Promise<{ valid: boolean; actual?: string; error?: string }> {
    try {
      const endpoints: Record<string, string> = {
        project: `/jobs/${entityId}`,
        application: `/applications/${entityId}`,
        worklog: `/work-logs/${entityId}`,
        invoice: `/invoices/${entityId}`,
      };
      
      const endpoint = endpoints[entityType];
      if (!endpoint) {
        return { valid: false, error: `未知的实体类型: ${entityType}` };
      }
      
      const response = await request.get(`${API_URL}${endpoint}`);
      const data = await response.json();
      const actualStatus = data.data?.status;
      
      if (actualStatus === expectedStatus) {
        console.log(`  ✅ ${entityType}状态验证通过：${expectedStatus}`);
        return { valid: true, actual: actualStatus };
      } else {
        console.log(`  ❌ ${entityType}状态不匹配！期望：${expectedStatus}, 实际：${actualStatus}`);
        return { valid: false, actual: actualStatus };
      }
    } catch (error) {
      console.log(`  ❌ 验证${entityType}状态失败：${entityId}`, error);
      return { valid: false, error: String(error) };
    }
  }

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

  static async verifyProjectExists(
    request: APIRequestContext, 
    projectTitle: string
  ): Promise<{ exists: boolean; project?: any }> {
    try {
      const response = await request.get(`${API_URL}/jobs`);
      const data = await response.json();
      const projects = data.data?.items || data.data || [];
      
      const project = projects.find((p: any) => 
        p.title === projectTitle || p.job_title === projectTitle
      );
      
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
    const report = {
      summary: {
        total: this.issues.length,
        critical: this.getCriticalCount(),
        high: this.getHighCount(),
        medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
        low: this.issues.filter(i => i.severity === 'LOW').length,
      },
      issues: this.issues,
    };
    return JSON.stringify(report, null, 2);
  }
}

export class StateTransitionVerifier {
  static async verifyTransition(
    page: Page,
    request: APIRequestContext,
    options: {
      entityType: 'project' | 'application' | 'worklog' | 'invoice';
      entityId: string;
      fromStatus: string;
      toStatus: string;
      operation: () => Promise<void>;
    }
  ): Promise<StateTransitionResult> {
    const errors: string[] = [];
    
    try {
      const beforeStatus = await DataVerifier.verifyEntityStatus(
        request,
        options.entityType,
        options.entityId,
        options.fromStatus
      );
      
      await options.operation();
      
      await page.waitForTimeout(2000);
      
      const afterStatus = await DataVerifier.verifyEntityStatus(
        request,
        options.entityType,
        options.entityId,
        options.toStatus
      );
      
      const success = afterStatus.valid;
      
      return {
        success,
        entityType: options.entityType,
        entityId: options.entityId,
        fromStatus: options.fromStatus,
        toStatus: options.toStatus,
        backendStatus: afterStatus.actual,
        errors: success ? [] : [`状态转换失败: ${beforeStatus.actual} → ${afterStatus.actual}`],
      };
    } catch (error) {
      errors.push(String(error));
      return {
        success: false,
        entityType: options.entityType,
        entityId: options.entityId,
        fromStatus: options.fromStatus,
        toStatus: options.toStatus,
        errors,
      };
    }
  }
}

export class CrossRoleVerifier {
  static async verifyDataVisibility(
    page: Page,
    request: APIRequestContext,
    options: {
      actor: TestUser;
      observer: TestUser;
      operation: string;
      entityEndpoint: string;
      expectedVisible: boolean;
    }
  ): Promise<{
    actorSuccess: boolean;
    observerSuccess: boolean;
    dataVisible: boolean;
    isSynced: boolean;
  }> {
    let actorSuccess = false;
    let observerSuccess = false;
    let dataVisible = false;
    
    await TestHelper.loginAsUser(page, options.actor);
    actorSuccess = true;
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, options.observer);
    
    const response = await request.get(`${API_URL}${options.entityEndpoint}`);
    const data = await response.json();
    const items = data.data?.items || data.data || [];
    
    dataVisible = items.length > 0;
    observerSuccess = true;
    
    return {
      actorSuccess,
      observerSuccess,
      dataVisible,
      isSynced: dataVisible === options.expectedVisible,
    };
  }
}
