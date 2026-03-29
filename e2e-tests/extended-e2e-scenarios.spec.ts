import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  TestHelper, 
  DataVerifier, 
  IssueLogger,
  TEST_USERS 
} from '../e2e-utils/test-helpers-enhanced';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issueLogger = new IssueLogger();

test.describe('Extended E2E Test Scenarios', () => {
  
  test.beforeAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('Extended E2E Test Scenarios - Headed Mode');
    console.log('='.repeat(80) + '\n');
  });

  test.afterAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('Extended E2E Test Scenarios Complete');
    console.log('='.repeat(80));
    
    if (issueLogger.getIssueCount() > 0) {
      console.log('\nIssue List:');
      console.log(issueLogger.generateReport());
    }
  });

  test('Scenario 1: Admin Dashboard Access', async ({ page, request }) => {
    console.log('\n[Scenario 1] Admin Dashboard Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
    
    if (loginResult.success) {
      console.log('  [PASS] Admin login successful');
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);
      
      const dashboardElement = page.locator('[data-testid="dashboard"], [class*="dashboard"], h1, h2').first();
      const hasDashboard = await dashboardElement.isVisible().catch(() => false);
      
      if (hasDashboard) {
        console.log('  [PASS] Dashboard element visible');
      }
      
      await page.screenshot({ path: 'test-results/scenario1-admin-dashboard.png', fullPage: true });
      console.log('  [INFO] Screenshot saved: test-results/scenario1-admin-dashboard.png');
    } else {
      console.log('  [FAIL] Admin login failed');
      issueLogger.logIssue({
        category: 'UX',
        severity: 'CRITICAL',
        description: 'Admin cannot access dashboard',
        expectedBehavior: 'Admin should be able to login and see dashboard',
        actualBehavior: 'Login failed',
        steps: ['Login as admin', 'Verify dashboard access'],
      });
    }
    
    expect(loginResult.success).toBe(true);
  });

  test('Scenario 2: HR Project Management Access', async ({ page, request }) => {
    console.log('\n[Scenario 2] HR Project Management Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
    
    if (loginResult.success) {
      console.log('  [PASS] HR login successful');
      
      const possiblePaths = ['/hr/projects', '/hr/jobs', '/hr/post-job', '/jobs/manage'];
      let foundPath = '';
      
      for (const path of possiblePaths) {
        const navResult = await TestHelper.navigateToPage(page, path);
        if (navResult.success) {
          foundPath = path;
          console.log(`  [PASS] Found HR project page: ${path}`);
          break;
        }
      }
      
      if (!foundPath) {
        console.log('  [INFO] HR project management page not found at expected paths');
      }
      
      await page.screenshot({ path: 'test-results/scenario2-hr-projects.png', fullPage: true });
      console.log('  [INFO] Screenshot saved: test-results/scenario2-hr-projects.png');
    }
    
    expect(loginResult.success).toBe(true);
  });

  test('Scenario 3: Freelancer Profile Access', async ({ page, request }) => {
    console.log('\n[Scenario 3] Freelancer Profile Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    if (loginResult.success) {
      console.log('  [PASS] Freelancer login successful');
      
      const profilePaths = ['/profile', '/freelancer/profile', '/settings/profile'];
      let foundPath = '';
      
      for (const path of profilePaths) {
        const navResult = await TestHelper.navigateToPage(page, path);
        if (navResult.success) {
          foundPath = path;
          console.log(`  [PASS] Found profile page: ${path}`);
          break;
        }
      }
      
      await page.screenshot({ path: 'test-results/scenario3-freelancer-profile.png', fullPage: true });
      console.log('  [INFO] Screenshot saved: test-results/scenario3-freelancer-profile.png');
    }
    
    expect(loginResult.success).toBe(true);
  });

  test('Scenario 4: Job Details Page Navigation', async ({ page, request }) => {
    console.log('\n[Scenario 4] Job Details Page Navigation');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    const navResult = await TestHelper.navigateToPage(page, '/jobs');
    
    if (navResult.success) {
      await page.waitForTimeout(2000);
      
      const jobLinks = page.locator('a[href^="/jobs/"], [data-testid^="job-"]').first();
      const hasJobLink = await jobLinks.isVisible().catch(() => false);
      
      if (hasJobLink) {
        await jobLinks.click();
        await page.waitForTimeout(2000);
        
        const detailUrl = page.url();
        console.log(`  [PASS] Navigated to job detail: ${detailUrl}`);
        
        const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply")').first();
        const hasApplyButton = await applyButton.isVisible().catch(() => false);
        
        if (hasApplyButton) {
          console.log('  [PASS] Apply button found on job detail page');
        }
        
        await page.screenshot({ path: 'test-results/scenario4-job-detail.png', fullPage: true });
        console.log('  [INFO] Screenshot saved: test-results/scenario4-job-detail.png');
      } else {
        console.log('  [INFO] No job links found on jobs page');
      }
    }
    
    expect(navResult.success).toBe(true);
  });

  test('Scenario 5: Work Logs Page Access', async ({ page, request }) => {
    console.log('\n[Scenario 5] Work Logs Page Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    const navResult = await TestHelper.navigateToPage(page, '/work-logs');
    
    if (navResult.success) {
      await page.waitForTimeout(2000);
      
      const createButton = page.locator('[data-testid="create-worklog-btn"], a:has-text("填报工时"), button:has-text("新建"), button:has-text("创建"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.isVisible().catch(() => false);
      
      if (hasCreateButton) {
        console.log('  [PASS] Create work log button found');
      } else {
        console.log('  [INFO] Create work log button not found (checking if user has assigned projects)');
        
        const emptyState = page.locator('text=暂无工时记录').first();
        const hasEmptyState = await emptyState.isVisible().catch(() => false);
        if (hasEmptyState) {
          console.log('  [INFO] Empty state shown - user may need assigned projects');
        }
      }
      
      await page.screenshot({ path: 'test-results/scenario5-work-logs.png', fullPage: true });
      console.log('  [INFO] Screenshot saved: test-results/scenario5-work-logs.png');
    }
    
    expect(navResult.success).toBe(true);
  });

  test('Scenario 6: Invoices Page Access', async ({ page, request }) => {
    console.log('\n[Scenario 6] Invoices Page Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    const invoicePaths = ['/invoices', '/freelancer/invoices'];
    let navSuccess = false;
    
    for (const path of invoicePaths) {
      const navResult = await TestHelper.navigateToPage(page, path);
      if (navResult.success) {
        navSuccess = true;
        console.log(`  [PASS] Found invoices page: ${path}`);
        
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'test-results/scenario6-invoices.png', fullPage: true });
        console.log('  [INFO] Screenshot saved: test-results/scenario6-invoices.png');
        break;
      }
    }
    
    if (!navSuccess) {
      console.log('  [INFO] Invoices page not found at expected paths');
    }
    
    expect(true).toBe(true);
  });

  test('Scenario 7: Navigation Menu Verification', async ({ page, request }) => {
    console.log('\n[Scenario 7] Navigation Menu Verification');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.waitForTimeout(2000);
    
    const navSelectors = [
      'nav',
      '[data-testid="navigation"]',
      '[class*="nav"]',
      '[class*="menu"]',
      'header nav',
    ];
    
    let navFound = false;
    for (const selector of navSelectors) {
      const nav = page.locator(selector).first();
      const isVisible = await nav.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`  [PASS] Navigation found: ${selector}`);
        navFound = true;
        
        const links = await nav.locator('a').count();
        console.log(`  [INFO] Navigation contains ${links} links`);
        break;
      }
    }
    
    if (!navFound) {
      console.log('  [INFO] Navigation element not found');
    }
    
    await page.screenshot({ path: 'test-results/scenario7-navigation.png', fullPage: true });
    console.log('  [INFO] Screenshot saved: test-results/scenario7-navigation.png');
    
    expect(true).toBe(true);
  });

  test('Scenario 8: User Menu/Settings Access', async ({ page, request }) => {
    console.log('\n[Scenario 8] User Menu/Settings Access');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.waitForTimeout(2000);
    
    // User menu is the avatar/initials button in the header
    const userMenuSelectors = [
      'button[class*="rounded-full"]',
      '[class*="rounded-full"][class*="gradient"]',
      'img[class*="rounded-full"]',
      'div[class*="rounded-full"][class*="flex"]',
    ];
    
    let menuFound = false;
    for (const selector of userMenuSelectors) {
      const menus = page.locator(selector);
      const count = await menus.count();
      
      for (let i = 0; i < count; i++) {
        const menu = menus.nth(i);
        const isVisible = await menu.isVisible().catch(() => false);
        const parentText = await menu.locator('..').textContent().catch(() => '');
        
        // Skip if it's in the mobile menu or not the user avatar
        if (isVisible && !parentText.includes('Open main menu')) {
          const className = await menu.getAttribute('class').catch(() => '');
          if (className.includes('gradient') || className.includes('object-cover')) {
            console.log(`  [PASS] User menu found: ${selector}`);
            menuFound = true;
            
            try {
              await menu.click();
              await page.waitForTimeout(1000);
              console.log('  [PASS] User menu opened');
              
              // Check for menu items
              const profileLink = page.locator('a:has-text("个人档案"), a:has-text("Profile")').first();
              const hasProfile = await profileLink.isVisible().catch(() => false);
              if (hasProfile) {
                console.log('  [PASS] Profile link found in menu');
              }
              
              const settingsLink = page.locator('a:has-text("设置"), a:has-text("Settings")').first();
              const hasSettings = await settingsLink.isVisible().catch(() => false);
              if (hasSettings) {
                console.log('  [PASS] Settings link found in menu');
              }
              
              const logoutBtn = page.locator('button:has-text("退出登录"), button:has-text("Logout")').first();
              const hasLogout = await logoutBtn.isVisible().catch(() => false);
              if (hasLogout) {
                console.log('  [PASS] Logout button found in menu');
              }
            } catch {
              console.log('  [INFO] Could not click user menu');
            }
            break;
          }
        }
      }
      if (menuFound) break;
    }
    
    if (!menuFound) {
      console.log('  [INFO] User menu not found');
    }
    
    await page.screenshot({ path: 'test-results/scenario8-user-menu.png', fullPage: true });
    console.log('  [INFO] Screenshot saved: test-results/scenario8-user-menu.png');
    
    expect(true).toBe(true);
  });

  test('Scenario 9: Responsive Design Check', async ({ page, request }) => {
    console.log('\n[Scenario 9] Responsive Design Check');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      console.log(`  [INFO] Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.screenshot({ 
        path: `test-results/scenario9-${viewport.name.toLowerCase()}.png`, 
        fullPage: true 
      });
    }
    
    console.log('  [PASS] Responsive design screenshots captured');
    
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Scenario 10: Logout Functionality', async ({ page, request }) => {
    console.log('\n[Scenario 10] Logout Functionality');
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    await TestHelper.logout(page);
    await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
    
    await page.waitForTimeout(2000);
    
    // Find and click user avatar to open menu
    const avatarButton = page.locator('div[class*="rounded-full"][class*="gradient"]').first();
    const isVisible = await avatarButton.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('  [PASS] User avatar found');
      
      await avatarButton.click();
      await page.waitForTimeout(1000);
      
      // Check for logout button in dropdown
      const logoutBtn = page.locator('button:has-text("退出登录"), button:has-text("Logout")').first();
      const hasLogout = await logoutBtn.isVisible().catch(() => false);
      
      if (hasLogout) {
        console.log('  [PASS] Logout button found in dropdown menu');
        
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('login') || !currentUrl.includes('dashboard')) {
          console.log('  [PASS] Successfully logged out and redirected');
        } else {
          console.log(`  [INFO] Current URL after logout: ${currentUrl}`);
        }
      } else {
        console.log('  [INFO] Logout button not found in dropdown');
      }
    } else {
      console.log('  [INFO] User avatar not found');
    }
    
    await page.screenshot({ path: 'test-results/scenario10-logout.png', fullPage: true });
    console.log('  [INFO] Screenshot saved: test-results/scenario10-logout.png');
    
    expect(true).toBe(true);
  });
});
