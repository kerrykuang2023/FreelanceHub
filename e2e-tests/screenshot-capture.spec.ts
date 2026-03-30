import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const SCREENSHOT_DIR = 'docs/screenshots/readme';

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
  },
};

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loginAsUser(page: Page, user: { email: string; password: string }) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
  await page.waitForTimeout(3000);
}

async function switchLanguage(page: Page, language: 'zh' | 'en' | 'ja') {
  const langLabels: Record<string, string> = {
    'zh': '中文',
    'en': 'English', 
    'ja': '日本語'
  };
  
  await page.click('[data-testid="language-switcher"]');
  await page.waitForTimeout(500);
  
  const langOption = page.locator(`button:has-text("${langLabels[language]}")`);
  await langOption.click();
  await page.waitForTimeout(1500);
}

async function takeScreenshot(page: Page, filename: string) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filepath}`);
}

test.describe('全链路全角色全语言截图测试', () => {
  
  test.beforeEach(async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);
  });

  test('登录页面 - 中文', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'login-zh.png');
  });

  test('登录页面 - 英文', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await switchLanguage(page, 'en');
    await takeScreenshot(page, 'login-en.png');
  });

  test('登录页面 - 日文', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await switchLanguage(page, 'ja');
    await takeScreenshot(page, 'login-ja.png');
  });

  test('Freelancer工作台 - 中文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    await takeScreenshot(page, 'freelancer-dashboard-zh.png');
  });

  test('Freelancer工作台 - 英文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    await switchLanguage(page, 'en');
    await takeScreenshot(page, 'freelancer-dashboard-en.png');
  });

  test('Freelancer工作台 - 日文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    await switchLanguage(page, 'ja');
    await takeScreenshot(page, 'freelancer-dashboard-ja.png');
  });

  test('HR工作台 - 中文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    await takeScreenshot(page, 'hr-dashboard-zh.png');
  });

  test('HR工作台 - 英文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    await switchLanguage(page, 'en');
    await takeScreenshot(page, 'hr-dashboard-en.png');
  });

  test('HR工作台 - 日文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    await switchLanguage(page, 'ja');
    await takeScreenshot(page, 'hr-dashboard-ja.png');
  });

  test('Admin工作台 - 中文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.admin);
    await takeScreenshot(page, 'admin-dashboard-zh.png');
  });

  test('Admin工作台 - 英文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.admin);
    await switchLanguage(page, 'en');
    await takeScreenshot(page, 'admin-dashboard-en.png');
  });

  test('Admin工作台 - 日文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.admin);
    await switchLanguage(page, 'ja');
    await takeScreenshot(page, 'admin-dashboard-ja.png');
  });

  test('职位列表 - 中文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    await page.waitForTimeout(1000);
    
    const jobsLink = page.locator('a[href*="jobs"], a:has-text("职位"), a:has-text("项目")').first();
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await page.waitForTimeout(2000);
    }
    
    await takeScreenshot(page, 'jobs-list-zh.png');
  });

  test('职位列表 - 英文', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    await switchLanguage(page, 'en');
    await page.waitForTimeout(1000);
    
    const jobsLink = page.locator('a[href*="jobs"], a:has-text("Jobs"), a:has-text("Projects")').first();
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await page.waitForTimeout(2000);
    }
    
    await takeScreenshot(page, 'jobs-list-en.png');
  });
});
