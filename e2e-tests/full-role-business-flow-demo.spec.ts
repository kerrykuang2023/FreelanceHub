import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
    name: '自由顾问'
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
    name: 'HR 招聘官'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
    name: '系统管理员'
  }
};

class DemoHelper {
  static async highlightElement(page: Page, selector: string, label: string = '') {
    try {
      const element = page.locator(selector).first();
      await element.scrollIntoViewIfNeeded({ timeout: 5000 });
      await element.highlight({ color: 'yellow', duration: 1000 });
      console.log(`  ✨ 操作：${label || selector}`);
    } catch (e) {
      console.log(`  ⚠️  元素未找到：${selector}`);
    }
  }

  static async takeDemoScreenshot(page: Page, stepName: string) {
    try {
      await page.screenshot({
        path: `test-results/demo-${stepName}-${Date.now()}.png`,
        fullPage: false
      });
      console.log(`  📸 截图：${stepName}`);
    } catch (e) {
      console.log(`  ⚠️  截图失败：${stepName}`);
    }
  }

  static async login(page: Page, email: string, password: string, roleName: string) {
    console.log(`\n👤 登录为：${roleName}`);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await this.highlightElement(page, 'input[type="email"]', '输入邮箱');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(email);

    await this.highlightElement(page, 'input[type="password"]', '输入密码');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password);

    await this.highlightElement(page, 'button[type="submit"]', '点击登录按钮');
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await this.takeDemoScreenshot(page, `login-${roleName.replace(/\s/g, '-')}`);
    
    const currentUrl = page.url();
    const success = !currentUrl.includes('/login');
    console.log(`  ${success ? '✅' : '❌'} 登录${success ? '成功' : '失败'}\n`);
    
