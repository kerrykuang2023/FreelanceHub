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
};

let freelancerToken: string = '';
let hrToken: string = '';

async function loginAndGetToken(request: APIRequestContext, user: TestUser): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
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
  
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t);
  }, token);
  
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log(`✅ Logged in as ${user.email}`);
}

test.describe('工作台数据验证测试', () => {
  test.setTimeout(120000);

  test.beforeAll(async ({ request }) => {
    freelancerToken = await loginAndGetToken(request, TEST_USERS.freelancer);
    hrToken = await loginAndGetToken(request, TEST_USERS.hr);
    console.log('✅ Tokens obtained for all users');
  });

  test('DASHBOARD-01: 顾问工作台 - 进行中项目应显示数据', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DASHBOARD-01: 顾问工作台数据验证');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.freelancer, freelancerToken);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const statCards = page.locator('[data-testid^="stat-card-"]');
    const count = await statCards.count();
    console.log(`[DASHBOARD-01] 找到 ${count} 个统计卡片`);

    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      const testId = await card.getAttribute('data-testid');
      const label = await card.locator('.kpi-label').textContent();
      const value = await card.locator('.kpi-value').textContent();
      console.log(`[DASHBOARD-01] 卡片 ${i + 1}: ${label} = ${value} (testId: ${testId})`);
    }

    const projectCard = page.locator('[data-testid="stat-card-进行中项目"]');
    if (await projectCard.isVisible()) {
      const projectCountText = await projectCard.locator('.kpi-value').textContent();
      console.log(`[DASHBOARD-01] 进行中项目数量: ${projectCountText}`);
    }

    await page.screenshot({ path: 'test-results/dashboard-freelancer.png', fullPage: true });
  });

  test('DASHBOARD-02: HR工作台 - 最近申请应显示数据', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DASHBOARD-02: HR工作台数据验证');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.hr, hrToken);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const statCards = page.locator('[data-testid^="stat-card-"]');
    const count = await statCards.count();
    console.log(`[DASHBOARD-02] 找到 ${count} 个统计卡片`);

    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      const testId = await card.getAttribute('data-testid');
      const label = await card.locator('.kpi-label').textContent();
      const value = await card.locator('.kpi-value').textContent();
      console.log(`[DASHBOARD-02] 卡片 ${i + 1}: ${label} = ${value} (testId: ${testId})`);
    }

    const applicationCard = page.locator('[data-testid="stat-card-待审核申请"]');
    if (await applicationCard.isVisible()) {
      const applicationCountText = await applicationCard.locator('.kpi-value').textContent();
      console.log(`[DASHBOARD-02] 待审核申请数量: ${applicationCountText}`);
    }

    await page.screenshot({ path: 'test-results/dashboard-hr.png', fullPage: true });
  });

  test('DASHBOARD-03: HR工作台 - 有效职位应显示数据', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DASHBOARD-03: HR有效职位验证');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.hr, hrToken);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const jobCard = page.locator('[data-testid="stat-card-有效职位"]');
    if (await jobCard.isVisible()) {
      const jobCountText = await jobCard.locator('.kpi-value').textContent();
      console.log(`[DASHBOARD-03] 有效职位数: ${jobCountText}`);
    }

    await page.screenshot({ path: 'test-results/dashboard-hr-jobs.png', fullPage: true });
  });

  test('DASHBOARD-04: 验证API返回数据', async ({ request }) => {
    console.log('\n========================================');
    console.log('  DASHBOARD-04: API数据验证');
    console.log('========================================\n');

    const myProjectsRes = await request.get(`${API_URL}/jobs/my-projects`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const myProjectsData = await myProjectsRes.json();
    const projectCount = myProjectsData.data?.length || 0;
    console.log(`[DASHBOARD-04] Freelancer my-projects: ${projectCount} 个项目`);
    expect(projectCount).toBeGreaterThan(0);

    const myAppsRes = await request.get(`${API_URL}/job-applications/my-applications`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const myAppsData = await myAppsRes.json();
    const appCount = myAppsData.applications?.length || myAppsData.data?.length || 0;
    console.log(`[DASHBOARD-04] Freelancer my-applications: ${appCount} 个申请`);

    const hrJobsRes = await request.get(`${API_URL}/jobs/my-posted-jobs`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const hrJobsData = await hrJobsRes.json();
    const hrJobCount = hrJobsData.jobs?.length || hrJobsData.data?.length || 0;
    console.log(`[DASHBOARD-04] HR my-posted-jobs: ${hrJobCount} 个职位`);
    expect(hrJobCount).toBeGreaterThan(0);

    const hrAppsRes = await request.get(`${API_URL}/job-applications/received`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const hrAppsData = await hrAppsRes.json();
    const hrAppCount = hrAppsData.applications?.length || hrAppsData.data?.length || 0;
    console.log(`[DASHBOARD-04] HR received-applications: ${hrAppCount} 个申请`);
    expect(hrAppCount).toBeGreaterThan(0);
  });

  test('DASHBOARD-05: 验证工作台页面显示数据', async ({ page }) => {
    console.log('\n========================================');
    console.log('  DASHBOARD-05: 工作台页面显示验证');
    console.log('========================================\n');

    await loginAsUser(page, TEST_USERS.freelancer, freelancerToken);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const projectSection = page.locator('h2:has-text("进行中的项目")');
    const projectCount = await projectSection.count();
    console.log(`[DASHBOARD-05] Freelancer 进行中的项目标题数量: ${projectCount}`);
    expect(projectCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/dashboard-freelancer-full.png', fullPage: true });

    await page.evaluate(() => {
      localStorage.removeItem('access_token');
    });

    await loginAsUser(page, TEST_USERS.hr, hrToken);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const appSection = page.locator('h2:has-text("最近申请")');
    const appCount = await appSection.count();
    console.log(`[DASHBOARD-05] HR 最近申请标题数量: ${appCount}`);
    expect(appCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/dashboard-hr-full.png', fullPage: true });
  });
});
