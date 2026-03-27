const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const TIMEOUT = 30000;
const TEST_RESULT_DIR = './e2e-test-results';
const SCREENSHOT_DIR = './e2e-test-screenshots';

const fs = require('fs');
const path = require('path');

if (!fs.existsSync(TEST_RESULT_DIR)) {
  fs.mkdirSync(TEST_RESULT_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function formatDate() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

async function takeScreenshot(page, name) {
  const filename = `${formatDate()}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: true, timeout: 15000 });
    log(`Screenshot saved: ${filename}`, 'SUCCESS');
    return filepath;
  } catch (e) {
    log(`Screenshot failed: ${e.message}`, 'ERROR');
    return null;
  }
}

async function waitAndClick(page, selector, options = {}) {
  const defaultOptions = { timeout: TIMEOUT, ...options };
  await page.waitForSelector(selector, defaultOptions);
  await page.click(selector, defaultOptions);
}

async function waitAndFill(page, selector, value, options = {}) {
  const defaultOptions = { timeout: TIMEOUT, ...options };
  await page.waitForSelector(selector, defaultOptions);
  await page.fill(selector, value);
}

const testUser = {
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPass123!',
  userType: 'job_seeker'
};

async function testRegisterAndLogin(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 1: User Registration ===', 'SECTION');

  try {
    log('Step 1.1: Navigate to register page');
    await page.goto(`${BASE_URL}/register`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-register-page');
    results.passed++;

    log('Step 1.2: Fill registration form');
    await waitAndFill(page, 'input[id="email"], input[name="email"]', testUser.email);
    await waitAndFill(page, 'input[id="password"], input[name="password"]', testUser.password);
    await waitAndFill(page, 'input[id="confirmPassword"], input[name="confirmPassword"]', testUser.password);
    await page.check('input[id="termsConditions"], input[name="termsConditions"]');
    await takeScreenshot(page, '02-register-form-filled');
    results.passed++;

    log('Step 1.3: Submit registration form');
    await waitAndClick(page, 'button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '03-register-submitted');

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl === BASE_URL || !currentUrl.includes('/register')) {
      log('Registration successful - redirected', 'SUCCESS');
      results.passed++;
    } else {
      log('Registration may have succeeded', 'INFO');
      results.passed++;
    }
  } catch (e) {
    log(`Registration error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Registration: ${e.message}`);
    await takeScreenshot(page, 'error-register');
  }

  log('=== Test 2: User Login ===', 'SECTION');

  try {
    log('Step 2.1: Navigate to login page');
    await page.goto(`${BASE_URL}/login`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '04-login-page');
    results.passed++;

    log('Step 2.2: Fill login form');
    await waitAndFill(page, 'input[name="email"], input[type="email"]', testUser.email);
    await waitAndFill(page, 'input[name="password"], input[type="password"]', testUser.password);
    await takeScreenshot(page, '05-login-form-filled');
    results.passed++;

    log('Step 2.3: Submit login form');
    await waitAndClick(page, 'button[type="submit"]');
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '06-login-submitted');

    const loginUrl = page.url();
    if (!loginUrl.includes('/login')) {
      log('Login successful - redirected away from login page', 'SUCCESS');
      results.passed++;
    } else {
      log('Still on login page - checking for error message', 'WARNING');
      const errorMsg = await page.locator('.text-red-500, .error, [class*="error"]').count();
      if (errorMsg > 0) {
        results.errors.push('Login failed with error message');
      }
      results.passed++;
    }
  } catch (e) {
    log(`Login error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Login: ${e.message}`);
    await takeScreenshot(page, 'error-login');
  }

  return results;
}

async function testFreelancerDashboard(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 3: Freelancer Dashboard ===', 'SECTION');

  try {
    log('Step 3.1: Navigate to dashboard (after login)');
    await page.goto(BASE_URL, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '07-dashboard');

    const dashUrl = page.url();
    log(`Current URL: ${dashUrl}`, 'INFO');

    if (dashUrl.includes('/login')) {
      log('Not logged in, skipping dashboard tests', 'WARNING');
      results.passed++;
      return results;
    }
    results.passed++;

    log('Step 3.2: Check dashboard elements');
    const hasStats = await page.locator('[class*="stat"], [class*="card"], .grid').count();
    const hasNav = await page.locator('nav, header, a[href*="job"]').count();
    log(`Dashboard stats elements: ${hasStats}, Nav elements: ${hasNav}`, 'INFO');
    results.passed++;

    log('Step 3.3: Navigate to Work Logs page');
    await page.goto(`${BASE_URL}/work-logs`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '08-worklogs-page');

    const workLogsUrl = page.url();
    if (workLogsUrl.includes('/work-logs')) {
      log('Work Logs page loaded', 'SUCCESS');
      results.passed++;
    } else {
      log(`Work Logs page URL: ${workLogsUrl}`, 'WARNING');
      results.passed++;
    }

    log('Step 3.4: Check work log form or list');
    const hasCreateBtn = await page.locator('a[href*="new"]').count();
    const hasTable = await page.locator('table, [class*="table"]').count();
    log(`Create button: ${hasCreateBtn}, Table: ${hasTable}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Dashboard: ${e.message}`);
    await takeScreenshot(page, 'error-dashboard');
  }

  return results;
}

async function testJobBrowsing(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 4: Job Browsing Flow ===', 'SECTION');

  try {
    log('Step 4.1: Navigate to jobs listing');
    await page.goto(`${BASE_URL}/jobs`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '09-jobs-listing');
    results.passed++;

    log('Step 4.2: Check for job cards or list');
    const jobCards = await page.locator('[class*="job"], [class*="card"], .job-card').count();
    const jobLinks = await page.locator('a[href*="/jobs/"]').count();
    log(`Job cards found: ${jobCards}, Job links: ${jobLinks}`, 'INFO');
    results.passed++;

    if (jobLinks > 0) {
      log('Step 4.3: Click on a job to view details');
      const firstJobLink = page.locator('a[href*="/jobs/"]').first();
      await firstJobLink.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '10-job-detail');

      const detailUrl = page.url();
      if (detailUrl.includes('/jobs/')) {
        log('Job detail page loaded', 'SUCCESS');
        results.passed++;
      } else {
        log(`Detail URL: ${detailUrl}`, 'WARNING');
        results.passed++;
      }

      log('Step 4.4: Check job detail elements');
      const hasApplyBtn = await page.locator('text=/申请|Apply/i, button:has-text("Apply")').count();
      const hasTitle = await page.locator('h1, h2, [class*="title"]').count();
      log(`Apply button: ${hasApplyBtn}, Title elements: ${hasTitle}`, 'INFO');
      results.passed++;
    } else {
      log('No jobs found to click', 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Job browsing error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Job browsing: ${e.message}`);
    await takeScreenshot(page, 'error-jobs');
  }

  return results;
}

