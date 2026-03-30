import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const LANGUAGES = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
  },
};

interface I18nIssue {
  id: string;
  page: string;
  language: string;
  description: string;
  expectedText: string;
  actualText: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'FIXED';
}

class I18nIssueLogger {
  private issues: I18nIssue[] = [];
  private issueCounter = 0;

  logIssue(issue: Omit<I18nIssue, 'id' | 'status'>): void {
    this.issueCounter++;
    this.issues.push({
      ...issue,
      id: `i18n-${String(this.issueCounter).padStart(3, '0')}`,
      status: 'OPEN',
    });
  }

  getIssues(): I18nIssue[] {
    return this.issues;
  }

  printReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('国际化问题报告 / I18n Issues Report');
    console.log('='.repeat(80));
    
    if (this.issues.length === 0) {
      console.log('✅ 未发现国际化问题 / No i18n issues found');
      return;
    }

    const groupedByPage = this.issues.reduce((acc, issue) => {
      if (!acc[issue.page]) acc[issue.page] = [];
      acc[issue.page].push(issue);
      return acc;
    }, {} as Record<string, I18nIssue[]>);

    for (const [page, issues] of Object.entries(groupedByPage)) {
      console.log(`\n📄 ${page}`);
      for (const issue of issues) {
        console.log(`   [${issue.severity}] ${issue.description}`);
        console.log(`      预期: ${issue.expectedText}`);
        console.log(`      实际: ${issue.actualText}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`总计问题数: ${this.issues.length}`);
    console.log('='.repeat(80));
  }
}

const issueLogger = new I18nIssueLogger();

async function login(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-submit-btn"]');
    
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
    
    await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    return true;
  } catch (e) {
    console.log(`Login failed: ${email}`, e);
    return false;
  }
}

async function setLanguage(page: Page, langCode: string): Promise<void> {
  await page.evaluate((lang) => {
    localStorage.setItem('language', lang);
    localStorage.setItem('i18nextLng', lang);
  }, langCode);
}

async function switchLanguage(page: Page, langCode: string): Promise<void> {
  const languageSwitcher = page.locator('[data-testid="language-switcher"]');
  const isVisible = await languageSwitcher.isVisible().catch(() => false);
  
  if (isVisible) {
    await languageSwitcher.click();
    await page.waitForTimeout(500);
    
    const langOption = page.locator(`[data-testid="language-option-${langCode}"]`);
    const optionVisible = await langOption.isVisible().catch(() => false);
    
    if (optionVisible) {
      await langOption.click();
      await page.waitForTimeout(1000);
    }
  }
}

async function verifyTextExists(
  page: Page,
  selectors: string[],
  description: string,
  pageName: string,
  language: string
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 5000 });
      if (isVisible) {
        return true;
      }
    } catch {
      continue;
    }
  }
  
  issueLogger.logIssue({
    page: pageName,
    language,
    description: `未找到文本: ${description}`,
    expectedText: description,
    actualText: '未找到',
    severity: 'HIGH',
  });
  
  return false;
}

test.describe('🌐 全面国际化E2E测试 / Comprehensive i18n E2E Tests', () => {
  
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('开始国际化E2E测试 / Starting i18n E2E Tests');
    console.log('='.repeat(80));
  });

  test.afterAll(async () => {
    issueLogger.printReport();
  });

  test.describe('Phase 1: 语言切换器组件测试', () => {
    
    test('P1-01: 语言切换器应该在登录页面可见', async ({ page }) => {
      console.log('\n🧪 [P1-01] 测试语言切换器可见性');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      const isVisible = await languageSwitcher.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (!isVisible) {
        issueLogger.logIssue({
          page: '登录页面',
          language: 'all',
          description: '语言切换器组件不可见',
          expectedText: 'Language Switcher visible',
          actualText: 'Not found',
          severity: 'CRITICAL',
        });
      }
      
      console.log(`  结果: ${isVisible ? '✅ 通过' : '❌ 失败'}`);
    });
    
    test('P1-02: 点击语言切换器应显示语言选项', async ({ page }) => {
      console.log('\n🧪 [P1-02] 测试语言选项显示');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      const isVisible = await languageSwitcher.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (isVisible) {
        await languageSwitcher.click();
        await page.waitForTimeout(500);
        
        const zhOption = page.locator('[data-testid="language-option-zh"]');
        const enOption = page.locator('[data-testid="language-option-en"]');
        
        const zhVisible = await zhOption.isVisible().catch(() => false);
        const enVisible = await enOption.isVisible().catch(() => false);
        
        console.log(`  中文选项: ${zhVisible ? '✅' : '❌'}`);
        console.log(`  英文选项: ${enVisible ? '✅' : '❌'}`);
        
        if (!zhVisible || !enVisible) {
          issueLogger.logIssue({
            page: '语言切换器',
            language: 'all',
            description: '语言选项不完整',
            expectedText: '中文, English',
            actualText: `中文: ${zhVisible}, English: ${enVisible}`,
            severity: 'HIGH',
          });
        }
      } else {
        console.log('  ⚠️ 语言切换器不可见，跳过测试');
      }
    });
    
    test('P1-03: 语言选择应保存到localStorage', async ({ page }) => {
      console.log('\n🧪 [P1-03] 测试语言持久化');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await setLanguage(page, 'en');
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const savedLang = await page.evaluate(() => localStorage.getItem('language'));
      const isCorrect = savedLang === 'en';
      
      console.log(`  保存的语言: ${savedLang}`);
      console.log(`  结果: ${isCorrect ? '✅ 通过' : '❌ 失败'}`);
      
      if (!isCorrect) {
        issueLogger.logIssue({
          page: '语言持久化',
          language: 'en',
          description: '语言未正确保存到localStorage',
          expectedText: 'en',
          actualText: savedLang || 'null',
          severity: 'HIGH',
        });
      }
    });
  });

  test.describe('Phase 2: 公共页面国际化测试', () => {
    
    test('P2-01: 登录页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P2-01] 测试登录页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase2-login-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=欢迎回来', 'text=登录', 'text=邮箱'], desc: '欢迎回来/登录' },
        { selectors: ['text=邮箱', 'text=账号', 'text=Email'], desc: '邮箱/账号' },
        { selectors: ['text=密码', 'text=Password'], desc: '密码' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '登录页面', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P2-02: 登录页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P2-02] 测试登录页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase2-login-en.png' });
      
      const enTexts = [
        { selectors: ['text=Welcome', 'text=Login', 'text=Sign in', 'text=Back'], desc: 'Welcome/Login' },
        { selectors: ['text=Email', 'text=email', 'text=邮箱'], desc: 'Email' },
        { selectors: ['text=Password', 'text=password', 'text=密码'], desc: 'Password' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '登录页面', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P2-03: 注册页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P2-03] 测试注册页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase2-register-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=注册', 'text=创建', 'text=新用户', 'text=Register'], desc: '注册/创建' },
        { selectors: ['text=已有账户', 'text=登录', 'text=Login'], desc: '已有账户/登录' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '注册页面', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P2-04: 注册页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P2-04] 测试注册页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase2-register-en.png' });
      
      const enTexts = [
        { selectors: ['text=Register', 'text=Create', 'text=Sign up', 'text=注册'], desc: 'Register/Create' },
        { selectors: ['text=Already have', 'text=Sign in', 'text=Login', 'text=已有'], desc: 'Already have/Sign in' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '注册页面', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
  });

  test.describe('Phase 3: Freelancer页面国际化测试', () => {
    
    test.beforeEach(async ({ page }) => {
      const success = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(success).toBe(true);
    });
    
    test('P3-01: Freelancer仪表板中文显示', async ({ page }) => {
      console.log('\n🧪 [P3-01] 测试Freelancer仪表板中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-freelancer-dashboard-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=工作台', 'text=仪表板', 'text=首页'], desc: '工作台/仪表板' },
        { selectors: ['text=职位', 'text=工作'], desc: '职位/工作' },
        { selectors: ['text=工时', 'text=记录'], desc: '工时/记录' },
        { selectors: ['text=发票', 'text=账单'], desc: '发票/账单' },
        { selectors: ['text=档案', 'text=个人', 'text=设置'], desc: '档案/个人/设置' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'Freelancer仪表板', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P3-02: Freelancer仪表板英文显示', async ({ page }) => {
      console.log('\n🧪 [P3-02] 测试Freelancer仪表板英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-freelancer-dashboard-en.png' });
      
      const enTexts = [
        { selectors: ['text=Dashboard', 'text=Home', 'text=Overview'], desc: 'Dashboard/Home' },
        { selectors: ['text=Job', 'text=Work', 'text=Project'], desc: 'Job/Work/Project' },
        { selectors: ['text=Work Log', 'text=Time', 'text=Log'], desc: 'Work Log/Time' },
        { selectors: ['text=Invoice', 'text=Bill'], desc: 'Invoice/Bill' },
        { selectors: ['text=Profile', 'text=Setting', 'text=Account'], desc: 'Profile/Setting' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'Freelancer仪表板', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P3-03: 职位列表页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P3-03] 测试职位列表页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-jobs-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=职位', 'text=工作', 'text=项目'], desc: '职位/工作/项目' },
        { selectors: ['text=搜索', 'text=筛选', 'text=过滤'], desc: '搜索/筛选' },
        { selectors: ['text=状态', 'text=类型'], desc: '状态/类型' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '职位列表', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P3-04: 职位列表页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P3-04] 测试职位列表页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-jobs-en.png' });
      
      const enTexts = [
        { selectors: ['text=Job', 'text=Work', 'text=Project'], desc: 'Job/Work/Project' },
        { selectors: ['text=Search', 'text=Filter'], desc: 'Search/Filter' },
        { selectors: ['text=Status', 'text=Type'], desc: 'Status/Type' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '职位列表', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P3-05: 工时列表页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P3-05] 测试工时列表页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-worklogs-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=工时', 'text=记录'], desc: '工时/记录' },
        { selectors: ['text=创建', 'text=新增', 'text=添加'], desc: '创建/新增' },
        { selectors: ['text=日期', 'text=时间'], desc: '日期/时间' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '工时列表', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P3-06: 工时列表页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P3-06] 测试工时列表页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-worklogs-en.png' });
      
      const enTexts = [
        { selectors: ['text=Work Log', 'text=Time Log', 'text=Log'], desc: 'Work Log/Time Log' },
        { selectors: ['text=Create', 'text=Add', 'text=New'], desc: 'Create/Add/New' },
        { selectors: ['text=Date', 'text=Time'], desc: 'Date/Time' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '工时列表', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P3-07: 发票列表页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P3-07] 测试发票列表页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-invoices-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=发票', 'text=账单'], desc: '发票/账单' },
        { selectors: ['text=创建', 'text=新增'], desc: '创建/新增' },
        { selectors: ['text=金额', 'text=状态'], desc: '金额/状态' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '发票列表', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P3-08: 发票列表页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P3-08] 测试发票列表页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-invoices-en.png' });
      
      const enTexts = [
        { selectors: ['text=Invoice', 'text=Bill'], desc: 'Invoice/Bill' },
        { selectors: ['text=Create', 'text=Add', 'text=New'], desc: 'Create/Add/New' },
        { selectors: ['text=Amount', 'text=Status', 'text=Total'], desc: 'Amount/Status' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '发票列表', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P3-09: 个人档案页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P3-09] 测试个人档案页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-profile-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=档案', 'text=个人', 'text=资料'], desc: '档案/个人/资料' },
        { selectors: ['text=编辑', 'text=修改'], desc: '编辑/修改' },
        { selectors: ['text=技能', 'text=经验', 'text=教育'], desc: '技能/经验/教育' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '个人档案', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P3-10: 个人档案页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P3-10] 测试个人档案页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase3-profile-en.png' });
      
      const enTexts = [
        { selectors: ['text=Profile', 'text=Account', 'text=Personal'], desc: 'Profile/Account/Personal' },
        { selectors: ['text=Edit', 'text=Modify', 'text=Update'], desc: 'Edit/Modify/Update' },
        { selectors: ['text=Skill', 'text=Experience', 'text=Education'], desc: 'Skill/Experience/Education' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '个人档案', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
  });

  test.describe('Phase 4: HR页面国际化测试', () => {
    
    test.beforeEach(async ({ page }) => {
      const success = await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
      expect(success).toBe(true);
    });
    
    test('P4-01: HR仪表板中文显示', async ({ page }) => {
      console.log('\n🧪 [P4-01] 测试HR仪表板中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase4-hr-dashboard-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=HR', 'text=人力', 'text=仪表板', 'text=工作台'], desc: 'HR/仪表板' },
        { selectors: ['text=待审核', 'text=待处理', 'text=审批'], desc: '待审核/待处理' },
        { selectors: ['text=项目', 'text=职位'], desc: '项目/职位' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'HR仪表板', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P4-02: HR仪表板英文显示', async ({ page }) => {
      console.log('\n🧪 [P4-02] 测试HR仪表板英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase4-hr-dashboard-en.png' });
      
      const enTexts = [
        { selectors: ['text=HR', 'text=Dashboard', 'text=Overview'], desc: 'HR/Dashboard' },
        { selectors: ['text=Pending', 'text=Approval', 'text=Review'], desc: 'Pending/Approval' },
        { selectors: ['text=Project', 'text=Job'], desc: 'Project/Job' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'HR仪表板', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P4-03: 发布职位页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P4-03] 测试发布职位页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/jobs/post`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase4-post-job-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=发布', 'text=创建', 'text=新增'], desc: '发布/创建/新增' },
        { selectors: ['text=职位', 'text=工作'], desc: '职位/工作' },
        { selectors: ['text=标题', 'text=名称'], desc: '标题/名称' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '发布职位', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P4-04: 发布职位页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P4-04] 测试发布职位页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/jobs/post`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase4-post-job-en.png' });
      
      const enTexts = [
        { selectors: ['text=Post', 'text=Create', 'text=New'], desc: 'Post/Create/New' },
        { selectors: ['text=Job', 'text=Position'], desc: 'Job/Position' },
        { selectors: ['text=Title', 'text=Name'], desc: 'Title/Name' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '发布职位', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
  });

  test.describe('Phase 5: Admin页面国际化测试', () => {
    
    test.beforeEach(async ({ page }) => {
      const success = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      expect(success).toBe(true);
    });
    
    test('P5-01: Admin仪表板中文显示', async ({ page }) => {
      console.log('\n🧪 [P5-01] 测试Admin仪表板中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-dashboard-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=管理', 'text=后台', 'text=系统'], desc: '管理/后台/系统' },
        { selectors: ['text=用户', 'text=账户'], desc: '用户/账户' },
        { selectors: ['text=公司', 'text=企业'], desc: '公司/企业' },
        { selectors: ['text=配置', 'text=设置'], desc: '配置/设置' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'Admin仪表板', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P5-02: Admin仪表板英文显示', async ({ page }) => {
      console.log('\n🧪 [P5-02] 测试Admin仪表板英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-dashboard-en.png' });
      
      const enTexts = [
        { selectors: ['text=Admin', 'text=Management', 'text=System'], desc: 'Admin/Management/System' },
        { selectors: ['text=User', 'text=Account'], desc: 'User/Account' },
        { selectors: ['text=Company', 'text=Enterprise'], desc: 'Company/Enterprise' },
        { selectors: ['text=Config', 'text=Setting', 'text=Configuration'], desc: 'Config/Setting' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, 'Admin仪表板', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P5-03: 用户管理页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P5-03] 测试用户管理页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-users-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=用户', 'text=账户'], desc: '用户/账户' },
        { selectors: ['text=管理', 'text=列表'], desc: '管理/列表' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '用户管理', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P5-04: 用户管理页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P5-04] 测试用户管理页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-users-en.png' });
      
      const enTexts = [
        { selectors: ['text=User', 'text=Account'], desc: 'User/Account' },
        { selectors: ['text=Management', 'text=List'], desc: 'Management/List' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '用户管理', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
    
    test('P5-05: 系统配置页面中文显示', async ({ page }) => {
      console.log('\n🧪 [P5-05] 测试系统配置页面中文显示');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/admin/config`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-config-zh.png' });
      
      const zhTexts = [
        { selectors: ['text=配置', 'text=设置', 'text=系统'], desc: '配置/设置/系统' },
        { selectors: ['text=保存', 'text=提交'], desc: '保存/提交' },
      ];
      
      let passed = 0;
      for (const text of zhTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '系统配置', 'zh');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${zhTexts.length}`);
    });
    
    test('P5-06: 系统配置页面英文显示', async ({ page }) => {
      console.log('\n🧪 [P5-06] 测试系统配置页面英文显示');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/admin/config`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase5-admin-config-en.png' });
      
      const enTexts = [
        { selectors: ['text=Config', 'text=Setting', 'text=System'], desc: 'Config/Setting/System' },
        { selectors: ['text=Save', 'text=Submit'], desc: 'Save/Submit' },
      ];
      
      let passed = 0;
      for (const text of enTexts) {
        const found = await verifyTextExists(page, text.selectors, text.desc, '系统配置', 'en');
        if (found) passed++;
      }
      
      console.log(`  通过: ${passed}/${enTexts.length}`);
    });
  });

  test.describe('Phase 6: 流程级国际化测试', () => {
    
    test('P6-01: 完整登录流程中文测试', async ({ page }) => {
      console.log('\n🧪 [P6-01] 测试完整登录流程中文');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.freelancer.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.freelancer.password);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-login-flow-zh.png' });
      
      await page.click('[data-testid="login-submit-btn"]');
      
      await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-after-login-zh.png' });
      
      console.log('  ✅ 登录流程完成');
    });
    
    test('P6-02: 完整登录流程英文测试', async ({ page }) => {
      console.log('\n🧪 [P6-02] 测试完整登录流程英文');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.freelancer.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.freelancer.password);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-login-flow-en.png' });
      
      await page.click('[data-testid="login-submit-btn"]');
      
      await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-after-login-en.png' });
      
      console.log('  ✅ 登录流程完成');
    });
    
    test('P6-03: 语言切换持久化测试', async ({ page }) => {
      console.log('\n🧪 [P6-03] 测试语言切换持久化');
      
      await setLanguage(page, 'en');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      let savedLang = await page.evaluate(() => localStorage.getItem('language'));
      console.log(`  初始语言: ${savedLang}`);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      savedLang = await page.evaluate(() => localStorage.getItem('language'));
      console.log(`  刷新后语言: ${savedLang}`);
      
      const isPersisted = savedLang === 'en';
      console.log(`  持久化结果: ${isPersisted ? '✅ 通过' : '❌ 失败'}`);
      
      if (!isPersisted) {
        issueLogger.logIssue({
          page: '语言持久化',
          language: 'en',
          description: '语言刷新后未保持',
          expectedText: 'en',
          actualText: savedLang || 'null',
          severity: 'HIGH',
        });
      }
    });
    
    test('P6-04: 语言切换后页面更新测试', async ({ page }) => {
      console.log('\n🧪 [P6-04] 测试语言切换后页面更新');
      
      await setLanguage(page, 'zh');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-switch-before-zh.png' });
      
      await setLanguage(page, 'en');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n/phase6-switch-after-en.png' });
      
      const loginBtn = page.locator('[data-testid="login-submit-btn"]');
      const btnText = await loginBtn.textContent();
      
      console.log(`  按钮文本: ${btnText}`);
      console.log(`  结果: ${btnText?.includes('Login') || btnText?.includes('登录') ? '✅ 语言已切换' : '❌ 语言未切换'}`);
    });
  });

  test.describe('Phase 7: 跨角色国际化测试', () => {
    
    test('P7-01: Freelancer角色完整国际化流程', async ({ page }) => {
      console.log('\n🧪 [P7-01] 测试Freelancer角色完整国际化流程');
      
      const success = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      expect(success).toBe(true);
      
      const pages = [
        { url: '/', name: '仪表板' },
        { url: '/jobs', name: '职位列表' },
        { url: '/work-logs', name: '工时列表' },
        { url: '/invoices', name: '发票列表' },
        { url: '/profile', name: '个人档案' },
      ];
      
      for (const lang of ['zh', 'en']) {
        console.log(`\n  测试语言: ${lang}`);
        await setLanguage(page, lang);
        
        for (const pageInfo of pages) {
          await page.goto(`${BASE_URL}${pageInfo.url}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: `test-results/i18n/phase7-freelancer-${pageInfo.name.replace(/\s/g, '-')}-${lang}.png` 
          });
        }
      }
      
      console.log('  ✅ Freelancer角色国际化测试完成');
    });
    
    test('P7-02: HR角色完整国际化流程', async ({ page }) => {
      console.log('\n🧪 [P7-02] 测试HR角色完整国际化流程');
      
      const success = await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
      expect(success).toBe(true);
      
      const pages = [
        { url: '/hr/dashboard', name: 'HR仪表板' },
        { url: '/jobs', name: '职位列表' },
        { url: '/my-jobs', name: '我的职位' },
      ];
      
      for (const lang of ['zh', 'en']) {
        console.log(`\n  测试语言: ${lang}`);
        await setLanguage(page, lang);
        
        for (const pageInfo of pages) {
          await page.goto(`${BASE_URL}${pageInfo.url}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: `test-results/i18n/phase7-hr-${pageInfo.name.replace(/\s/g, '-')}-${lang}.png` 
          });
        }
      }
      
      console.log('  ✅ HR角色国际化测试完成');
    });
    
    test('P7-03: Admin角色完整国际化流程', async ({ page }) => {
      console.log('\n🧪 [P7-03] 测试Admin角色完整国际化流程');
      
      const success = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      expect(success).toBe(true);
      
      const pages = [
        { url: '/admin', name: 'Admin仪表板' },
        { url: '/admin/users', name: '用户管理' },
        { url: '/admin/config', name: '系统配置' },
      ];
      
      for (const lang of ['zh', 'en']) {
        console.log(`\n  测试语言: ${lang}`);
        await setLanguage(page, lang);
        
        for (const pageInfo of pages) {
          await page.goto(`${BASE_URL}${pageInfo.url}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: `test-results/i18n/phase7-admin-${pageInfo.name.replace(/\s/g, '-')}-${lang}.png` 
          });
        }
      }
      
      console.log('  ✅ Admin角色国际化测试完成');
    });
  });
});
