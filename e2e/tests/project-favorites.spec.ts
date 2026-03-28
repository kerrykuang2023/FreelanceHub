import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('PROJ-009: 项目收藏功能', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('项目详情页显示收藏按钮', async ({ page }) => {
    // 访问项目详情页
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证收藏按钮存在
    const saveBtn = page.locator('button[title*="Save"], button').filter({ hasText: /收藏|Save/ }).first();
    await expect(saveBtn).toBeVisible();
    
    // 验证收藏按钮图标
    const bookmarkIcon = saveBtn.locator('svg').first();
    await expect(bookmarkIcon).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/job-detail-save-button.png`,
      fullPage: false 
    });
  });

  test('点击收藏按钮保存项目', async ({ page }) => {
    // 访问项目详情页
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 点击收藏按钮
    const saveBtn = page.locator('button').filter({ hasText: /收藏|Save/ }).first();
    await saveBtn.click();
    
    // 等待状态更新
    await page.waitForTimeout(1000);
    
    // 验证 localStorage 中已保存
    const savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    expect(savedJobs).toBeTruthy();
    
    const jobs = JSON.parse(savedJobs || '[]');
    expect(jobs.length).toBeGreaterThan(0);
    
    // 验证按钮状态变化
    const bookmarkIcon = saveBtn.locator('svg').first();
    await expect(bookmarkIcon).toHaveClass(/fill-indigo-600|text-indigo-600/);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/job-saved-state.png`,
      fullPage: false 
    });
  });

  test('取消收藏项目', async ({ page }) => {
    // 先保存一个项目
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const saveBtn = page.locator('button').filter({ hasText: /收藏|Save/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // 验证已保存
    let savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    let jobs = JSON.parse(savedJobs || '[]');
    const initialCount = jobs.length;
    
    // 再次点击取消收藏
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // 验证已取消
    savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    jobs = JSON.parse(savedJobs || '[]');
    expect(jobs.length).toBe(initialCount - 1);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/job-unsave-state.png`,
      fullPage: false 
    });
  });

  test('收藏列表页面显示已保存的项目', async ({ page }) => {
    // 先保存一个项目
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const saveBtn = page.locator('button').filter({ hasText: /收藏|Save/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // 访问收藏列表页面
    await page.goto(`${BASE_URL}/saved-jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证页面标题
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/收藏|Saved/);
    
    // 验证项目列表显示
    const jobList = page.locator('[class*="job-card"], [class*="job-item"], div').filter({ hasText: /Job|项目/ }).first();
    await expect(jobList).toBeVisible();
    
    // 验证项目数量
    const savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    const jobs = JSON.parse(savedJobs || '[]');
    const countText = page.locator('text=' + jobs.length);
    await expect(countText).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/saved-jobs-list.png`,
      fullPage: true 
    });
  });

  test('从收藏列表移除项目', async ({ page }) => {
    // 先保存一个项目
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const saveBtn = page.locator('button').filter({ hasText: /收藏|Save/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // 访问收藏列表页面
    await page.goto(`${BASE_URL}/saved-jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证项目存在
    const jobCard = page.locator('[class*="job-card"], [class*="job-item"], div').filter({ hasText: /Job|项目/ }).first();
    await expect(jobCard).toBeVisible();
    
    // 点击删除按钮
    const deleteBtn = page.locator('button[title*="Remove"], button').filter({ hasText: /删除|Remove/ }).first();
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    
    // 验证项目已移除
    const savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    const jobs = JSON.parse(savedJobs || '[]');
    expect(jobs.length).toBe(0);
    
    // 验证空状态显示
    const emptyState = page.locator('text=/No Saved Jobs|没有收藏/');
    await expect(emptyState).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/saved-jobs-empty.png`,
      fullPage: true 
    });
  });

  test('收藏按钮状态同步', async ({ page }) => {
    // 访问项目详情页
    await page.goto(`${BASE_URL}/jobs/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 点击收藏
    const saveBtn = page.locator('button').filter({ hasText: /收藏|Save/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证收藏状态保持
    const savedJobs = await page.evaluate(() => localStorage.getItem('saved_jobs'));
    const jobs = JSON.parse(savedJobs || '[]');
    expect(jobs.length).toBeGreaterThan(0);
    
    // 验证按钮状态
    const bookmarkIcon = saveBtn.locator('svg').first();
    await expect(bookmarkIcon).toHaveClass(/fill-indigo-600|text-indigo-600/);
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/save-state-sync.png`,
      fullPage: false 
    });
  });

  test('收藏列表空状态显示', async ({ page }) => {
    // 清除 localStorage
    await page.evaluate(() => localStorage.clear());
    
    // 访问收藏列表页面
    await page.goto(`${BASE_URL}/saved-jobs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证空状态图标
    const emptyIcon = page.locator('svg').first();
    await expect(emptyIcon).toBeVisible();
    
    // 验证空状态文本
    const emptyText = page.locator('text=/No Saved Jobs|没有收藏/');
    await expect(emptyText).toBeVisible();
    
    // 验证浏览按钮
    const browseBtn = page.locator('button').filter({ hasText: /Browse|浏览/ });
    await expect(browseBtn).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/saved-jobs-empty-state.png`,
      fullPage: true 
    });
  });
});
