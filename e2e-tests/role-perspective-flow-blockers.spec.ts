import { expect, Page, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const API_URL = process.env.API_URL || 'http://localhost:5555/api/v1';

const USERS = {
  freelancer: { email: 'freelancer@test.com', password: 'Test123456!', role: 'job_seeker' },
  hr: { email: 'hr@test.com', password: 'Test123456!', role: 'hr_recruiter' },
  admin: { email: 'admin@test.com', password: 'Test123456!', role: 'admin' },
} as const;

const FORBIDDEN_TEXT = /JobPortal|Job\s+Portal|jobportal\.com|Invalid Date|无效的日期|React App|功能开发中/i;

type UserKey = keyof typeof USERS;

async function loginAs(page: Page, userKey: UserKey) {
  await page.context().clearCookies();
  const user = USERS[userKey];
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  const data = await response.json();
  const token = data.data?.token || data.token;

  expect(token, `Could not login as ${user.email}`).toBeTruthy();

  await page.request.post(`${API_URL}/auth/roles/switch`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { role_type: user.role },
  }).catch(() => undefined);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((accessToken) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('access_token', accessToken);
  }, token);

  return token;
}

async function collectPageErrors(page: Page, action: () => Promise<void>) {
  const errors: string[] = [];
  const onPageError = (error: Error) => errors.push(error.message);
  const onConsole = (message: any) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!/favicon|Download the React DevTools/i.test(text)) {
        errors.push(text);
      }
    }
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  await action();
  page.off('pageerror', onPageError);
  page.off('console', onConsole);

  return errors;
}

async function assertHealthyPage(page: Page, path: string, options: { needsBreadcrumb?: boolean } = {}) {
  const errors = await collectPageErrors(page, async () => {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForFunction(() => {
      const text = document.body.innerText.trim();
      return text.length > 30 && !/^Loading\.\.\.$|^加载中/i.test(text);
    }, undefined, { timeout: 15000 }).catch(() => undefined);
  });

  const body = (await page.locator('body').innerText()).trim();
  expect(body.length, `${path} should render meaningful content`).toBeGreaterThan(30);
  expect(body, `${path} should not show old brands, invalid dates, or unfinished placeholders`).not.toMatch(FORBIDDEN_TEXT);
  expect(body, `${path} should not be stuck on a loading-only screen`).not.toMatch(/^Loading\.\.\.$|^加载中/i);
  expect(errors, `${path} should not throw browser errors`).toEqual([]);
  await expect(page).toHaveTitle(/FreelanceHub/);

  if (options.needsBreadcrumb) {
    await expect(page.locator('[data-testid="breadcrumb-navigation"]'), `${path} breadcrumb`).toBeVisible();
  }
}

async function clickFirstVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      return true;
    }
  }
  return false;
}

