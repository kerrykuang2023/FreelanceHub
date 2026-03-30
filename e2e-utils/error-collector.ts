import { Page, APIRequestContext, BrowserContext, TestInfo, Locator } from '@playwright/test';

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

export interface CapturedError {
  type: 'console' | 'pageerror' | 'network';
  message: string;
  timestamp: string;
  url?: string;
  stack?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  timestamp: string;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  errors: CapturedError[];
  networkErrors: NetworkRequest[];
}

export interface NavigationResult {
  success: boolean;
  errors: CapturedError[];
  actualUrl: string;
}

export interface FormSubmitResult {
  success: boolean;
  errors: CapturedError[];
  networkErrors: NetworkRequest[];
}

export class ErrorCollector {
  private errors: CapturedError[] = [];
  private networkErrors: NetworkRequest[] = [];

  static setupErrorListeners(page: Page): ErrorCollector {
    const collector = new ErrorCollector();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const error: CapturedError = {
          type: 'console',
          message: msg.text(),
          timestamp: new Date().toISOString(),
          url: page.url(),
        };
        collector.errors.push(error);
        console.error(`[控制台错误] ${msg.text()}`);
      }
    });

    page.on('pageerror', exception => {
      const error: CapturedError = {
        type: 'pageerror',
        message: exception.message,
        timestamp: new Date().toISOString(),
        url: page.url(),
        stack: exception.stack,
      };
      collector.errors.push(error);
      console.error(`[页面错误] ${exception.message}`);
    });

    page.on('response', async response => {
      if (response.status() >= 400) {
        const networkError: NetworkRequest = {
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          timestamp: new Date().toISOString(),
        };
        try {
          networkError.error = await response.text();
        } catch {
          networkError.error = 'Unable to read response body';
        }
        collector.networkErrors.push(networkError);
        console.error(`[网络错误 ${response.status()}] ${response.url()}`);
      }
    });

    return collector;
  }

  getErrors(): CapturedError[] {
    return this.errors;
  }

  getNetworkErrors(): NetworkRequest[] {
    return this.networkErrors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0 || this.networkErrors.length > 0;
  }

  getErrorCount(): number {
    return this.errors.length + this.networkErrors.length;
  }

  getErrorReport(): string {
    let report = '';
    
    if (this.errors.length > 0) {
      report += `\n=== 控制台/页面错误 (${this.errors.length}) ===\n`;
      this.errors.forEach((err, i) => {
        report += `${i + 1}. [${err.type}] ${err.message}\n`;
        if (err.url) report += `   URL: ${err.url}\n`;
      });
    }
    
    if (this.networkErrors.length > 0) {
      report += `\n=== 网络请求错误 (${this.networkErrors.length}) ===\n`;
      this.networkErrors.forEach((err, i) => {
        report += `${i + 1}. [${err.status}] ${err.method} ${err.url}\n`;
      });
    }
    
    return report;
  }

  clear(): void {
    this.errors = [];
    this.networkErrors = [];
  }
}

export class TestHelper {
  static setupPageMonitoring(page: Page): ErrorCollector {
    return ErrorCollector.setupErrorListeners(page);
  }

  static getConsoleErrors(collector: ErrorCollector): CapturedError[] {
    return collector.getErrors();
  }

  static getNetworkRequests(collector: ErrorCollector): NetworkRequest[] {
    return collector.getNetworkErrors();
  }

  static clearErrors(collector: ErrorCollector): void {
    collector.clear();
  }

  static async loginAsUser(page: Page, user: TestUser): Promise<LoginResult> {
    const result: LoginResult = {
      success: false,
      errors: [],
      networkErrors: []
    };

    try {
      console.log(`\n📝 登录用户：${user.email}`);
      
      await page.context().clearCookies();
      
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await emailInput.waitFor({ state: 'visible', timeout: 15000 });
          break;
        } catch (e) {
          retryCount++;
          if (retryCount >= maxRetries) {
            const error: CapturedError = {
              type: 'console',
              message: `登录表单等待超时: ${e}`,
              timestamp: new Date().toISOString(),
              url: page.url(),
            };
            result.errors.push(error);
            throw e;
          }
          console.log(`  ⚠️ 等待登录表单，重试 ${retryCount}/${maxRetries}`);
          await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
        }
      }
      
      await emailInput.clear();
      await emailInput.fill(user.email);
      
      await passwordInput.clear();
      await passwordInput.fill(user.password);
      
      const loginButton = page.locator('[data-testid="login-submit-btn"]');
      await loginButton.click();
      
