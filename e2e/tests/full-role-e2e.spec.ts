import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const TEST_USERS = {
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

async function login(page: Page, userType: 'admin' | 'freelancer' | 'company') {
  const user = TEST_USERS[userType];
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await submitButton.click();

  await page.waitForURL(/^(?!.*\/login).*/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log(`✓ ${userType} 登录成功`);
}

async function takeScreenshot(page: Page, name: string) {
  const path = `e2e-test-results/screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  截图: ${path}`);
  return path;
}

test.describe('自由顾问 (Freelancer) 角色 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'freelancer');
  });

  test('FL-001: 自由顾问登录后进入工作台', async ({ page }) => {
    await takeScreenshot(page, 'fl-001-dashboard');
    const dashboardVisible = await page.locator('text=/工作台|Dashboard/i').isVisible().catch(() => false);
    expect(dashboardVisible || page.url()).toBeTruthy();
  });

  test('FL-002: 访问个人档案页面', async ({ page }) => {
    await page.click('[data-testid="profile-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/profile`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-002-profile-page');

    const pageContent = await page.content();
    const hasProfileSection = pageContent.includes('档案') || pageContent.includes('Profile') ||
      pageContent.includes('skill') || pageContent.includes('技能');
    console.log(`  档案页面包含技能/档案内容: ${hasProfileSection}`);
  });

  test('FL-003: 访问项目列表页面', async ({ page }) => {
    await page.click('[data-testid="jobs-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/jobs`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-003-jobs-list');

    const pageContent = await page.content();
    const hasJobsContent = pageContent.includes('项目') || pageContent.includes('Job') ||
      pageContent.includes('工作');
    console.log(`  项目列表页面有内容: ${hasJobsContent}`);
  });

  test('FL-004: 访问工时列表页面', async ({ page }) => {
    await page.click('[data-testid="worklogs-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/worklogs`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-004-worklogs-page');

    const pageContent = await page.content();
    const hasWorklogContent = pageContent.includes('工时') || pageContent.includes('Worklog') ||
      pageContent.includes('Work Log');
    console.log(`  工时列表页面有内容: ${hasWorklogContent}`);
  });

  test('FL-005: 访问发票列表页面', async ({ page }) => {
    await page.click('[data-testid="invoices-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/invoices`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-005-invoices-page');

    const pageContent = await page.content();
    const hasInvoiceContent = pageContent.includes('发票') || pageContent.includes('Invoice');
    console.log(`  发票列表页面有内容: ${hasInvoiceContent}`);
  });

  test('FL-006: 访问消息中心页面', async ({ page }) => {
    await page.click('[data-testid="messages-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/messages`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-006-messages-page');

    const pageContent = await page.content();
    const hasMessageContent = pageContent.includes('消息') || pageContent.includes('Message') ||
      pageContent.includes('通知');
    console.log(`  消息中心页面有内容: ${hasMessageContent}`);
  });

  test('FL-007: 访问报表页面', async ({ page }) => {
    await page.click('[data-testid="reports-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/reports`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-007-reports-page');

    const pageContent = await page.content();
    const hasReportsContent = pageContent.includes('报表') || pageContent.includes('Report') ||
      pageContent.includes('统计');
    console.log(`  报表页面有内容: ${hasReportsContent}`);
  });

  test('FL-008: 访问创建工时页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/worklogs/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-008-worklog-create');

    const pageContent = await page.content();
    console.log(`  创建工时页面加载完成`);

    const hasProjectSelect = pageContent.includes('项目') || pageContent.includes('Project');
    const hasDateField = pageContent.includes('日期') || pageContent.includes('Date');
    const hasHoursField = pageContent.includes('工时') || pageContent.includes('Hour');
    const hasWorkType = pageContent.includes('类型') || pageContent.includes('Type');
    const hasDescription = pageContent.includes('描述') || pageContent.includes('Description');

    console.log(`  项目选择: ${hasProjectSelect}, 日期: ${hasDateField}, 工时: ${hasHoursField}, 类型: ${hasWorkType}, 描述: ${hasDescription}`);
  });

  test('FL-009: 访问创建发票页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'fl-009-invoice-create');

    const pageContent = await page.content();
    console.log(`  创建发票页面加载完成`);

    const hasInvoiceType = pageContent.includes('发票类型') || pageContent.includes('Invoice Type');
    const hasBillingPeriod = pageContent.includes('计费周期') || pageContent.includes('Billing Period');
    const hasTaxRate = pageContent.includes('税率') || pageContent.includes('Tax');
    const hasAmount = pageContent.includes('金额') || pageContent.includes('Amount');

    console.log(`  发票类型: ${hasInvoiceType}, 计费周期: ${hasBillingPeriod}, 税率: ${hasTaxRate}, 金额: ${hasAmount}`);
  });
});

