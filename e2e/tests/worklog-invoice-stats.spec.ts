import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('WORKLOG-009: 工时统计图表', () => {
  test('工时统计页面可访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/worklog-stats-page.png`,
      fullPage: false 
    });
    
    // 验证页面标题
    await expect(page.locator('h1')).toContainText('数据统计');
  });

  test('工时统计卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证总工时卡片
    const worklogCard = page.locator('[data-testid="worklog-stats-card"]');
    await expect(worklogCard).toBeVisible();
    
    // 验证工时数值显示
    const totalHours = page.locator('text=/总工时/');
    await expect(totalHours).toBeVisible();
  });

  test('工时趋势图表渲染', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证工时趋势图表容器存在
    const worklogChart = page.locator('[data-testid="worklog-chart"]');
    await expect(worklogChart).toBeVisible();
    
    // 等待图表渲染 (ECharts 需要时间)
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/worklog-trend-chart.png`,
      fullPage: false 
    });
    
    // 验证图表内有 Canvas 元素 (ECharts 渲染)
    const canvas = worklogChart.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('期间选择器功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证期间选择器存在
    const periodSelect = page.locator('select').first();
    await expect(periodSelect).toBeVisible();
    
    // 测试选项
    await expect(periodSelect).toHaveValue('monthly');
    
    // 选择本季度
    await periodSelect.selectOption('quarterly');
    await page.waitForTimeout(1000);
    
    // 验证选择生效
    await expect(periodSelect).toHaveValue('quarterly');
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/worklog-period-selector.png`,
      fullPage: false 
    });
  });
});

test.describe('INV-009: 发票统计图表', () => {
  test('发票统计卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证发票状态卡片存在
    const invoiceCards = page.locator('[data-testid="invoice-status-cards"]');
    await expect(invoiceCards).toBeVisible();
    
    // 验证各个状态卡片
    await expect(page.locator('text=/总发票数/')).toBeVisible();
    await expect(page.locator('text=/待审核/')).toBeVisible();
    await expect(page.locator('text=/已通过/')).toBeVisible();
    await expect(page.locator('text=/已付款/')).toBeVisible();
  });

  test('发票统计图表渲染', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证发票统计图表容器存在
    const invoiceChart = page.locator('[data-testid="invoice-chart"]');
    await expect(invoiceChart).toBeVisible();
    
    // 等待图表渲染
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/invoice-stats-chart.png`,
      fullPage: false 
    });
    
    // 验证图表内有 Canvas 元素
    const canvas = invoiceChart.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('发票状态统计显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证发票状态数据
    const invoiceStats = page.locator('[data-testid="invoice-stats"]');
    await expect(invoiceStats).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/invoice-status-stats.png`,
      fullPage: false 
    });
  });
});

test.describe('STAT-001: 收入统计', () => {
  test('收入统计卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证收入卡片
    const incomeCard = page.locator('text=/总收入/');
    await expect(incomeCard).toBeVisible();
    
    // 验证收入数值显示
    const totalIncome = page.locator('text=/¥/').first();
    await expect(totalIncome).toBeVisible();
  });

  test('项目收入分布图表渲染', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证饼图容器存在
    const pieChart = page.locator('[data-testid="project-pie-chart"]');
    await expect(pieChart).toBeVisible();
    
    // 等待图表渲染
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/project-income-pie-chart.png`,
      fullPage: false 
    });
    
    // 验证图表内有 Canvas 元素
    const canvas = pieChart.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('报表页面整体功能', () => {
  test('所有统计卡片完整显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证所有统计卡片
    const cards = page.locator('.grid gap-4 > div');
    await expect(cards).toHaveCount(4);
    
    // 截图 - 完整页面
    await page.screenshot({ 
      path: `e2e/screenshots/reports-full-page.png`,
      fullPage: true 
    });
  });

  test('导出功能按钮存在', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 验证导出按钮存在
    const exportButton = page.locator('button', { hasText: '导出 Excel' });
    await expect(exportButton).toBeVisible();
  });
});
