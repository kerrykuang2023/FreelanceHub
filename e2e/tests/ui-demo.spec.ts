import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('UI操作演示测试', () => {
  test.setTimeout(120000);

  test('演示1: 求职者登录并浏览仪表盘', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 求职者登录流程');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('📍 步骤1: 打开登录页面');
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginBtn = page.locator('button[type="submit"]').first();
    
    console.log('📍 步骤2: 输入邮箱');
    await emailInput.click();
    await page.waitForTimeout(500);
    await emailInput.fill('freelancer@test.com');
    await page.waitForTimeout(800);
    
    console.log('📍 步骤3: 输入密码');
    await passwordInput.click();
    await page.waitForTimeout(500);
    await passwordInput.fill('Test1234!');
    await page.waitForTimeout(800);
    
    console.log('📍 步骤4: 点击登录按钮');
    await loginBtn.hover();
    await page.waitForTimeout(500);
    await loginBtn.click();
    
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    console.log('✅ 登录成功，已跳转到仪表盘');
    await page.waitForTimeout(2000);
    
    console.log('📍 步骤5: 浏览仪表盘内容');
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/freelancer-dashboard.png' });
    await page.waitForTimeout(1500);
  });

  test('演示2: 查看角色切换页面', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 角色切换功能');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    console.log('📍 步骤1: 导航到角色切换页面');
    await page.goto(`${BASE_URL}/profile/switch-role`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤2: 查看角色切换界面');
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/role-switcher.png' });
    await page.waitForTimeout(2000);
  });

  test('演示3: 查看积分历史页面', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 积分系统');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    console.log('📍 步骤1: 导航到积分历史页面');
    await page.goto(`${BASE_URL}/profile/credits`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤2: 查看积分卡片和历史记录');
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/credits.png' });
    await page.waitForTimeout(2000);
  });

  test('演示4: 提交举报', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 举报提交功能');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    console.log('📍 步骤1: 导航到举报页面');
    await page.goto(`${BASE_URL}/report`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤2: 选择举报类型');
    const typeRadios = page.locator('input[type="radio"][name="report_type"], input[type="radio"][value]');
    const radioCount = await typeRadios.count();
    if (radioCount > 0) {
      await typeRadios.first().click();
      await page.waitForTimeout(500);
    }
    
    console.log('📍 步骤3: 填写举报描述');
    const descInput = page.locator('textarea').first();
    if (await descInput.isVisible()) {
      await descInput.click();
      await page.waitForTimeout(300);
      await descInput.fill('这是一个测试举报内容，用于演示举报功能的使用流程。我们发现某用户存在违规行为。');
    }
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/report-form.png' });
    console.log('📍 步骤4: 查看填写完成的举报表单');
    await page.waitForTimeout(2000);
  });

  test('演示5: HR登录并发布职位', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: HR发布职位流程');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('📍 步骤1: HR打开登录页面');
    await page.waitForTimeout(1000);
    
    console.log('📍 步骤2: 输入HR账号');
    await page.locator('input[type="email"]').first().fill('hr@test.com');
    await page.waitForTimeout(500);
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.waitForTimeout(500);
    
    console.log('📍 步骤3: 点击登录');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    console.log('✅ HR登录成功');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤4: 导航到发布职位页面');
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/hr-post-job.png' });
    console.log('📍 步骤5: 查看发布职位表单');
    await page.waitForTimeout(2000);
  });

  test('演示6: 管理员登录并查看审批队列', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 管理员审批流程');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('📍 步骤1: 管理员打开登录页面');
    await page.waitForTimeout(1000);
    
    console.log('📍 步骤2: 输入管理员账号');
    await page.locator('input[type="email"]').first().fill('admin@test.com');
    await page.waitForTimeout(500);
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.waitForTimeout(500);
    
    console.log('📍 步骤3: 点击登录');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    console.log('✅ 管理员登录成功');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤4: 导航到角色审批页面');
    await page.goto(`${BASE_URL}/admin/role-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/admin-approvals.png' });
    console.log('📍 步骤5: 查看审批队列');
    await page.waitForTimeout(2000);
    
    console.log('📍 步骤6: 导航到举报管理页面');
    await page.goto(`${BASE_URL}/admin/reports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/admin-reports.png' });
    console.log('📍 步骤7: 查看举报管理');
    await page.waitForTimeout(2000);
  });

  test('演示7: 多角色用户切换角色', async ({ page }) => {
    test.slow();
    
    console.log('\n🎬 开始演示: 多角色用户切换');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('📍 步骤1: 使用多角色用户登录');
    await page.locator('input[type="email"]').first().fill('multirole@test.com');
    await page.waitForTimeout(500);
    await page.locator('input[type="password"]').first().fill('Test1234!');
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
    console.log('✅ 多角色用户登录成功');
    await page.waitForTimeout(1500);
    
    console.log('📍 步骤2: 查看当前角色');
    await page.goto(`${BASE_URL}/profile/switch-role`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'e2e-test-results/screenshots/demo/multirole-switch.png' });
    console.log('📍 步骤3: 查看角色切换选项');
    await page.waitForTimeout(2000);
  });
});