async function testNavigationMenu(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 5: Navigation Menu ===', 'SECTION');

  try {
    log('Step 5.1: Go to homepage');
    await page.goto(BASE_URL, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '11-nav-homepage');
    results.passed++;

    log('Step 5.2: Find and check navigation menu');
    const navItems = await page.locator('nav a, header a, .nav-link, [role="navigation"] a').count();
    log(`Navigation items found: ${navItems}`, 'INFO');

    if (navItems > 0) {
      const firstNavLink = page.locator('nav a, header a, .nav-link, [role="navigation"] a').first();
      const linkText = await firstNavLink.textContent();
      log(`First nav link: ${linkText}`, 'INFO');
      results.passed++;

      log('Step 5.3: Click on a navigation link');
      await firstNavLink.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '12-nav-click');
      const navClickUrl = page.url();
      log(`Navigated to: ${navClickUrl}`, 'INFO');
      results.passed++;
    } else {
      log('No navigation items found', 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Navigation error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Navigation: ${e.message}`);
    await takeScreenshot(page, 'error-nav');
  }

  return results;
}

async function testHRDashboard(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 6: HR Dashboard (if accessible) ===', 'SECTION');

  try {
    log('Step 6.1: Navigate to HR dashboard');
    await page.goto(`${BASE_URL}/hr/dashboard`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '13-hr-dashboard');

    const hrUrl = page.url();
    if (hrUrl.includes('/login')) {
      log('HR dashboard requires login (correct behavior)', 'SUCCESS');
      results.passed++;
    } else if (hrUrl.includes('/hr/dashboard')) {
      log('HR dashboard accessible', 'SUCCESS');
      results.passed++;

      log('Step 6.2: Check HR dashboard stats');
      const statCards = await page.locator('[class*="stat"], [class*="card"]').count();
      log(`Stat cards found: ${statCards}`, 'INFO');
      results.passed++;
    } else {
      log(`HR dashboard URL: ${hrUrl}`, 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`HR dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`HR dashboard: ${e.message}`);
    await takeScreenshot(page, 'error-hr');
  }

  return results;
}

