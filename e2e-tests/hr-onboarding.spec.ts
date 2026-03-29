import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('HR Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="email-input"]', 'hr@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-submit-btn"]');
    
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('HR can access onboarding page', async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/onboarding`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const onboardingPage = page.locator('[data-testid="hr-onboarding-page"]');
    await expect(onboardingPage).toBeVisible({ timeout: 10000 });
    
    const title = page.locator('h1:has-text("欢迎加入JobPortal")');
    await expect(title).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/hr-onboarding-page.png', 
      fullPage: true 
    });
    
    console.log('✅ HR onboarding page is accessible');
  });

  test('HR can search companies', async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/onboarding`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="搜索公司"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('测试');
    await page.click('button:has-text("搜索")');
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/hr-company-search.png', 
      fullPage: true 
    });
    
    console.log('✅ HR can search companies');
  });

  test('HR can access company management page', async ({ page }) => {
    await page.goto(`${BASE_URL}/company`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pageTitle = page.locator('h1:has-text("公司管理")');
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    
    const noCompanyMessage = page.locator('h2:has-text("暂无公司信息")');
    await expect(noCompanyMessage).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/hr-company-management.png', 
      fullPage: true 
    });
    
    console.log('✅ HR can access company management page');
  });

  test('HR menu shows company management option', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const companyMenuItem = page.locator('[data-testid="menu-item-company"]');
    await expect(companyMenuItem).toBeVisible();
    await expect(companyMenuItem).toHaveText('公司管理');
    
    console.log('✅ HR menu shows company management option');
  });
});
