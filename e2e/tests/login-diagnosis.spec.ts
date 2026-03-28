import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

test.describe('Login Diagnosis', () => {
  
  test('Diagnose login flow for all roles', async ({ page, context }) => {
    console.log('\n========== 登录流程诊断 ==========\n');
    
    const testUsers = [
      { email: 'freelancer@test.com', password: 'Test123456!', role: 'freelancer' },
      { email: 'hr@test.com', password: 'Test123456!', role: 'hr' },
      { email: 'admin@test.com', password: 'Test123456!', role: 'admin' }
    ];
    
    for (const user of testUsers) {
      console.log(`\n----- 测试 ${user.role} 登录 -----`);
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      console.log(`当前URL: ${page.url()}`);
      
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const submitBtn = page.locator('button[type="submit"]');
      
      console.log(`邮箱输入框存在: ${await emailInput.isVisible()}`);
      console.log(`密码输入框存在: ${await passwordInput.isVisible()}`);
      console.log(`提交按钮存在: ${await submitBtn.isVisible()}`);
      
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      
      console.log(`填写完成，准备点击提交...`);
      
      const responsePromise = page.waitForResponse(resp => 
        resp.url().includes('/auth/login') || resp.url().includes('/auth/signin')
      ).catch(() => null);
      
      await submitBtn.click();
      
      console.log(`提交按钮已点击，等待响应...`);
      
      const response = await Promise.race([
        responsePromise,
        page.waitForTimeout(5000).then(() => null)
      ]);
      
      if (response) {
        console.log(`API响应状态: ${response.status()}`);
        try {
          const body = await response.json();
          console.log(`API响应体: ${JSON.stringify(body).substring(0, 200)}...`);
        } catch (e) {
          console.log(`无法解析响应体`);
        }
      } else {
        console.log(`未捕获到登录API响应`);
      }
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`登录后URL: ${currentUrl}`);
      
      const localStorage = await page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            items[key] = window.localStorage.getItem(key) || '';
          }
        }
        return items;
      });
      
      console.log(`LocalStorage keys: ${Object.keys(localStorage).join(', ')}`);
      
      const hasToken = Object.keys(localStorage).some(k => 
        k.toLowerCase().includes('token') || k.toLowerCase().includes('auth')
      );
      console.log(`存在Token: ${hasToken}`);
      
      const loginSuccess = !currentUrl.includes('/login');
      console.log(`登录结果: ${loginSuccess ? '成功' : '失败'}`);
      
      await page.screenshot({ path: `screenshots/login-diagnosis-${user.role}.png`, fullPage: true });
      
      if (!loginSuccess) {
        const pageContent = await page.content();
        const hasError = pageContent.includes('error') || pageContent.includes('错误') || pageContent.includes('失败');
        console.log(`页面包含错误信息: ${hasError}`);
      }
      
      await context.clearCookies();
      await page.evaluate(() => window.localStorage.clear());
      
      console.log(`----- ${user.role} 测试结束 -----\n`);
    }
  });
  
  test('Direct API login test', async ({ request }) => {
    console.log('\n========== 直接API登录测试 ==========\n');
    
    const testUsers = [
      { email: 'freelancer@test.com', password: 'Test123456!' },
      { email: 'hr@test.com', password: 'Test123456!' },
      { email: 'admin@test.com', password: 'Test123456!' }
    ];
    
    for (const user of testUsers) {
      console.log(`\n测试用户: ${user.email}`);
      
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: user.email,
          password: user.password
        }
      });
      
      console.log(`响应状态: ${response.status()}`);
      
      if (response.ok()) {
        const body = await response.json();
        console.log(`登录成功! Token存在: ${!!body.token || !!body.data?.token}`);
        console.log(`用户信息: ${JSON.stringify(body.user || body.data?.user || 'N/A').substring(0, 100)}`);
      } else {
        const text = await response.text();
        console.log(`登录失败: ${text.substring(0, 200)}`);
      }
    }
  });
  
  test('Check frontend login page structure', async ({ page }) => {
    console.log('\n========== 检查登录页面结构 ==========\n');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const inputs = await page.locator('input').all();
    console.log(`找到 ${inputs.length} 个输入框:`);
    for (const input of inputs) {
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`  - name: ${name}, type: ${type}, placeholder: ${placeholder}`);
    }
    
    const buttons = await page.locator('button').all();
    console.log(`\n找到 ${buttons.length} 个按钮:`);
    for (const btn of buttons) {
      const text = await btn.textContent();
      const type = await btn.getAttribute('type');
      console.log(`  - text: ${text?.trim()}, type: ${type}`);
    }
    
    const forms = await page.locator('form').all();
    console.log(`\n找到 ${forms.length} 个表单`);
    
    await page.screenshot({ path: 'screenshots/login-page-structure.png', fullPage: true });
  });
});
