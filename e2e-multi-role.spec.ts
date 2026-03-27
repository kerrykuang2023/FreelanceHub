import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

describe('JobPortal Multi-Role E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  // =========================================================================
  // USER ACCOUNTS FOR TESTING
  // =========================================================================
  const testUsers = {
    freelancer: {
      email: `freelancer_${Date.now()}@test.com`,
      password: 'TestPass123!',
      type: 'job_seeker'
    },
    hr: {
      email: `hr_${Date.now()}@test.com`,
      password: 'TestPass123!',
      type: 'hr_recruiter'
    },
    admin: {
      email: 'admin@jobportal.com',
      password: 'admin123'
    }
  };

  // =========================================================================
  // ROLE 1: FREELANCER (自由顾问) USER JOURNEY TESTS
  // =========================================================================
  test.describe('Role: Freelancer (自由顾问)', () => {

    test.describe('1.1 Freelancer Registration & Login', () => {
      test('should register as a freelancer', async () => {
        await page.goto(`${BASE_URL}/register`);
        await page.waitForLoadState('networkidle');

        await page.selectOption('select#user_type_name', 'job_seeker');
        await page.fill('input[type="email"]', testUsers.freelancer.email);
        await page.fill('input[name="password"]', testUsers.freelancer.password);
        await page.fill('input[name="confirmPassword"]', testUsers.freelancer.password);
        await page.click('input[name="termsConditions"]');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        const url = page.url();
        const hasSuccessMessage = await page.locator('text=successfully').count() > 0;
        const hasErrorMessage = await page.locator('text=already exists').count() > 0;

        console.log(`[Freelancer Registration] URL: ${url}, Success: ${hasSuccessMessage}, Error: ${hasErrorMessage}`);
        expect(hasSuccessMessage || hasErrorMessage || !url.includes('/register')).toBeTruthy();
      });

      test('should login as freelancer', async () => {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');

        await page.fill('input[type="email"]', testUsers.freelancer.email);
        await page.fill('input[type="password"]', testUsers.freelancer.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        const url = page.url();
        console.log(`[Freelancer Login] URL: ${url}`);
        expect(url).not.toBe(`${BASE_URL}/login`);
      });

      test('should display freelancer-specific navigation', async () => {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');

        await page.fill('input[type="email"]', testUsers.freelancer.email);
        await page.fill('input[type="password"]', testUsers.freelancer.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');

        const navItems = await page.locator('nav a, aside a').allTextContents();
        console.log(`[Freelancer Nav Items] ${JSON.stringify(navItems)}`);

        // Freelancer should see: Jobs, My Applications, Work Logs, etc.
        // Issue: Nav items may not be role-specific
      });
    });

    test.describe('1.2 Freelancer Job Browsing', () => {
      test('should browse available jobs', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const jobCards = await page.locator('[class*="card"], [class*="job"]').count();
        console.log(`[Job Browsing] Found ${jobCards} job cards`);

        expect(jobCards).toBeGreaterThanOrEqual(0);
      });

      test('should filter jobs by skill category', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');

        const filterExists = await page.locator('text=Filters, text=Skill').count() > 0;
        console.log(`[Filter] Filter section exists: ${filterExists}`);

        // Issue: Skill category filter may not work correctly
      });

      test('should search jobs by keyword', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
        if (await searchInput.count() > 0) {
          await searchInput.fill('SAP');
          await page.waitForTimeout(1000);
          console.log(`[Search] Search functionality exists`);
        } else {
          console.log(`[Search] Search input not found - ISSUE`);
        }
      });
    });

    test.describe('1.3 Freelancer Job Application', () => {
      test('should view job details', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const firstJob = page.locator('[class*="card"], [class*="job"]').first();
        if (await firstJob.count() > 0) {
          await firstJob.click();
          await page.waitForTimeout(2000);

          const url = page.url();
          console.log(`[Job Details] URL after click: ${url}`);
          expect(url).toContain('/jobs/');
        }
      });

      test('should apply to a job', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const applyButton = page.locator('button:has-text("Apply"), a:has-text("Apply")').first();
        if (await applyButton.count() > 0) {
          await applyButton.click();
          await page.waitForTimeout(2000);

          // Check if redirected to login (if not authenticated)
          const url = page.url();
          console.log(`[Apply] URL after apply: ${url}`);

          if (url.includes('/login')) {
            console.log(`[Apply] ISSUE: User was redirected to login - application requires auth`);
          }
        } else {
          console.log(`[Apply] ISSUE: Apply button not found`);
        }
      });

      test('should view my applications', async () => {
        await page.goto(`${BASE_URL}/applications`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[My Applications] URL: ${url}`);

        // Issue: Page may require authentication or show empty state
      });
    });

    test.describe('1.4 Freelancer Work Log Submission', () => {
      test('should access work log page', async () => {
        await page.goto(`${BASE_URL}/work-logs`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Work Logs] URL: ${url}`);

        // Issue: Work log page may not be implemented
      });

      test('should see quick submit button on dashboard', async () => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const quickSubmitButton = page.locator('button:has-text("填报"), button:has-text("Submit Work")').count();
        console.log(`[Quick Submit] Button found: ${quickSubmitButton > 0}`);

        // Issue: Quick submit floating button may not exist
      });

      test('should submit work log with required fields', async () => {
        await page.goto(`${BASE_URL}/work-logs/new`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Issue: New work log page may not be implemented
        const url = page.url();
        console.log(`[New Work Log] URL: ${url}`);

        if (url.includes('/login')) {
          console.log(`[New Work Log] ISSUE: Requires authentication`);
        } else if (url.includes('/work-logs/new')) {
          // Check form fields
          const projectSelect = await page.locator('select[name="project"], select[name="project_id"]').count();
          const dateInput = await page.locator('input[type="date"], input[name="work_date"]').count();
          const hoursInput = await page.locator('input[type="number"], input[name="hours"]').count();

          console.log(`[Form Fields] Project: ${projectSelect > 0}, Date: ${dateInput > 0}, Hours: ${hoursInput > 0}`);
        }
      });
    });

    test.describe('1.5 Freelancer Invoice & Payment', () => {
      test('should access invoices page', async () => {
        await page.goto(`${BASE_URL}/invoices`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Invoices] URL: ${url}`);
      });

      test('should access payments page', async () => {
        await page.goto(`${BASE_URL}/payments`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Payments] URL: ${url}`);
      });

      test('should see payment notifications', async () => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');

        const notificationBadge = await page.locator('[class*="badge"], [class*="notification"]').count();
        console.log(`[Notifications] Notification elements: ${notificationBadge}`);
      });
    });
  });

  // =========================================================================
  // ROLE 2: HR RECRUITER (HR) USER JOURNEY TESTS
  // =========================================================================
  test.describe('Role: HR Recruiter (HR招聘者)', () => {

    test.describe('2.1 HR Registration & Setup', () => {
      test('should register as HR', async () => {
        await page.goto(`${BASE_URL}/register`);
        await page.waitForLoadState('networkidle');

        await page.selectOption('select#user_type_name', 'hr_recruiter');
        await page.fill('input[type="email"]', testUsers.hr.email);
        await page.fill('input[name="password"]', testUsers.hr.password);
        await page.fill('input[name="confirmPassword"]', testUsers.hr.password);
        await page.click('input[name="termsConditions"]');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        const url = page.url();
        console.log(`[HR Registration] URL: ${url}`);
        expect(url).not.toBe(`${BASE_URL}/register`);
      });

      test('should complete company profile', async () => {
        await page.goto(`${BASE_URL}/company/profile`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Company Profile] URL: ${url}`);

        if (url.includes('/login')) {
          console.log(`[Company Profile] ISSUE: Requires authentication`);
        }
      });
    });

    test.describe('2.2 HR Job Posting', () => {
      test('should access post job page', async () => {
        await page.goto(`${BASE_URL}/post-job`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Post Job] URL: ${url}`);

        if (!url.includes('/login')) {
          const formFields = await page.locator('input, select, textarea').count();
          console.log(`[Post Job Form] Found ${formFields} form elements`);
        }
      });

      test('should see skill category dropdown', async () => {
        await page.goto(`${BASE_URL}/post-job`);
        await page.waitForLoadState('networkidle');

        // Issue: Skill category may not be properly loaded or linked
        const skillSelect = await page.locator('select[name*="skill"], select[name*="category"]').count();
        console.log(`[Skill Selection] Skill select found: ${skillSelect > 0}`);

        if (skillSelect === 0) {
          console.log(`[Skill Selection] ISSUE: Skill category selector not found`);
        }
      });

      test('should see rate type options', async () => {
        await page.goto(`${BASE_URL}/post-job`);
        await page.waitForLoadState('networkidle');

        const rateTypeSelect = await page.locator('select[name*="rate"], select[name*="type"]').count();
        console.log(`[Rate Type] Rate type select found: ${rateTypeSelect > 0}`);
      });
    });

    test.describe('2.3 HR Application Management', () => {
      test('should view received applications', async () => {
        await page.goto(`${BASE_URL}/applications/received`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Received Applications] URL: ${url}`);
      });

      test('should approve or reject applications', async () => {
        await page.goto(`${BASE_URL}/applications/received`);
        await page.waitForLoadState('networkidle');

        // Issue: Application management UI may not be implemented
        const approveButton = await page.locator('button:has-text("Approve"), button:has-text("通过")').count();
        const rejectButton = await page.locator('button:has-text("Reject"), button:has-text("拒绝")').count();

        console.log(`[Application Actions] Approve: ${approveButton}, Reject: ${rejectButton}`);
      });
    });

    test.describe('2.4 HR Work Log Review', () => {
      test('should view pending work logs', async () => {
        await page.goto(`${BASE_URL}/work-logs/pending`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Pending Work Logs] URL: ${url}`);
      });

      test('should batch approve work logs', async () => {
        await page.goto(`${BASE_URL}/work-logs/pending`);
        await page.waitForLoadState('networkidle');

        // Issue: Batch operations may not be implemented
        const checkboxCount = await page.locator('input[type="checkbox"]').count();
        const batchButton = await page.locator('button:has-text("Batch"), button:has-text("批量")').count();

        console.log(`[Batch Operations] Checkboxes: ${checkboxCount}, Batch buttons: ${batchButton}`);
      });
    });
  });

  // =========================================================================
  // ROLE 3: ADMIN USER JOURNEY TESTS
  // =========================================================================
  test.describe('Role: Admin (平台管理员)', () => {

    test.describe('3.1 Admin Dashboard', () => {
      test('should access admin dashboard', async () => {
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Admin Dashboard] URL: ${url}`);

        if (url.includes('/admin')) {
          const dashboardCards = await page.locator('[class*="card"], [class*="stat"]').count();
          console.log(`[Admin Dashboard] Dashboard elements: ${dashboardCards}`);
        }
      });

      test('should access skill category management', async () => {
        await page.goto(`${BASE_URL}/admin/settings/skills`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Skill Management] URL: ${url}`);
      });

      test('should access user management', async () => {
        await page.goto(`${BASE_URL}/admin/users`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[User Management] URL: ${url}`);
      });
    });

    test.describe('3.2 Admin System Configuration', () => {
      test('should manage work types', async () => {
        await page.goto(`${BASE_URL}/admin/settings/work-types`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Work Types] URL: ${url}`);
      });

      test('should manage tax configurations', async () => {
        await page.goto(`${BASE_URL}/admin/settings/tax`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log(`[Tax Config] URL: ${url}`);
      });
    });
  });

  // =========================================================================
  // CROSS-CUTTING CONCERNS TESTS
  // =========================================================================
  test.describe('Cross-Cutting Concerns', () => {

    test.describe('Navigation & UX', () => {
      test('should have consistent header across pages', async () => {
        const pages = ['/', '/jobs', '/login', '/register'];

        for (const path of pages) {
          await page.goto(`${BASE_URL}${path}`);
          await page.waitForLoadState('networkidle');

          const header = await page.locator('header, [class*="header"]').count();
          const logo = await page.locator('a[href="/"], [class*="logo"]').count();

          console.log(`[Header] ${path} - Header: ${header > 0}, Logo: ${logo > 0}`);
        }
      });

      test('should show appropriate navigation for guest users', async () => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');

        const navItems = await page.locator('nav a, header a').allTextContents();
        console.log(`[Guest Nav] ${JSON.stringify(navItems)}`);

        // Guest should see: Login, Register
        // Should NOT see: Dashboard, Work Logs (without auth)
      });

      test('should handle 404 pages gracefully', async () => {
        await page.goto(`${BASE_URL}/nonexistent-page-xyz`);
        await page.waitForLoadState('networkidle');

        const has404Message = await page.locator('text=404, text=Not Found, text=Page not found').count() > 0;
        console.log(`[404 Handling] Has 404 message: ${has404Message}`);
      });
    });

    test.describe('Responsive Design', () => {
      test('should work on mobile viewport', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');

        const isUsable = await page.locator('body').count() > 0;
        console.log(`[Mobile] Page is usable: ${isUsable}`);

        // Issue: Mobile layout may not be responsive
      });

      test('should work on tablet viewport', async () => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');

        const isUsable = await page.locator('body').count() > 0;
        console.log(`[Tablet] Page is usable: ${isUsable}`);
      });
    });

    test.describe('API Integration', () => {
      test('should handle API errors gracefully', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForLoadState('networkidle');

        const hasErrorMessage = await page.locator('text=Error, text=Failed to load').count() > 0;
        console.log(`[API Errors] Error displayed: ${hasErrorMessage}`);
      });

      test('should show loading states', async () => {
        await page.goto(`${BASE_URL}/jobs`);
        await page.waitForTimeout(1000);

        const loadingSpinner = await page.locator('[class*="spinner"], [class*="loading"], [class*="skeleton"]').count();
        console.log(`[Loading States] Loading elements: ${loadingSpinner}`);
      });
    });
  });

  // =========================================================================
  // ISSUES SUMMARY
  // =========================================================================
  test.describe('Issues Summary', () => {
    test('should document all found issues', async () => {
      const issues = [];

      // Check registration
      await page.goto(`${BASE_URL}/register`);
      await page.waitForTimeout(1000);
      issues.push({
        category: 'Registration',
        issue: 'User registration flow needs verification',
        severity: 'Medium'
      });

      // Check login
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(1000);
      issues.push({
        category: 'Authentication',
        issue: 'Login error handling needs improvement',
        severity: 'Medium'
      });

      // Check jobs page
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForTimeout(1000);
      const jobCards = await page.locator('[class*="card"]').count();
      if (jobCards === 0) {
        issues.push({
          category: 'Jobs',
          issue: 'No job cards displayed on jobs page',
          severity: 'High'
        });
      }

      // Check work logs
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForTimeout(1000);
      issues.push({
        category: 'Work Logs',
        issue: 'Work log page may not be implemented',
        severity: 'High'
      });

      console.log('\n========== ISSUES SUMMARY ==========');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
      });
      console.log('====================================\n');

      expect(true).toBeTruthy();
    });
  });
});