      await page.waitForTimeout(3000);
      
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      result.success = !currentUrl.includes('/login');
      
      if (result.success) {
        console.log(`  ✅ 登录成功：${user.email}`);
      } else {
        console.log(`  ❌ 登录失败：${user.email}`);
        const error: CapturedError = {
          type: 'console',
          message: '登录后未跳转，仍在登录页面',
          timestamp: new Date().toISOString(),
          url: currentUrl,
        };
        result.errors.push(error);
      }
      
      return result;
    } catch (error) {
      console.error(`登录失败：${user.email}`, error);
      const capturedError: CapturedError = {
        type: 'console',
        message: `登录异常: ${error}`,
        timestamp: new Date().toISOString(),
        url: page.url(),
      };
      result.errors.push(capturedError);
      return result;
    }
  }

  static async logout(page: Page): Promise<void> {
    try {
      await page.context().clearCookies();
      
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      console.log('  ✅ 已登出');
    } catch (error) {
      console.log('  ⚠️ 登出过程发生异常:', error);
    }
  }

  static async navigateToPage(page: Page, path: string, expectedUrlPattern?: RegExp): Promise<NavigationResult> {
    const result: NavigationResult = {
      success: false,
      errors: [],
      actualUrl: ''
    };

    try {
      console.log(`  📍 导航到：${path}`);
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      result.actualUrl = page.url();
      result.success = true;
      
      if (expectedUrlPattern && !expectedUrlPattern.test(result.actualUrl)) {
        result.success = false;
        const error: CapturedError = {
          type: 'console',
          message: `URL不匹配预期模式: ${expectedUrlPattern}`,
          timestamp: new Date().toISOString(),
          url: result.actualUrl,
        };
        result.errors.push(error);
        console.log(`  ❌ URL不匹配: ${result.actualUrl}`);
      } else {
        console.log(`  ✅ 页面加载完成：${result.actualUrl}`);
      }
      
      return result;
    } catch (error) {
      console.log(`  ❌ 导航失败：${path}`, error);
      const capturedError: CapturedError = {
        type: 'console',
        message: `导航失败: ${error}`,
        timestamp: new Date().toISOString(),
        url: page.url(),
      };
      result.errors.push(capturedError);
      result.actualUrl = page.url();
      return result;
    }
  }

  static async verifyElementExists(page: Page, selector: string, description: string): Promise<{ exists: boolean; element?: Locator }> {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`  ✅ ${description} 存在`);
      return { exists: true, element };
    } catch {
      console.log(`  ❌ ${description} 不存在：${selector}`);
      return { exists: false };
    }
  }

  static async fillFormAndSubmit(
    page: Page,
    formData: Record<string, string>,
    submitSelector: string
  ): Promise<FormSubmitResult> {
    const result: FormSubmitResult = {
      success: false,
      errors: [],
      networkErrors: []
    };

    try {
      for (const [selector, value] of Object.entries(formData)) {
        const element = page.locator(selector);
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          await element.selectOption(value);
        } else {
          await element.clear();
          await element.fill(value);
        }
      }
      
      const submitButton = page.locator(submitSelector);
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      result.success = true;
      console.log('  ✅ 表单提交成功');
      
      return result;
    } catch (error) {
      console.log('  ❌ 表单提交失败:', error);
      const capturedError: CapturedError = {
        type: 'console',
        message: `表单提交失败: ${error}`,
        timestamp: new Date().toISOString(),
        url: page.url(),
      };
      result.errors.push(capturedError);
      return result;
    }
  }
}

