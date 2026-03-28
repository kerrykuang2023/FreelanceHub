import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test('Debug login flow', async ({ page }) => {
  console.log('\n========== 登录流程调试 ==========\n');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  console.log(`初始URL: ${page.url()}`);
  
  await page.fill('input[name="email"]', 'freelancer@test.com');
  await page.fill('input[name="password"]', 'Test123456!');
  
  console.log('填写完成，准备点击提交...');
  
  const responsePromise = page.waitForResponse(resp => 
    resp.url().includes('/auth/login')
  );
  
  await page.click('button[type="submit"]');
  
  const response = await responsePromise;
  console.log(`API响应状态: ${response.status()}`);
  
  if (response.ok()) {
    const body = await response.json();
    console.log(`登录成功，Token存在: ${!!body.data?.token}`);
  }
  
  await page.waitForTimeout(5000);
  
  console.log(`5秒后URL: ${page.url()}`);
  
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
  
  await page.screenshot({ path: 'screenshots/login-debug.png', fullPage: true });
});
