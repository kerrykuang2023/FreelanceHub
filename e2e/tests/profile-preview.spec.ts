import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('PROFILE-007: 档案预览功能', () => {
  test.beforeEach(async ({ page }) => {
    // 访问档案页面
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
  });

  test('档案页面显示预览按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 验证预览按钮存在
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await expect(previewBtn).toBeVisible();
    
    // 验证按钮文本
    await expect(previewBtn).toContainText('预览档案');
    
    // 验证按钮图标
    const icon = previewBtn.locator('svg');
    await expect(icon).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-button.png`,
      fullPage: false 
    });
  });

  test('点击预览按钮跳转到预览页面', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待页面跳转
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证跳转到预览页面
    const previewPage = page.locator('[data-testid="profile-preview-page"]');
    await expect(previewPage).toBeVisible();
    
    // 验证 URL
    expect(page.url()).toContain('/profile/preview/');
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-page.png`,
      fullPage: true 
    });
  });

  test('预览页面显示完整档案信息', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待预览页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 验证预览页面标题
    const previewPage = page.locator('[data-testid="profile-preview-page"]');
    await expect(previewPage).toBeVisible();
    
    // 验证档案头部信息
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    
    // 验证技能部分
    const skillsSection = page.locator('[data-testid*="skill-"]').first();
    await expect(skillsSection).toBeVisible();
    
    // 验证项目经验部分
    const projectSection = page.locator('[data-testid*="project-"]').first();
    await expect(projectSection).toBeVisible();
    
    // 验证联系按钮存在
    const contactBtn = page.locator('[data-testid="contact-btn"]');
    await expect(contactBtn).toBeVisible();
    await expect(contactBtn).toContainText('联系我');
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-complete.png`,
      fullPage: false 
    });
  });

  test('预览页面显示费率信息', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待预览页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证费率卡片存在
    const rateCard = page.locator('text=/服务费率/');
    await expect(rateCard).toBeVisible();
    
    // 验证费率值显示
    const rateValue = page.locator('text=/小时费率/').or(page.locator('text=/日费率/'));
    await expect(rateValue).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-rates.png`,
      fullPage: false 
    });
  });

  test('预览页面显示档案统计', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待预览页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证档案统计部分
    const statsSection = page.locator('text=/档案统计/');
    await expect(statsSection).toBeVisible();
    
    // 验证档案完整度进度条
    const progressBar = page.locator('.bg-green-500');
    await expect(progressBar).toBeVisible();
    
    // 验证完整度百分比
    const percentage = page.locator('text=/%/').first();
    await expect(percentage).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-stats.png`,
      fullPage: false 
    });
  });

  test('预览页面快速操作按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待预览页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证查看项目按钮
    const viewProjectsBtn = page.locator('[data-testid="view-projects-btn"]');
    await expect(viewProjectsBtn).toBeVisible();
    await expect(viewProjectsBtn).toContainText('查看项目');
    
    // 验证浏览所有顾问按钮
    const browseAllBtn = page.locator('[data-testid="browse-all-btn"]');
    await expect(browseAllBtn).toBeVisible();
    await expect(browseAllBtn).toContainText('浏览所有顾问');
    
    // 截图
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-actions.png`,
      fullPage: false 
    });
  });

  test('预览页面响应式布局', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 点击预览按钮
    const previewBtn = page.locator('[data-testid="preview-profile-btn"]');
    await previewBtn.click();
    
    // 等待预览页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证页面使用 grid 布局
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
    
    // 验证主内容区域
    const mainContent = page.locator('.lg\\:col-span-2');
    await expect(mainContent).toBeVisible();
    
    // 验证侧边栏
    const sidebar = page.locator('.lg\\:col-span-3').locator('.space-y-6').last();
    await expect(sidebar).toBeVisible();
    
    // 截图 - 完整页面
    await page.screenshot({ 
      path: `e2e/screenshots/profile-preview-layout.png`,
      fullPage: true 
    });
  });
});
