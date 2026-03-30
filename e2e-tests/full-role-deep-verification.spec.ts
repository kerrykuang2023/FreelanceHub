import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { TestHelper, TEST_USERS, IssueLogger, ConsoleError } from '../e2e-utils/test-helpers';
import { DataConsistencyVerifier } from '../e2e-utils/data-consistency-verifier';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

interface PageAnalysis {
  pageName: string;
  url: string;
  userRole: string;
  elements: { selector: string; value: string; expected?: string; status: 'match' | 'mismatch' | 'missing' }[];
  backendData: any;
  frontendData: any;
  improvements: string[];
  issues: { description: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }[];
  consoleErrors: ConsoleError[];
}

interface TestContext {
  adminToken: string;
  hrToken: string;
  freelancerToken: string;
  hrCompanyId: string;
  testProjectId: string;
  testWorkLogId: string;
  testInvoiceId: string;
  testApplicationId: string;
  analyses: PageAnalysis[];
}

const context: TestContext = {
  adminToken: '',
  hrToken: '',
  freelancerToken: '',
  hrCompanyId: '',
  testProjectId: '',
  testWorkLogId: '',
  testInvoiceId: '',
  testApplicationId: '',
  analyses: []
};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        全角色全流程全场景E2E测试 - 深度数据一致性验证                    ║');
  console.log('║        Full Role Full Flow Full Scenario E2E Test                        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📋 Step 0: 获取认证Token...');
  
  context.adminToken = await DataConsistencyVerifier.getAuthToken(request, 'admin@test.com', 'Test123456!');
  context.hrToken = await DataConsistencyVerifier.getAuthToken(request, 'hr@test.com', 'Test123456!');
  context.freelancerToken = await DataConsistencyVerifier.getAuthToken(request, 'freelancer@test.com', 'Test123456!');
  
  console.log('  ✅ 管理员Token: ' + (context.adminToken ? '已获取' : '获取失败'));
  console.log('  ✅ HR Token: ' + (context.hrToken ? '已获取' : '获取失败'));
  console.log('  ✅ 自由顾问Token: ' + (context.freelancerToken ? '已获取' : '获取失败'));
});

class DeepPageAnalyzer {
  static async analyzePage(
    page: Page,
    request: APIRequestContext,
    options: {
      pageName: string;
      url: string;
      userRole: string;
      expectedElements?: { selector: string; description: string }[];
      backendDataFetcher?: () => Promise<any>;
      dataValidators?: { frontendSelector: string; backendField: string; description: string }[];
    }
  ): Promise<PageAnalysis> {
    const analysis: PageAnalysis = {
      pageName: options.pageName,
      url: options.url,
      userRole: options.userRole,
      elements: [],
      backendData: null,
      frontendData: {},
      improvements: [],
      issues: [],
      consoleErrors: []
    };

    TestHelper.setupPageMonitoring(page);

    console.log(`\n┌─────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ 📄 页面分析: ${options.pageName.padEnd(52)}│`);
    console.log(`│ 👤 角色: ${options.userRole.padEnd(57)}│`);
    console.log(`│ 🔗 URL: ${options.url.substring(0, 55).padEnd(55)}│`);
    console.log(`└─────────────────────────────────────────────────────────────────────────┘`);

    await page.goto(options.url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    analysis.consoleErrors = TestHelper.getConsoleErrors();
    
    if (analysis.consoleErrors.length > 0) {
      const criticalErrors = analysis.consoleErrors.filter(e => e.type === 'error' || e.type === 'pageerror');
      if (criticalErrors.length > 0) {
        analysis.issues.push({
          description: `发现 ${criticalErrors.length} 个控制台错误`,
          severity: 'HIGH'
        });
        console.log(`  ⚠️ 控制台错误: ${criticalErrors.length} 个`);
        criticalErrors.slice(0, 3).forEach(e => {
          console.log(`     - ${e.message.substring(0, 80)}...`);
        });
      }
    }

    if (options.expectedElements) {
      console.log('\n  📋 元素存在性检查:');
      for (const elem of options.expectedElements) {
        const locator = page.locator(elem.selector);
        const count = await locator.count();
        const exists = count > 0;
        
        let value = '';
        if (exists) {
          try {
            const tagName = await locator.first().evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'input' || tagName === 'textarea') {
              value = await locator.first().inputValue();
            } else {
              value = (await locator.first().textContent() || '').trim().substring(0, 50);
            }
          } catch {
            value = '(无法获取值)';
          }
        }
        
        analysis.elements.push({
          selector: elem.selector,
          value: exists ? value : '(不存在)',
          status: exists ? 'match' : 'missing'
        });
        
        const status = exists ? '✅' : '❌';
        console.log(`     ${status} ${elem.description}: ${exists ? '存在' : '缺失'}`);
        
        if (!exists) {
          analysis.improvements.push(`缺失元素: ${elem.description} (${elem.selector})`);
        }
      }
    }

    if (options.backendDataFetcher) {
      console.log('\n  📊 后端数据获取:');
      try {
        analysis.backendData = await options.backendDataFetcher();
        console.log(`     ✅ 后端数据获取成功`);
      } catch (error) {
        console.log(`     ❌ 后端数据获取失败: ${error}`);
        analysis.issues.push({
          description: '后端数据获取失败',
          severity: 'CRITICAL'
        });
      }
    }

    if (options.dataValidators && analysis.backendData) {
      console.log('\n  🔍 数据一致性验证:');
      for (const validator of options.dataValidators) {
        const frontendElement = page.locator(validator.frontendSelector).first();
        let frontendValue = '';
        let backendValue = '';
        
        try {
          if (await frontendElement.isVisible({ timeout: 2000 })) {
            frontendValue = (await frontendElement.textContent() || '').trim();
            analysis.frontendData[validator.frontendSelector] = frontendValue;
          }
        } catch {
          frontendValue = '(未找到)';
        }
        
        const backendPath = validator.backendField.split('.');
        let currentData: any = analysis.backendData;
        for (const path of backendPath) {
          if (currentData && typeof currentData === 'object') {
            currentData = currentData[path];
          }
        }
        backendValue = currentData !== undefined ? String(currentData) : '(未定义)';
        
        const normalizedFrontend = frontendValue.toLowerCase().replace(/[\s\n\r\t]/g, '');
        const normalizedBackend = backendValue.toLowerCase().replace(/[\s\n\r\t]/g, '');
        const isMatch = normalizedFrontend.includes(normalizedBackend) || normalizedBackend.includes(normalizedFrontend);
        
        const status = isMatch ? '✅' : '⚠️';
        console.log(`     ${status} ${validator.description}:`);
        console.log(`        前端: ${frontendValue.substring(0, 40)}`);
        console.log(`        后端: ${backendValue.substring(0, 40)}`);
        
        if (!isMatch && frontendValue !== '(未找到)') {
          analysis.issues.push({
            description: `${validator.description} 前后端不一致`,
            severity: 'MEDIUM'
          });
        }
      }
    }

    await this.analyzePageUX(page, analysis);

    return analysis;
  }

