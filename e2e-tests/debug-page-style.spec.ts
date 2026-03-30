import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.use({
  viewport: { width: 1920, height: 1080 },
});

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
    console.log(`登录失败: ${email}`, e);
    return false;
  }
}

test.describe('🔍 页面样式调试', () => {
  test('调试页面样式', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 页面样式调试');
    console.log('='.repeat(80));
    
    // 登录
    console.log('🔐 正在登录...');
    const loginSuccess = await login(page, 'admin@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    console.log('✅ 登录成功');
    
    // 访问项目列表页面
    console.log('\n📋 访问项目列表页面');
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 获取所有page-container元素
    const allPageContainers = page.locator('.page-container');
    const count = await allPageContainers.count();
    console.log(`找到 ${count} 个page-container元素`);
    
    for (let i = 0; i < count; i++) {
      const container = allPageContainers.nth(i);
      const tagName = await container.evaluate(el => el.tagName);
      const className = await container.evaluate(el => el.className);
      const parent = await container.evaluate(el => el.parentElement?.tagName || 'none');
      
      console.log(`\n元素 ${i + 1}:`);
      console.log(`  标签: ${tagName}`);
      console.log(`  类名: ${className}`);
      console.log(`  父元素: ${parent}`);
      
      // 获取样式
      const styles = await container.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          maxWidth: computed.maxWidth,
          marginLeft: computed.marginLeft,
          marginRight: computed.marginRight,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
          width: computed.width,
        };
      });
      
      console.log(`  样式:`);
      console.log(`    max-width: ${styles.maxWidth}`);
      console.log(`    margin-left: ${styles.marginLeft}`);
      console.log(`    margin-right: ${styles.marginRight}`);
      console.log(`    padding-left: ${styles.paddingLeft}`);
      console.log(`    padding-right: ${styles.paddingRight}`);
      console.log(`    width: ${styles.width}`);
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/debug-page-style.png', fullPage: true });
    console.log('\n📸 截图已保存到 test-results/debug-page-style.png');
  });
});