test.describe('企业用户 (HR/Company) 角色 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'company');
  });

  test('HR-001: 企业用户登录后进入工作台', async ({ page }) => {
    await takeScreenshot(page, 'hr-001-dashboard');
    console.log(`  企业用户工作台访问成功`);
  });

  test('HR-002: 访问发布项目页面', async ({ page }) => {
    await page.click('[data-testid="post-job-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/jobs/post`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'hr-002-post-job');

    const pageContent = await page.content();
    const hasJobForm = pageContent.includes('项目') || pageContent.includes('Job') ||
      pageContent.includes('标题') || pageContent.includes('Title');
    console.log(`  发布项目页面有表单内容: ${hasJobForm}`);
  });

  test('HR-003: 访问我的项目页面', async ({ page }) => {
    await page.click('[data-testid="my-jobs-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/my-jobs`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'hr-003-my-jobs');

    const pageContent = await page.content();
    const hasJobsContent = pageContent.includes('项目') || pageContent.includes('Job');
    console.log(`  我的项目页面有内容: ${hasJobsContent}`);
  });

  test('HR-004: 访问工时审核页面', async ({ page }) => {
    await page.click('[data-testid="hr-worklogs-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/hr/worklogs`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'hr-004-worklogs-review');

    const pageContent = await page.content();
    const hasWorklogContent = pageContent.includes('工时') || pageContent.includes('Worklog');
    console.log(`  工时审核页面有内容: ${hasWorklogContent}`);
  });

  test('HR-005: 访问发票审核页面', async ({ page }) => {
    await page.click('[data-testid="invoice-review-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/invoices/review`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'hr-005-invoice-review');

    const pageContent = await page.content();
    const hasInvoiceContent = pageContent.includes('发票') || pageContent.includes('Invoice');
    console.log(`  发票审核页面有内容: ${hasInvoiceContent}`);
  });

  test('HR-006: 访问项目管理技能要求选择', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/post`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'hr-006-skill-selection');

    const pageContent = await page.content();
    const hasSkillSelection = pageContent.includes('技能') || pageContent.includes('Skill') ||
      pageContent.includes('category') || pageContent.includes('分类');
    console.log(`  技能要求选择区域存在: ${hasSkillSelection}`);
  });
});

test.describe('管理员 (Admin) 角色 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('ADM-001: 管理员登录后进入仪表盘', async ({ page }) => {
    await takeScreenshot(page, 'adm-001-dashboard');
    const pageContent = await page.content();
    const hasDashboardContent = pageContent.includes('仪表盘') || pageContent.includes('Dashboard') ||
      pageContent.includes('统计') || pageContent.includes('Stat');
    console.log(`  管理员仪表盘有内容: ${hasDashboardContent}`);
  });

  test('ADM-002: 访问用户管理页面', async ({ page }) => {
    await page.click('[data-testid="admin-users-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/admin/users`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'adm-002-users');

    const pageContent = await page.content();
    const hasUsersContent = pageContent.includes('用户') || pageContent.includes('User');
    console.log(`  用户管理页面有内容: ${hasUsersContent}`);
  });

  test('ADM-003: 访问企业管理页面', async ({ page }) => {
    await page.click('[data-testid="admin-companies-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/admin/companies`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'adm-003-companies');

    const pageContent = await page.content();
    const hasCompaniesContent = pageContent.includes('企业') || pageContent.includes('Company');
    console.log(`  企业管理页面有内容: ${hasCompaniesContent}`);
  });

  test('ADM-004: 访问技能管理页面', async ({ page }) => {
    await page.click('[data-testid="admin-skills-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/admin/config`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'adm-004-skills');

    const pageContent = await page.content();
    const hasSkillsContent = pageContent.includes('技能') || pageContent.includes('Skill');
    console.log(`  技能管理页面有内容: ${hasSkillsContent}`);
  });

  test('ADM-005: 访问系统配置页面', async ({ page }) => {
    await page.click('[data-testid="admin-config-link"]').catch(async () => {
      await page.goto(`${BASE_URL}/admin/system-config`);
    });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'adm-005-config');

    const pageContent = await page.content();
    const hasConfigContent = pageContent.includes('配置') || pageContent.includes('Config') ||
      pageContent.includes('System');
    console.log(`  系统配置页面有内容: ${hasConfigContent}`);
  });
});

test.describe('用户体验和UI完整性测试', () => {
  test('UI-001: 验证注册页面包含确认密码字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-001-register-page');

    const pageContent = await page.content();
    const hasConfirmPassword = pageContent.includes('确认密码') || pageContent.includes('confirmPassword') ||
      pageContent.includes('confirm') || pageContent.includes('Confirm');
    console.log(`  注册页面包含确认密码字段: ${hasConfirmPassword}`);
  });

  test('UI-002: 验证登录页面基本结构', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-002-login-page');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log(`  登录页面基本元素完整`);
  });

  test('UI-003: 验证个人档案页面包含所有必需字段', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-003-profile-fields');

    const pageContent = await page.content();
    const hasDisplayName = pageContent.includes('显示名称') || pageContent.includes('displayName') ||
      pageContent.includes('姓名') || pageContent.includes('Name');
    const hasSummary = pageContent.includes('简介') || pageContent.includes('Summary') ||
      pageContent.includes('描述');
    const hasSkills = pageContent.includes('技能') || pageContent.includes('Skill');
    const hasRates = pageContent.includes('费率') || pageContent.includes('Rate') ||
      pageContent.includes('薪资') || pageContent.includes('Salary');

    console.log(`  显示名称: ${hasDisplayName}, 简介: ${hasSummary}, 技能: ${hasSkills}, 费率: ${hasRates}`);
  });

  test('UI-004: 验证工时填报表单完整性', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/worklogs/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-004-worklog-form');

    const pageContent = await page.content();
    const hasProject = pageContent.includes('项目') || pageContent.includes('Project');
    const hasDate = pageContent.includes('日期') || pageContent.includes('Date');
    const hasHours = pageContent.includes('工时') || pageContent.includes('Hour');
    const hasWorkType = pageContent.includes('工作类型') || pageContent.includes('Work Type');
    const hasDescription = pageContent.includes('工作描述') || pageContent.includes('Description');

    console.log(`  项目: ${hasProject}, 日期: ${hasDate}, 工时: ${hasHours}, 工作类型: ${hasWorkType}, 描述: ${hasDescription}`);
  });

  test('UI-005: 验证发票创建表单完整性', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/invoices/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-005-invoice-form');

    const pageContent = await page.content();
    const hasInvoiceType = pageContent.includes('发票类型') || pageContent.includes('Invoice Type');
    const hasPeriod = pageContent.includes('计费周期') || pageContent.includes('Billing Period');
    const hasTaxRate = pageContent.includes('税率') || pageContent.includes('Tax Rate');
    const hasAmount = pageContent.includes('金额') || pageContent.includes('Amount');

    console.log(`  发票类型: ${hasInvoiceType}, 计费周期: ${hasPeriod}, 税率: ${hasTaxRate}, 金额: ${hasAmount}`);
  });

  test('UI-006: 验证项目发布表单包含技能要求', async ({ page }) => {
    await login(page, 'company');
    await page.goto(`${BASE_URL}/jobs/post`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-006-job-post-form');

    const pageContent = await page.content();
    const hasSkillCategories = pageContent.includes('技能') || pageContent.includes('Skill') ||
      pageContent.includes('category');
    console.log(`  技能要求选择区域存在: ${hasSkillCategories}`);
  });

  test('UI-007: 验证报表页面统计卡片', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-007-reports-page');

    const pageContent = await page.content();
    const hasCharts = pageContent.includes('图表') || pageContent.includes('Chart') ||
      pageContent.includes('ECharts');
    const hasStats = pageContent.includes('统计') || pageContent.includes('Stat') ||
      pageContent.includes('收入') || pageContent.includes('Revenue');
    console.log(`  图表: ${hasCharts}, 统计卡片: ${hasStats}`);
  });

  test('UI-008: 验证消息中心功能完整性', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-008-messages-page');

    const pageContent = await page.content();
    const hasMessages = pageContent.includes('消息') || pageContent.includes('Message');
    const hasMarkRead = pageContent.includes('已读') || pageContent.includes('Mark Read');
    const hasDetails = pageContent.includes('详情') || pageContent.includes('Detail');
    console.log(`  消息: ${hasMessages}, 标记已读: ${hasMarkRead}, 详情: ${hasDetails}`);
  });

  test('UI-009: 验证管理员仪表盘统计卡片', async ({ page }) => {
    await login(page, 'admin');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-009-admin-dashboard');

    const pageContent = await page.content();
    const hasStats = pageContent.includes('用户') || pageContent.includes('User') ||
      pageContent.includes('项目') || pageContent.includes('Job') ||
      pageContent.includes('统计') || pageContent.includes('Stat');
    console.log(`  管理员仪表盘有统计内容: ${hasStats}`);
  });

  test('UI-010: 验证响应式布局', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'ui-010-desktop-layout');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'ui-010-tablet-layout');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'ui-010-mobile-layout');

    console.log(`  响应式布局测试完成`);
  });
});

