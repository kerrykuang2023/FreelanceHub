import { Page, APIRequestContext } from '@playwright/test';

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
  hr1: {
    email: 'hr@test.com',
    password: 'Test123456!',
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
  message: string;
  url?: string;
}

export interface LoginResult {
  success: boolean;
  errors: ConsoleError[];
}

export class TestHelper {
  private static consoleErrors: ConsoleError[] = [];

  static setupPageMonitoring(page: Page): void {
    this.consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        this.consoleErrors.push({
          type: msg.type(),
          message: msg.text(),
        });
      }
    });

    page.on('pageerror', error => {
      this.consoleErrors.push({
        type: 'pageerror',
        message: error.message,
      });
    });
  }

  static getConsoleErrors(): ConsoleError[] {
    return this.consoleErrors;
  }

  static clearErrors(): void {
    this.consoleErrors = [];
  }

  static async loginAsUser(page: Page, emailOrUser: string | TestUser, password?: string): Promise<LoginResult> {
    const errors: ConsoleError[] = [];
    let email: string;
    let pass: string;

    if (typeof emailOrUser === 'object') {
      email = emailOrUser.email;
      pass = emailOrUser.password;
    } else {
      email = emailOrUser;
      pass = password || 'Test123456!';
    }

    try {
      console.log(`  📝 尝试登录: ${email}`);
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const emailInput = page.locator('[data-testid="email-input"]').first();
      const passwordInput = page.locator('[data-testid="password-input"]').first();
      
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      
      await emailInput.clear();
      await emailInput.fill(email);
      await page.waitForTimeout(300);
      
      await passwordInput.clear();
      await passwordInput.fill(pass);
      await page.waitForTimeout(300);
      
      const loginButton = page.locator('[data-testid="login-submit-btn"]').first();
      await loginButton.click();
      
      console.log(`  📝 等待登录响应...`);
      
      await page.waitForTimeout(3000);
      
      try {
        await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
      } catch (e) {
        console.log(`  ⚠️ URL未变化，检查当前URL: ${page.url()}`);
      }
      
      const currentUrl = page.url();
      const success = !currentUrl.includes('/login');
      
      if (success) {
        console.log(`  ✅ 登录成功，当前URL: ${currentUrl}`);
        
        await page.waitForTimeout(2000);
        
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        console.log(`  📝 Token已存储: ${!!token}`);
        
        await page.waitForTimeout(1000);
      } else {
        console.log(`  ❌ 登录失败，仍在登录页面`);
        
        const errorAlert = page.locator('[class*="error"], [class*="alert"]').first();
        if (await errorAlert.isVisible({ timeout: 1000 }).catch(() => false)) {
          const errorText = await errorAlert.textContent();
          console.log(`  📝 错误信息: ${errorText}`);
          errors.push({ type: 'error', message: errorText || 'Unknown error' });
        }
      }
      
      return { success, errors };
    } catch (error) {
      console.error(`登录失败: ${email}`, error);
      return { success: false, errors: [...errors, { type: 'error', message: String(error) }] };
    }
  }

  static async logout(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    } catch (error) {
      console.log('登出过程发生异常:', error);
    }
  }

  static async getAPIData(request: APIRequestContext, url: string): Promise<any> {
    const response = await request.get(url);
    return response.json();
  }

  static async postAPIData(request: APIRequestContext, url: string, data: any): Promise<any> {
    const response = await request.post(url, { data });
    return response.json();
  }

  static async verifyDataInDatabase(request: APIRequestContext, collection: string, query: any): Promise<any[]> {
    const response = await request.get(`${API_URL}/admin/${collection}?${new URLSearchParams(query)}`);
    const json = await response.json();
    return json.data || [];
  }

  static async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `./e2e-test-screenshots/${timestamp}-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  static async waitForAPIResponse(page: Page, urlPattern: RegExp): Promise<any> {
    const response = await page.waitForResponse(resp => urlPattern.test(resp.url()));
    return response.json();
  }

  static async verifyElementExists(page: Page, selector: string, description: string): Promise<{ exists: boolean; count: number }> {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      return { exists: count > 0, count };
    } catch {
      return { exists: false, count: 0 };
    }
  }
}

export class DataVerifier {
  static async verifyProjectStatus(request: APIRequestContext, projectId: string, expectedStatus: string): Promise<boolean> {
    const response = await request.get(`${API_URL}/projects/${projectId}`);
    const data = await response.json();
    return data.data?.status === expectedStatus;
  }

  static async verifyWorkLogStatus(request: APIRequestContext, workLogId: string, expectedStatus: string): Promise<boolean> {
    const response = await request.get(`${API_URL}/work-logs/${workLogId}`);
    const data = await response.json();
    return data.data?.status === expectedStatus;
  }

  static async verifyInvoiceStatus(request: APIRequestContext, invoiceId: string, expectedStatus: string): Promise<boolean> {
    const response = await request.get(`${API_URL}/invoices/${invoiceId}`);
    const data = await response.json();
    return data.data?.status === expectedStatus;
  }

  static async verifyWorkLogCount(request: APIRequestContext, freelancerId: string, expectedCount: number): Promise<boolean> {
    const response = await request.get(`${API_URL}/work-logs?freelancer_id=${freelancerId}`);
    const data = await response.json();
    return (data.data?.items?.length || 0) === expectedCount;
  }

  static async verifyInvoiceCount(request: APIRequestContext, freelancerId: string, expectedCount: number): Promise<boolean> {
    const response = await request.get(`${API_URL}/invoices?freelancer_id=${freelancerId}`);
    const data = await response.json();
    return (data.data?.items?.length || 0) === expectedCount;
  }
}

export class MasterDataChecker {
  static async checkCompanies(request: APIRequestContext, minCount: number = 2): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/companies`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkSkillCategories(request: APIRequestContext, minCount: number = 2): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/skills`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkSystemConfigs(request: APIRequestContext, minCount: number = 20): Promise<{ passed: boolean; actual: number }> {
    try {
      const response = await request.get(`${API_URL}/admin/configs`);
      const data = await response.json();
      const actual = data.data?.items?.length || data.data?.length || 0;
      return { passed: actual >= minCount, actual };
    } catch {
      return { passed: false, actual: 0 };
    }
  }

  static async checkAllMasterData(request: APIRequestContext): Promise<{ passed: boolean; details: any }> {
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
  }) {
    const issueRecord = {
      ...issue,
      id: `ISS-${String(this.issues.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    };
    this.issues.push(issueRecord);
    console.log(`[ISSUE] ${issueRecord.id}: ${issue.description}`);
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