test.describe('Role perspective flow blocker audit', () => {
  test('admin can navigate management surfaces and open safe action dialogs', async ({ page }) => {
    await loginAs(page, 'admin');

    for (const path of ['/admin', '/admin/users', '/admin/role-approvals', '/admin/configuration', '/profile/switch-role']) {
      await assertHealthyPage(page, path, { needsBreadcrumb: path !== '/admin' });
    }

    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const openedUserDetail = await clickFirstVisible(page, [
      'button[title="查看"]',
      'button:has-text("查看")',
    ]);
    if (openedUserDetail) {
      await expect(page.locator('body')).toContainText(/用户详情|邮箱|角色|状态/);
    }

    await page.goto(`${BASE_URL}/admin/configuration`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('button', { name: /添加|初始化/ }).first()).toBeVisible();
  });

  test('admin role approvals protect self-review and expose applicant data safely', async ({ page }) => {
    await loginAs(page, 'admin');
    await assertHealthyPage(page, '/admin/role-approvals', { needsBreadcrumb: true });

    const createdAtCells = await page.locator('[data-testid="role-approval-created-at"]').allInnerTexts().catch(() => []);
    expect(createdAtCells.join('\n')).not.toMatch(/Invalid Date|无效的日期/i);

    const body = await page.locator('body').innerText();
    if (body.includes('自己的申请')) {
      await expect(page.locator('body')).toContainText('需其他管理员审批');
      await expect(page.locator('button:has-text("批准")').first()).toBeDisabled();
    }
  });

  test('HR can reach hiring, application, work-log, invoice, and role pages', async ({ page }) => {
    const token = await loginAs(page, 'hr');

    const companyResponse = await page.request.get(`${API_URL}/companies/my-company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(companyResponse.ok(), 'HR my-company API should succeed').toBeTruthy();
    const companyData = await companyResponse.json();
    const hrCompany = companyData.company || companyData.data?.company || companyData.data;
    expect(hrCompany?._id || hrCompany?.id, 'HR company response should include a usable company ID').toBeTruthy();

    for (const path of ['/company', '/post-job', '/company/applications', '/company/work-logs/pending', '/company/invoices/review', '/profile/switch-role']) {
      await assertHealthyPage(page, path, { needsBreadcrumb: path.includes('/company') || path.includes('/profile') });
    }

    await page.goto(`${BASE_URL}/company`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('button').filter({ hasText: '编辑信息' }).click();
    await page.locator('[data-testid="save-company-button"]').click();
    await expect(page.locator('[data-testid="company-success-message"]')).toContainText('公司信息已保存');
    await expect(page.locator('[data-testid="company-error-message"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Invalid company ID');

    await page.goto(`${BASE_URL}/post-job`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('input, textarea, select').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("发布")').first()).toBeVisible();

    await page.goto(`${BASE_URL}/company/invoices/review`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('[data-testid="global-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-navigation"]')).toBeVisible();

    await page.goto(`${BASE_URL}/company/applications`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const acceptButton = page.locator('[data-testid="application-accepted-button"]').first();
    if (await acceptButton.isVisible().catch(() => false)) {
      await page.route('**/api/v1/job-applications/*/status', async (route) => {
        if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Application status updated successfully', application: {} }),
          });
        } else {
          await route.continue();
        }
      });
      await acceptButton.click();
      await expect(page.locator('[data-testid="application-success-message"], [data-testid="application-error-message"]')).toBeVisible();
    }
  });

  test('HR onboarding profile does not ask for job posting details', async ({ page }) => {
    await loginAs(page, 'hr');

    await page.route('**/api/v1/hr/onboarding/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            has_company: true,
            has_profile: false,
            is_approved: false,
            current_step: 'profile',
            company_id: 'mock-company-id',
            company_name: 'My Company',
          },
        }),
      });
    });

    await page.goto(`${BASE_URL}/hr/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    await expect(page.getByRole('heading', { name: '完善HR资料' })).toBeVisible();
    await expect(page.getByText('所在部门')).toBeVisible();
    await expect(page.locator('label', { hasText: '职位' })).toHaveCount(0);
    await expect(page.getByText('职位信息')).toHaveCount(0);
    await expect(page.getByText('具体岗位请在入驻完成后到“发布职位”中逐个创建。')).toBeVisible();
  });

  test('freelancer can reach job, project, work-log, invoice, and role pages', async ({ page }) => {
    await loginAs(page, 'freelancer');

    for (const path of ['/jobs', '/my-projects', '/work-logs', '/invoices', '/profile/switch-role']) {
      await assertHealthyPage(page, path, { needsBreadcrumb: path.includes('/profile') });
    }

    await page.goto(`${BASE_URL}/work-logs`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const canCreateWorkLog = await clickFirstVisible(page, [
      '[data-testid="create-worklog-btn"]',
      'a:has-text("创建")',
      'button:has-text("创建")',
      'a:has-text("新增")',
      'button:has-text("新增")',
    ]);
    if (canCreateWorkLog) {
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await expect(page.locator('input, textarea, select').first()).toBeVisible();
    }
  });

  test('role application requires complete, reviewable data before submitting', async ({ page }) => {
    await loginAs(page, 'hr');
    await assertHealthyPage(page, '/profile/switch-role', { needsBreadcrumb: true });

    const applyButton = page.locator('[data-testid="apply-role-job_seeker"]').first();
    if (!(await applyButton.isVisible().catch(() => false))) {
      test.skip(true, 'Current HR user already has or has requested the job seeker role.');
    }

    await applyButton.click();
    await page.locator('[data-testid="submit-role-application"]').click();
    await expect(page.locator('[data-testid="role-application-error"]')).toContainText(/申请原因|技能|经验/);
  });
});