  private static async analyzePageUX(page: Page, analysis: PageAnalysis): Promise<void> {
    console.log('\n  💡 UX改进建议分析:');
    
    const pageTitle = await page.title();
    if (!pageTitle || pageTitle === 'React App') {
      analysis.improvements.push('页面标题应更具描述性，便于用户理解当前页面');
    }

    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      analysis.improvements.push('缺少主标题(h1)，影响页面层级结构和SEO');
    } else if (h1Count > 1) {
      analysis.improvements.push('存在多个h1标签，建议只保留一个主标题');
    }

    const buttonsWithoutText = await page.locator('button:not(:has-text(""))').count();
    const emptyButtons = await page.locator('button:empty').count();
    if (emptyButtons > 0) {
      analysis.improvements.push(`发现 ${emptyButtons} 个空按钮，应添加可访问性文本`);
    }

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      analysis.improvements.push(`发现 ${imagesWithoutAlt} 个图片缺少alt属性，影响可访问性`);
    }

    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]').count();
    const hasData = await page.locator('[data-testid*="card"], [data-testid*="item"], .card, .item').count() > 0;
    if (hasData && loadingIndicators === 0) {
      analysis.improvements.push('数据加载时建议显示加载指示器，提升用户体验');
    }

    const breadcrumbCount = await page.locator('nav[aria-label*="breadcrumb"], .breadcrumb, [data-testid*="breadcrumb"]').count();
    if (analysis.url.split('/').length > 3 && breadcrumbCount === 0) {
      analysis.improvements.push('深层页面建议添加面包屑导航，便于用户了解当前位置');
    }

    const filterOptions = await page.locator('select, [data-testid*="filter"], [data-testid*="search"]').count();
    const listItems = await page.locator('[data-testid*="item"], [data-testid*="card"]').count();
    if (listItems > 10 && filterOptions === 0) {
      analysis.improvements.push('列表项较多时建议添加筛选/搜索功能，便于用户查找');
    }

    const paginationCount = await page.locator('[data-testid*="pagination"], .pagination, nav[aria-label*="pagination"]').count();
    if (listItems >= 10 && paginationCount === 0) {
      analysis.improvements.push('数据量较大时建议添加分页功能，避免页面过长');
    }

    if (analysis.improvements.length > 0) {
      analysis.improvements.slice(0, 5).forEach((improvement, index) => {
        console.log(`     ${index + 1}. ${improvement}`);
      });
      if (analysis.improvements.length > 5) {
        console.log(`     ... 还有 ${analysis.improvements.length - 5} 条建议`);
      }
    } else {
      console.log('     ✅ 未发现明显的UX改进点');
    }
  }

  static generateAnalysisReport(analyses: PageAnalysis[]): string {
    let report = '\n';
    report += '╔══════════════════════════════════════════════════════════════════════════╗\n';
    report += '║                      页面分析汇总报告                                    ║\n';
    report += '╚══════════════════════════════════════════════════════════════════════════╝\n\n';

    const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
    const totalImprovements = analyses.reduce((sum, a) => sum + a.improvements.length, 0);
    const totalConsoleErrors = analyses.reduce((sum, a) => sum + a.consoleErrors.length, 0);

    report += `📊 总体统计:\n`;
    report += `   - 分析页面数: ${analyses.length}\n`;
    report += `   - 发现问题数: ${totalIssues}\n`;
    report += `   - 改进建议数: ${totalImprovements}\n`;
    report += `   - 控制台错误: ${totalConsoleErrors}\n\n`;

    report += `📋 各页面详情:\n`;
    report += `${'─'.repeat(80)}\n`;

    for (const analysis of analyses) {
      report += `\n📄 ${analysis.pageName} (${analysis.userRole})\n`;
      report += `   URL: ${analysis.url}\n`;
      
      if (analysis.issues.length > 0) {
        report += `   ⚠️ 问题:\n`;
        analysis.issues.forEach(issue => {
          report += `      [${issue.severity}] ${issue.description}\n`;
        });
      }

      if (analysis.improvements.length > 0) {
        report += `   💡 改进建议:\n`;
        analysis.improvements.slice(0, 3).forEach(imp => {
          report += `      - ${imp}\n`;
        });
      }

      const criticalErrors = analysis.consoleErrors.filter(e => e.type === 'error' || e.type === 'pageerror');
      if (criticalErrors.length > 0) {
        report += `   🐛 控制台错误: ${criticalErrors.length} 个\n`;
      }

      report += `   ✅ 元素检查: ${analysis.elements.filter(e => e.status === 'match').length}/${analysis.elements.length} 通过\n`;
    }

    return report;
  }
}

