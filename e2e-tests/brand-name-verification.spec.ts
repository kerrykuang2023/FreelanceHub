import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';

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

async function loginAsUser(page: Page, user: { email: string; password: string }) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  await page.waitForTimeout(2000);
}

async function switchLanguage(page: Page, language: 'zh' | 'en' | 'ja') {
  await page.click('[data-testid="language-switcher"]');
  await page.waitForTimeout(500);
  const langSelector = `[data-testid="lang-option-${language}"]`;
  await page.click(langSelector);
  await page.waitForTimeout(1000);
}

test.describe('品牌名称验证测试 - FreelanceHub', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('登录页面Logo显示FreelanceHub', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const logoText = await page.locator('text=FreelanceHub').first();
    await expect(logoText).toBeVisible();
    
    const pageTitle = await page.title();
    expect(pageTitle).toContain('FreelanceHub');
    
    console.log('✅ 登录页面Logo验证通过: FreelanceHub');
  });

  test('登录页面版权信息显示FreelanceHub', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const copyright = page.locator('text=FreelanceHub');
    await expect(copyright).toBeVisible();
    
    console.log('✅ 登录页面版权信息验证通过');
  });

  test('Freelancer工作台Logo显示FreelanceHub', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    
    const logoText = await page.locator('text=FreelanceHub').first();
    await expect(logoText).toBeVisible();
    
    console.log('✅ Freelancer工作台Logo验证通过: FreelanceHub');
  });

  test('HR工作台Logo显示FreelanceHub', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    
    const logoText = await page.locator('text=FreelanceHub').first();
    await expect(logoText).toBeVisible();
    
    console.log('✅ HR工作台Logo验证通过: FreelanceHub');
  });

  test('Admin工作台Logo显示FreelanceHub', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.admin);
    
    const logoText = await page.locator('text=FreelanceHub').first();
    await expect(logoText).toBeVisible();
    
    console.log('✅ Admin工作台Logo验证通过: FreelanceHub');
  });

  test('页面标题包含FreelanceHub', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const title = await page.title();
    expect(title).toContain('FreelanceHub');
    
    console.log(`✅ 页面标题验证通过: ${title}`);
  });

  test('多语言下Logo显示FreelanceHub', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    
    const languages = ['zh', 'en', 'ja'] as const;
    
    for (const lang of languages) {
      await switchLanguage(page, lang);
      await page.waitForTimeout(1000);
      
      const logoText = await page.locator('text=FreelanceHub').first();
      await expect(logoText).toBeVisible();
      
      console.log(`✅ ${lang} 语言下Logo验证通过: FreelanceHub`);
    }
  });

  test('确认页面中不存在JobPortal字样', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    
    const pageContent = await page.content();
    
    expect(pageContent).not.toContain('JobPortal');
    expect(pageContent).not.toContain('Job Portal');
    
    console.log('✅ 确认页面中不存在JobPortal字样');
  });

  test('Footer版权信息显示FreelanceHub', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.freelancer);
    
    await page.waitForTimeout(1000);
    
    const footerContent = await page.locator('footer').textContent();
    expect(footerContent).toContain('FreelanceHub');
    
    console.log('✅ Footer版权信息验证通过: FreelanceHub');
  });
});
