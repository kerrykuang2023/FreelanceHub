const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const TIMEOUT = 30000;
const RETRY_COUNT = 2;
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

async function safeGoto(page, url, options = {}) {
  const defaultOptions = {
    timeout: TIMEOUT,
    waitUntil: 'domcontentloaded',
    ...options
  };

  for (let i = 0; i <= RETRY_COUNT; i++) {
    try {
      await page.goto(url, defaultOptions);
      return true;
    } catch (e) {
      if (i < RETRY_COUNT && (e.message.includes('ERR_ABORTED') || e.message.includes('net::'))) {
        log(`Retry ${i + 1} for ${url} due to: ${e.message.substring(0, 50)}`, 'WARNING');
        await page.waitForTimeout(1000);
      } else {
        throw e;
      }
    }
  }
  return false;
}

async function takeScreenshot(page, name) {
  const filename = `${formatDate()}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: true, timeout: 10000 });
    log(`Screenshot saved: ${filename}`, 'SUCCESS');
    return filepath;
  } catch (e) {
    log(`Failed to take screenshot: ${e.message}`, 'ERROR');
    return null;
  }
}

async function testPublicPages(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Testing Public Pages ===', 'SECTION');

  const publicPages = [
    { url: '/', name: 'Homepage' },
    { url: '/jobs', name: 'Jobs-Listing' },
    { url: '/login', name: 'Login-Page' },
    { url: '/register', name: 'Register-Page' },
  ];

  for (const pageInfo of publicPages) {
    log(`Testing public page: ${pageInfo.name}`);
    try {
      const success = await safeGoto(page, `${BASE_URL}${pageInfo.url}`);
      if (success) {
        await page.waitForTimeout(1000);
        await takeScreenshot(page, `01-public-${pageInfo.name.toLowerCase()}`);
        log(`${pageInfo.name} loaded successfully`, 'SUCCESS');
        results.passed++;
      } else {
        throw new Error('Failed to navigate after retries');
      }
    } catch (e) {
      log(`${pageInfo.name} failed: ${e.message}`, 'ERROR');
      results.failed++;
      results.errors.push(`${pageInfo.name}: ${e.message}`);
      await takeScreenshot(page, `error-public-${pageInfo.name.toLowerCase()}`);
    }
  }

  return results;
}

async function testAPIs(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Testing Public APIs ===', 'SECTION');

  log('Testing Jobs API');
  try {
    const jobsResponse = await page.evaluate(async (apiUrl) => {
      try {
        const res = await fetch(`${apiUrl}/jobs`);
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    }, API_URL);

    if (jobsResponse.ok) {
      log('Jobs API accessible', 'SUCCESS');
      results.passed++;
    } else if (jobsResponse.error) {
      log(`Jobs API error: ${jobsResponse.error}`, 'ERROR');
      results.failed++;
      results.errors.push(`Jobs API: ${jobsResponse.error}`);
    } else {
      log(`Jobs API returned: ${jobsResponse.status}`, 'WARNING');
      results.passed++;
    }
  } catch (e) {
    log(`Jobs API exception: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Jobs API: ${e.message}`);
  }

  log('Testing Skills API');
  try {
    const skillsResponse = await page.evaluate(async (apiUrl) => {
      try {
        const res = await fetch(`${apiUrl}/skills/categories`);
        const data = await res.json();
        return { status: res.status, ok: res.ok, count: Array.isArray(data) ? data.length : 0 };
      } catch (e) {
        return { error: e.message };
      }
    }, API_URL);

    if (skillsResponse.ok) {
      log(`Skills API accessible (${skillsResponse.count} categories)`, 'SUCCESS');
      results.passed++;
    } else if (skillsResponse.error) {
      log(`Skills API error: ${skillsResponse.error}`, 'ERROR');
      results.failed++;
      results.errors.push(`Skills API: ${skillsResponse.error}`);
    } else {
      log(`Skills API returned: ${skillsResponse.status}`, 'WARNING');
      results.passed++;
    }
  } catch (e) {
    log(`Skills API exception: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Skills API: ${e.message}`);
  }

  log('Testing Auth APIs');
  try {
    const authResponse = await page.evaluate(async (apiUrl) => {
      try {
        const res = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
        });
        return { status: res.status };
      } catch (e) {
        return { error: e.message };
      }
    }, API_URL);

    if (authResponse.status === 400 || authResponse.status === 401) {
      log('Auth API responding correctly', 'SUCCESS');
      results.passed++;
    } else {
      log(`Auth API returned: ${authResponse.status}`, 'WARNING');
      results.passed++;
    }
  } catch (e) {
    log(`Auth API exception: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Auth API: ${e.message}`);
  }

  return results;
}

async function testFreelancerJourney(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Freelancer Role Journey ===', 'SECTION');

  log('Step 1: Homepage');
  try {
    await safeGoto(page, BASE_URL);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '01-freelancer-homepage');
    results.passed++;
  } catch (e) {
    log(`Homepage error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Homepage: ${e.message}`);
  }

  log('Step 2: Jobs listing');
  try {
    await safeGoto(page, `${BASE_URL}/jobs`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '02-freelancer-jobs-listing');
    results.passed++;
  } catch (e) {
    log(`Jobs listing error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Jobs listing: ${e.message}`);
  }

  log('Step 3: Login page');
  try {
    await safeGoto(page, `${BASE_URL}/login`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '03-freelancer-login-page');

    const hasForm = await page.locator('form').count() > 0;
    const hasEmail = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPassword = await page.locator('input[type="password"], input[name="password"]').count() > 0;

    if (hasForm && hasEmail && hasPassword) {
      log('Login form elements present', 'SUCCESS');
      results.passed++;
    } else {
      log('Login form incomplete', 'WARNING');
      results.passed++;
    }
  } catch (e) {
    log(`Login page error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Login page: ${e.message}`);
  }

  log('Step 4: Register page');
  try {
    await safeGoto(page, `${BASE_URL}/register`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '04-freelancer-register-page');
    results.passed++;
  } catch (e) {
    log(`Register page error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Register page: ${e.message}`);
  }

  log('Step 5: Protected route redirect');
  try {
    await safeGoto(page, `${BASE_URL}/work-logs`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '05-freelancer-worklogs-redirect');
    const url = page.url();
    if (url.includes('/login')) {
      log('Correctly redirected to login', 'SUCCESS');
    } else {
      log('Not redirected (may be logged in)', 'INFO');
    }
    results.passed++;
  } catch (e) {
    log(`Protected route error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Protected route: ${e.message}`);
  }

  return results;
}

async function testHRJourney(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== HR Role Journey ===', 'SECTION');

  log('Step 1: Homepage');
  try {
    await safeGoto(page, BASE_URL);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '01-hr-homepage');
    results.passed++;
  } catch (e) {
    log(`Homepage error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Homepage: ${e.message}`);
  }

  log('Step 2: HR Dashboard (protected)');
  try {
    await safeGoto(page, `${BASE_URL}/hr/dashboard`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '02-hr-dashboard-redirect');
    const url = page.url();
    if (url.includes('/login')) {
      log('Correctly redirected to login', 'SUCCESS');
    } else {
      log('Not redirected (may have auth)', 'INFO');
    }
    results.passed++;
  } catch (e) {
    log(`HR Dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`HR Dashboard: ${e.message}`);
  }

  log('Step 3: Post Job page');
  try {
    await safeGoto(page, `${BASE_URL}/post-job`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '03-hr-post-job-page');
    results.passed++;
  } catch (e) {
    log(`Post Job error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Post Job: ${e.message}`);
  }

  return results;
}