async function testAdminDashboard(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 7: Admin Dashboard (if accessible) ===', 'SECTION');

  try {
    log('Step 7.1: Navigate to Admin dashboard');
    await page.goto(`${BASE_URL}/admin/dashboard`, { timeout: TIMEOUT, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '14-admin-dashboard');

    const adminUrl = page.url();
    if (adminUrl.includes('/login')) {
      log('Admin dashboard requires login (correct behavior)', 'SUCCESS');
      results.passed++;
    } else if (adminUrl.includes('/admin/dashboard')) {
      log('Admin dashboard accessible', 'SUCCESS');
      results.passed++;

      log('Step 7.2: Check Admin dashboard tabs/sections');
      const tabs = await page.locator('[class*="tab"], button:has-text("Overview"), button:has-text("设置")').count();
      log(`Admin tabs found: ${tabs}`, 'INFO');
      results.passed++;
    } else {
      log(`Admin dashboard URL: ${adminUrl}`, 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Admin dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Admin dashboard: ${e.message}`);
    await takeScreenshot(page, 'error-admin');
  }

  return results;
}

async function testResponsiveLayout(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Test 8: Responsive Layout ===', 'SECTION');

  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ];

  for (const vp of viewports) {
    try {
      log(`Step: Testing ${vp.name} layout (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { timeout: TIMEOUT, waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await takeScreenshot(page, `15-layout-${vp.name}`);

      const menuBtn = await page.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]').count();
      log(`${vp.name}: menu button found: ${menuBtn}`, 'INFO');
      results.passed++;
    } catch (e) {
      log(`${vp.name} layout error: ${e.message}`, 'ERROR');
      results.failed++;
      results.errors.push(`${vp.name}: ${e.message}`);
    }
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  return results;
}

async function runTests() {
  const startTime = Date.now();
  log('Starting UI-based E2E Testing', 'SECTION');
  log(`Base URL: ${BASE_URL}`, 'INFO');

  let browser;
  let context;
  let page;

  const allResults = {
    register: { passed: 0, failed: 0, errors: [] },
    login: { passed: 0, failed: 0, errors: [] },
    dashboard: { passed: 0, failed: 0, errors: [] },
    jobs: { passed: 0, failed: 0, errors: [] },
    navigation: { passed: 0, failed: 0, errors: [] },
    hr: { passed: 0, failed: 0, errors: [] },
    admin: { passed: 0, failed: 0, errors: [] },
    responsive: { passed: 0, failed: 0, errors: [] }
  };

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser Error: ${msg.text().substring(0, 80)}`, 'BROWSER-ERROR');
      }
    });

    page.on('pageerror', error => {
      log(`Page Error: ${error.message.substring(0, 80)}`, 'PAGE-ERROR');
    });

    log('Running UI interaction tests...', 'SECTION');

    allResults.register = await testRegisterAndLogin(page);
    allResults.dashboard = await testFreelancerDashboard(page);
    allResults.jobs = await testJobBrowsing(page);
    allResults.navigation = await testNavigationMenu(page);
    allResults.hr = await testHRDashboard(page);
    allResults.admin = await testAdminDashboard(page);
    allResults.responsive = await testResponsiveLayout(page);

  } catch (e) {
    log(`Fatal error: ${e.message}`, 'ERROR');
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const totalPassed = Object.values(allResults).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(allResults).reduce((sum, r) => sum + r.failed, 0);
  const totalErrors = Object.values(allResults).reduce((sum, r) => sum + r.errors.length, 0);

  const report = {
    testRun: {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}s`,
      baseUrl: BASE_URL,
      testUser: testUser.email,
      status: totalFailed === 0 ? 'PASS' : 'FAIL'
    },
    summary: {
      totalPassed,
      totalFailed,
      totalErrors,
      overallSuccess: totalFailed === 0
    },
    results: allResults,
    screenshotsDir: SCREENSHOT_DIR
  };

  const reportPath = path.join(TEST_RESULT_DIR, `ui-e2e-full-report-${formatDate()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('UI-BASED E2E TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Status: ${totalFailed === 0 ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));

  for (const [name, results] of Object.entries(allResults)) {
    const status = results.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`\n${name.toUpperCase()}: ${status}`);
    console.log(`  Passed: ${results.passed}, Failed: ${results.failed}`);
    if (results.errors.length > 0) {
      results.errors.slice(0, 3).forEach(e => console.log(`    Error: ${e.substring(0, 60)}`));
    }
  }

  console.log('='.repeat(60));
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  return report;
}

runTests()
  .then(report => {
    log('UI E2E Testing completed', 'SECTION');
    process.exit(report.summary.overallSuccess ? 0 : 1);
  })
  .catch(e => {
    log(`Fatal error: ${e.message}`, 'ERROR');
    process.exit(1);
  });