export class DataVerifier {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null) {
    this.authToken = token;
  }

  static async verifyCompanyExists(request: APIRequestContext, companyName: string): Promise<{ exists: boolean; company?: any }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/admin/companies`, { headers });
      const data = await response.json();
      const companies = data.data?.items || data.data || [];
      const company = companies.find((c: any) => c.company_name === companyName);
      
      if (company) {
        console.log(`  ✅ 公司数据存在：${companyName}`);
        return { exists: true, company };
      }
      console.log(`  ❌ 公司数据不存在：${companyName}`);
      return { exists: false };
    } catch (error) {
      console.log(`  ❌ 验证公司数据失败：${companyName}`, error);
      return { exists: false };
    }
  }

  static async verifyProjectExists(request: APIRequestContext, projectTitle: string): Promise<{ exists: boolean; project?: any }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/jobs`, { headers });
      const data = await response.json();
      const projects = data.data?.items || data.data || [];
      const project = projects.find((p: any) => p.title === projectTitle);
      
      if (project) {
        console.log(`  ✅ 项目数据存在：${projectTitle}`);
        return { exists: true, project };
      }
      console.log(`  ❌ 项目数据不存在：${projectTitle}`);
      return { exists: false };
    } catch (error) {
      console.log(`  ❌ 验证项目数据失败：${projectTitle}`, error);
      return { exists: false };
    }
  }

  static async verifyApplicationExists(
    request: APIRequestContext, 
    freelancerId: string,
    jobId: string
  ): Promise<{ exists: boolean; application?: any }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/applications`, { headers });
      const data = await response.json();
      const applications = data.data?.items || data.data || [];
      const application = applications.find((a: any) => 
        a.freelancer_id === freelancerId || 
        a.job_id === jobId ||
        a.applicant_id === freelancerId
      );
      
      if (application) {
        console.log(`  ✅ 申请数据存在`);
        return { exists: true, application };
      }
      console.log(`  ❌ 申请数据不存在`);
      return { exists: false };
    } catch (error) {
      console.log(`  ❌ 验证申请数据失败`, error);
      return { exists: false };
    }
  }

  static async verifySkillCategories(request: APIRequestContext): Promise<{ exists: boolean; count: number }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/admin/skills`, { headers });
      const data = await response.json();
      const categories = data.data || [];
      console.log(`  ✅ 技能分类数量：${categories.length}`);
      return { exists: categories.length > 0, count: categories.length };
    } catch (error) {
      console.log(`  ❌ 验证技能分类失败`, error);
      return { exists: false, count: 0 };
    }
  }

  static async verifyWorkLogExists(request: APIRequestContext, workLogId?: string): Promise<{ exists: boolean; workLog?: any }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/work-logs`, { headers });
      const data = await response.json();
      const workLogs = data.data?.items || data.data || [];
      
      if (workLogId) {
        const workLog = workLogs.find((w: any) => w._id === workLogId);
        if (workLog) {
          console.log(`  ✅ 工时记录存在：${workLogId}`);
          return { exists: true, workLog };
        }
      } else if (workLogs.length > 0) {
        console.log(`  ✅ 工时记录存在：${workLogs.length} 条`);
        return { exists: true, workLog: workLogs[0] };
      }
      
      console.log(`  ❌ 工时记录不存在`);
      return { exists: false };
    } catch (error) {
      console.log(`  ❌ 验证工时记录失败`, error);
      return { exists: false };
    }
  }

  static async verifyInvoiceExists(request: APIRequestContext, invoiceId?: string): Promise<{ exists: boolean; invoice?: any }> {
    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      const response = await request.get(`${API_URL}/invoices`, { headers });
      const data = await response.json();
      const invoices = data.data?.items || data.data || [];
      
      if (invoiceId) {
        const invoice = invoices.find((i: any) => i._id === invoiceId);
        if (invoice) {
          console.log(`  ✅ 发票记录存在：${invoiceId}`);
          return { exists: true, invoice };
        }
      } else if (invoices.length > 0) {
        console.log(`  ✅ 发票记录存在：${invoices.length} 条`);
        return { exists: true, invoice: invoices[0] };
      }
      
      console.log(`  ❌ 发票记录不存在`);
      return { exists: false };
    } catch (error) {
      console.log(`  ❌ 验证发票记录失败`, error);
      return { exists: false };
    }
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
    page?: string;
    userRole?: string;
    errors?: CapturedError[];
    networkErrors?: NetworkRequest[];
  }): void {
    const issueRecord = {
      ...issue,
      id: `ISS-${String(this.issues.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    };
    this.issues.push(issueRecord);
    console.log(`\n❗ [问题] ${issueRecord.id}: ${issue.description}`);
    console.log(`   严重性：${issue.severity} | 分类：${issue.category}`);
  }

  getIssues(): any[] {
    return this.issues;
  }

  getIssueCount(): number {
    return this.issues.length;
  }

  generateReport(): string {
    return JSON.stringify({
      summary: {
        total: this.issues.length,
        critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
        high: this.issues.filter(i => i.severity === 'HIGH').length,
        medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
        low: this.issues.filter(i => i.severity === 'LOW').length,
      },
      byCategory: {
        UX: this.issues.filter(i => i.category === 'UX').length,
        LOGIC: this.issues.filter(i => i.category === 'LOGIC').length,
        API: this.issues.filter(i => i.category === 'API').length,
        UI: this.issues.filter(i => i.category === 'UI').length,
        PERMISSION: this.issues.filter(i => i.category === 'PERMISSION').length,
        DATA: this.issues.filter(i => i.category === 'DATA').length,
      },
      issues: this.issues,
    }, null, 2);
  }
}