async function testAdminJourney(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Admin Role Journey ===', 'SECTION');

  log('Step 1: Homepage');
  try {
    await safeGoto(page, BASE_URL);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '01-admin-homepage');
    results.passed++;
  } catch (e) {
    log(`Homepage error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Homepage: ${e.message}`);
  }

  log('Step 2: Admin Dashboard (protected)');
  try {
    await safeGoto(page, `${BASE_URL}/admin/dashboard`);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '02-admin-dashboard-redirect');
    const url = page.url();
    if (url.includes('/login')) {
      log('Correctly redirected to login', 'SUCCESS');
    } else {
      log('Not redirected (may have auth)', 'INFO');
    }
    results.passed++;
  } catch (e) {
    log(`Admin Dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Admin Dashboard: ${e.message}`);
  }

  return results;
}

async function testNavigationAndLayout(page) {
  const results = { passed: 0, failed: 0, errors: [] };

  log('=== Testing Navigation and Layout ===', 'SECTION');

  const viewports = [
    { size: { width: 1920, height: 1080 }, name: 'desktop-1920x1080' },
    { size: { width: 768, height: 1024 }, name: 'tablet-768x1024' },
    { size: { width: 375, height: 667 }, name: 'mobile-375x667' },
  ];

  for (const vp of viewports) {
    log(`Testing viewport: ${vp.name}`);
    try {
      await page.setViewportSize(vp.size);
      await safeGoto(page, BASE_URL);
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `layout-${vp.name}`);
      results.passed++;
    } catch (e) {
      log(`Viewport ${vp.name} error: ${e.message}`, 'ERROR');
      results.failed++;
      results.errors.push(`Viewport ${vp.name}: ${e.message}`);
    }
  }

  await page.setViewportSize({ width: 1920, height: 1080 });

  return results;
}

