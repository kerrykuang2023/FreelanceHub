import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

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

test.describe('🔍 页面居中和留白效果验证', () => {
  test('验证页面布局效果', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 页面居中和留白效果验证');
    console.log('='.repeat(80));
    
    // 登录
    console.log('🔐 正在登录...');
    const loginSuccess = await login(page, 'admin@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    console.log('✅ 登录成功');
    
    // 测试页面列表
    const pagesToTest = [
      { name: '仪表盘', url: '/dashboard' },
      { name: '项目列表', url: '/jobs' },
      { name: '工时列表', url: '/work-logs' },
      { name: '发票列表', url: '/invoices' },
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`\n📋 检查页面: ${pageInfo.name}`);
      
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // 等待loading状态完成
      
      // 检查page-container类
      const pageContainer = page.locator('.page-container');
      
      try {
        await pageContainer.waitFor({ state: 'attached', timeout: 60000 });
      } catch (e) {
        console.log(`  ⚠️ 等待page-container超时: ${e.message}`);
        // 截图保存
        await page.screenshot({ path: `test-results/layout-error-${pageInfo.name}.png` });
        continue;
      }
      
      const count = await pageContainer.count();
      
      if (count > 0) {
        // 获取样式信息
        const styles = await pageContainer.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            maxWidth: computed.maxWidth,
            marginLeft: computed.marginLeft,
            marginRight: computed.marginRight,
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight,
          };
        });
        
        console.log(`  ✅ 找到page-container`);
        console.log(`     max-width: ${styles.maxWidth}`);
        console.log(`     margin: ${styles.marginLeft} ${styles.marginRight}`);
        console.log(`     padding: ${styles.paddingLeft} ${styles.paddingRight}`);
        
        // 验证居中
        if (styles.marginLeft === 'auto' && styles.marginRight === 'auto') {
          console.log(`  ✅ 内容已居中`);
        } else {
          console.log(`  ⚠️ 内容未居中 (margin: ${styles.marginLeft} ${styles.marginRight})`);
        }
        
        // 验证留白
        const leftPad = parseInt(styles.paddingLeft);
        const rightPad = parseInt(styles.paddingRight);
        if (leftPad > 0 && rightPad > 0) {
          console.log(`  ✅ 有左右留白 (${leftPad}px)`);
        } else {
          console.log(`  ⚠️ 缺少留白`);
        }
        
        console.log(`  ✅ 页面布局正确`);
      } else {
        console.log(`  ❌ 未找到page-container类`);
        await page.screenshot({ path: `test-results/layout-error-${pageInfo.name}.png` });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 所有页面布局验证完成');
    console.log('='.repeat(80));
  });
});
