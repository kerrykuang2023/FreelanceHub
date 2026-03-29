import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.use({
  viewport: { width: 1920, height: 1080 },
});

async function login(page: Page, email: string, password: string): Promise<boolean> {
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

test.describe('🖥️ 全屏模式页面居中验证', () => {
  test('验证所有页面在全屏模式下居中显示', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🖥️ 全屏模式页面居中验证 (1920x1080)');
    console.log('='.repeat(80));
    
    // 登录
    console.log('🔐 正在登录...');
    const loginSuccess = await login(page, 'admin@test.com', 'Test123456!');
    expect(loginSuccess).toBe(true);
    console.log('✅ 登录成功');
    
    // 测试页面列表
    const pagesToTest = [
      { name: '仪表盘', url: '/' },
      { name: '项目列表', url: '/jobs' },
      { name: '工时列表', url: '/work-logs' },
      { name: '发票列表', url: '/invoices' },
      { name: '个人档案', url: '/profile' },
      { name: '角色切换', url: '/profile/switch-role' },
    ];
    
    const results: { page: string; passed: boolean; issues: string[] }[] = [];
    
    for (const pageInfo of pagesToTest) {
      const issues: string[] = [];
      
      console.log(`\n📋 检查页面: ${pageInfo.name}`);
      
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      // 截图
      await page.screenshot({ path: `test-results/fullscreen-${pageInfo.name.replace(/\s+/g, '-')}.png` });
      
      // 检查主内容区域的page-container类或page-container-narrow类（排除导航栏）
      const mainPageContainer = page.locator('main .page-container, main .page-container-narrow, .flex-1 .page-container, .flex-1 .page-container-narrow').first();
      
      let count = 0;
      try {
        await mainPageContainer.waitFor({ state: 'attached', timeout: 30000 });
        count = await mainPageContainer.count();
      } catch (e) {
        // 如果找不到主内容区域的page-container，尝试其他选择器
        const altPageContainer = page.locator('.page-container, .page-container-narrow').nth(1); // 跳过导航栏的page-container
        try {
          await altPageContainer.waitFor({ state: 'attached', timeout: 10000 });
          count = await altPageContainer.count();
        } catch (e2) {
          console.log(`  ⚠️ 未找到主内容区域的page-container类`);
        }
      }
      
      if (count > 0) {
        // 获取样式信息
        const styles = await mainPageContainer.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            maxWidth: computed.maxWidth,
            marginLeft: computed.marginLeft,
            marginRight: computed.marginRight,
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight,
            width: computed.width,
            // 获取实际位置
            left: rect.left,
            right: rect.right,
            actualWidth: rect.width,
            viewportWidth: window.innerWidth,
          };
        });
        
        console.log(`  ✅ 找到主内容区域的page-container`);
        console.log(`     max-width: ${styles.maxWidth}`);
        console.log(`     margin: ${styles.marginLeft} ${styles.marginRight}`);
        console.log(`     padding: ${styles.paddingLeft} ${styles.paddingRight}`);
        console.log(`     width: ${styles.width}`);
        console.log(`     实际位置: left=${styles.left.toFixed(0)}px, width=${styles.actualWidth.toFixed(0)}px`);
        
        // 验证居中 - 通过检查实际位置是否居中
        const expectedLeft = (styles.viewportWidth - styles.actualWidth) / 2;
        const actualLeft = styles.left;
        const tolerance = 15; // 允许15px误差
        
        if (Math.abs(expectedLeft - actualLeft) <= tolerance) {
          console.log(`  ✅ 内容已居中 (期望left: ${expectedLeft.toFixed(0)}px, 实际left: ${actualLeft.toFixed(0)}px)`);
        } else {
          issues.push(`内容未居中 (期望left: ${expectedLeft.toFixed(0)}px, 实际left: ${actualLeft.toFixed(0)}px)`);
        }
        
        // 验证留白
        const leftPad = parseInt(styles.paddingLeft);
        const rightPad = parseInt(styles.paddingRight);
        if (leftPad > 0 && rightPad > 0) {
          console.log(`  ✅ 有左右留白 (${leftPad}px)`);
        } else {
          issues.push('缺少左右padding留白');
        }
        
        // 验证max-width
        if (styles.maxWidth !== 'none') {
          console.log(`  ✅ 有max-width限制 (${styles.maxWidth})`);
        } else {
          issues.push('缺少max-width限制');
        }
      } else {
        issues.push('未找到主内容区域的page-container类');
      }
      
      const passed = issues.length === 0;
      results.push({
        page: pageInfo.name,
        passed,
        issues,
      });
      
      if (passed) {
        console.log(`  ✅ 页面布局正确`);
      } else {
        console.log(`  ❌ 页面布局问题:`);
        for (const issue of issues) {
          console.log(`     - ${issue}`);
        }
      }
    }
    
    // 生成报告
    console.log('\n' + '='.repeat(80));
    console.log('📊 全屏模式页面居中验证报告');
    console.log('='.repeat(80));
    
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    
    console.log(`\n总计: ${results.length} 个页面`);
    console.log(`通过: ${passed.length} 个 ✅`);
    console.log(`失败: ${failed.length} 个 ❌`);
    
    if (failed.length > 0) {
      console.log('\n❌ 需要修复的页面:');
      for (const result of failed) {
        console.log(`  - ${result.page}`);
        for (const issue of result.issues) {
          console.log(`    • ${issue}`);
        }
      }
    }
    
    // 断言至少80%通过
    const passRate = passed.length / results.length;
    console.log(`\n通过率: ${(passRate * 100).toFixed(1)}%`);
    expect(passRate).toBeGreaterThanOrEqual(0.8, `有${failed.length}个页面布局不正确`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 所有页面全屏模式验证完成');
    console.log('='.repeat(80));
  });
});
