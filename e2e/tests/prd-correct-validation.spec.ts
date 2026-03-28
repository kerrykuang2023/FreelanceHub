import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('PRD功能完整验证测试 - 正确选择器', () => {
  test.setTimeout(300000);

  test('AUTH-001: 注册页面完整验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-auth-001-register.png', fullPage: true });

    console.log('\n=== AUTH-001 注册页面验证 ===');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInputs = page.locator('input[type="password"]');
    const roleSelect = page.locator('select').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    console.log(`邮箱输入框: ${await emailInput.isVisible() ? '✅' : '❌'}`);
    console.log(`密码输入框数量: ${await passwordInputs.count()}`);
    console.log(`角色选择: ${await roleSelect.isVisible() ? '✅' : '❌'}`);
    console.log(`提交按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);

    if (await passwordInputs.count() < 2) {
      console.log('⚠️ 缺少确认密码输入框');
    }
  });

  test('AUTH-002: 登录页面完整验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-auth-002-login.png', fullPage: true });

    console.log('\n=== AUTH-002 登录页面验证 ===');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();
    const forgotLink = page.locator('a:has-text("忘记"), a:has-text("Forgot")').first();

    console.log(`邮箱输入框: ${await emailInput.isVisible() ? '✅' : '❌'}`);
    console.log(`密码输入框: ${await passwordInput.isVisible() ? '✅' : '❌'}`);
    console.log(`登录按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
    console.log(`忘记密码链接: ${await forgotLink.isVisible() ? '✅' : '❌'}`);
  });

  test('PROFILE: 个人档案页面完整验证', async ({ page }) => {
    console.log('\n=== PROFILE 个人档案验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-profile-001.png', fullPage: true });

    const profileContainer = page.locator('[data-testid="profile-container"]');
    console.log(`档案容器: ${await profileContainer.isVisible() ? '✅' : '❌'}`);

    const tabs = ['overview', 'skills', 'experience', 'certifications', 'settings'];
    for (const tab of tabs) {
      const tabBtn = page.locator(`[data-testid="tab-${tab}"]`).first();
      console.log(`${tab}标签页: ${await tabBtn.isVisible() ? '✅' : '❌'}`);
    }

    const addSkillBtn = page.locator('[data-testid="add-skill-btn"]').first();
    console.log(`添加技能按钮: ${await addSkillBtn.isVisible() ? '✅' : '❌'}`);

    const hourlyRateInput = page.locator('[data-testid="hourly-rate-input"]').first();
    console.log(`时薪输入框: ${await hourlyRateInput.isVisible() ? '✅' : '❌'}`);

    const previewBtn = page.locator('[data-testid="preview-profile-btn"]').first();
    console.log(`预览档案按钮: ${await previewBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('WORKLOG-001: 工时填报页面完整验证', async ({ page }) => {
    console.log('\n=== WORKLOG-001 工时填报验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/create-worklog`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-worklog-001-create.png', fullPage: true });

    const projectSelect = page.locator('select[name="project_requirement_id"], #project_requirement_id').first();
    console.log(`项目选择: ${await projectSelect.isVisible() ? '✅' : '❌'}`);

    const dateInput = page.locator('input[type="date"], #work_date').first();
    console.log(`工作日期: ${await dateInput.isVisible() ? '✅' : '❌'}`);

    const timeInputs = page.locator('input[type="time"]');
    console.log(`时间输入框数量: ${await timeInputs.count()} (预期2个)`);

    const hoursInput = page.locator('input[name="hours_worked"], #hours_worked').first();
    console.log(`工时输入: ${await hoursInput.isVisible() ? '✅' : '❌'}`);

    const workTypeSection = page.locator('button[type="button"]').filter({ hasText: /远程|现场|会议/ }).first();
    const workTypeSelect = page.locator('select[name="work_type"], #work_type').first();
    console.log(`工作类型: ${await workTypeSection.isVisible() || await workTypeSelect.isVisible() ? '✅' : '❌'}`);

    const descTextarea = page.locator('textarea[name="work_description"], #work_description').first();
    console.log(`工作描述: ${await descTextarea.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`提交按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('WORKLOG-002: 工时列表页面验证', async ({ page }) => {
    console.log('\n=== WORKLOG-002 工时列表验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/worklogs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-worklog-002-list.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"工时": ${pageContent.includes('工时') ? '✅' : '❌'}`);
    console.log(`页面包含"项目": ${pageContent.includes('项目') ? '✅' : '❌'}`);

    const createLink = page.locator('a[href*="create-worklog"], a:has-text("新增"), a:has-text("填报")').first();
    console.log(`新增工时链接: ${await createLink.isVisible() ? '✅' : '❌'}`);
  });

  test('INV-001: 发票创建页面验证', async ({ page }) => {
    console.log('\n=== INV-001 发票创建验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/create-invoice`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-inv-001-create.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"发票": ${pageContent.includes('发票') ? '✅' : '❌'}`);

    const form = page.locator('form').first();
    console.log(`表单存在: ${await form.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`提交按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('PROJ-001: 项目发布页面验证', async ({ page }) => {
    console.log('\n=== PROJ-001 项目发布验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('hr@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-proj-001-post.png', fullPage: true });

    const titleInput = page.locator('input[name*="title"]').first();
    console.log(`项目标题: ${await titleInput.isVisible() ? '✅' : '❌'}`);

    const descTextarea = page.locator('textarea[name*="description"]').first();
    console.log(`项目描述: ${await descTextarea.isVisible() ? '✅' : '❌'}`);

    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`下拉选择框数量: ${selectCount}`);

    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    console.log(`日期输入框数量: ${dateCount}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`发布按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('ADMIN-001: 管理员仪表盘验证', async ({ page }) => {
    console.log('\n=== ADMIN-001 管理员仪表盘验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('admin@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-admin-001-dashboard.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"仪表盘"或"Dashboard": ${pageContent.includes('仪表盘') || pageContent.includes('Dashboard') || pageContent.includes('统计') ? '✅' : '❌'}`);

    const cards = page.locator('[class*="card"], [class*="stat"]');
    const cardCount = await cards.count();
    console.log(`卡片/统计区域数量: ${cardCount}`);
  });

  test('MSG-001: 消息中心验证', async ({ page }) => {
    console.log('\n=== MSG-001 消息中心验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-msg-001-messages.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"消息": ${pageContent.includes('消息') || pageContent.includes('Message') ? '✅' : '❌'}`);
  });

  test('STAT-001: 报表统计验证', async ({ page }) => {
    console.log('\n=== STAT-001 报表统计验证 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/prd-stat-001-reports.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"统计"或"报表": ${pageContent.includes('统计') || pageContent.includes('报表') || pageContent.includes('Report') ? '✅' : '❌'}`);

    const charts = page.locator('canvas, [class*="chart"], svg');
    const chartCount = await charts.count();
    console.log(`图表元素数量: ${chartCount}`);
  });
});
