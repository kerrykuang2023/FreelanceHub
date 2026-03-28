import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('详细UI元素验证测试', () => {
  test.setTimeout(300000);

  test('验证注册页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-auth-001-register.png', fullPage: true });

    console.log('\n--- 注册页面元素检查 ---');
    
    const elements = {
      '邮箱输入框': 'input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]',
      '密码输入框': 'input[type="password"]',
      '确认密码': 'input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="确认"], input[placeholder*="Confirm"]',
      '角色选择': 'select[name="role"], select[name="userType"], [data-testid="role-select"]',
      '注册按钮': 'button[type="submit"], button:has-text("注册"), button:has-text("Register")',
      '登录链接': 'a:has-text("登录"), a:has-text("Login"), a[href*="login"]',
    };

    for (const [name, selector] of Object.entries(elements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证登录页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-auth-002-login.png', fullPage: true });

    console.log('\n--- 登录页面元素检查 ---');
    
    const elements = {
      '邮箱输入框': 'input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]',
      '密码输入框': 'input[type="password"]',
      '记住登录': 'input[type="checkbox"], [data-testid="remember-me"]',
      '登录按钮': 'button[type="submit"], button:has-text("登录"), button:has-text("Login")',
      '忘记密码链接': 'a:has-text("忘记"), a:has-text("Forgot"), a[href*="forgot"]',
      '注册链接': 'a:has-text("注册"), a:has-text("Register"), a[href*="register"]',
    };

    for (const [name, selector] of Object.entries(elements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证个人档案页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-profile-001.png', fullPage: true });

    console.log('\n--- 个人档案页面元素检查 ---');
    
    const profileElements = {
      '显示名称': 'input[name="displayName"], input[name="display_name"], input[placeholder*="名称"]',
      '一句话介绍': 'input[name="headline"], input[placeholder*="介绍"], input[placeholder*="headline"]',
      '个人简介': 'textarea[name="summary"], textarea[placeholder*="简介"], textarea[placeholder*="summary"]',
      '工作年限': 'input[name="yearsOfExperience"], input[name="years"], input[type="number"]',
      '头像上传': 'input[type="file"], [data-testid="avatar-upload"], button:has-text("上传")',
      '技能区域': '[data-testid="skills-section"], [class*="skill"], section:has-text("技能")',
      '费率设置': 'input[name*="rate"], input[name*="Rate"], [class*="rate"]',
      '保存按钮': 'button[type="submit"], button:has-text("保存"), button:has-text("Save")',
    };

    for (const [name, selector] of Object.entries(profileElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }

    const tabs = page.locator('[role="tab"], button[role="tab"], .tab, [class*="tab"]').all();
    console.log(`\n标签页数量: ${(await tabs).length}`);
  });

  test('验证工时填报页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/create-worklog`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-worklog-001-create.png', fullPage: true });

    console.log('\n--- 工时填报页面元素检查 ---');
    
    const worklogElements = {
      '项目选择': 'select[name*="project"], [data-testid*="project"], select',
      '工作日期': 'input[type="date"], input[name*="date"], [data-testid*="date"]',
      '开始时间': 'input[type="time"], input[name*="start"], [data-testid*="start"]',
      '结束时间': 'input[type="time"], input[name*="end"], [data-testid*="end"]',
      '工作时长': 'input[name*="hour"], input[type="number"], [data-testid*="hour"]',
      '工作类型': 'select[name*="type"], select[name*="work"], [data-testid*="type"]',
      '工作描述': 'textarea, [data-testid*="description"]',
      '附件上传': 'input[type="file"], [data-testid*="attachment"]',
      '提交按钮': 'button[type="submit"], button:has-text("提交"), button:has-text("保存")',
    };

    for (const [name, selector] of Object.entries(worklogElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }

    const pageContent = await page.content();
    console.log(`\n页面是否包含"工时": ${pageContent.includes('工时') ? '✅' : '❌'}`);
    console.log(`页面是否包含"项目": ${pageContent.includes('项目') ? '✅' : '❌'}`);
  });

  test('验证工时列表页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/worklogs`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-worklog-002-list.png', fullPage: true });

    console.log('\n--- 工时列表页面元素检查 ---');
    
    const listElements = {
      '工时列表': 'table, [data-testid*="list"], [class*="list"], [class*="table"]',
      '新增按钮': 'a[href*="create"], button:has-text("新增"), button:has-text("添加")',
      '筛选区域': '[data-testid*="filter"], [class*="filter"], select',
      '搜索框': 'input[type="search"], input[placeholder*="搜索"]',
      '批量操作': '[data-testid*="batch"], button:has-text("批量")',
    };

    for (const [name, selector] of Object.entries(listElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证发票创建页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/create-invoice`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-invoice-001-create.png', fullPage: true });

    console.log('\n--- 发票创建页面元素检查 ---');
    
    const invoiceElements = {
      '发票类型': 'select[name*="type"], select[name*="invoice"], [data-testid*="type"]',
      '计费周期开始': 'input[name*="start"], input[type="date"]:first-of-type',
      '计费周期结束': 'input[name*="end"], input[type="date"]:last-of-type',
      '税率设置': 'input[name*="tax"], input[type="number"], [data-testid*="tax"]',
      '金额显示': '[class*="amount"], [class*="total"], [data-testid*="amount"]',
      '工时选择': '[data-testid*="worklog"], [class*="worklog"], input[type="checkbox"]',
      '提交按钮': 'button[type="submit"], button:has-text("提交"), button:has-text("创建")',
    };

    for (const [name, selector] of Object.entries(invoiceElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证项目发布页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('hr@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-proj-001-post.png', fullPage: true });

    console.log('\n--- 项目发布页面元素检查 ---');
    
    const projectElements = {
      '项目标题': 'input[name*="title"], input[placeholder*="标题"], input[placeholder*="Title"]',
      '项目描述': 'textarea[name*="description"], textarea[placeholder*="描述"]',
      '工作性质': 'select[name*="nature"], select[name*="job"], [data-testid*="nature"]',
      '工作形式': 'select[name*="format"], select[name*="work"], [data-testid*="format"]',
      '费率类型': 'select[name*="rate"], select[name*="salary"], [data-testid*="rate"]',
      '费率金额': 'input[name*="amount"], input[type="number"]',
      '技能要求': 'select[name*="skill"], [data-testid*="skill"], [class*="skill"]',
      '项目周期': 'select[name*="cycle"], select[name*="period"], [data-testid*="cycle"]',
      '开始日期': 'input[type="date"], input[name*="start"]',
      '招聘人数': 'input[name*="count"], input[type="number"]',
      '发布按钮': 'button[type="submit"], button:has-text("发布"), button:has-text("保存")',
    };

    for (const [name, selector] of Object.entries(projectElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证管理员仪表盘页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('admin@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-admin-001-dashboard.png', fullPage: true });

    console.log('\n--- 管理员仪表盘页面元素检查 ---');
    
    const dashboardElements = {
      '统计卡片': '[class*="stat"], [class*="card"], [data-testid*="stat"]',
      '用户统计': '[class*="user"], :has-text("用户")',
      '项目统计': '[class*="project"], :has-text("项目")',
      '收入统计': '[class*="revenue"], :has-text("收入")',
      '图表区域': 'canvas, [class*="chart"], svg',
      '快捷操作': '[class*="quick"], [class*="action"], button',
    };

    for (const [name, selector] of Object.entries(dashboardElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证报表统计页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-stat-001-reports.png', fullPage: true });

    console.log('\n--- 报表统计页面元素检查 ---');
    
    const reportElements = {
      '时间选择器': 'input[type="date"], select, [class*="period"]',
      '统计卡片': '[class*="stat"], [class*="card"], [class*="summary"]',
      '图表区域': 'canvas, [class*="chart"], svg, [id*="chart"]',
      '数据表格': 'table, [class*="table"]',
      '导出按钮': 'button:has-text("导出"), button:has-text("Export"), [class*="export"]',
    };

    for (const [name, selector] of Object.entries(reportElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });

  test('验证消息中心页面所有元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();

    await emailInput.fill('freelancer@test.com');
    await passwordInput.fill('Test123456');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-test-results/screenshots/detailed-msg-001-messages.png', fullPage: true });

    console.log('\n--- 消息中心页面元素检查 ---');
    
    const messageElements = {
      '消息列表': '[class*="message"], [class*="list"], [data-testid*="message"]',
      '消息详情': '[class*="detail"], [class*="content"]',
      '未读标记': '[class*="unread"], [class*="badge"]',
      '标记已读': 'button:has-text("已读"), button:has-text("Read")',
      '删除消息': 'button:has-text("删除"), button:has-text("Delete")',
    };

    for (const [name, selector] of Object.entries(messageElements)) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${name}: ${isVisible ? '✅ 存在' : '❌ 缺失'}`);
    }
  });
});