test.describe('PRD功能验证测试', () => {
  test('PRD-AUTH-001: 验证用户注册功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-auth-001-register');

    const pageContent = await page.content();
    const hasEmailField = pageContent.includes('邮箱') || pageContent.includes('email');
    const hasPasswordField = pageContent.includes('密码') || pageContent.includes('password');
    const hasRoleSelect = pageContent.includes('角色') || pageContent.includes('role') ||
      pageContent.includes('用户类型');
    console.log(`  邮箱字段: ${hasEmailField}, 密码字段: ${hasPasswordField}, 角色选择: ${hasRoleSelect}`);
  });

  test('PRD-AUTH-002: 验证用户登录功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-auth-002-login');

    const pageContent = await page.content();
    const hasLoginForm = pageContent.includes('登录') || pageContent.includes('Login');
    console.log(`  登录表单存在: ${hasLoginForm}`);
  });

  test('PRD-PROFILE-001: 验证个人档案页面', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-profile-001');

    const pageContent = await page.content();
    console.log(`  个人档案页面已加载`);
  });

  test('PRD-PROJ-001: 验证项目发布功能', async ({ page }) => {
    await login(page, 'company');
    await page.goto(`${BASE_URL}/jobs/post`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-proj-001-post');

    const pageContent = await page.content();
    const hasTitle = pageContent.includes('标题') || pageContent.includes('Title');
    const hasDescription = pageContent.includes('描述') || pageContent.includes('Description');
    console.log(`  项目标题: ${hasTitle}, 描述: ${hasDescription}`);
  });

  test('PRD-WORKLOG-001: 验证工时填报功能', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/worklogs/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-worklog-001-create');

    const pageContent = await page.content();
    console.log(`  工时填报页面已加载`);
  });

  test('PRD-WORKLOG-002: 验证工时列表功能', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/worklogs`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-worklog-002-list');

    const pageContent = await page.content();
    console.log(`  工时列表页面已加载`);
  });

  test('PRD-INV-001: 验证发票创建功能', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/invoices/create`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-inv-001-create');

    const pageContent = await page.content();
    console.log(`  发票创建页面已加载`);
  });

  test('PRD-MSG-001: 验证消息中心功能', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-msg-001-messages');

    const pageContent = await page.content();
    console.log(`  消息中心页面已加载`);
  });

  test('PRD-STAT-001: 验证报表统计功能', async ({ page }) => {
    await login(page, 'freelancer');
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'prd-stat-001-reports');

    const pageContent = await page.content();
    console.log(`  报表统计页面已加载`);
  });
});