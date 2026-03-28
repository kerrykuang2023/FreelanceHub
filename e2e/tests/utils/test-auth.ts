import { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

/**
 * 测试用户账号
 * 用于 E2E 测试的预创建账号
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'admin',
  },
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'freelancer',
  },
  company: {
    email: 'company@test.com',
    password: 'Test1234!',
    role: 'company',
  },
};

/**
 * 执行登录操作
 * 在测试中使用此函数登录用户
 */
export async function login(page: Page, userType: 'admin' | 'freelancer' | 'company' = 'admin') {
  const user = TEST_USERS[userType];
  
  // 访问登录页面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // 填写邮箱
  await page.fill('input[name="email"]', user.email);
  
  // 填写密码
  await page.fill('input[name="password"]', user.password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功并跳转到首页
  await page.waitForURL(/^(?!.*\/login).*/);
  await page.waitForTimeout(2000); // 等待页面完全加载
  
  console.log(`✓ ${userType} 登录成功`);
}

/**
 * 执行登出操作
 */
export async function logout(page: Page) {
  // 点击用户菜单
  await page.click('[data-testid="user-menu"]');
  
  // 点击登出
  await page.click('[data-testid="logout"]');
  
  // 等待跳转到登录页面
  await page.waitForURL(/\/login/);
  
  console.log('✓ 已登出');
}

/**
 * 确保已登录
 * 如果未登录则执行登录
 */
export async function ensureLoggedIn(page: Page, userType: 'admin' | 'freelancer' | 'company' = 'admin') {
  const currentUrl = page.url();
  
  // 如果当前在登录页面，执行登录
  if (currentUrl.includes('/login')) {
    await login(page, userType);
  } else {
    // 否则检查是否已登录（通过检查是否有用户菜单）
    const userMenu = page.locator('[data-testid="user-menu"]');
    const isVisible = await userMenu.isVisible().catch(() => false);
    
    if (!isVisible) {
      await login(page, userType);
    }
  }
}
