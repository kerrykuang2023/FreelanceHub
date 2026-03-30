import { test, expect } from '@playwright/test';

test.describe('登录页面调试测试', () => {
  test('调试登录页面元素', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    console.log('开始测试...');
    
    await page.goto('http://localhost:5137/');
    await page.evaluate(() => localStorage.clear());
    console.log('清除localStorage');
    
    await page.goto('http://localhost:5137/login');
    console.log('导航到登录页面');
    
    await page.waitForLoadState('networkidle');
    console.log('页面加载完成');
    
    await page.waitForTimeout(5000);
    console.log('等待5秒');
    
    const pageContent = await page.content();
    console.log('页面内容长度:', pageContent.length);
    
    const errorOverlay = await page.locator('vite-error-overlay').count();
    console.log('vite-error-overlay 数量:', errorOverlay);
    
    if (errorOverlay > 0) {
      const errorHtml = await page.locator('vite-error-overlay').innerHTML();
      console.log('Vite Error HTML:', errorHtml.substring(0, 2000));
    }
    
    console.log('Console Errors:', consoleErrors);
    console.log('Page Errors:', pageErrors);
    
    const emailInputByTestId = await page.locator('[data-testid="email-input"]').count();
    console.log('data-testid="email-input" 元素数量:', emailInputByTestId);
    
    const emailInputByName = await page.locator('input[name="email"]').count();
    console.log('input[name="email"] 元素数量:', emailInputByName);
    
    const allInputs = await page.locator('input').all();
    console.log('所有input元素数量:', allInputs.length);
    
    const rootContent = await page.locator('#root').innerHTML();
    console.log('#root 内容长度:', rootContent.length);
    console.log('#root 内容:', rootContent.substring(0, 1000));
  });
});
