import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'freelancer',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
  },
};

let freelancerToken: string = '';
let hrToken: string = '';

async function loginAndGetToken(request: APIRequestContext, user: TestUser): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });
  
  const data = await response.json();
  if (!data.success || !data.data?.token) {
    throw new Error(`Login failed for ${user.email}`);
  }
  
  return data.data.token;
}

async function loginAsUser(page: Page, user: TestUser, token: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t);
  }, token);
  
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log(`✅ Logged in as ${user.email}`);
}

test.describe('白屏问题诊断测试', () => {
  test.setTimeout(120000);

  test.beforeAll(async ({ request }) => {
    freelancerToken = await loginAndGetToken(request, TEST_USERS.freelancer);
    hrToken = await loginAndGetToken(request, TEST_USERS.hr);
    console.log('✅ Tokens obtained for all users');
  });

  test('DEBUG-01: 检查页面控制台错误', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DEBUG-01: 检查页面控制台错误');
    console.log('========================================\n');

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      console.log(`[Browser Console] ${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      console.log(`[Page Error] ${error.message}`);
      pageErrors.push(error.message);
    });

    await loginAsUser(page, TEST_USERS.freelancer, freelancerToken);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const bodyText = await page.locator('body').textContent();
    console.log(`[DEBUG-01] Body text length: ${bodyText?.length || 0}`);
    console.log(`[DEBUG-01] Body text preview: ${bodyText?.substring(0, 500) || 'empty'}`);

    const html = await page.content();
    console.log(`[DEBUG-01] HTML length: ${html.length}`);

    await page.screenshot({ path: 'test-results/debug-page.png', fullPage: true });

    if (consoleErrors.length > 0) {
      console.log('\n[DEBUG-01] 控制台错误:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    if (pageErrors.length > 0) {
      console.log('\n[DEBUG-01] 页面错误:');
      pageErrors.forEach(err => console.log(`  - ${err}`));
    }

    const hasAppRoot = await page.locator('#root, [data-testid="global-navbar"], .page-container').count();
    console.log(`[DEBUG-01] 找到 ${hasAppRoot} 个根元素`);

    const hasLoadingSpinner = await page.locator('.animate-spin').count();
    console.log(`[DEBUG-01] 找到 ${hasLoadingSpinner} 个加载动画`);
  });

  test('DEBUG-02: 检查页面DOM结构', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DEBUG-02: 检查页面DOM结构');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.freelancer, freelancerToken);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const domInfo = await page.evaluate(() => {
      const body = document.body;
      return {
        bodyClasses: body.className,
        childrenCount: body.children.length,
        hasNavbar: !!document.querySelector('[data-testid="global-navbar"]'),
        hasPortalLayout: !!document.querySelector('.flex.flex-col.bg-gray-50'),
        hasPageContainer: !!document.querySelector('.page-container'),
        hasStatCards: !!document.querySelector('[data-testid^="stat-card-"]'),
        bodyInnerHTML: body.innerHTML.substring(0, 2000),
      };
    });

    console.log('[DEBUG-02] DOM 信息:');
    console.log(`  - Body classes: ${domInfo.bodyClasses}`);
    console.log(`  - Children count: ${domInfo.childrenCount}`);
    console.log(`  - Has Navbar: ${domInfo.hasNavbar}`);
    console.log(`  - Has PortalLayout: ${domInfo.hasPortalLayout}`);
    console.log(`  - Has PageContainer: ${domInfo.hasPageContainer}`);
    console.log(`  - Has StatCards: ${domInfo.hasStatCards}`);
    console.log(`  - Body HTML preview: ${domInfo.bodyInnerHTML.substring(0, 500)}...`);

    await page.screenshot({ path: 'test-results/debug-dom.png', fullPage: true });
  });
});
