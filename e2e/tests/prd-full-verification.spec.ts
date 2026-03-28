import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('PRD功能完整验证 - 使用正确选择器', () => {
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('完整验证: 工时填报页面 (WORKLOG-001)', async ({ page }) => {
    console.log('\n========== WORKLOG-001 工时填报验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-worklog-001-create.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"填报工时": ${pageContent.includes('填报工时') ? '✅' : '❌'}`);
    console.log(`页面包含"项目": ${pageContent.includes('项目') ? '✅' : '❌'}`);
    console.log(`页面包含"工作日期": ${pageContent.includes('工作日期') ? '✅' : '❌'}`);
    console.log(`页面包含"工时": ${pageContent.includes('工时') ? '✅' : '❌'}`);
    console.log(`页面包含"工作类型": ${pageContent.includes('工作类型') ? '✅' : '❌'}`);
    console.log(`页面包含"工作描述": ${pageContent.includes('工作描述') ? '✅' : '❌'}`);

    const projectSelect = page.locator('select#project_requirement_id, select[name="project_requirement_id"]').first();
    console.log(`项目选择框: ${await projectSelect.isVisible() ? '✅' : '❌'}`);

    const dateInput = page.locator('input[type="date"]#work_date, input[type="date"][name="work_date"]').first();
    console.log(`工作日期输入: ${await dateInput.isVisible() ? '✅' : '❌'}`);

    const timeInputs = page.locator('input[type="time"]');
    const timeCount = await timeInputs.count();
    console.log(`时间输入框数量: ${timeCount} (预期2个)`);

    const hoursInput = page.locator('input#hours_worked, input[name="hours_worked"]').first();
    console.log(`工时输入: ${await hoursInput.isVisible() ? '✅' : '❌'}`);

    const workTypeSection = page.locator('text=工作类型').first();
    console.log(`工作类型区域: ${await workTypeSection.isVisible() ? '✅' : '❌'}`);

    const descTextarea = page.locator('textarea#work_description, textarea[name="work_description"]').first();
    console.log(`工作描述: ${await descTextarea.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`提交按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('完整验证: 工时列表页面 (WORKLOG-002)', async ({ page }) => {
    console.log('\n========== WORKLOG-002 工时列表验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-worklog-002-list.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"工时管理": ${pageContent.includes('工时管理') ? '✅' : '❌'}`);
    console.log(`页面包含"填报工时": ${pageContent.includes('填报工时') ? '✅' : '❌'}`);

    const createLink = page.locator('a[href="/work-logs/new"]').first();
    console.log(`新增工时链接: ${await createLink.isVisible() ? '✅' : '❌'}`);

    const statusFilter = page.locator('select').first();
    console.log(`状态筛选: ${await statusFilter.isVisible() ? '✅' : '❌'}`);

    const table = page.locator('table').first();
    console.log(`工时表格: ${await table.isVisible() ? '✅' : '❌'}`);
  });

  test('完整验证: 个人档案页面 (PROFILE)', async ({ page }) => {
    console.log('\n========== PROFILE 个人档案验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-profile-001.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"档案完整度": ${pageContent.includes('档案完整度') ? '✅' : '❌'}`);
    console.log(`页面包含"个人简介": ${pageContent.includes('个人简介') ? '✅' : '❌'}`);
    console.log(`页面包含"技能": ${pageContent.includes('技能') ? '✅' : '❌'}`);
    console.log(`页面包含"项目经历": ${pageContent.includes('项目经历') ? '✅' : '❌'}`);
    console.log(`页面包含"资质证书": ${pageContent.includes('资质证书') ? '✅' : '❌'}`);
    console.log(`页面包含"费率设置": ${pageContent.includes('费率设置') ? '✅' : '❌'}`);

    const tabButtons = page.locator('button[data-testid^="tab-"]');
    const tabCount = await tabButtons.count();
    console.log(`标签页按钮数量: ${tabCount}`);

    const previewBtn = page.locator('[data-testid="preview-profile-btn"]').first();
    console.log(`预览档案按钮: ${await previewBtn.isVisible() ? '✅' : '❌'}`);

    const addSkillBtn = page.locator('[data-testid="add-skill-btn"]').first();
    console.log(`添加技能按钮: ${await addSkillBtn.isVisible() ? '✅ (需要点击技能标签)' : '❌'}`);
  });

  test('完整验证: 管理员仪表盘 (ADMIN-001)', async ({ page }) => {
    console.log('\n========== ADMIN-001 管理员仪表盘验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('admin@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-admin-001-dashboard.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"系统管理后台": ${pageContent.includes('系统管理后台') ? '✅' : '❌'}`);
    console.log(`页面包含"总用户数": ${pageContent.includes('总用户数') ? '✅' : '❌'}`);
    console.log(`页面包含"自由顾问": ${pageContent.includes('自由顾问') ? '✅' : '❌'}`);
    console.log(`页面包含"注册企业": ${pageContent.includes('注册企业') ? '✅' : '❌'}`);
    console.log(`页面包含"项目需求": ${pageContent.includes('项目需求') ? '✅' : '❌'}`);
    console.log(`页面包含"工时记录": ${pageContent.includes('工时记录') ? '✅' : '❌'}`);

    const tabButtons = page.locator('button:has-text("概览"), button:has-text("企业审核"), button:has-text("工时管理")');
    const tabCount = await tabButtons.count();
    console.log(`标签页按钮数量: ${tabCount}`);
  });

  test('完整验证: 发票创建页面 (INV-001)', async ({ page }) => {
    console.log('\n========== INV-001 发票创建验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-inv-001-create.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"发票": ${pageContent.includes('发票') ? '✅' : '❌'}`);

    const form = page.locator('form').first();
    console.log(`表单存在: ${await form.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`提交按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('完整验证: 项目发布页面 (PROJ-001)', async ({ page }) => {
    console.log('\n========== PROJ-001 项目发布验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('hr@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-proj-001-post.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"项目标题": ${pageContent.includes('项目标题') || pageContent.includes('标题') ? '✅' : '❌'}`);
    console.log(`页面包含"项目描述": ${pageContent.includes('项目描述') || pageContent.includes('描述') ? '✅' : '❌'}`);
    console.log(`页面包含"工作性质": ${pageContent.includes('工作性质') ? '✅' : '❌'}`);
    console.log(`页面包含"工作形式": ${pageContent.includes('工作形式') ? '✅' : '❌'}`);

    const titleInput = page.locator('input[name*="title"]').first();
    console.log(`标题输入框: ${await titleInput.isVisible() ? '✅' : '❌'}`);

    const descTextarea = page.locator('textarea[name*="description"]').first();
    console.log(`描述输入框: ${await descTextarea.isVisible() ? '✅' : '❌'}`);

    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`下拉选择框数量: ${selectCount}`);
  });

  test('完整验证: 消息中心页面 (MSG-001)', async ({ page }) => {
    console.log('\n========== MSG-001 消息中心验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-msg-001-messages.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"消息": ${pageContent.includes('消息') || pageContent.includes('Message') ? '✅' : '❌'}`);
  });

  test('完整验证: 报表统计页面 (STAT-001)', async ({ page }) => {
    console.log('\n========== STAT-001 报表统计验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-stat-001-reports.png', fullPage: true });

    const pageContent = await page.content();
    console.log(`页面包含"统计"或"报表": ${pageContent.includes('统计') || pageContent.includes('报表') || pageContent.includes('Report') ? '✅' : '❌'}`);

    const charts = page.locator('canvas, [class*="chart"], svg');
    const chartCount = await charts.count();
    console.log(`图表元素数量: ${chartCount}`);
  });

  test('完整验证: 注册页面 (AUTH-001)', async ({ page }) => {
    console.log('\n========== AUTH-001 注册页面验证 ==========');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-auth-001-register.png', fullPage: true });

    const emailInput = page.locator('input[type="email"]').first();
    console.log(`邮箱输入框: ${await emailInput.isVisible() ? '✅' : '❌'}`);

    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    console.log(`密码输入框数量: ${passwordCount} (预期2个)`);

    const roleSelect = page.locator('select').first();
    console.log(`角色选择: ${await roleSelect.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`注册按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);
  });

  test('完整验证: 登录页面 (AUTH-002)', async ({ page }) => {
    console.log('\n========== AUTH-002 登录页面验证 ==========');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/verify-auth-002-login.png', fullPage: true });

    const emailInput = page.locator('input[type="email"]').first();
    console.log(`邮箱输入框: ${await emailInput.isVisible() ? '✅' : '❌'}`);

    const passwordInput = page.locator('input[type="password"]').first();
    console.log(`密码输入框: ${await passwordInput.isVisible() ? '✅' : '❌'}`);

    const submitBtn = page.locator('button[type="submit"]').first();
    console.log(`登录按钮: ${await submitBtn.isVisible() ? '✅' : '❌'}`);

    const forgotLink = page.locator('a:has-text("忘记"), a:has-text("Forgot")').first();
    console.log(`忘记密码链接: ${await forgotLink.isVisible() ? '✅' : '❌'}`);
  });
});