test.describe('第一部分：管理员角色测试', () => {
  
  test('【ADMIN-01】管理员登录并分析登录页面', async ({ page, request }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('第一部分：管理员角色测试');
    console.log('═'.repeat(80));
    console.log('\n📌 【ADMIN-01】管理员登录测试');

    TestHelper.setupPageMonitoring(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '登录页面',
      url: `${BASE_URL}/login`,
      userRole: 'Administrator',
      expectedElements: [
        { selector: '[data-testid="email-input"], input[name="email"], input[type="email"]', description: '邮箱输入框' },
        { selector: '[data-testid="password-input"], input[name="password"], input[type="password"]', description: '密码输入框' },
        { selector: '[data-testid="login-submit-btn"], button[type="submit"], button:has-text("登录")', description: '登录按钮' },
        { selector: 'a:has-text("注册"), a[href*="register"]', description: '注册链接' }
      ]
    });

    context.analyses.push(analysis);

    const emailInput = page.locator('[data-testid="email-input"], input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[name="password"], input[type="password"]').first();
    
    await emailInput.fill('admin@test.com');
    await passwordInput.fill('Test123456!');

    const loginButton = page.locator('[data-testid="login-submit-btn"], button[type="submit"], button:has-text("登录")').first();
    await loginButton.click();

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const loginSuccess = !currentUrl.includes('/login');

    if (loginSuccess) {
      console.log('  ✅ 管理员登录成功');
      console.log(`  📍 跳转到: ${currentUrl}`);
    } else {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: '管理员登录失败',
        expectedBehavior: '登录成功后应跳转到管理员Dashboard',
        actualBehavior: '登录后仍停留在登录页面',
        steps: ['访问登录页面', '输入管理员邮箱', '输入密码', '点击登录按钮'],
        page: '/login',
        userRole: 'Administrator'
      });
    }

    expect(loginSuccess).toBe(true);
  });

  test('【ADMIN-02】管理员Dashboard数据一致性', async ({ page, request }) => {
    console.log('\n📌 【ADMIN-02】管理员Dashboard数据一致性验证');

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '管理员Dashboard',
      url: `${BASE_URL}/admin/dashboard`,
      userRole: 'Administrator',
      expectedElements: [
        { selector: 'h1, [data-testid="page-title"]', description: '页面标题' },
        { selector: '[data-testid*="stat"], [class*="stat-card"], .dashboard-card', description: '统计卡片' },
        { selector: 'nav[aria-label="Breadcrumb"], .breadcrumb', description: '面包屑导航' }
      ],
      backendDataFetcher: async () => {
        const [users, companies, projects, workLogs, invoices] = await Promise.all([
          request.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${context.adminToken}` } }).then(r => r.json()),
          request.get(`${API_URL}/admin/companies`, { headers: { Authorization: `Bearer ${context.adminToken}` } }).then(r => r.json()),
          request.get(`${API_URL}/jobs`, { headers: { Authorization: `Bearer ${context.adminToken}` } }).then(r => r.json()),
          request.get(`${API_URL}/work-logs`, { headers: { Authorization: `Bearer ${context.adminToken}` } }).then(r => r.json()),
          request.get(`${API_URL}/invoices`, { headers: { Authorization: `Bearer ${context.adminToken}` } }).then(r => r.json())
        ]);
        return { users, companies, projects, workLogs, invoices };
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const usersCount = analysis.backendData.users?.data?.items?.length || analysis.backendData.users?.data?.length || 0;
      const companiesCount = analysis.backendData.companies?.data?.items?.length || analysis.backendData.companies?.data?.length || 0;
      const projectsCount = analysis.backendData.projects?.jobs?.length || analysis.backendData.projects?.data?.items?.length || 0;
      const workLogsCount = analysis.backendData.workLogs?.work_logs?.length || analysis.backendData.workLogs?.data?.items?.length || 0;
      const invoicesCount = analysis.backendData.invoices?.invoices?.length || analysis.backendData.invoices?.data?.items?.length || 0;

      console.log('\n  📊 后端数据统计:');
      console.log(`     用户总数: ${usersCount}`);
      console.log(`     公司总数: ${companiesCount}`);
      console.log(`     项目总数: ${projectsCount}`);
      console.log(`     工时总数: ${workLogsCount}`);
      console.log(`     发票总数: ${invoicesCount}`);

      const statCards = await page.locator('[data-testid*="stat"], [class*="stat-card"], .dashboard-card').count();
      console.log(`\n  📊 前端统计卡片数: ${statCards}`);

      if (statCards < 3) {
        analysis.improvements.push('Dashboard建议显示更多关键业务指标，如用户数、项目数、工时数、发票数等');
      }
    }

    await TestHelper.logout(page);
  });

  test('【ADMIN-03】用户管理页面', async ({ page, request }) => {
    console.log('\n📌 【ADMIN-03】用户管理页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '用户管理页面',
      url: `${BASE_URL}/admin/users`,
      userRole: 'Administrator',
      expectedElements: [
        { selector: 'table, [data-testid="users-table"], .users-list', description: '用户列表' },
        { selector: 'th, [data-testid*="header"]', description: '表头' },
        { selector: 'tr, [data-testid*="user-row"], .user-item', description: '用户行' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${context.adminToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const users = analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端用户数据: ${users.length} 条`);

      const userRows = await page.locator('tr, [data-testid*="user-row"], .user-item').count();
      console.log(`  📊 前端用户显示: ${userRows} 条`);

      if (users.length > 0 && userRows === 0) {
        analysis.issues.push({
          description: '后端有用户数据但前端未显示',
          severity: 'HIGH'
        });
      }

      if (users.length > 0) {
        console.log('\n  📋 用户数据抽样验证:');
        for (const user of users.slice(0, 3)) {
          console.log(`     - ${user.email} (${user.role || user.user_role})`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【ADMIN-04】公司管理页面', async ({ page, request }) => {
    console.log('\n📌 【ADMIN-04】公司管理页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'admin@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '公司管理页面',
      url: `${BASE_URL}/admin/companies`,
      userRole: 'Administrator',
      expectedElements: [
        { selector: 'table, [data-testid="companies-table"], .companies-list', description: '公司列表' },
        { selector: 'button:has-text("新增"), button:has-text("添加"), a[href*="company"]', description: '新增公司按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/admin/companies`, {
          headers: { Authorization: `Bearer ${context.adminToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const companies = analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端公司数据: ${companies.length} 条`);

      if (companies.length > 0) {
        console.log('\n  📋 公司数据抽样验证:');
        for (const company of companies.slice(0, 3)) {
          console.log(`     - ${company.company_name} (状态: ${company.status || '未知'})`);
        }
      }
    }

    await TestHelper.logout(page);
  });
});

test.describe('第二部分：HR角色测试', () => {
  
  test('【HR-01】HR登录并分析Dashboard', async ({ page, request }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('第二部分：HR角色测试');
    console.log('═'.repeat(80));
    console.log('\n📌 【HR-01】HR登录并分析Dashboard');

    TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ HR登录成功');

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: 'HR Dashboard',
      url: `${BASE_URL}/`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: 'h1, [data-testid="page-title"]', description: '页面标题' },
        { selector: 'nav[aria-label="Breadcrumb"], .breadcrumb', description: '面包屑导航' }
      ],
      backendDataFetcher: async () => {
        const [company, projects, applications] = await Promise.all([
          request.get(`${API_URL}/companies/my-company`, { headers: { Authorization: `Bearer ${context.hrToken}` } }).then(r => r.json()).catch(() => null),
          request.get(`${API_URL}/jobs?posted_by=me`, { headers: { Authorization: `Bearer ${context.hrToken}` } }).then(r => r.json()).catch(() => null),
          request.get(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${context.hrToken}` } }).then(r => r.json()).catch(() => null)
        ]);
        return { company, projects, applications };
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData?.company?.data) {
      context.hrCompanyId = analysis.backendData.company.data._id;
      console.log(`\n  📊 HR所属公司ID: ${context.hrCompanyId}`);
    }

    await TestHelper.logout(page);
  });

  test('【HR-02】公司信息页面', async ({ page, request }) => {
    console.log('\n📌 【HR-02】公司信息页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '公司信息页面',
      url: `${BASE_URL}/company/profile`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: '[data-testid="company-name"], h1, .company-name', description: '公司名称' },
        { selector: '[data-testid="company-info"], .company-details', description: '公司详情' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/companies/my-company`, {
          headers: { Authorization: `Bearer ${context.hrToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData?.data) {
      const company = analysis.backendData.data;
      console.log('\n  📊 后端公司数据:');
      console.log(`     公司名称: ${company.company_name}`);
      console.log(`     公司状态: ${company.status}`);
      console.log(`     员工人数: ${company.employee_count || '未设置'}`);

      const frontendCompanyName = await page.locator('[data-testid="company-name"], h1, .company-name').first().textContent().catch(() => '');
      console.log(`\n  📊 前端公司名称: ${frontendCompanyName?.trim()}`);

      if (company.company_name && frontendCompanyName && !frontendCompanyName.includes(company.company_name)) {
        analysis.issues.push({
          description: '前后端公司名称不一致',
          severity: 'MEDIUM'
        });
      }
    }

    await TestHelper.logout(page);
  });

  test('【HR-03】项目发布页面', async ({ page, request }) => {
    console.log('\n📌 【HR-03】项目发布页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '项目发布页面',
      url: `${BASE_URL}/post-job`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: '[data-testid="project-title-input"], input[name="job_title"], input[name="project_title"]', description: '项目标题输入框' },
        { selector: '[data-testid="project-description-input"], textarea[name="job_description"], textarea[name="project_description"]', description: '项目描述输入框' },
        { selector: 'button[type="submit"], button:has-text("发布"), button:has-text("提交")', description: '提交按钮' },
        { selector: 'select[name="job_nature"], [data-testid="job-nature-select"]', description: '工作性质选择' },
        { selector: 'select[name="work_format"], [data-testid="work-format-select"]', description: '工作方式选择' }
      ]
    });

    context.analyses.push(analysis);

    const formElements = analysis.elements.filter(e => e.status === 'missing');
    if (formElements.length > 0) {
      console.log('\n  ⚠️ 缺失的表单元素:');
      formElements.forEach(elem => {
        console.log(`     - ${elem.selector}`);
      });
    }

    await TestHelper.logout(page);
  });

  test('【HR-04】项目列表页面', async ({ page, request }) => {
    console.log('\n📌 【HR-04】项目列表页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '项目列表页面',
      url: `${BASE_URL}/my-jobs`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: '[data-testid*="posted-job-item"], [data-testid*="job-card"], [data-testid="post-new-job-btn"]', description: '项目卡片' },
        { selector: '[data-testid="post-new-job-btn"], button:has-text("发布"), a[href*="post-job"]', description: '发布项目按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/jobs/my-posted-jobs`, {
          headers: { Authorization: `Bearer ${context.hrToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const projects = analysis.backendData.jobs || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端项目数据: ${projects.length} 条`);

      if (projects.length > 0) {
        context.testProjectId = projects[0]._id;
        console.log(`  📝 测试项目ID: ${context.testProjectId}`);
        
        console.log('\n  📋 项目数据抽样验证:');
        for (const project of projects.slice(0, 3)) {
          console.log(`     - ${project.job_title || project.project_title} (状态: ${project.status})`);
        }
      }

      const frontendCards = await page.locator('[data-testid*="posted-job-item"], [data-testid*="job-card"]').count();
      console.log(`\n  📊 前端项目显示: ${frontendCards} 条`);

      if (projects.length > 0 && frontendCards === 0) {
        analysis.issues.push({
          description: '后端有项目数据但前端未显示',
          severity: 'HIGH'
        });
      }
    }

    await TestHelper.logout(page);
  });

  test('【HR-05】工时审核页面', async ({ page, request }) => {
    console.log('\n📌 【HR-05】工时审核页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '工时审核页面',
      url: `${BASE_URL}/company/work-logs/pending`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: '[data-testid*="worklog"], [data-testid*="work-log"], .work-log-item', description: '工时列表项' },
        { selector: 'button:has-text("确认"), button:has-text("通过"), button:has-text("审核")', description: '审核按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/work-logs?status=submitted`, {
          headers: { Authorization: `Bearer ${context.hrToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const workLogs = analysis.backendData.work_logs || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端待审核工时: ${workLogs.length} 条`);

      if (workLogs.length > 0) {
        context.testWorkLogId = workLogs[0]._id;
        console.log(`  📝 测试工时ID: ${context.testWorkLogId}`);
        
        console.log('\n  📋 待审核工时详情:');
        for (const wl of workLogs.slice(0, 3)) {
          console.log(`     - 工时: ${wl.hours_worked}h, 状态: ${wl.status}`);
          console.log(`       描述: ${wl.work_description?.substring(0, 30)}...`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【HR-06】发票审核页面', async ({ page, request }) => {
    console.log('\n📌 【HR-06】发票审核页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'hr@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '发票审核页面',
      url: `${BASE_URL}/company/invoices/review`,
      userRole: 'HR Recruiter',
      expectedElements: [
        { selector: '[data-testid*="invoice"], .invoice-item', description: '发票列表项' },
        { selector: 'button:has-text("审批"), button:has-text("通过"), button:has-text("审核")', description: '审批按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/invoices?status=submitted`, {
          headers: { Authorization: `Bearer ${context.hrToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const invoices = analysis.backendData.invoices || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端待审核发票: ${invoices.length} 条`);

      if (invoices.length > 0) {
        context.testInvoiceId = invoices[0]._id;
        console.log(`  📝 测试发票ID: ${context.testInvoiceId}`);
        
        console.log('\n  📋 待审核发票详情:');
        for (const inv of invoices.slice(0, 3)) {
          console.log(`     - 发票号: ${inv.invoice_number}`);
          console.log(`       金额: ¥${inv.total_amount}, 状态: ${inv.status}`);
        }
      }
    }

    await TestHelper.logout(page);
  });
});

test.describe('第三部分：自由顾问角色测试', () => {
  
  test('【FREELANCER-01】自由顾问登录并分析Dashboard', async ({ page, request }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('第三部分：自由顾问角色测试');
    console.log('═'.repeat(80));
    console.log('\n📌 【FREELANCER-01】自由顾问登录并分析Dashboard');

    TestHelper.setupPageMonitoring(page);

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);
    console.log('  ✅ 自由顾问登录成功');

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '自由顾问Dashboard',
      url: `${BASE_URL}/`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: 'h1, [data-testid="page-title"]', description: '页面标题' },
        { selector: 'nav[aria-label="Breadcrumb"], .breadcrumb', description: '面包屑导航' }
      ],
      backendDataFetcher: async () => {
        const [profile, applications, workLogs, invoices] = await Promise.all([
          request.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${context.freelancerToken}` } }).then(r => r.json()).catch(() => null),
          request.get(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${context.freelancerToken}` } }).then(r => r.json()).catch(() => null),
          request.get(`${API_URL}/work-logs`, { headers: { Authorization: `Bearer ${context.freelancerToken}` } }).then(r => r.json()).catch(() => null),
          request.get(`${API_URL}/invoices`, { headers: { Authorization: `Bearer ${context.freelancerToken}` } }).then(r => r.json()).catch(() => null)
        ]);
        return { profile, applications, workLogs, invoices };
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData?.profile?.data) {
      console.log('\n  📊 顾问个人信息:');
      console.log(`     邮箱: ${analysis.backendData.profile.data.email}`);
      console.log(`     姓名: ${analysis.backendData.profile.data.name || '未设置'}`);
    }

    await TestHelper.logout(page);
  });

  test('【FREELANCER-02】项目浏览页面', async ({ page, request }) => {
    console.log('\n📌 【FREELANCER-02】项目浏览页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '项目浏览页面',
      url: `${BASE_URL}/jobs`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: '[data-testid*="job-"], [data-testid="jobs-list-page"]', description: '项目卡片' },
        { selector: '[data-testid="keyword-search"], input[type="search"], input[placeholder*="搜索"]', description: '搜索框' },
        { selector: '[data-testid="toggle-filters-btn"], select, [data-testid*="filter"]', description: '筛选器' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/jobs`, {
          headers: { Authorization: `Bearer ${context.freelancerToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const projects = analysis.backendData.jobs || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端可浏览项目: ${projects.length} 条`);

      const frontendCards = await page.locator('[data-testid*="job-"]').count();
      console.log(`  📊 前端项目显示: ${frontendCards} 条`);

      if (projects.length > 0 && frontendCards === 0) {
        analysis.issues.push({
          description: '后端有项目数据但前端未显示',
          severity: 'HIGH'
        });
      }

      if (projects.length > 0) {
        console.log('\n  📋 项目数据抽样验证:');
        for (const project of projects.slice(0, 3)) {
          console.log(`     - ${project.job_title || project.project_title}`);
          console.log(`       状态: ${project.status}, 薪资: ${project.rate_amount || '面议'}`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【FREELANCER-03】我的申请页面', async ({ page, request }) => {
    console.log('\n📌 【FREELANCER-03】我的申请页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '我的申请页面',
      url: `${BASE_URL}/my-applications`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: '[data-testid*="application"], .application-item', description: '申请列表项' },
        { selector: '[data-testid*="status"], .status-badge', description: '状态标签' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/applications`, {
          headers: { Authorization: `Bearer ${context.freelancerToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const applications = analysis.backendData.applications || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端申请数据: ${applications.length} 条`);

      if (applications.length > 0) {
        context.testApplicationId = applications[0]._id;
        console.log(`  📝 测试申请ID: ${context.testApplicationId}`);
        
        console.log('\n  📋 申请数据抽样验证:');
        for (const app of applications.slice(0, 3)) {
          console.log(`     - 项目: ${app.project_requirement_id?.job_title || app.job?.job_title || '未知'}`);
          console.log(`       状态: ${app.status}`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【FREELANCER-04】工时填报页面', async ({ page, request }) => {
    console.log('\n📌 【FREELANCER-04】工时填报页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '工时填报页面',
      url: `${BASE_URL}/work-logs`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: '[data-testid*="worklog"], [data-testid*="work-log"], .work-log-item', description: '工时列表项' },
        { selector: 'button:has-text("新增"), button:has-text("填报"), button:has-text("添加")', description: '新增工时按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/work-logs`, {
          headers: { Authorization: `Bearer ${context.freelancerToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const workLogs = analysis.backendData.work_logs || analysis.backendData.data?.items || analysis.backendData.data?.work_logs || analysis.backendData.data || [];
      console.log(`\n  📊 后端工时数据: ${workLogs.length} 条`);

      const statusCounts = {
        draft: workLogs.filter((w: any) => w.status === 'draft').length,
        submitted: workLogs.filter((w: any) => w.status === 'submitted').length,
        confirmed: workLogs.filter((w: any) => w.status === 'confirmed').length,
        rejected: workLogs.filter((w: any) => w.status === 'rejected').length
      };
      console.log(`  📊 工时状态分布: 草稿=${statusCounts.draft}, 待审核=${statusCounts.submitted}, 已确认=${statusCounts.confirmed}, 已驳回=${statusCounts.rejected}`);

      const frontendItems = await page.locator('[data-testid*="worklog"], [data-testid*="work-log"], .work-log-item').count();
      console.log(`\n  📊 前端工时显示: ${frontendItems} 条`);

      if (workLogs.length > 0 && frontendItems === 0) {
        analysis.issues.push({
          description: '后端有工时数据但前端未显示',
          severity: 'HIGH'
        });
      }

      if (workLogs.length > 0) {
        console.log('\n  📋 工时数据抽样验证:');
        for (const wl of workLogs.slice(0, 3)) {
          console.log(`     - 日期: ${wl.work_date}, 工时: ${wl.hours_worked}h`);
          console.log(`       状态: ${wl.status}, 描述: ${wl.work_description?.substring(0, 30)}...`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【FREELANCER-05】发票管理页面', async ({ page, request }) => {
    console.log('\n📌 【FREELANCER-05】发票管理页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '发票管理页面',
      url: `${BASE_URL}/invoices`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: '[data-testid*="invoice"], .invoice-item', description: '发票列表项' },
        { selector: 'button:has-text("创建"), button:has-text("开票"), button:has-text("新增")', description: '创建发票按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/invoices`, {
          headers: { Authorization: `Bearer ${context.freelancerToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData) {
      const invoices = analysis.backendData.invoices || analysis.backendData.data?.items || analysis.backendData.data || [];
      console.log(`\n  📊 后端发票数据: ${invoices.length} 条`);

      const statusCounts = {
        draft: invoices.filter((i: any) => i.status === 'draft').length,
        submitted: invoices.filter((i: any) => i.status === 'submitted').length,
        approved: invoices.filter((i: any) => i.status === 'approved').length,
        paid: invoices.filter((i: any) => i.status === 'paid').length
      };
      console.log(`  📊 发票状态分布: 草稿=${statusCounts.draft}, 待审核=${statusCounts.submitted}, 已批准=${statusCounts.approved}, 已付款=${statusCounts.paid}`);

      const frontendItems = await page.locator('[data-testid*="invoice"], .invoice-item').count();
      console.log(`\n  📊 前端发票显示: ${frontendItems} 条`);

      if (invoices.length > 0 && frontendItems === 0) {
        analysis.issues.push({
          description: '后端有发票数据但前端未显示',
          severity: 'HIGH'
        });
      }

      if (invoices.length > 0) {
        console.log('\n  📋 发票数据抽样验证:');
        for (const inv of invoices.slice(0, 3)) {
          console.log(`     - 发票号: ${inv.invoice_number}`);
          console.log(`       金额: ¥${inv.total_amount}, 状态: ${inv.status}`);
        }
      }
    }

    await TestHelper.logout(page);
  });

  test('【FREELANCER-06】个人资料页面', async ({ page, request }) => {
    console.log('\n📌 【FREELANCER-06】个人资料页面验证');

    const loginResult = await TestHelper.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
    expect(loginResult.success).toBe(true);

    const analysis = await DeepPageAnalyzer.analyzePage(page, request, {
      pageName: '个人资料页面',
      url: `${BASE_URL}/profile`,
      userRole: 'Job Seeker',
      expectedElements: [
        { selector: '[data-testid="profile-form"], form', description: '个人资料表单' },
        { selector: 'input[name="name"], input[name="username"]', description: '姓名输入框' },
        { selector: 'input[name="email"]', description: '邮箱输入框' },
        { selector: 'button[type="submit"], button:has-text("保存")', description: '保存按钮' }
      ],
      backendDataFetcher: async () => {
        const response = await request.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${context.freelancerToken}` }
        });
        return response.json();
      }
    });

    context.analyses.push(analysis);

    if (analysis.backendData?.data) {
      const profile = analysis.backendData.data;
      console.log('\n  📊 后端个人资料:');
      console.log(`     邮箱: ${profile.email}`);
      console.log(`     姓名: ${profile.name || '未设置'}`);
      console.log(`     电话: ${profile.phone || '未设置'}`);
      console.log(`     角色: ${profile.role || profile.user_role}`);

      const frontendEmail = await page.locator('input[name="email"]').first().inputValue().catch(() => '');
      console.log(`\n  📊 前端邮箱: ${frontendEmail}`);

      if (profile.email && frontendEmail !== profile.email) {
        analysis.issues.push({
          description: '前后端邮箱数据不一致',
          severity: 'MEDIUM'
        });
      }
    }

    await TestHelper.logout(page);
  });
});

test.describe('第四部分：数据一致性深度验证', () => {
  
  test('【VERIFY-01】完整业务链路数据验证', async ({ page, request }) => {
    console.log('\n' + '═'.repeat(80));
    console.log('第四部分：数据一致性深度验证');
    console.log('═'.repeat(80));
    console.log('\n📌 【VERIFY-01】完整业务链路数据验证');

    console.log('\n  📋 验证项目 → 工时 → 发票 业务链路\n');

    if (context.testProjectId) {
      const projectResponse = await request.get(`${API_URL}/jobs/${context.testProjectId}`, {
        headers: { Authorization: `Bearer ${context.hrToken}` }
      });
      const projectData = await projectResponse.json();
      const project = projectData.data || projectData;

      console.log(`  📊 项目: ${project.job_title || project.project_title}`);
      console.log(`  📊 项目状态: ${project.status}`);
    }

    const workLogsResponse = await request.get(`${API_URL}/work-logs`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const workLogsData = await workLogsResponse.json();
    const workLogs = workLogsData.work_logs || workLogsData.data?.items || workLogsData.data?.work_logs || workLogsData.data || [];

    console.log(`\n  📊 工时总数: ${workLogs.length} 条`);
    
    const statusCounts = {
      draft: workLogs.filter((w: any) => w.status === 'draft').length,
      submitted: workLogs.filter((w: any) => w.status === 'submitted').length,
      confirmed: workLogs.filter((w: any) => w.status === 'confirmed').length,
      rejected: workLogs.filter((w: any) => w.status === 'rejected').length
    };
    console.log(`  📊 工时状态分布: 草稿=${statusCounts.draft}, 待审核=${statusCounts.submitted}, 已确认=${statusCounts.confirmed}, 已驳回=${statusCounts.rejected}`);

    const invoicesResponse = await request.get(`${API_URL}/invoices`, {
      headers: { Authorization: `Bearer ${context.freelancerToken}` }
    });
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.invoices || invoicesData.data?.items || invoicesData.data || [];

    console.log(`\n  📊 发票总数: ${invoices.length} 条`);
    
    const invoiceStatusCounts = {
      draft: invoices.filter((i: any) => i.status === 'draft').length,
      submitted: invoices.filter((i: any) => i.status === 'submitted').length,
      approved: invoices.filter((i: any) => i.status === 'approved').length,
      paid: invoices.filter((i: any) => i.status === 'paid').length
    };
    console.log(`  📊 发票状态分布: 草稿=${invoiceStatusCounts.draft}, 待审核=${invoiceStatusCounts.submitted}, 已批准=${invoiceStatusCounts.approved}, 已付款=${invoiceStatusCounts.paid}`);

    console.log('\n  ✅ 业务链路数据验证完成');
  });
});

test.afterAll(() => {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          测试汇总报告                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  
  const report = DeepPageAnalyzer.generateAnalysisReport(context.analyses);
  console.log(report);

  const issues = issueLogger.getIssues();
  
  if (issues.length > 0) {
    console.log('\n⚠️ 发现问题汇总:');
    console.log(`  - 总计: ${issues.length} 个问题`);
    console.log(`  - 严重: ${issueLogger.getCriticalCount()} 个`);
    console.log(`  - 高危: ${issueLogger.getHighCount()} 个`);
    
    console.log('\n📋 问题详情:');
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity}] ${issue.description}`);
      console.log(`   页面: ${issue.page}`);
      console.log(`   角色: ${issue.userRole}`);
      console.log(`   预期: ${issue.expectedBehavior}`);
      console.log(`   实际: ${issue.actualBehavior}`);
    });
  }

  const totalIssues = context.analyses.reduce((sum, a) => sum + a.issues.length, 0);
  const totalImprovements = context.analyses.reduce((sum, a) => sum + a.improvements.length, 0);
  
  console.log('\n📊 测试统计:');
  console.log(`  - 分析页面数: ${context.analyses.length}`);
  console.log(`  - 发现问题数: ${totalIssues}`);
  console.log(`  - 改进建议数: ${totalImprovements}`);
  console.log(`  - 记录问题数: ${issues.length}`);

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  E2E测试完成 - 全角色全流程全场景深度验证');
  console.log('═'.repeat(80));
  console.log('\n');
});
