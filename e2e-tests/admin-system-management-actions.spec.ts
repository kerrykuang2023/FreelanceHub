import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const API_URL = process.env.API_URL || 'http://localhost:5555/api/v1';

const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'Test123456!',
};

const SYSTEM_MENU_ITEMS = [
  { label: '管理后台', path: '/admin/dashboard', expectedText: '系统管理后台' },
  { label: '用户管理', path: '/admin/users', expectedText: '用户管理' },
  { label: '角色审批', path: '/admin/role-approvals', expectedText: '角色审批管理' },
  { label: '企业审核', path: '/admin/companies', expectedText: '企业审核管理' },
  { label: '工时管理', path: '/admin/worklogs', expectedText: '工时记录管理' },
  { label: '发票管理', path: '/admin/invoices', expectedText: '发票管理' },
  { label: '项目管理', path: '/admin/projects', expectedText: '项目管理' },
  { label: '举报管理', path: '/admin/reports', expectedText: '举报管理' },
  { label: '系统配置', path: '/admin/configuration', expectedText: '系统配置' },
  { label: '技能分类', path: '/admin/config/skill-categories', expectedText: '技能分类' },
  { label: '工时类型', path: '/admin/config/work-types', expectedText: '工时类型' },
  { label: '税率配置', path: '/admin/config/tax-rates', expectedText: '税率配置' },
  { label: '货币配置', path: '/admin/config/currencies', expectedText: '货币配置' },
  { label: '语言要求', path: '/admin/config/languages', expectedText: '语言要求' },
  { label: '工作性质', path: '/admin/config/job-natures', expectedText: '工作性质' },
  { label: '工作形式', path: '/admin/config/work-formats', expectedText: '工作形式' },
  { label: '计费类型', path: '/admin/config/rate-types', expectedText: '计费类型' },
  { label: '发票类型', path: '/admin/config/invoice-types', expectedText: '发票类型' },
  { label: '付款方式', path: '/admin/config/payment-methods', expectedText: '付款方式' },
];

async function loginAsAdmin(page: Page) {
  await page.context().clearCookies();
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: ADMIN_USER,
  });
  const data = await response.json();
  const token = data.data?.token || data.token;
  expect(token, 'Admin login token').toBeTruthy();

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((accessToken) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('access_token', accessToken);
  }, token);
}

async function expectAdminShell(page: Page) {
  await expect(page.locator('[data-testid="global-navbar"]')).toBeVisible();
  await expect(page.locator('[data-testid="breadcrumb-navigation"]')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('404');
  await expect(page.locator('body')).not.toContainText('功能开发中');
  await expect(page.locator('body')).not.toContainText('Dashboard');
  await expect(page.locator('body')).not.toContainText('Rate类型');
}

test.describe('Admin system management navigation and actions', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('system management menu labels match configured second-level routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const systemMenu = page.locator('[data-testid="menu-item-system-management"]');
    await expect(systemMenu).toBeVisible();
    await systemMenu.hover();

    for (const item of SYSTEM_MENU_ITEMS) {
      await expect(systemMenu, `Menu should include ${item.label}`).toContainText(item.label);
    }

    await expect(systemMenu).not.toContainText('Dashboard');
    await expect(systemMenu).not.toContainText('Rate类型');
  });

  test('every admin system management route keeps the same shell and loads meaningful content', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const item of SYSTEM_MENU_ITEMS) {
      await test.step(`load ${item.label}`, async () => {
        await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);

        await expectAdminShell(page);
        await expect(page.locator('body'), `${item.label} page content`).toContainText(item.expectedText);
      });
    }

    expect(pageErrors, 'Admin pages should not throw browser runtime errors').toEqual([]);
  });

  test('dashboard tab routes open the intended management tables', async ({ page }) => {
    const tabRoutes = [
      { path: '/admin/companies', text: '企业审核管理' },
      { path: '/admin/worklogs', text: '工时记录管理' },
      { path: '/admin/invoices', text: '发票管理' },
      { path: '/admin/projects', text: '项目管理' },
    ];

    for (const route of tabRoutes) {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await expectAdminShell(page);
      await expect(page.locator('body')).toContainText(route.text);
    }
  });

  test('safe admin action buttons open their expected interaction surfaces', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const viewUserButton = page.locator('button[title="查看"]').first();
    await expect(viewUserButton).toBeVisible();
    await viewUserButton.click();
    await expect(page.getByRole('heading', { name: '用户详情' })).toBeVisible();
    await page.getByRole('button', { name: '关闭' }).click();

    await page.goto(`${BASE_URL}/admin/config/work-types`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.getByRole('button', { name: '添加工时类型' }).click();
    await expect(page.getByRole('heading', { name: '添加工时类型' })).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();

    await page.goto(`${BASE_URL}/admin/configuration`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.getByRole('button', { name: '添加配置' }).click();
    await expect(page.getByRole('heading', { name: /添加/ })).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();
  });
});
