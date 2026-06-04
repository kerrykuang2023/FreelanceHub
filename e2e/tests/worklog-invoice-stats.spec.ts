import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5137';
const API_URL = process.env.E2E_API_URL || 'http://localhost:5555/api/v1';

async function loginAsAdmin(page: Page, request: any) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'admin@test.com', password: 'Test123456!' },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const token = body.data?.token || body.token;
  expect(token).toBeTruthy();

  await page.addInitScript((accessToken) => {
    localStorage.setItem('access_token', accessToken);
  }, token);
}

async function openReports(page: Page) {
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('数据统计', { timeout: 15000 });
}

test.beforeEach(async ({ page, request }) => {
  await loginAsAdmin(page, request);
});

test.describe('WORKLOG-009: 工时统计图表', () => {
  test('工时统计页面可访问', async ({ page }) => {
    await openReports(page);

    await page.screenshot({
      path: 'e2e/screenshots/worklog-stats-page.png',
      fullPage: false,
    });
  });

  test('工时统计卡片显示', async ({ page }) => {
    await openReports(page);

    const worklogCard = page.getByTestId('worklog-stats-card');
    await expect(worklogCard).toBeVisible();
    await expect(worklogCard).toContainText('总工时');
  });

  test('工时趋势图表渲染', async ({ page }) => {
    await openReports(page);

    const worklogChart = page.getByTestId('worklog-chart');
    await expect(worklogChart).toBeVisible();
    await expect(worklogChart.locator('canvas')).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/worklog-trend-chart.png',
      fullPage: false,
    });
  });

  test('期间选择器功能', async ({ page }) => {
    await openReports(page);

    const periodSelect = page.getByLabel('统计周期');
    await expect(periodSelect).toBeVisible();
    await expect(periodSelect).toHaveValue('monthly');

    await periodSelect.selectOption('quarterly');
    await expect(periodSelect).toHaveValue('quarterly');
    await expect(page.getByTestId('worklog-chart').locator('canvas')).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/worklog-period-selector.png',
      fullPage: false,
    });
  });
});

test.describe('INV-009: 发票统计图表', () => {
  test('发票统计卡片显示', async ({ page }) => {
    await openReports(page);

    const invoiceCards = page.getByTestId('invoice-status-cards');
    await expect(invoiceCards).toBeVisible();
    await expect(page.getByTestId('invoice-total-card')).toContainText('总发票数');
    await expect(page.getByTestId('invoice-pending-card')).toContainText('待审核');
    await expect(page.getByTestId('invoice-approved-card')).toContainText('已通过');
    await expect(page.getByTestId('invoice-paid-card')).toContainText('已付款');
  });

  test('发票统计图表渲染', async ({ page }) => {
    await openReports(page);

    const invoiceChart = page.getByTestId('invoice-chart');
    await expect(invoiceChart).toBeVisible();
    await expect(invoiceChart.locator('canvas')).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/invoice-stats-chart.png',
      fullPage: false,
    });
  });

  test('发票状态统计显示', async ({ page }) => {
    await openReports(page);

    const invoiceStats = page.getByTestId('invoice-stats');
    await expect(invoiceStats).toBeVisible();
    await expect(invoiceStats).toContainText('付款率');

    await page.screenshot({
      path: 'e2e/screenshots/invoice-status-stats.png',
      fullPage: false,
    });
  });
});

test.describe('STAT-001: 收入统计', () => {
  test('收入统计卡片显示', async ({ page }) => {
    await openReports(page);

    await expect(page.getByTestId('summary-card').first()).toContainText('总收入');
    await expect(page.locator('text=/¥/').first()).toBeVisible();
  });

  test('项目收入分布图表渲染', async ({ page }) => {
    await openReports(page);

    const pieChart = page.getByTestId('project-pie-chart');
    await expect(pieChart).toBeVisible();
    await expect(pieChart.locator('canvas')).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/project-income-pie-chart.png',
      fullPage: false,
    });
  });
});

test.describe('报表页面整体功能', () => {
  test('所有统计卡片完整显示', async ({ page }) => {
    await openReports(page);

    await expect(page.getByTestId('summary-card')).toHaveCount(3);
    await expect(page.getByTestId('worklog-stats-card')).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/reports-full-page.png',
      fullPage: true,
    });
  });

  test('导出功能按钮可下载当前报表', async ({ page }) => {
    await openReports(page);

    const exportButton = page.getByRole('button', { name: '导出 Excel' });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('freelancehub-report');
  });
});