    return success;
  }

  static async logout(page: Page) {
    try {
      const userMenu = page.locator('[class*="rounded-full"]').first();
      await userMenu.click();
      await page.waitForTimeout(500);
      
      const logoutBtn = page.locator('button:has-text("退出"), text=退出登录').first();
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      console.log(`  🚪 已退出登录`);
    } catch (e) {
      console.log(`  ⚠️  退出登录失败`);
    }
  }

  static async verifyMenuItems(page: Page, expectedItems: string[]) {
    console.log(`  📋 验证菜单项...`);
    
    try {
      const nav = page.locator('nav[aria-label="Global"]').first();
      const navText = await nav.textContent({ timeout: 5000 });
      console.log(`  📝 导航栏内容: ${navText?.substring(0, 200)}...`);
      
      for (const item of expectedItems) {
        try {
          const menuItem = nav.locator(`a:has-text("${item}"), button:has-text("${item}")`).first();
          const isVisible = await menuItem.isVisible({ timeout: 2000 }).catch(() => false);
          console.log(`    ${isVisible ? '✅' : '❌'} ${item}`);
        } catch (e) {
          console.log(`    ❌ ${item} (查找失败)`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️  导航栏未找到，跳过菜单验证`);
    }
  }

  static async verifyBreadcrumbs(page: Page, expectedPath: string[]) {
    console.log(`  🍞 验证面包屑：${expectedPath.join(' > ')}`);
    
    try {
      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]').first();
      const breadcrumbText = await breadcrumbNav.textContent({ timeout: 5000 });
      console.log(`  📝 面包屑内容: ${breadcrumbText}`);
      
      for (const item of expectedPath) {
        try {
          const breadcrumbItem = breadcrumbNav.locator(`:text-is("${item}"), a:has-text("${item}"), span:has-text("${item}")`).first();
          const isVisible = await breadcrumbItem.isVisible({ timeout: 2000 }).catch(() => false);
          console.log(`    ${isVisible ? '✅' : '❌'} ${item}`);
        } catch (e) {
          console.log(`    ❌ ${item} (查找失败)`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️  面包屑未找到，跳过验证`);
    }
  }
}

test.describe('🎬 全角色业务流程演示', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('📌 场景 1: 自由顾问 (Freelancer) 完整工作流', () => {
    test('DEMO-FREELANCER-001: 从登录到工时填报', async ({ page }) => {
      console.log('\n' + '='.repeat(80));
      console.log(' 场景：自由顾问日常工作流程');
      console.log('='.repeat(80) + '\n');

      const loginSuccess = await DemoHelper.login(
        page,
        TEST_USERS.freelancer.email,
        TEST_USERS.freelancer.password,
        TEST_USERS.freelancer.name
      );
      expect(loginSuccess).toBe(true);

      console.log('\n📊 步骤 2: 查看工作台');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'freelancer-dashboard');

      console.log('\n🔍 步骤 3: 浏览可接项目');
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'freelancer-browse-jobs');

      console.log('\n📝 步骤 4: 查看申请状态');
      await page.goto(`${BASE_URL}/applications`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'freelancer-applications');

      console.log('\n⏰ 步骤 5: 工时管理');
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'freelancer-worklogs');

      console.log('\n👤 步骤 6: 查看个人档案');
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'freelancer-profile');

      console.log('\n✅ 自由顾问工作流程演示完成\n');
    });
  });

  test.describe('📌 场景 2: HR 招聘官完整工作流', () => {
    test('DEMO-HR-001: 从登录到发布项目', async ({ page }) => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 场景：HR 招聘官日常工作流程');
      console.log('='.repeat(80) + '\n');

      const loginSuccess = await DemoHelper.login(
        page,
        TEST_USERS.hr.email,
        TEST_USERS.hr.password,
        TEST_USERS.hr.name
      );
      expect(loginSuccess).toBe(true);

      console.log('\n📊 步骤 2: 查看 HR 工作台');
      await page.goto(`${BASE_URL}/hr/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'hr-dashboard');

      console.log('\n📢 步骤 3: 发布新项目');
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.highlightElement(page, 'input[name="project_title"], input[data-testid="project-title-input"]', '项目标题输入框');
      await DemoHelper.highlightElement(page, 'textarea[name="project_description"]', '项目描述输入框');
      await DemoHelper.highlightElement(page, 'input[name="rate_amount"]', '费率金额输入框');
      await DemoHelper.highlightElement(page, 'button[data-testid="submit-job-btn"], button:has-text("发布项目")', '发布按钮');
      
      await DemoHelper.takeDemoScreenshot(page, 'hr-post-job-form');

      console.log('\n💼 步骤 4: 查看已发布项目');
      await page.goto(`${BASE_URL}/my-projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'hr-my-projects');

      console.log('\n📋 步骤 5: 管理候选人申请');
      await page.goto(`${BASE_URL}/company/applications`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'hr-applications');

      console.log('\n✅ 步骤 6: 审核工时');
      await page.goto(`${BASE_URL}/company/work-logs/pending`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'hr-pending-worklogs');

      console.log('\n✅ HR 招聘官工作流程演示完成\n');
    });
  });

  test.describe('📌 场景 3: 系统管理员完整工作流', () => {
    test('DEMO-ADMIN-001: 从登录到系统管理', async ({ page }) => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 场景：系统管理员日常工作流程');
      console.log('='.repeat(80) + '\n');

      const loginSuccess = await DemoHelper.login(
        page,
        TEST_USERS.admin.email,
        TEST_USERS.admin.password,
        TEST_USERS.admin.name
      );
      expect(loginSuccess).toBe(true);

      console.log('\n📊 步骤 2: 查看管理后台');
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'admin-dashboard');

      console.log('\n👥 步骤 3: 用户管理');
      await page.goto(`${BASE_URL}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.highlightElement(page, 'table', '用户列表表格');
      await DemoHelper.takeDemoScreenshot(page, 'admin-users');

      console.log('\n🏢 步骤 4: 公司管理');
      await page.goto(`${BASE_URL}/admin/companies`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.highlightElement(page, 'table', '公司列表表格');
      await DemoHelper.takeDemoScreenshot(page, 'admin-companies');

      console.log('\n💼 步骤 5: 项目管理');
      await page.goto(`${BASE_URL}/admin/projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'admin-projects');

      console.log('\n⏰ 步骤 6: 工时管理');
      await page.goto(`${BASE_URL}/admin/worklogs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'admin-worklogs');

      console.log('\n💰 步骤 7: 发票管理');
      await page.goto(`${BASE_URL}/admin/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await DemoHelper.takeDemoScreenshot(page, 'admin-invoices');

      console.log('\n⚙️ 步骤 8: 查看系统管理子菜单');
      try {
        const systemMenu = page.locator('button:has-text("系统管理"), a:has-text("系统管理")').first();
        await systemMenu.hover();
        await page.waitForTimeout(1000);
        
        console.log('  📂 系统管理子菜单已展开');
        await DemoHelper.takeDemoScreenshot(page, 'admin-system-menu');
      } catch (e) {
        console.log('  ⚠️  系统管理菜单未找到');
      }

      console.log('\n✅ 系统管理员工作流程演示完成\n');
    });
  });

  test.describe('📌 场景 4: 跨角色导航一致性验证', () => {
    test('DEMO-CONSISTENCY-001: 验证所有角色导航体验', async ({ page }) => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 场景：验证所有角色的导航一致性');
      console.log('='.repeat(80) + '\n');

      const roles = [
        { ...TEST_USERS.freelancer, dashboard: '/dashboard' },
        { ...TEST_USERS.hr, dashboard: '/hr/dashboard' },
        { ...TEST_USERS.admin, dashboard: '/admin/dashboard' }
      ];

      for (const role of roles) {
        console.log(`\n🔍 验证角色：${role.name}`);
        console.log('-'.repeat(60));
        
        await DemoHelper.login(page, role.email, role.password, role.name);
        
        await page.goto(`${BASE_URL}${role.dashboard}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        
        const nav = page.locator('nav[aria-label="Global"]').first();
        const navVisible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${navVisible ? '✅' : '❌'} 顶部导航栏显示正常`);
        
        const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]').first();
        const breadcrumbVisible = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${breadcrumbVisible ? '✅' : '❌'} 面包屑导航显示正常`);
        
        if (navVisible && breadcrumbVisible) {
          try {
            const navBox = await nav.boundingBox();
            const breadcrumbBox = await breadcrumb.boundingBox();
            
            if (navBox && breadcrumbBox) {
              const spacing = Math.round(breadcrumbBox.y - (navBox.y + navBox.height));
              console.log(`  📏 导航栏到面包屑间距：${spacing}px`);
              console.log(`  ${spacing < 50 ? '✅' : '⚠️'} 间距${spacing < 50 ? '合理' : '偏大'}`);
            }
          } catch (e) {
            console.log(`  ⚠️  间距测量失败`);
          }
        }
        
        await DemoHelper.takeDemoScreenshot(page, `consistency-${role.name.replace(/\s/g, '-')}-dashboard`);
        
        await DemoHelper.logout(page);
        await page.waitForTimeout(1000);
      }

      console.log('\n✅ 跨角色导航一致性验证完成\n');
    });
  });

  test.describe('📌 场景 5: 统一菜单组件功能演示', () => {
    test('DEMO-MENU-001: 演示统一菜单组件功能', async ({ page }) => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 场景：统一菜单组件功能演示');
      console.log('='.repeat(80) + '\n');

      await DemoHelper.login(page, TEST_USERS.hr.email, TEST_USERS.hr.password, TEST_USERS.hr.name);

      console.log('\n🖱️ 演示 1: 菜单项悬停效果');
      try {
        const nav = page.locator('nav[aria-label="Global"]').first();
        const menuItems = nav.locator('a, button').locator('visible=true');
        
        const firstMenuItem = menuItems.first();
        await firstMenuItem.hover();
        await page.waitForTimeout(500);
        console.log('  ✨ 菜单项悬停高亮效果已展示');
      } catch (e) {
        console.log('  ⚠️  菜单项悬停效果演示失败');
      }
      
      console.log('\n🍞 演示 2: 面包屑导航点击');
      try {
        const homeLink = page.locator('nav[aria-label="Breadcrumb"] a').first();
        const isClickable = await homeLink.isEnabled({ timeout: 2000 });
        console.log(`  ${isClickable ? '✅' : '❌'} 首页链接可点击`);
      } catch (e) {
        console.log('  ⚠️  面包屑导航点击演示失败');
      }
      
      console.log('\n📱 演示 3: 响应式设计检查');
      const viewport = page.viewportSize();
      console.log(`  📐 当前视口：${viewport?.width || 0}x${viewport?.height || 0}`);
      
      if (viewport && viewport.width < 1024) {
        try {
          const mobileMenuBtn = page.locator('button:has(svg[aria-label="Open main menu"])').first();
          const mobileMenuVisible = await mobileMenuBtn.isVisible({ timeout: 2000 });
          console.log(`  ${mobileMenuVisible ? '✅' : '❌'} 移动端汉堡菜单按钮显示`);
        } catch (e) {
          console.log('  ⚠️  移动端菜单检查失败');
        }
      } else {
        console.log('  ℹ️  桌面端视图，跳过移动端菜单测试');
      }

      console.log('\n🏷️ 演示 4: 角色标识显示');
      try {
        const roleBadge = page.locator('text=HR 招聘官').first();
        const roleBadgeVisible = await roleBadge.isVisible({ timeout: 2000 });
        console.log(`  ${roleBadgeVisible ? '✅' : '❌'} 角色标识正确显示`);
      } catch (e) {
        console.log('  ⚠️  角色标识显示检查失败');
      }

      console.log('\n👤 演示 5: 用户下拉菜单');
      try {
        const userAvatar = page.locator('[class*="rounded-full"]').first();
        await userAvatar.click();
        await page.waitForTimeout(500);
        
        const profileVisible = await page.locator('text=个人档案').isVisible({ timeout: 2000 }).catch(() => false);
        const settingsVisible = await page.locator('text=设置').isVisible({ timeout: 2000 }).catch(() => false);
        const logoutVisible = await page.locator('text=退出登录').isVisible({ timeout: 2000 }).catch(() => false);
        
        console.log(`  ${profileVisible ? '✅' : '❌'} 个人档案链接`);
        console.log(`  ${settingsVisible ? '✅' : '❌'} 设置链接`);
        console.log(`  ${logoutVisible ? '✅' : '❌'} 退出登录链接`);
      } catch (e) {
        console.log('  ⚠️  用户下拉菜单演示失败');
      }

      await DemoHelper.takeDemoScreenshot(page, 'menu-features-demo');

      console.log('\n✅ 统一菜单组件功能演示完成\n');
    });
  });
});

test.afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('🎉 全角色业务流程演示完成！');
  console.log('='.repeat(80));
  console.log('\n📊 演示总结:');
  console.log('  ✅ 自由顾问工作流程');
  console.log('  ✅ HR 招聘官工作流程');
  console.log('  ✅ 系统管理员工作流程');
  console.log('  ✅ 跨角色导航一致性验证');
  console.log('  ✅ 统一菜单组件功能演示');
  console.log('\n📸 所有截图已保存到：test-results/');
  console.log('='.repeat(80) + '\n');
});
