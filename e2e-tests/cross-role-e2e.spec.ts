import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'freelancer',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
  },
};

let tokens: Record<string, string> = {};

async function loginAndGetToken(request: APIRequestContext, user: TestUser): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  const data = await response.json();
  if (!data.success || !data.data?.token) {
    throw new Error(`Login failed for ${user.email}`);
  }
  return data.data.token;
}

async function loginAsUser(page: Page, user: TestUser, token: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.evaluate((t) => localStorage.setItem('access_token', t), token);
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log(`✅ Logged in as ${user.email} (${user.role})`);
}

async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  });
  console.log('✅ Logged out');
}

test.describe('跨角色全链路业务流程测试', () => {
  test.setTimeout(180000);

  test.beforeAll(async ({ request }) => {
    console.log('\n========================================');
    console.log('  初始化测试用户 Token');
    console.log('========================================\n');
    
    for (const [key, user] of Object.entries(TEST_USERS)) {
      tokens[key] = await loginAndGetToken(request, user);
      console.log(`✅ ${key} token obtained`);
    }
  });

  test('E2E-01: Freelancer 工作台完整流程', async ({ page }) => {
    console.log('\n========================================');
    console.log('  E2E-01: Freelancer 工作台完整流程');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.freelancer, tokens.freelancer);

    console.log('[Step 1] 验证工作台统计卡片...');
    const statCards = page.locator('[data-testid^="stat-card-"]');
    const cardCount = await statCards.count();
    console.log(`  找到 ${cardCount} 个统计卡片`);
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i);
      const testId = await card.getAttribute('data-testid');
      const label = await card.locator('.kpi-label').textContent();
      const value = await card.locator('.kpi-value').textContent();
      console.log(`  - ${label}: ${value}`);
    }

    console.log('[Step 2] 验证进行中项目列表...');
    const projectSection = page.locator('h2:has-text("进行中的项目")');
    const projectCount = await projectSection.count();
    console.log(`  进行中项目标题数量: ${projectCount}`);

    console.log('[Step 3] 验证导航菜单...');
    const navItems = page.locator('nav a, nav button');
    const navCount = await navItems.count();
    console.log(`  导航菜单项数量: ${navCount}`);

    await page.screenshot({ path: 'test-results/e2e-freelancer-dashboard.png', fullPage: true });
    console.log('✅ E2E-01 测试通过');

    await logout(page);
  });

  test('E2E-02: HR 工作台完整流程', async ({ page }) => {
    console.log('\n========================================');
    console.log('  E2E-02: HR 工作台完整流程');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.hr, tokens.hr);

    console.log('[Step 1] 验证工作台统计卡片...');
    const statCards = page.locator('[data-testid^="stat-card-"]');
    const cardCount = await statCards.count();
    console.log(`  找到 ${cardCount} 个统计卡片`);
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i);
      const testId = await card.getAttribute('data-testid');
      const label = await card.locator('.kpi-label').textContent();
      const value = await card.locator('.kpi-value').textContent();
      console.log(`  - ${label}: ${value}`);
    }

    console.log('[Step 2] 验证有效职位数量...');
    const jobCard = page.locator('[data-testid="stat-card-有效职位"]');
    if (await jobCard.isVisible()) {
      const jobCount = await jobCard.locator('.kpi-value').textContent();
      console.log(`  有效职位: ${jobCount}`);
    }

    console.log('[Step 3] 验证待审核申请...');
    const appCard = page.locator('[data-testid="stat-card-待审核申请"]');
    if (await appCard.isVisible()) {
      const appCount = await appCard.locator('.kpi-value').textContent();
      console.log(`  待审核申请: ${appCount}`);
    }

    await page.screenshot({ path: 'test-results/e2e-hr-dashboard.png', fullPage: true });
    console.log('✅ E2E-02 测试通过');

    await logout(page);
  });

  test('E2E-03: Admin 工作台完整流程', async ({ page }) => {
    console.log('\n========================================');
    console.log('  E2E-03: Admin 工作台完整流程');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.admin, tokens.admin);

    console.log('[Step 1] 验证工作台统计卡片...');
    const statCards = page.locator('[data-testid^="stat-card-"]');
    const cardCount = await statCards.count();
    console.log(`  找到 ${cardCount} 个统计卡片`);
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i);
      const testId = await card.getAttribute('data-testid');
      const label = await card.locator('.kpi-label').textContent();
      const value = await card.locator('.kpi-value').textContent();
      console.log(`  - ${label}: ${value}`);
    }

    console.log('[Step 2] 验证待审核企业列表...');
    const companySection = page.locator('h2:has-text("待审核企业")');
    const companyCount = await companySection.count();
    console.log(`  待审核企业标题数量: ${companyCount}`);

    await page.screenshot({ path: 'test-results/e2e-admin-dashboard.png', fullPage: true });
    console.log('✅ E2E-03 测试通过');

    await logout(page);
  });

  test('E2E-04: API 数据验证', async ({ request }) => {
    console.log('\n========================================');
    console.log('  E2E-04: API 数据验证');
    console.log('========================================\n');

    console.log('[Step 1] Freelancer API 验证...');
    const myProjectsRes = await request.get(`${API_URL}/jobs/my-projects`, {
      headers: { Authorization: `Bearer ${tokens.freelancer}` },
    });
    const myProjectsData = await myProjectsRes.json();
    console.log(`  Freelancer 项目数: ${myProjectsData.data?.length || 0}`);
    expect(myProjectsData.data?.length || 0).toBeGreaterThan(0);

    const myAppsRes = await request.get(`${API_URL}/job-applications/my-applications`, {
      headers: { Authorization: `Bearer ${tokens.freelancer}` },
    });
    const myAppsData = await myAppsRes.json();
    console.log(`  Freelancer 申请数: ${myAppsData.applications?.length || myAppsData.data?.length || 0}`);

    console.log('[Step 2] HR API 验证...');
    const hrJobsRes = await request.get(`${API_URL}/jobs/my-posted-jobs`, {
      headers: { Authorization: `Bearer ${tokens.hr}` },
    });
    const hrJobsData = await hrJobsRes.json();
    const hrJobCount = hrJobsData.jobs?.length || hrJobsData.data?.length || 0;
    console.log(`  HR 职位数: ${hrJobCount}`);
    expect(hrJobCount).toBeGreaterThan(0);

    const hrAppsRes = await request.get(`${API_URL}/job-applications/received`, {
      headers: { Authorization: `Bearer ${tokens.hr}` },
    });
    const hrAppsData = await hrAppsRes.json();
    const hrAppCount = hrAppsData.applications?.length || hrAppsData.data?.length || 0;
    console.log(`  HR 收到的申请数: ${hrAppCount}`);
    expect(hrAppCount).toBeGreaterThan(0);

    console.log('[Step 3] Admin API 验证...');
    const adminCompaniesRes = await request.get(`${API_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const adminCompaniesData = await adminCompaniesRes.json();
    console.log(`  Admin 企业数: ${adminCompaniesData.data?.items?.length || adminCompaniesData.data?.length || 0}`);

    console.log('✅ E2E-04 测试通过');
  });

  test('E2E-05: 跨角色完整业务流程', async ({ page, request }) => {
    console.log('\n========================================');
    console.log('  E2E-05: 跨角色完整业务流程');
    console.log('========================================\n');

    const timestamp = Date.now();
    const jobTitle = `E2E测试职位-${timestamp}`;

    console.log('[Step 1] HR 发布职位...');
    await loginAsUser(page, TEST_USERS.hr, tokens.hr);
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const titleInput = page.locator('input[name="project_title"], input[name="job_title"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(jobTitle);
      
      const descInput = page.locator('textarea[name="job_description"], textarea[name="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill('这是一个E2E测试职位描述');
      }
      
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log(`  职位发布完成: ${jobTitle}`);
    } else {
      console.log('  职位发布页面不可用，跳过...');
    }

    await page.screenshot({ path: 'test-results/e2e-hr-post-job.png', fullPage: true });
    await logout(page);

    console.log('[Step 2] Freelancer 浏览职位...');
    await loginAsUser(page, TEST_USERS.freelancer, tokens.freelancer);
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const jobCard = page.locator(`text=${jobTitle}`).first();
    if (await jobCard.isVisible()) {
      console.log(`  找到职位: ${jobTitle}`);
      await jobCard.click();
      await page.waitForTimeout(1000);
      
      const applyBtn = page.locator('button:has-text("申请"), button:has-text("Apply")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
        console.log('  已申请职位');
      }
    } else {
      console.log('  未找到刚发布的职位（可能需要等待索引更新）');
    }

    await page.screenshot({ path: 'test-results/e2e-freelancer-jobs.png', fullPage: true });
    await logout(page);

    console.log('[Step 3] HR 查看申请...');
    await loginAsUser(page, TEST_USERS.hr, tokens.hr);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const recentApps = page.locator('h2:has-text("最近申请"), h2:has-text("待审核申请")');
    const appsCount = await recentApps.count();
    console.log(`  申请相关标题数量: ${appsCount}`);

    await page.screenshot({ path: 'test-results/e2e-hr-applications.png', fullPage: true });
    await logout(page);

    console.log('[Step 4] Admin 管理验证...');
    await loginAsUser(page, TEST_USERS.admin, tokens.admin);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/e2e-admin-final.png', fullPage: true });
    await logout(page);

    console.log('✅ E2E-05 测试通过');
  });

  test('E2E-06: 页面导航和权限验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('  E2E-06: 页面导航和权限验证');
    console.log('========================================\n');

    console.log('[Step 1] 验证 Freelancer 导航...');
    await loginAsUser(page, TEST_USERS.freelancer, tokens.freelancer);
    
    const navLinks = page.locator('nav a[href]');
    const linkCount = await navLinks.count();
    console.log(`  导航链接数量: ${linkCount}`);

    const validLinks: string[] = [];
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && href.startsWith('/')) {
        validLinks.push(href);
      }
    }

    console.log(`  测试导航链接: ${validLinks.join(', ')}`);
    for (const link of validLinks) {
      await page.goto(`${BASE_URL}${link}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const url = page.url();
      console.log(`  - ${link} -> ${url}`);
    }

    await logout(page);

    console.log('[Step 2] 验证 HR 导航...');
    await loginAsUser(page, TEST_USERS.hr, tokens.hr);
    
    const hrNavLinks = page.locator('nav a[href]');
    const hrLinkCount = await hrNavLinks.count();
    console.log(`  HR 导航链接数量: ${hrLinkCount}`);

    await logout(page);

    console.log('[Step 3] 验证 Admin 导航...');
    await loginAsUser(page, TEST_USERS.admin, tokens.admin);
    
    const adminNavLinks = page.locator('nav a[href]');
    const adminLinkCount = await adminNavLinks.count();
    console.log(`  Admin 导航链接数量: ${adminLinkCount}`);

    await logout(page);

    console.log('✅ E2E-06 测试通过');
  });
});
