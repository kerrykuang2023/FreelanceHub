import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
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

async function login(page: any, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-submit-btn"]');
    
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
    
    await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    return true;
  } catch (e) {
    console.log(`登录失败: ${email}`, e);
    return false;
  }
}

test.describe('📱 响应式布局验证', () => {
  test('验证不同屏幕尺寸下的页面布局', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📱 响应式布局验证测试');
    console.log('='.repeat(80));
    
    const viewports = [
      { name: '手机竖屏', width: 375, height: 667 },
      { name: '手机横屏', width: 667, height: 375 },
      { name: '平板竖屏', width: 768, height: 1024 },
      { name: '平板横屏', width: 1024, height: 768 },
      { name: '桌面', width: 1280, height: 720 },
      { name: '大桌面', width: 1920, height: 1080 },
    ];
    
    const loginSuccess = await login(page, 'admin@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    
    const pagesToTest = [
      { name: '仪表盘', url: '/' },
      { name: '项目列表', url: '/jobs' },
      { name: '工时列表', url: '/work-logs' },
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📐 测试视口: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      for (const pageInfo of pagesToTest) {
        console.log(`  📋 检查页面: ${pageInfo.name}`);
        
        await page.goto(`${BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const pageContainer = page.locator('.page-container, .page-container-narrow').first();
        const containerExists = await pageContainer.count();
        
        if (containerExists > 0) {
          const box = await pageContainer.boundingBox();
          const containerWidth = box?.width || 0;
          const containerLeft = box?.x || 0;
          const containerRight = viewport.width - (containerLeft + containerWidth);
          
          console.log(`    容器宽度: ${containerWidth}px`);
          console.log(`    左边距: ${containerLeft}px`);
          console.log(`    右边距: ${containerRight}px`);
          
          if (viewport.width < 768) {
            expect(containerLeft).toBeLessThanOrEqual(30);
            expect(containerRight).toBeLessThanOrEqual(40);
            console.log(`    ✅ 移动端布局正确`);
          } else if (viewport.width < 1024) {
            expect(containerLeft).toBeLessThanOrEqual(50);
            expect(containerRight).toBeLessThanOrEqual(50);
            console.log(`    ✅ 平板布局正确`);
          } else {
            expect(containerWidth).toBeLessThanOrEqual(viewport.width);
            console.log(`    ✅ 桌面布局正确`);
          }
        } else {
          console.log(`    ⚠️ 未找到page-container`);
        }
        
        await page.screenshot({ 
          path: `test-results/responsive-${viewport.name.replace(/\s+/g, '-')}-${pageInfo.name.replace(/\s+/g, '-')}.png` 
        });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 响应式布局验证完成');
    console.log('='.repeat(80));
  });
  
  test('验证导航栏响应式', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🧭 导航栏响应式验证');
    console.log('='.repeat(80));
    
    const loginSuccess = await login(page, 'freelancer@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    
    const mobileViewports = [
      { name: '手机竖屏', width: 375, height: 667 },
      { name: '手机横屏', width: 667, height: 375 },
    ];
    
    for (const viewport of mobileViewports) {
      console.log(`\n📐 测试视口: ${viewport.name}`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const hamburgerButton = page.locator('button[type="button"]').filter({ 
        has: page.locator('svg[class*="h-6"]') 
      });
      
      const hasHamburger = await hamburgerButton.count();
      console.log(`  汉堡菜单按钮: ${hasHamburger > 0 ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasHamburger > 0) {
        try {
          await hamburgerButton.first().click({ force: true, timeout: 5000 });
          await page.waitForTimeout(500);
          
          const mobileMenu = page.locator('[role="dialog"], .fixed.inset-y-0');
          const menuVisible = await mobileMenu.count();
          console.log(`  移动端菜单: ${menuVisible > 0 ? '✅ 已打开' : '❌ 未打开'}`);
        } catch (e) {
          console.log(`  移动端菜单: ⚠️ 无法点击汉堡菜单`);
        }
      }
      
      await page.screenshot({ 
        path: `test-results/responsive-nav-${viewport.name.replace(/\s+/g, '-')}.png` 
      });
    }
    
    const desktopViewport = { name: '桌面', width: 1280, height: 720 };
    console.log(`\n📐 测试视口: ${desktopViewport.name}`);
    
    await page.setViewportSize({ width: desktopViewport.width, height: desktopViewport.height });
    await page.waitForTimeout(500);
    
    const navMenu = page.locator('nav, [role="navigation"]');
    const navVisible = await navMenu.count();
    console.log(`  桌面导航菜单: ${navVisible > 0 ? '✅ 可见' : '❌ 不可见'}`);
    
    await page.screenshot({ 
      path: `test-results/responsive-nav-${desktopViewport.name}.png` 
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 导航栏响应式验证完成');
    console.log('='.repeat(80));
  });
  
  test('验证表格响应式', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 表格响应式验证');
    console.log('='.repeat(80));
    
    const loginSuccess = await login(page, 'admin@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const viewports = [
      { name: '手机', width: 375, height: 667 },
      { name: '平板', width: 768, height: 1024 },
      { name: '桌面', width: 1280, height: 720 },
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📐 测试视口: ${viewport.name}`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const tableWrapper = page.locator('table, [role="table"], .overflow-x-auto').first();
      const tableExists = await tableWrapper.count();
      
      if (tableExists > 0) {
        const box = await tableWrapper.boundingBox();
        const tableWidth = box?.width || 0;
        
        console.log(`  表格宽度: ${tableWidth}px`);
        console.log(`  视口宽度: ${viewport.width}px`);
        
        if (viewport.width < 768) {
          const hasOverflow = tableWidth > viewport.width;
          console.log(`  水平滚动: ${hasOverflow ? '✅ 支持' : '⚠️ 无需'}`);
        } else {
          expect(tableWidth).toBeLessThanOrEqual(viewport.width);
          console.log(`  ✅ 表格适应视口`);
        }
      } else {
        console.log(`  ⚠️ 未找到表格`);
      }
      
      await page.screenshot({ 
        path: `test-results/responsive-table-${viewport.name}.png` 
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 表格响应式验证完成');
    console.log('='.repeat(80));
  });
});
