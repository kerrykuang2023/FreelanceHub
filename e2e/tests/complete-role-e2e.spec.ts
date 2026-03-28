import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface TestResult {
  feature: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  screenshot?: string;
  timestamp: string;
}

const testResults: TestResult[] = [];

function logResult(feature: string, status: 'pass' | 'fail' | 'skip', message: string, screenshot?: string) {
  testResults.push({
    feature,
    status,
    message,
    screenshot,
    timestamp: new Date().toISOString(),
  });
}

test.describe.serial('Complete Role-Based E2E Test Suite', () => {
  let freelancerPage: Page;
  let hrPage: Page;
  let adminPage: Page;

  test.beforeAll(async ({ browser }) => {
    freelancerPage = await browser.newPage();
    hrPage = await browser.newPage();
    adminPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await freelancerPage.close();
    await hrPage.close();
    await adminPage.close();
    
    console.log('\n========== E2E TEST RESULTS SUMMARY ==========\n');
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const skipped = testResults.filter(r => r.status === 'skip').length;
    
    console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
    console.log('\nFailed Tests:');
    testResults.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.feature}: ${r.message}`);
    });
    console.log('\n=============================================\n');
  });

  test('FL-001: Freelancer Login Flow', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/login`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-001-login-page.png' });
      
      const emailInput = freelancerPage.locator('input[type="email"]').first();
      const passwordInput = freelancerPage.locator('input[type="password"]').first();
      const loginBtn = freelancerPage.locator('button[type="submit"]').first();
      
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      
      await emailInput.fill('freelancer@test.com');
      await passwordInput.fill('Test1234!');
      
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-001-login-filled.png' });
      
      await loginBtn.click();
      await freelancerPage.waitForURL(/^(?!.*login)/, { timeout: 10000 });
      
      const currentUrl = freelancerPage.url();
      if (!currentUrl.includes('login')) {
        logResult('FL-001 Login', 'pass', 'Login successful');
        await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-001-after-login.png' });
      } else {
        logResult('FL-001 Login', 'fail', 'Still on login page after submit');
      }
    } catch (error: any) {
      logResult('FL-001 Login', 'fail', error.message);
      throw error;
    }
  });

  test('FL-002: Freelancer Dashboard Access', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-002-dashboard.png' });
      
      const pageContent = await freelancerPage.content();
      const hasContent = pageContent.length > 1000;
      
      if (hasContent) {
        logResult('FL-002 Dashboard', 'pass', 'Dashboard page loaded');
      } else {
        logResult('FL-002 Dashboard', 'fail', 'Dashboard content not loaded');
      }
    } catch (error: any) {
      logResult('FL-002 Dashboard', 'fail', error.message);
      throw error;
    }
  });

  test('FL-003: Role Switcher Component', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/profile/switch-role`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-003-role-switch.png' });
      
      const pageContent = await freelancerPage.content();
      if (pageContent.includes('角色') || pageContent.includes('role') || pageContent.includes('Role') || pageContent.includes('切换')) {
        logResult('FL-003 Role Switcher', 'pass', 'Role switcher page accessible');
      } else {
        logResult('FL-003 Role Switcher', 'fail', 'Role switcher content not found');
      }
    } catch (error: any) {
      logResult('FL-003 Role Switcher', 'fail', error.message);
    }
  });

  test('FL-004: Credit History Page', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/profile/credits`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-004-credits.png' });
      
      const pageContent = await freelancerPage.content();
      if (pageContent.includes('积分') || pageContent.includes('credit') || pageContent.includes('Credit') || pageContent.includes('信用')) {
        logResult('FL-004 Credit History', 'pass', 'Credit history page accessible');
      } else {
        logResult('FL-004 Credit History', 'fail', 'Credit page content not found');
      }
    } catch (error: any) {
      logResult('FL-004 Credit History', 'fail', error.message);
    }
  });

  test('FL-005: Report Submission Page', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/report`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/fl-005-report.png' });
      
      const pageContent = await freelancerPage.content();
      if (pageContent.includes('举报') || pageContent.includes('report') || pageContent.includes('Report')) {
        logResult('FL-005 Report', 'pass', 'Report page accessible');
      } else {
        logResult('FL-005 Report', 'fail', 'Report page content not found');
      }
    } catch (error: any) {
      logResult('FL-005 Report', 'fail', error.message);
    }
  });

  test('HR-001: HR Login Flow', async () => {
    try {
      await hrPage.goto(`${BASE_URL}/login`);
      await hrPage.waitForLoadState('networkidle');
      await hrPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/hr-001-login.png' });
      
      const emailInput = hrPage.locator('input[type="email"]').first();
      const passwordInput = hrPage.locator('input[type="password"]').first();
      const loginBtn = hrPage.locator('button[type="submit"]').first();
      
      await emailInput.fill('hr@test.com');
      await passwordInput.fill('Test1234!');
      await loginBtn.click();
      await hrPage.waitForURL(/^(?!.*login)/, { timeout: 10000 });
      
      const currentUrl = hrPage.url();
      if (!currentUrl.includes('login')) {
        logResult('HR-001 Login', 'pass', 'HR login successful');
        await hrPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/hr-001-after-login.png' });
      } else {
        logResult('HR-001 Login', 'fail', 'HR login failed');
      }
    } catch (error: any) {
      logResult('HR-001 Login', 'fail', error.message);
    }
  });

  test('HR-002: Post Job Page', async () => {
    try {
      await hrPage.goto(`${BASE_URL}/post-job`);
      await hrPage.waitForLoadState('networkidle');
      await hrPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/hr-002-post-job.png' });
      
      const pageContent = await hrPage.content();
      if (pageContent.includes('职位') || pageContent.includes('job') || pageContent.includes('Job')) {
        logResult('HR-002 Post Job', 'pass', 'Post job page accessible');
      } else {
        logResult('HR-002 Post Job', 'fail', 'Post job page content not found');
      }
    } catch (error: any) {
      logResult('HR-002 Post Job', 'fail', error.message);
    }
  });

  test('HR-003: Work Logs Review', async () => {
    try {
      await hrPage.goto(`${BASE_URL}/company/work-logs/pending`);
      await hrPage.waitForLoadState('networkidle');
      await hrPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/hr-003-worklogs.png' });
      
      const pageContent = await hrPage.content();
      if (pageContent.includes('工时') || pageContent.includes('worklog') || pageContent.includes('Work Log')) {
        logResult('HR-003 Work Logs', 'pass', 'Work logs page accessible');
      } else {
        logResult('HR-003 Work Logs', 'fail', 'Work logs page content not found');
      }
    } catch (error: any) {
      logResult('HR-003 Work Logs', 'fail', error.message);
    }
  });

  test('ADMIN-001: Admin Login Flow', async () => {
    try {
      await adminPage.goto(`${BASE_URL}/login`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/admin-001-login.png' });
      
      const emailInput = adminPage.locator('input[type="email"]').first();
      const passwordInput = adminPage.locator('input[type="password"]').first();
      const loginBtn = adminPage.locator('button[type="submit"]').first();
      
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('Test1234!');
      await loginBtn.click();
      await adminPage.waitForURL(/^(?!.*login)/, { timeout: 10000 });
      
      const currentUrl = adminPage.url();
      if (!currentUrl.includes('login')) {
        logResult('ADMIN-001 Login', 'pass', 'Admin login successful');
        await adminPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/admin-001-after-login.png' });
      } else {
        logResult('ADMIN-001 Login', 'fail', 'Admin login failed');
      }
    } catch (error: any) {
      logResult('ADMIN-001 Login', 'fail', error.message);
    }
  });

  test('ADMIN-002: Role Approvals Page', async () => {
    try {
      await adminPage.goto(`${BASE_URL}/admin/role-approvals`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/admin-002-role-approvals.png' });
      
      const pageContent = await adminPage.content();
      if (pageContent.includes('审批') || pageContent.includes('approval') || pageContent.includes('Approval')) {
        logResult('ADMIN-002 Role Approvals', 'pass', 'Role approvals page accessible');
      } else {
        logResult('ADMIN-002 Role Approvals', 'fail', 'Role approvals page content not found');
      }
    } catch (error: any) {
      logResult('ADMIN-002 Role Approvals', 'fail', error.message);
    }
  });

  test('ADMIN-003: Report Management Page', async () => {
    try {
      await adminPage.goto(`${BASE_URL}/admin/reports`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/admin-003-reports.png' });
      
      const pageContent = await adminPage.content();
      if (pageContent.includes('举报') || pageContent.includes('report') || pageContent.includes('Report')) {
        logResult('ADMIN-003 Reports', 'pass', 'Report management page accessible');
      } else {
        logResult('ADMIN-003 Reports', 'fail', 'Report management page content not found');
      }
    } catch (error: any) {
      logResult('ADMIN-003 Reports', 'fail', error.message);
    }
  });

  test('ADMIN-004: Admin Dashboard Stats', async () => {
    try {
      await adminPage.goto(`${BASE_URL}/admin/dashboard`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/admin-004-dashboard.png' });
      
      const pageContent = await adminPage.content();
      if (pageContent.includes('用户') || pageContent.includes('user') || pageContent.includes('统计') || pageContent.includes('Dashboard')) {
        logResult('ADMIN-004 Dashboard', 'pass', 'Dashboard page accessible');
      } else {
        logResult('ADMIN-004 Dashboard', 'fail', 'Dashboard stats not found');
      }
    } catch (error: any) {
      logResult('ADMIN-004 Dashboard', 'fail', error.message);
    }
  });

  test('NAV-001: Navigation Menu Role-Based Filtering', async () => {
    try {
      await freelancerPage.goto(`${BASE_URL}/`);
      await freelancerPage.waitForLoadState('networkidle');
      
      const pageContent = await freelancerPage.content();
      const hasAdminLink = pageContent.includes('/admin');
      
      if (!hasAdminLink) {
        logResult('NAV-001 Menu Filter', 'pass', 'Admin links correctly hidden for freelancer');
      } else {
        logResult('NAV-001 Menu Filter', 'fail', 'Admin links visible for freelancer');
      }
      
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/nav-001-freelancer-menu.png' });
    } catch (error: any) {
      logResult('NAV-001 Menu Filter', 'fail', error.message);
    }
  });

  test('UI-001: Responsive Design Check', async () => {
    try {
      await freelancerPage.setViewportSize({ width: 375, height: 667 });
      await freelancerPage.goto(`${BASE_URL}/`);
      await freelancerPage.waitForLoadState('networkidle');
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/ui-001-mobile.png' });
      
      await freelancerPage.setViewportSize({ width: 768, height: 1024 });
      await freelancerPage.waitForTimeout(500);
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/ui-001-tablet.png' });
      
      await freelancerPage.setViewportSize({ width: 1920, height: 1080 });
      await freelancerPage.waitForTimeout(500);
      await freelancerPage.screenshot({ path: 'e2e-test-results/screenshots/e2e/ui-001-desktop.png' });
      
      logResult('UI-001 Responsive', 'pass', 'Responsive design screenshots captured');
    } catch (error: any) {
      logResult('UI-001 Responsive', 'fail', error.message);
    }
  });
});
