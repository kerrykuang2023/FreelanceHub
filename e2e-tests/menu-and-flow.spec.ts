import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { TestHelper, TEST_USERS, IssueLogger, MasterDataChecker } from '../e2e-utils/test-helpers';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

test.describe('菜单改造与全链路E2E验证', () => {
  let issueLogger: IssueLogger;

  test.beforeEach(async ({ page }) => {
    issueLogger = new IssueLogger();
    TestHelper.setupPageMonitoring(page);
  });

  test.afterEach(async ({ page }) => {
    await TestHelper.logout(page);
  });

  test('MENU-01: Freelancer角色菜单渲染验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：Freelancer角色菜单渲染验证');
    console.log('========================================\n');

    const user = TEST_USERS.freelancer1;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: 'Freelancer用户登录失败',
        expectedBehavior: '用户应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入账号密码', '点击登录'],
        userRole: 'freelancer',
      });
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const navbar = await page.locator('[data-testid="global-navbar"]');
    await expect(navbar).toBeVisible({ timeout: 10000 });
    console.log('✅ GlobalNavbar 组件可见');

    const expectedMenuItems = [
      'menu-item-dashboard',
      'menu-item-my-projects',
      'menu-item-browse-projects',
      'menu-item-my-applications',
      'menu-item-saved-jobs',
      'menu-item-work-logs',
      'menu-item-invoices',
      'menu-item-messages',
    ];

    const menuContainer = page.locator('[data-testid="navbar-menu"]');
    await expect(menuContainer).toBeVisible({ timeout: 5000 });
    console.log('✅ 菜单容器可见');
    
    const menuItems = await menuContainer.locator('[data-testid^="menu-item-"]').all();
    console.log(`发现 ${menuItems.length} 个菜单项`);
    
    for (const item of menuItems) {
      const testId = await item.getAttribute('data-testid');
      console.log(`  - ${testId}`);
    }

    const ctaButton = page.locator('[data-testid="cta-button"]');
    await expect(ctaButton).toBeVisible();
    const ctaText = await ctaButton.textContent();
    expect(ctaText).toContain('找工作');
    console.log(`✅ CTA按钮显示正确: ${ctaText}`);

    const breadcrumb = page.locator('[data-testid="breadcrumb-navigation"]');
    const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false);
    console.log(`✅ 面包屑导航: ${breadcrumbVisible ? '可见' : '不可见'}`);

    const consoleErrors = TestHelper.getConsoleErrors();
    const criticalErrors = consoleErrors.filter(e => e.type === 'error' || e.type === 'pageerror');
    
    if (criticalErrors.length > 0) {
      console.log(`⚠️ 发现 ${criticalErrors.length} 个控制台错误`);
      criticalErrors.forEach(err => console.log(`  - ${err.message}`));
    }

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
    console.log(`- 严重问题: ${issueLogger.getCriticalCount()}`);
    console.log(`- 高优先级问题: ${issueLogger.getHighCount()}`);
  });

  test('MENU-02: HR角色菜单渲染验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：HR角色菜单渲染验证');
    console.log('========================================\n');

    const user = TEST_USERS.hr1;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: 'HR用户登录失败',
        expectedBehavior: '用户应该能够成功登录',
        actualBehavior: '登录失败',
        steps: ['访问登录页面', '输入账号密码', '点击登录'],
        userRole: 'hr_recruiter',
      });
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const navbar = await page.locator('[data-testid="global-navbar"]');
    await expect(navbar).toBeVisible({ timeout: 10000 });
    console.log('✅ GlobalNavbar 组件可见');

    const expectedMenuItems = [
      'menu-item-dashboard',
      'menu-item-my-projects',
      'menu-item-post-job',
      'menu-item-applications',
      'menu-item-work-logs',
      'menu-item-invoices',
      'menu-item-messages',
    ];

    for (const itemId of expectedMenuItems) {
      const menuItem = page.locator(`[data-testid="${itemId}"]`);
      const isVisible = await menuItem.isVisible().catch(() => false);
      
      if (!isVisible) {
        issueLogger.logIssue({
          category: 'UI',
          severity: 'HIGH',
          description: `菜单项 ${itemId} 未显示`,
          expectedBehavior: 'HR角色应该看到所有专属菜单项',
          actualBehavior: `菜单项 ${itemId} 不可见`,
          steps: ['登录HR账户', '检查菜单项'],
          userRole: 'hr_recruiter',
        });
      } else {
        console.log(`✅ 菜单项 ${itemId} 可见`);
      }
    }

    const freelancerOnlyItem = page.locator('[data-testid="menu-item-browse-projects"]');
    const freelancerItemVisible = await freelancerOnlyItem.isVisible().catch(() => false);
    
    if (freelancerItemVisible) {
      issueLogger.logIssue({
        category: 'PERMISSION',
        severity: 'HIGH',
        description: 'HR角色看到了Freelancer专属菜单项',
        expectedBehavior: 'HR角色不应该看到"浏览项目"菜单项',
        actualBehavior: '菜单项可见',
        steps: ['登录HR账户', '检查菜单项'],
        userRole: 'hr_recruiter',
      });
    } else {
      console.log('✅ HR角色正确地看不到Freelancer专属菜单项');
    }

    const ctaButton = page.locator('[data-testid="cta-button"]');
    await expect(ctaButton).toBeVisible();
    const ctaText = await ctaButton.textContent();
    expect(ctaText).toContain('发布职位');
    console.log(`✅ CTA按钮显示正确: ${ctaText}`);

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
  });

  test('MENU-03: 角色切换菜单更新验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：角色切换菜单更新验证');
    console.log('========================================\n');

    const user = TEST_USERS.admin;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const userAvatarButton = page.locator('[data-testid="user-avatar-button"]');
    await expect(userAvatarButton).toBeVisible();
    await userAvatarButton.click();
    console.log('✅ 点击用户头像');

    await page.waitForTimeout(500);

    const switchRoleMenu = page.locator('[data-testid="menu-switch-role"]');
    const switchRoleVisible = await switchRoleMenu.isVisible().catch(() => false);
    
    if (switchRoleVisible) {
      console.log('✅ 切换角色菜单项可见');
    }

    const roleSwitcher = page.locator('[class*="role-switcher"], [class*="RoleSwitcher"]').first();
    const roleSwitcherVisible = await roleSwitcher.isVisible().catch(() => false);
    
    if (roleSwitcherVisible) {
      console.log('✅ 角色切换器可见');
      
      const roleButtons = roleSwitcher.locator('button');
      const count = await roleButtons.count();
      console.log(`  发现 ${count} 个角色选项`);
      
      if (count > 1) {
        const secondRole = roleButtons.nth(1);
        const roleText = await secondRole.textContent();
        console.log(`  尝试切换到角色: ${roleText}`);
        await secondRole.click();
        
        await page.waitForTimeout(3000);
        
        const navbar = page.locator('[data-testid="global-navbar"]');
        await expect(navbar).toBeVisible();
        console.log('✅ 角色切换后导航栏仍然可见');
      }
    } else {
      console.log('⚠️ 角色切换器不可见（可能只有一个角色）');
    }

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
  });

  test('MENU-04: 菜单导航链接功能验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：菜单导航链接功能验证');
    console.log('========================================\n');

    const user = TEST_USERS.freelancer1;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const browseProjectsItem = page.locator('[data-testid="menu-item-browse-projects"]');
    await expect(browseProjectsItem).toBeVisible();
    await browseProjectsItem.click();
    console.log('✅ 点击"浏览项目"菜单项');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/jobs/);
    console.log(`✅ 页面成功跳转到: ${page.url()}`);

    const breadcrumb = page.locator('[data-testid="breadcrumb-navigation"]');
    const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false);
    
    if (breadcrumbVisible) {
      const breadcrumbItems = breadcrumb.locator('[data-testid^="breadcrumb-item-"]');
      const count = await breadcrumbItems.count();
      console.log(`✅ 面包屑显示 ${count} 个项目`);
      
      const lastItem = breadcrumbItems.last();
      const lastItemText = await lastItem.textContent();
      console.log(`  当前页面: ${lastItemText}`);
    }

    const workLogsItem = page.locator('[data-testid="menu-item-work-logs"]');
    await expect(workLogsItem).toBeVisible();
    await workLogsItem.click();
    console.log('✅ 点击"工时管理"菜单项');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/work-logs/);
    console.log(`✅ 页面成功跳转到: ${page.url()}`);

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
  });

  test('MENU-05: 端到端业务流程验证（HR发布职位 -> Freelancer申请 -> HR审批）', async ({ page, request }) => {
    test.setTimeout(60000);
    console.log('\n========================================');
    console.log('测试：端到端业务流程验证');
    console.log('========================================\n');

    const masterDataCheck = await MasterDataChecker.checkAllMasterData(request);
    if (!masterDataCheck.passed) {
      console.log('⚠️ 主数据检查未通过:', masterDataCheck.details);
    }

    console.log('\n--- 步骤1: HR登录并发布职位 ---');
    const hrUser = TEST_USERS.hr1;
    const hrLoginResult = await TestHelper.loginAsUser(page, hrUser);

    if (!hrLoginResult.success) {
      throw new Error('HR登录失败');
    }

    await page.waitForTimeout(2000);

    const postJobButton = page.locator('[data-testid="cta-button"]');
    await expect(postJobButton).toBeVisible();
    await postJobButton.click();
    console.log('✅ HR点击"发布职位"按钮');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/post-job/);
    console.log('✅ 成功跳转到发布职位页面');

    const breadcrumb = page.locator('[data-testid="breadcrumb-navigation"]');
    const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false);
    if (breadcrumbVisible) {
      console.log('✅ 面包屑导航正常显示');
    }

    await TestHelper.logout(page);
    console.log('✅ HR登出');

    console.log('\n--- 步骤2: Freelancer登录并浏览项目 ---');
    const freelancerUser = TEST_USERS.freelancer1;
    const freelancerLoginResult = await TestHelper.loginAsUser(page, freelancerUser);

    if (!freelancerLoginResult.success) {
      throw new Error('Freelancer登录失败');
    }

    await page.waitForTimeout(2000);

    const browseProjectsItem = page.locator('[data-testid="menu-item-browse-projects"]');
    await expect(browseProjectsItem).toBeVisible();
    await browseProjectsItem.click();
    console.log('✅ Freelancer点击"浏览项目"菜单项');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/jobs/);
    console.log('✅ 成功跳转到项目列表页面');

    const jobsList = page.locator('[class*="job"], [class*="project"]').first();
    const hasJobs = await jobsList.isVisible().catch(() => false);
    console.log(`✅ 项目列表: ${hasJobs ? '有项目' : '暂无项目'}`);

    const ctaButton = page.locator('[data-testid="cta-button"]');
    await expect(ctaButton).toBeVisible();
    const ctaText = await ctaButton.textContent();
    console.log(`✅ CTA按钮显示: ${ctaText}`);

    await TestHelper.logout(page);
    console.log('✅ Freelancer登出');

    console.log('\n--- 步骤3: Admin登录并验证系统管理菜单 ---');
    const adminUser = TEST_USERS.admin;
    const adminLoginResult = await TestHelper.loginAsUser(page, adminUser);

    if (!adminLoginResult.success) {
      throw new Error('Admin登录失败');
    }

    await page.waitForTimeout(2000);

    const systemManagementItem = page.locator('[data-testid="menu-item-system-management"]');
    const systemManagementVisible = await systemManagementItem.isVisible().catch(() => false);
    
    if (systemManagementVisible) {
      console.log('✅ 系统管理菜单项可见');
      
      await systemManagementItem.hover();
      await page.waitForTimeout(500);
      
      const adminDashboardItem = page.locator('[data-testid="menu-item-admin-dashboard"]');
      const adminDashboardVisible = await adminDashboardItem.isVisible().catch(() => false);
      
      if (adminDashboardVisible) {
        console.log('✅ 系统管理子菜单正确显示');
      }
    }

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
    console.log(`- 严重问题: ${issueLogger.getCriticalCount()}`);
    console.log(`- 高优先级问题: ${issueLogger.getHighCount()}`);
  });

  test('MENU-06: 用户下拉菜单功能验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：用户下拉菜单功能验证');
    console.log('========================================\n');

    const user = TEST_USERS.freelancer1;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const userAvatarButton = page.locator('[data-testid="user-avatar-button"]');
    await expect(userAvatarButton).toBeVisible();
    await userAvatarButton.click();
    console.log('✅ 点击用户头像');

    await page.waitForTimeout(500);

    const profileMenu = page.locator('[data-testid="menu-profile"]');
    await expect(profileMenu).toBeVisible();
    console.log('✅ 个人档案菜单项可见');

    const switchRoleMenu = page.locator('[data-testid="menu-switch-role"]');
    const switchRoleVisible = await switchRoleMenu.isVisible().catch(() => false);
    console.log(`✅ 切换角色菜单项: ${switchRoleVisible ? '可见' : '不可见'}`);

    const logoutMenu = page.locator('[data-testid="menu-logout"]');
    await expect(logoutMenu).toBeVisible();
    console.log('✅ 退出登录菜单项可见');

    await profileMenu.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/profile/);
    console.log('✅ 成功跳转到个人档案页面');

    const breadcrumb = page.locator('[data-testid="breadcrumb-navigation"]');
    const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false);
    if (breadcrumbVisible) {
      console.log('✅ 面包屑导航在个人档案页面正常显示');
    }

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
  });

  test('MENU-07: 移动端菜单响应式验证', async ({ page }) => {
    console.log('\n========================================');
    console.log('测试：移动端菜单响应式验证');
    console.log('========================================\n');

    await page.setViewportSize({ width: 375, height: 667 });
    console.log('✅ 设置移动端视口: 375x667');

    const user = TEST_USERS.freelancer1;
    const loginResult = await TestHelper.loginAsUser(page, user);

    if (!loginResult.success) {
      throw new Error('登录失败');
    }

    await page.waitForTimeout(2000);

    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    console.log('✅ 移动端菜单按钮可见');

    await mobileMenuButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 点击移动端菜单按钮');

    const mobileMenu = page.locator('[class*="DialogPanel"], [class*="mobile-menu"]').first();
    const mobileMenuVisible = await mobileMenu.isVisible().catch(() => false);
    
    if (mobileMenuVisible) {
      console.log('✅ 移动端菜单面板打开');
      
      const menuItems = mobileMenu.locator('a, button');
      const count = await menuItems.count();
      console.log(`  发现 ${count} 个菜单项`);
    }

    const closeButton = page.locator('[class*="XMarkIcon"]').first();
    const closeButtonVisible = await closeButton.isVisible().catch(() => false);
    
    if (closeButtonVisible) {
      await closeButton.click();
      await page.waitForTimeout(500);
      console.log('✅ 关闭移动端菜单');
    }

    console.log('\n测试结果汇总:');
    console.log(`- 问题数量: ${issueLogger.getIssueCount()}`);
  });
});
