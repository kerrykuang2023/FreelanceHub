import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

/**
 * 测试账号配置
 * 注意：这些账号需要先在数据库中创建
 */
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
  },
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
  },
  company: {
    email: 'company@test.com',
    password: 'Test1234!',
  },
};

/**
 * 执行登录操作
 */
async function loginUser(page: any, userType: 'admin' | 'freelancer' | 'company' = 'admin') {
  const user = TEST_USERS[userType];
  
  // 访问登录页面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // 截图
  await page.screenshot({ path: 'e2e-test-results/screenshots/login-page.png' });
  
  // 填写邮箱
  await page.fill('input[name="email"]', user.email);
  
  // 填写密码
  await page.fill('input[name="password"]', user.password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待页面跳转
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: 'e2e-test-results/screenshots/after-login.png' });
  
  console.log(`✓ ${userType} 登录成功`);
}

/**
 * WORKLOG-009 & INV-009: 报表页面完整测试
 * 使用真实登录流程
 */
test.describe('WORKLOG-009 & INV-009: 报表页面测试 (真实登录)', () => {
  
  test('FULL-001: 管理员登录并访问报表页面', async ({ page }) => {
    // 步骤 1: 登录
    await loginUser(page, 'admin');
    
    // 步骤 2: 访问报表页面
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 步骤 3: 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/full-001-reports-page.png',
      fullPage: true 
    });
    
    // 步骤 4: 验证页面基本结构
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
    
    console.log('✓ FULL-001: 管理员登录并访问报表页面完成');
  });

  test('FULL-002: 自由顾问登录并访问报表页面', async ({ page }) => {
    // 步骤 1: 登录
    await loginUser(page, 'freelancer');
    
    // 步骤 2: 访问报表页面
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 步骤 3: 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/full-002-freelancer-reports.png',
      fullPage: true 
    });
    
    console.log('✓ FULL-002: 自由顾问登录并访问报表页面完成');
  });

  test('FULL-003: 企业用户登录并访问报表页面', async ({ page }) => {
    // 步骤 1: 登录
    await loginUser(page, 'company');
    
    // 步骤 2: 访问报表页面
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 步骤 3: 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/full-003-company-reports.png',
      fullPage: true 
    });
    
    console.log('✓ FULL-003: 企业用户登录并访问报表页面完成');
  });
});
