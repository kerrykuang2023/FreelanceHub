import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './utils/mock-user';

const BASE_URL = 'http://localhost:5137';

/**
 * WORKLOG-009: 工时统计图表
 * PRD 需求：工时数据统计分析
 * 优先级：P1
 * 角色：所有用户
 */
test.describe('WORKLOG-009: 工时统计图表 (基于 PRD)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock 管理员用户，避免重复登录
    await mockAuthenticatedUser(page, 'admin');
  });

  test('WORKLOG-009-001: 【PRD 验证】访问报表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/worklog-009-001-reports-page.png',
      fullPage: true 
    });
    
    // PRD 验证：页面标题
    await expect(page.locator('h1:has-text("数据统计")')).toBeVisible();
    
    // PRD 验证：页面描述
    await expect(page.locator('text=查看收入、支出和工时统计')).toBeVisible();
    
    console.log('✓ WORKLOG-009-001: 报表页面访问成功');
  });

  test('WORKLOG-009-002: 【PRD 验证】工时统计卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/worklog-009-002-worklog-cards.png' 
    });
    
    // PRD 验证：工时统计卡片
    await expect(page.locator('text=总工时')).toBeVisible();
    await expect(page.locator('text=日均')).toBeVisible();
    
    console.log('✓ WORKLOG-009-002: 工时统计卡片显示正常');
  });

  test('WORKLOG-009-003: 【PRD 验证】工时趋势图表', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/worklog-009-003-worklog-chart.png' 
    });
    
    // PRD 验证：图表容器存在
    const worklogChart = page.locator('[data-testid="worklog-chart"]');
    await expect(worklogChart).toBeVisible();
    
    // PRD 验证：图表标题
    await expect(page.locator('h3:has-text("工时趋势")')).toBeVisible();
    
    console.log('✓ WORKLOG-009-003: 工时趋势图表显示正常');
  });

  test('WORKLOG-009-004: 【PRD 验证】周期切换功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // PRD 验证：周期选择器
    const periodSelect = page.locator('select').first();
    await expect(periodSelect).toBeVisible();
    
    // 测试月度切换
    await periodSelect.selectOption('monthly');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-test-results/screenshots/worklog-009-004-monthly.png' });
    
    // 测试季度切换
    await periodSelect.selectOption('quarterly');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-test-results/screenshots/worklog-009-004-quarterly.png' });
    
    // 测试年度切换
    await periodSelect.selectOption('yearly');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-test-results/screenshots/worklog-009-004-yearly.png' });
    
    console.log('✓ WORKLOG-009-004: 周期切换功能正常');
  });

  test('WORKLOG-009-005: 【PRD 验证】项目收入分布图表', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/worklog-009-005-project-pie-chart.png' 
    });
    
    // PRD 验证：饼图容器
    const pieChart = page.locator('[data-testid="project-pie-chart"]');
    await expect(pieChart).toBeVisible();
    
    // PRD 验证：图表标题
    await expect(page.locator('h3:has-text("项目收入分布")')).toBeVisible();
    
    console.log('✓ WORKLOG-009-005: 项目收入分布图表显示正常');
  });
});

/**
 * INV-009: 发票统计图表
 * PRD 需求：发票数据统计
 * 优先级：P1
 * 角色：所有用户
 */
test.describe('INV-009: 发票统计图表 (基于 PRD)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock 管理员用户
    await mockAuthenticatedUser(page, 'admin');
  });

  test('INV-009-001: 【PRD 验证】发票统计图表显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/inv-009-001-invoice-chart.png' 
    });
    
    // PRD 验证：发票统计图表容器
    const invoiceChart = page.locator('[data-testid="invoice-chart"]');
    await expect(invoiceChart).toBeVisible();
    
    // PRD 验证：图表标题
    await expect(page.locator('h3:has-text("发票统计")')).toBeVisible();
    
    console.log('✓ INV-009-001: 发票统计图表显示正常');
  });

  test('INV-009-002: 【PRD 验证】发票状态卡片', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/inv-009-002-invoice-status-cards.png' 
    });
    
    // PRD 验证：发票状态
    await expect(page.locator('text=总发票数')).toBeVisible();
    await expect(page.locator('text=待审核')).toBeVisible();
    await expect(page.locator('text=已通过')).toBeVisible();
    await expect(page.locator('text=已付款')).toBeVisible();
    
    console.log('✓ INV-009-002: 发票状态卡片显示正常');
  });

  test('INV-009-003: 【PRD 验证】发票数据可视化', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/inv-009-003-invoice-visualization.png' 
    });
    
    // PRD 验证：图表图例
    await expect(page.locator('text=发票金额')).toBeVisible();
    await expect(page.locator('text=发票数量')).toBeVisible();
    
    console.log('✓ INV-009-003: 发票数据可视化显示正常');
  });

  test('INV-009-004: 【PRD 验证】导出功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/inv-009-004-export-section.png' 
    });
    
    // PRD 验证：导出区域
    await expect(page.locator('h3:has-text("导出报表")')).toBeVisible();
    await expect(page.locator('button:has-text("导出 Excel")')).toBeVisible();
    
    console.log('✓ INV-009-004: 导出功能可用');
  });
});

/**
 * 完整报表页面用户旅程测试
 * 模拟真实用户使用场景
 */
test.describe('REPORT-001: 完整报表页面用户旅程 (基于 PRD)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock 管理员用户
    await mockAuthenticatedUser(page, 'admin');
  });

  test('REPORT-001-001: 管理员查看完整报表', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 步骤 1: 验证页面加载
    await expect(page.locator('h1:has-text("数据统计")')).toBeVisible();
    await page.screenshot({ path: 'e2e-test-results/screenshots/report-001-001-page-loaded.png' });
    
    // 步骤 2: 验证所有统计卡片
    await expect(page.locator('text=总收入')).toBeVisible();
    await expect(page.locator('text=总支出')).toBeVisible();
    await expect(page.locator('text=净利润')).toBeVisible();
    await expect(page.locator('text=总工时')).toBeVisible();
    await page.screenshot({ path: 'e2e-test-results/screenshots/report-001-002-stats-cards.png' });
    
    // 步骤 3: 验证所有图表
    await expect(page.locator('[data-testid="worklog-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-pie-chart"]')).toBeVisible();
    await page.screenshot({ path: 'e2e-test-results/screenshots/report-001-003-charts.png' });
    
    // 步骤 4: 验证发票状态
    await expect(page.locator('text=待审核')).toBeVisible();
    await expect(page.locator('text=已通过')).toBeVisible();
    await expect(page.locator('text=已付款')).toBeVisible();
    await page.screenshot({ path: 'e2e-test-results/screenshots/report-001-004-invoice-status.png' });
    
    // 步骤 5: 测试周期切换
    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('quarterly');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-test-results/screenshots/report-001-005-quarterly-view.png' });
    
    // 步骤 6: 完整页面截图
    await page.screenshot({ 
      path: 'e2e-test-results/screenshots/report-001-006-full-page.png',
      fullPage: true 
    });
    
    console.log('✓ REPORT-001-001: 完整报表页面用户旅程测试通过');
  });
});
