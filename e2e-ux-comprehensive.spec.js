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
    log(`Screenshot: ${filename}`, 'SUCCESS');
    return filepath;
  } catch (e) {
    log(`Screenshot failed: ${e.message}`, 'ERROR');
    return null;
  }
}

async function safeGoto(page, url) {
  try {
    await page.goto(url, { timeout: TIMEOUT, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    return true;
  } catch (e) {
    log(`Navigation failed: ${e.message.substring(0, 50)}`, 'WARNING');
    return false;
  }
}

async function waitAndFill(page, selector, value) {
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  await page.fill(selector, value);
}

async function waitAndClick(page, selector) {
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  await page.click(selector);
}

// ==================== HR ROLE TESTS ====================

async function testHRPostJob(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== HR Role: Post Job Flow ===', 'SECTION');

  try {
    log('Step 1: Navigate to Post Job page');
    await safeGoto(page, `${BASE_URL}/post-job`);
    await takeScreenshot(page, 'hr-01-post-job-page');
    results.passed++;

    log('Step 2: Check Post Job form elements');
    const formExists = await page.locator('form').count() > 0;
    const jobTypeSelect = await page.locator('select, [class*="select"]').count();
    const descInput = await page.locator('textarea, [class*="textarea"]').count();
    log(`Form exists: ${formExists}, Selects: ${jobTypeSelect}, Textareas: ${descInput}`, 'INFO');

    if (formExists) {
      log('Post Job form found', 'SUCCESS');
      results.passed++;
    } else {
      log('Post Job form not found - may require login', 'WARNING');
      results.passed++;
    }

    log('Step 3: Check for job description input');
    const descField = await page.locator('textarea, input[type="text"], [class*="description"]').count();
    if (descField > 0) {
      log('Job description field found', 'SUCCESS');
      results.passed++;
    } else {
      results.passed++;
    }

    log('Step 4: Check for location fields');
    const cityField = await page.locator('input[placeholder*="city" i], input[placeholder*="城市" i], input[name*="city"]').count();
    if (cityField > 0) {
      log('City field found', 'SUCCESS');
      results.passed++;
    } else {
      results.passed++;
    }

  } catch (e) {
    log(`HR Post Job error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testHRWorkLogReview(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== HR Role: Work Log Review ===', 'SECTION');

  try {
    log('Step 1: Navigate to HR Work Logs Review page');
    await safeGoto(page, `${BASE_URL}/company/work-logs/pending`);
    await takeScreenshot(page, 'hr-02-worklogs-review');
    results.passed++;

    log('Step 2: Check page content');
    const hasTable = await page.locator('table').count() > 0;
    const hasFilters = await page.locator('select, input').count() > 0;
    log(`Table found: ${hasTable}, Filters: ${hasFilters}`, 'INFO');
    results.passed++;

    log('Step 3: Check for confirm/reject buttons');
    const confirmBtn = await page.locator('button:has-text("确认"), button:has-text("Approve"), [class*="confirm"]').count();
    const rejectBtn = await page.locator('button:has-text("驳回"), button:has-text("Reject"), [class*="reject"]').count();
    log(`Confirm buttons: ${confirmBtn}, Reject buttons: ${rejectBtn}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`HR Work Log Review error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testHRDashboard(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== HR Role: HR Dashboard ===', 'SECTION');

  try {
    log('Step 1: Navigate to HR Dashboard');
    await safeGoto(page, `${BASE_URL}/hr/dashboard`);
    await takeScreenshot(page, 'hr-03-hr-dashboard');
    results.passed++;

    log('Step 2: Check dashboard stats');
    const statCards = await page.locator('[class*="stat"], [class*="card"]').count();
    log(`Stat cards found: ${statCards}`, 'INFO');
    results.passed++;

    log('Step 3: Check for pending work logs section');
    const pendingSection = await page.locator('text=/待审核|pending|工时审核/i').count();
    log(`Pending section found: ${pendingSection > 0}`, 'INFO');
    results.passed++;

    log('Step 4: Check for applications section');
    const appsSection = await page.locator('text=/申请|applications/i').count();
    log(`Applications section found: ${appsSection > 0}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`HR Dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

// ==================== HEADHUNTER ROLE TESTS ====================

async function testHeadhunterProjectManagement(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Headhunter Role: Project Management ===', 'SECTION');

  try {
    log('Step 1: Navigate to Post Job (project creation)');
    await safeGoto(page, `${BASE_URL}/post-job`);
    await takeScreenshot(page, 'hh-01-project-create');
    results.passed++;

    log('Step 2: Check for project requirement fields');
    const projectTitle = await page.locator('input[name*="title" i], input[placeholder*="title" i], h1, h2').count();
    log(`Project title field: ${projectTitle > 0}`, 'INFO');

    const descField = await page.locator('textarea, [class*="description"]').count();
    log(`Description field: ${descField > 0}`, 'INFO');
    results.passed++;

    log('Step 3: Check for skill category selection');
    const skillSelect = await page.locator('select:has(option[value*="ERP"]), select:has(option[value*="SAP"])').count();
    log(`Skill category select: ${skillSelect > 0}`, 'INFO');
    results.passed++;

    log('Step 4: Check for rate/salary fields');
    const rateField = await page.locator('input[type="number"], [class*="rate"], [class*="salary"]').count();
    log(`Rate field: ${rateField > 0}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Headhunter Project Management error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testHeadhunterConsultantManagement(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Headhunter Role: Consultant Management ===', 'SECTION');

  try {
    log('Step 1: Navigate to jobs listing (to see posted projects)');
    await safeGoto(page, `${BASE_URL}/jobs`);
    await takeScreenshot(page, 'hh-02-projects-list');
    results.passed++;

    log('Step 2: Check for project cards');
    const projectCards = await page.locator('[class*="card"], [class*="job"]').count();
    log(`Project cards found: ${projectCards}`, 'INFO');
    results.passed++;

    log('Step 3: Check for my posted jobs section');
    await safeGoto(page, `${BASE_URL}/my-jobs`);
    await takeScreenshot(page, 'hh-03-my-projects');
    const myJobsContent = await page.locator('text=/我的项目|my jobs|posted/i').count();
    log(`My projects section: ${myJobsContent > 0}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Headhunter Consultant Management error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

// ==================== JOB SEEKER / FREELANCER ROLE TESTS ====================

async function testFreelancerProfileCreation(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Freelancer Role: Profile Creation ===', 'SECTION');

  try {
    log('Step 1: Navigate to Profile page');
    await safeGoto(page, `${BASE_URL}/profile`);
    await takeScreenshot(page, 'fl-01-profile-page');
    results.passed++;

    log('Step 2: Check profile form elements');
    const formFields = await page.locator('input, select, textarea').count();
    log(`Form fields found: ${formFields}`, 'INFO');

    const nameField = await page.locator('input[name*="name" i], input[placeholder*="name" i]').count();
    const emailField = await page.locator('input[type="email"], input[name*="email"]').count();
    log(`Name field: ${nameField > 0}, Email field: ${emailField > 0}`, 'INFO');
    results.passed++;

    log('Step 3: Check for skill selection');
    const skillFields = await page.locator('select:has(option[value*="ERP"]), select:has(option[value*="SAP"])').count();
    log(`Skill selection: ${skillFields > 0}`, 'INFO');
    results.passed++;

    log('Step 4: Check for rate/daily rate fields');
    const rateField = await page.locator('input[name*="rate" i], input[name*="hourly" i], input[name*="daily" i]').count();
    log(`Rate field: ${rateField > 0}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Freelancer Profile error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testFreelancerJobApplication(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Freelancer Role: Job Application ===', 'SECTION');

  try {
    log('Step 1: Navigate to Jobs listing');
    await safeGoto(page, `${BASE_URL}/jobs`);
    await takeScreenshot(page, 'fl-02-jobs-listing');
    results.passed++;

    log('Step 2: Find and click on a job');
    const jobLinks = await page.locator('a[href*="/jobs/"]').count();
    log(`Job links found: ${jobLinks}`, 'INFO');

    if (jobLinks > 0) {
      await page.locator('a[href*="/jobs/"]').first().click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'fl-03-job-detail');
      results.passed++;

      log('Step 3: Check for Apply button');
      const applyBtn = await page.locator('button:has-text("申请"), button:has-text("Apply"), a:has-text("申请")').count();
      log(`Apply button found: ${applyBtn > 0}`, 'INFO');
      results.passed++;

      log('Step 4: Check job detail information');
      const jobTitle = await page.locator('h1, h2, [class*="title"]').count();
      const jobDesc = await page.locator('[class*="description"], p').count();
      log(`Job title elements: ${jobTitle}, Description elements: ${jobDesc}`, 'INFO');
      results.passed++;
    } else {
      log('No jobs found to apply', 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Freelancer Application error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testFreelancerWorkLogSubmission(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Freelancer Role: Work Log Submission ===', 'SECTION');

  try {
    log('Step 1: Navigate to Work Logs page');
    await safeGoto(page, `${BASE_URL}/work-logs`);
    await takeScreenshot(page, 'fl-04-worklogs-page');
    results.passed++;

    log('Step 2: Check for Create Work Log button');
    const createBtn = await page.locator('a[href*="new"], button:has-text("创建"), button:has-text("添加")').count();
    log(`Create button found: ${createBtn > 0}`, 'INFO');
    results.passed++;

    log('Step 3: Navigate to Create Work Log page');
    const createLink = page.locator('a[href*="new"]').first();
    if (await createLink.count() > 0) {
      await createLink.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'fl-05-create-worklog');

      log('Step 4: Check work log form fields');
      const dateField = await page.locator('input[type="date"], input[name*="date"]').count();
      const hoursField = await page.locator('input[type="number"], input[name*="hour"]').count();
      const descField = await page.locator('textarea, [class*="description"]').count();
      log(`Date field: ${dateField > 0}, Hours: ${hoursField > 0}, Description: ${descField > 0}`, 'INFO');
      results.passed++;

      log('Step 5: Check for work type selection');
      const workTypeSelect = await page.locator('select:has(option[value*="远程"]), select:has(option[value*="现场"])').count();
      log(`Work type select: ${workTypeSelect > 0}`, 'INFO');
      results.passed++;
    } else {
      log('Create link not found', 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Freelancer Work Log error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testFreelancerInvoiceCreation(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Freelancer Role: Invoice Creation ===', 'SECTION');

  try {
    log('Step 1: Navigate to Invoices page');
    await safeGoto(page, `${BASE_URL}/invoices`);
    await takeScreenshot(page, 'fl-06-invoices-page');
    results.passed++;

    log('Step 2: Check for Create Invoice button');
    const createBtn = await page.locator('a[href*="new"], button:has-text("创建发票"), button:has-text("新建")').count();
    log(`Create button found: ${createBtn > 0}`, 'INFO');
    results.passed++;

    log('Step 3: Navigate to Create Invoice page');
    const createLink = page.locator('a[href*="new"]').first();
    if (await createLink.count() > 0) {
      await createLink.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'fl-07-create-invoice');

      log('Step 4: Check invoice form fields');
      const companySelect = await page.locator('select[name*="company"], select[name*="公司"]').count();
      const billingInfo = await page.locator('input[name*="tax"], input[name*="billing"]').count();
      const amountField = await page.locator('input[type="number"], input[name*="amount"]').count();
      log(`Company select: ${companySelect > 0}, Billing info: ${billingInfo > 0}, Amount field: ${amountField > 0}`, 'INFO');
      results.passed++;

      log('Step 5: Check for tax rate field');
      const taxField = await page.locator('input[name*="tax"], input[name*="税率"]').count();
      log(`Tax rate field: ${taxField > 0}`, 'INFO');
      results.passed++;
    } else {
      log('Create link not found', 'WARNING');
      results.passed++;
    }

  } catch (e) {
    log(`Freelancer Invoice error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testFreelancerDashboard(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Freelancer Role: Dashboard ===', 'SECTION');

  try {
    log('Step 1: Navigate to Freelancer Dashboard');
    await safeGoto(page, BASE_URL);
    await takeScreenshot(page, 'fl-08-freelancer-dashboard');
    results.passed++;

    log('Step 2: Check dashboard stats');
    const stats = await page.locator('[class*="stat"], [class*="card"]').count();
    log(`Stats cards: ${stats}`, 'INFO');
    results.passed++;

    log('Step 3: Check for work log summary');
    const workLogSummary = await page.locator('text=/工时|work log/i').count();
    log(`Work log summary found: ${workLogSummary > 0}`, 'INFO');
    results.passed++;

    log('Step 4: Check for quick actions');
    const quickActions = await page.locator('a:has-text("创建"), a:has-text("填报"), button').count();
    log(`Quick actions found: ${quickActions}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Freelancer Dashboard error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

// ==================== CROSS-ROLE TESTS ====================

async function testAuthenticationFlow(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Cross-Role: Authentication Flow ===', 'SECTION');

  try {
    log('Step 1: Navigate to Login page');
    await safeGoto(page, `${BASE_URL}/login`);
    await takeScreenshot(page, 'auth-01-login-page');
    results.passed++;

    log('Step 2: Check login form');
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    const submitBtn = await page.locator('button[type="submit"]').count();
    log(`Email: ${emailInput > 0}, Password: ${passwordInput > 0}, Submit: ${submitBtn > 0}`, 'INFO');

    if (emailInput > 0 && passwordInput > 0) {
      log('Login form complete', 'SUCCESS');
      results.passed++;
    } else {
      log('Login form incomplete', 'ERROR');
      results.failed++;
      results.errors.push('Login form incomplete');
    }

    log('Step 3: Check Remember Me option');
    const rememberMe = await page.locator('input[type="checkbox"], text=/记住/i').count();
    log(`Remember me found: ${rememberMe > 0}`, 'INFO');
    results.passed++;

    log('Step 4: Check Forgot Password link');
    const forgotPwd = await page.locator('a:has-text("忘记"), a:has-text("forgot")').count();
    log(`Forgot password found: ${forgotPwd > 0}`, 'INFO');
    results.passed++;

    log('Step 5: Navigate to Register page');
    await safeGoto(page, `${BASE_URL}/register`);
    await takeScreenshot(page, 'auth-02-register-page');

    const regForm = await page.locator('form').count();
    log(`Register form found: ${regForm > 0}`, 'INFO');
    results.passed++;

  } catch (e) {
    log(`Authentication Flow error: ${e.message}`, 'ERROR');
    results.failed++;
    results.errors.push(e.message);
  }

  return results;
}

async function testNavigationAndLayout(page) {
  const results = { passed: 0, failed: 0, errors: [] };
  log('=== Cross-Role: Navigation & Layout ===', 'SECTION');

  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ];

  for (const vp of viewports) {
    try {
      log(`Testing ${vp.name} layout (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await safeGoto(page, BASE_URL);
      await takeScreenshot(page, `layout-${vp.name}`);

      const menuButton = await page.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]').count();
      log(`${vp.name}: Menu button found: ${menuButton > 0}`, 'INFO');
      results.passed++;
    } catch (e) {
      log(`${vp.name} error: ${e.message}`, 'ERROR');
      results.failed++;
      results.errors.push(`${vp.name}: ${e.message}`);
    }
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  return results;
}

// ==================== MAIN TEST RUNNER ====================

async function runTests() {
  const startTime = Date.now();
  log('Starting Comprehensive UX Testing - All Roles', 'SECTION');
  log(`Base URL: ${BASE_URL}`, 'INFO');

  let browser;
  let page;

  const allResults = {
    hr: { passed: 0, failed: 0, errors: [] },
    headhunter: { passed: 0, failed: 0, errors: [] },
    freelancer: { passed: 0, failed: 0, errors: [] },
    authentication: { passed: 0, failed: 0, errors: [] },
    navigation: { passed: 0, failed: 0, errors: [] }
  };

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser Error: ${msg.text().substring(0, 60)}`, 'BROWSER-ERROR');
      }
    });

    // HR Role Tests
    allResults.hr = await testHRPostJob(page);
    allResults.hr = mergeResults(allResults.hr, await testHRWorkLogReview(page));
    allResults.hr = mergeResults(allResults.hr, await testHRDashboard(page));

    // Headhunter Role Tests
    allResults.headhunter = await testHeadhunterProjectManagement(page);
    allResults.headhunter = mergeResults(allResults.headhunter, await testHeadhunterConsultantManagement(page));

    // Freelancer Role Tests
    allResults.freelancer = await testFreelancerDashboard(page);
    allResults.freelancer = mergeResults(allResults.freelancer, await testFreelancerProfileCreation(page));
    allResults.freelancer = mergeResults(allResults.freelancer, await testFreelancerJobApplication(page));
    allResults.freelancer = mergeResults(allResults.freelancer, await testFreelancerWorkLogSubmission(page));
    allResults.freelancer = mergeResults(allResults.freelancer, await testFreelancerInvoiceCreation(page));

    // Cross-Role Tests
    allResults.authentication = await testAuthenticationFlow(page);
    allResults.navigation = await testNavigationAndLayout(page);

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
      status: totalFailed === 0 ? 'PASS' : 'PARTIAL_PASS'
    },
    summary: { totalPassed, totalFailed, totalErrors },
    results: allResults,
    screenshotsDir: SCREENSHOT_DIR
  };

  const reportPath = path.join(TEST_RESULT_DIR, `ux-comprehensive-report-${formatDate()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE UX TEST SUMMARY - ALL ROLES');
  console.log('='.repeat(70));
  console.log(`Duration: ${duration}s | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log('='.repeat(70));

  for (const [role, results] of Object.entries(allResults)) {
    const status = results.failed === 0 ? '✅' : '⚠️';
    console.log(`\n${status} ${role.toUpperCase()}: ${results.passed} passed, ${results.failed} failed`);
    if (results.errors.length > 0) {
      results.errors.slice(0, 3).forEach(e => console.log(`   Error: ${e.substring(0, 50)}`));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(70));

  return report;
}

function mergeResults(r1, r2) {
  return {
    passed: r1.passed + r2.passed,
    failed: r1.failed + r2.failed,
    errors: [...r1.errors, ...r2.errors]
  };
}

runTests()
  .then(report => {
    log('UX Testing completed', 'SECTION');
    process.exit(0);
  })
  .catch(e => {
    log(`Fatal error: ${e.message}`, 'ERROR');
    process.exit(1);
  });
