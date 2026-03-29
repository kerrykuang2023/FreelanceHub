import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

test.describe('登录页面渲染测试', () => {
  test('验证登录页面是否可以正常渲染', async ({ page }) => {
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
    
    console.log('📋 开始测试登录页面渲染...');
    
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => localStorage.clear());
    console.log('✅ 清除localStorage');
    
    await page.goto(`${BASE_URL}/login`);
    console.log('✅ 导航到登录页面');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const pageContent = await page.content();
    console.log(`📄 页面内容长度: ${pageContent.length}`);
    
    const errorOverlay = await page.locator('vite-error-overlay').count();
    console.log(`🔍 Vite错误覆盖层数量: ${errorOverlay}`);
    
    if (errorOverlay > 0) {
      try {
        const errorElement = page.locator('vite-error-overlay');
        const errorText = await errorElement.textContent({ timeout: 5000 });
        console.log(`❌ Vite错误文本: ${errorText?.substring(0, 1000)}`);
        
        const errorHtml = await errorElement.innerHTML();
        console.log(`❌ Vite错误HTML长度: ${errorHtml.length}`);
        
        const preElement = await errorElement.locator('pre').first().textContent({ timeout: 3000 }).catch(() => null);
        if (preElement) {
          console.log(`❌ 错误详情: ${preElement.substring(0, 500)}`);
        }
        
        const messageElement = await errorElement.locator('.message, [class*="message"]').first().textContent({ timeout: 3000 }).catch(() => null);
        if (messageElement) {
          console.log(`❌ 错误消息: ${messageElement}`);
        }
        
        const fileElement = await errorElement.locator('[class*="file"], [class*="filepath"]').first().textContent({ timeout: 3000 }).catch(() => null);
        if (fileElement) {
          console.log(`❌ 错误文件: ${fileElement}`);
        }
      } catch (e) {
        console.log(`❌ 无法获取错误详情: ${e}`);
      }
    }
    
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`📄 #root内容长度: ${rootContent.length}`);
    
    if (rootContent.length > 0) {
      console.log(`📄 #root内容预览: ${rootContent.substring(0, 500)}`);
    }
    
    const emailInput = await page.locator('[data-testid="email-input"]').count();
    console.log(`📧 邮箱输入框数量: ${emailInput}`);
    
    const passwordInput = await page.locator('[data-testid="password-input"]').count();
    console.log(`🔑 密码输入框数量: ${passwordInput}`);
    
    const submitBtn = await page.locator('[data-testid="login-submit-btn"]').count();
    console.log(`📤 提交按钮数量: ${submitBtn}`);
    
    console.log(`📋 控制台错误: ${consoleErrors.length}`);
    consoleErrors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    
    console.log(`📋 页面错误: ${pageErrors.length}`);
    pageErrors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    
    if (emailInput > 0 && passwordInput > 0 && submitBtn > 0) {
      console.log('✅ 登录页面渲染成功');
      
      await page.fill('[data-testid="email-input"]', 'hr@test.com');
      await page.fill('[data-testid="password-input"]', 'Test123456!');
      await page.click('[data-testid="login-submit-btn"]');
      
      console.log('✅ 提交登录表单');
      
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`📍 当前URL: ${currentUrl}`);
      
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      console.log(`🔑 Token存在: ${!!token}`);
      
      if (token) {
        console.log('✅ 登录成功');
      } else {
        console.log('❌ 登录失败');
      }
    } else {
      console.log('❌ 登录页面渲染失败');
      
      const allInputs = await page.locator('input').all();
      console.log(`📋 所有input元素数量: ${allInputs.length}`);
      
      for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
        const input = allInputs[i];
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const testId = await input.getAttribute('data-testid');
        console.log(`  Input ${i}: name=${name}, type=${type}, data-testid=${testId}`);
      }
    }
    
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(submitBtn).toBeGreaterThan(0);
  });
});