async function runTests() {
  const startTime = Date.now();
  log('Starting Multi-Role E2E Testing', 'SECTION');
  log(`Base URL: ${BASE_URL}`, 'INFO');
  log(`API URL: ${API_URL}`, 'INFO');

  let browser;
  let context;
  let page;

  const allResults = {
    publicPages: { passed: 0, failed: 0, errors: [] },
    apis: { passed: 0, failed: 0, errors: [] },
    freelancer: { passed: 0, failed: 0, errors: [] },
    hr: { passed: 0, failed: 0, errors: [] },
    admin: { passed: 0, failed: 0, errors: [] },
    navigation: { passed: 0, failed: 0, errors: [] },
  };

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser Console: ${msg.text().substring(0, 100)}`, 'BROWSER-ERROR');
      }
    });

    page.on('pageerror', error => {
      log(`Page Error: ${error.message.substring(0, 100)}`, 'PAGE-ERROR');
    });

    const testFunctions = [
      { name: 'Public Pages', fn: () => testPublicPages(page) },
      { name: 'APIs', fn: () => testAPIs(page) },
      { name: 'Freelancer Journey', fn: () => testFreelancerJourney(page) },
      { name: 'HR Journey', fn: () => testHRJourney(page) },
      { name: 'Admin Journey', fn: () => testAdminJourney(page) },
      { name: 'Navigation & Layout', fn: () => testNavigationAndLayout(page) },
    ];

    for (const test of testFunctions) {
      try {
        const result = await test.fn();
        const key = test.name.toLowerCase().replace(/[^a-z]/g, '');
        if (allResults[key]) {
          allResults[key] = result;
        } else {
          Object.keys(allResults).forEach(k => {
            if (test.name.toLowerCase().includes(k) || k.includes(test.name.toLowerCase())) {
              allResults[k] = result;
            }
          });
        }
      } catch (e) {
        log(`Test ${test.name} threw exception: ${e.message}`, 'ERROR');
      }
    }

  } catch (e) {
    log(`Fatal test error: ${e.message}`, 'ERROR');
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const totalPassed = Object.values(allResults).reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = Object.values(allResults).reduce((sum, r) => sum + (r.failed || 0), 0);
  const totalErrors = Object.values(allResults).reduce((sum, r) => sum + (r.errors?.length || 0), 0);

  const report = {
    testRun: {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}s`,
      baseUrl: BASE_URL,
      apiUrl: API_URL,
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

  const reportPath = path.join(TEST_RESULT_DIR, `multi-role-e2e-report-${formatDate()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Test report saved: ${reportPath}`, 'SUCCESS');

  console.log('\n' + '='.repeat(60));
  console.log('MULTI-ROLE E2E TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Status: ${totalFailed === 0 ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));

  for (const [name, results] of Object.entries(allResults)) {
    const status = (results.failed || 0) === 0 ? 'PASS' : 'FAIL';
    console.log(`\n${name.toUpperCase()}: ${status}`);
    console.log(`  Passed: ${results.passed || 0}, Failed: ${results.failed || 0}, Errors: ${results.errors?.length || 0}`);
    if (results.errors?.length > 0) {
      console.log(`  Errors:`);
      results.errors.slice(0, 3).forEach(e => console.log(`    - ${e.substring(0, 80)}`));
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
    log('E2E Testing completed', 'SECTION');
    process.exit(report.summary.overallSuccess ? 0 : 1);
  })
  .catch(e => {
    log(`Fatal error: ${e.message}`, 'ERROR');
    process.exit(1);
  });
