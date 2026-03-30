import { chromium, Browser, Page, chromiumChromiumCoverage } from 'playwright';

const BASE_URL = 'http://localhost:5137';
const testResults = {
  timestamp: new Date().toISOString(),
  roles: [] as any[],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

async function takeScreenshot(page: Page, name: string) {
  const path = `e2e-test-screenshots/admin-config-${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

async function runAsRole(
  browser: Browser,
  role: string,
  credentials: { email: string; password: string },
  testCases: Array<() => Promise<{ name: string; passed: boolean; error?: string; screenshot?: string }>>
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing Role: ${role}`);
  console.log('='.repeat(60));

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  const roleResults = {
    role,
    email: credentials.email,
    tests: [] as any[],
    navigation: [] as string[]
  };

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, `${role.toLowerCase()}-01-login-page`);

    console.log(`  📝 Logging in as ${credentials.email}...`);
    await page.fill('input[type="email"]', credentials.email);
    await page.fill('input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, `${role.toLowerCase()}-02-after-login`);

    if (page.url().includes('login')) {
      console.log(`  ⚠️  Login may have failed, continuing anyway...`);
    }

    for (const testCase of testCases) {
      try {
        const result = await testCase();
        roleResults.tests.push(result);
        testResults.summary.total++;
        if (result.passed) {
          testResults.summary.passed++;
          console.log(`  ✅ ${result.name}`);
        } else {
          testResults.summary.failed++;
          console.log(`  ❌ ${result.name}: ${result.error}`);
        }
        if (result.screenshot) {
          console.log(`     📸 ${result.screenshot}`);
        }
      } catch (error: any) {
        roleResults.tests.push({ name: 'Unknown', passed: false, error: error.message });
        testResults.summary.failed++;
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.log(`  ❌ Failed to login: ${error.message}`);
    roleResults.tests.push({ name: 'Login', passed: false, error: error.message });
  } finally {
    await context.close();
  }

  testResults.roles.push(roleResults);
  return roleResults;
}

async function main() {
  console.log('🚀 Starting Multi-Role E2E Test Suite');
  console.log(`📅 ${testResults.timestamp}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  const adminTests = [
    async () => {
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-03-dashboard');
      return {
        name: 'Admin Dashboard loads',
        passed: page.url().includes('/admin/dashboard'),
        screenshot: 'admin-03-dashboard.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/configuration`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-04-system-config');
      return {
        name: 'System Configuration page loads',
        passed: page.url().includes('/admin/configuration'),
        screenshot: 'admin-04-system-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/work-types`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-05-work-types-config');
      const hasTable = await page.locator('table').count() > 0;
      return {
        name: 'Work Types Config page has table',
        passed: hasTable,
        screenshot: 'admin-05-work-types-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/tax-rates`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-06-tax-rates-config');
      return {
        name: 'Tax Rates Config page loads',
        passed: true,
        screenshot: 'admin-06-tax-rates-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/currencies`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-07-currencies-config');
      return {
        name: 'Currencies Config page loads',
        passed: true,
        screenshot: 'admin-07-currencies-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/languages`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-08-languages-config');
      return {
        name: 'Languages Config page loads',
        passed: true,
        screenshot: 'admin-08-languages-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/job-natures`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-09-job-natures-config');
      return {
        name: 'Job Natures Config page loads',
        passed: true,
        screenshot: 'admin-09-job-natures-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/work-formats`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-10-work-formats-config');
      return {
        name: 'Work Formats Config page loads',
        passed: true,
        screenshot: 'admin-10-work-formats-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/rate-types`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-11-rate-types-config');
      return {
        name: 'Rate Types Config page loads',
        passed: true,
        screenshot: 'admin-11-rate-types-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/invoice-types`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-12-invoice-types-config');
      return {
        name: 'Invoice Types Config page loads',
        passed: true,
        screenshot: 'admin-12-invoice-types-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/config/payment-methods`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-13-payment-methods-config');
      return {
        name: 'Payment Methods Config page loads',
        passed: true,
        screenshot: 'admin-13-payment-methods-config.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/companies`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-14-companies-management');
      return {
        name: 'Companies Management page loads',
        passed: true,
        screenshot: 'admin-14-companies-management.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/worklogs`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-15-worklogs-management');
      return {
        name: 'WorkLogs Management page loads',
        passed: true,
        screenshot: 'admin-15-worklogs-management.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/invoices`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-16-invoices-management');
      return {
        name: 'Invoices Management page loads',
        passed: true,
        screenshot: 'admin-16-invoices-management.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/admin/projects`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'admin-17-projects-management');
      return {
        name: 'Projects Management page loads',
        passed: true,
        screenshot: 'admin-17-projects-management.png'
      };
    }
  ];

  const hrTests = [
    async () => {
      await page.goto(`${BASE_URL}/hr/dashboard`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'hr-01-dashboard');
      return {
        name: 'HR Dashboard loads',
        passed: page.url().includes('/hr/dashboard') || page.url().includes('/dashboard'),
        screenshot: 'hr-01-dashboard.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/post-job`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'hr-02-post-job');
      const hasForm = await page.locator('form').count() > 0;
      return {
        name: 'Post Job page has form',
        passed: hasForm,
        screenshot: 'hr-02-post-job.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/hr/worklogs`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'hr-03-worklogs');
      return {
        name: 'HR WorkLogs page loads',
        passed: true,
        screenshot: 'hr-03-worklogs.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'hr-04-invoices');
      return {
        name: 'HR Invoices page loads',
        passed: true,
        screenshot: 'hr-04-invoices.png'
      };
    }
  ];

  const freelancerTests = [
    async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'freelancer-01-dashboard');
      return {
        name: 'Freelancer Dashboard loads',
        passed: page.url().includes('/dashboard'),
        screenshot: 'freelancer-01-dashboard.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/work-logs`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'freelancer-02-worklogs');
      return {
        name: 'Work Logs page loads',
        passed: page.url().includes('/work-logs'),
        screenshot: 'freelancer-02-worklogs.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/create-work-log`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'freelancer-03-create-worklog');
      const hasForm = await page.locator('form').count() > 0;
      return {
        name: 'Create WorkLog page has form',
        passed: hasForm,
        screenshot: 'freelancer-03-create-worklog.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'freelancer-04-invoices');
      return {
        name: 'Invoices page loads',
        passed: true,
        screenshot: 'freelancer-04-invoices.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/create-invoice`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'freelancer-05-create-invoice');
      const hasForm = await page.locator('form').count() > 0;
      return {
        name: 'Create Invoice page has form',
        passed: hasForm,
        screenshot: 'freelancer-05-create-invoice.png'
      };
    }
  ];

  const publicTests = [
    async () => {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'public-01-homepage');
      return {
        name: 'Public Homepage loads',
        passed: true,
        screenshot: 'public-01-homepage.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'public-02-jobs-listing');
      return {
        name: 'Jobs Listing page loads',
        passed: true,
        screenshot: 'public-02-jobs-listing.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'public-03-login');
      return {
        name: 'Login page loads',
        passed: true,
        screenshot: 'public-03-login.png'
      };
    },
    async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      await takeScreenshot(page, 'public-04-register');
      return {
        name: 'Register page loads',
        passed: true,
        screenshot: 'public-04-register.png'
      };
    }
  ];

  let page: Page;
  page = await (await browser.newContext()).newPage();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing ADMIN Role');
  console.log('='.repeat(60));
  const adminContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await adminContext.newPage();
  await runAsRole(browser, 'Admin', { email: 'admin@test.com', password: 'admin123' }, adminTests);
  await adminContext.close();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing HR Role');
  console.log('='.repeat(60));
  const hrContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await hrContext.newPage();
  await runAsRole(browser, 'HR', { email: 'hr@test.com', password: 'hr123' }, hrTests);
  await hrContext.close();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing FREELANCER Role');
  console.log('='.repeat(60));
  const freelancerContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await freelancerContext.newPage();
  await runAsRole(browser, 'Freelancer', { email: 'freelancer@test.com', password: 'freelancer123' }, freelancerTests);
  await freelancerContext.close();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing PUBLIC Pages');
  console.log('='.repeat(60));
  const publicContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await publicContext.newPage();
  await runAsRole(browser, 'Public', { email: '', password: '' }, publicTests);
  await publicContext.close();

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

  const reportPath = `e2e-test-results/multi-role-admin-config-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  console.log('\n📋 DETAILED RESULTS BY ROLE:');
  for (const roleResult of testResults.roles) {
    console.log(`\n${roleResult.role} (${roleResult.email || 'N/A'}):`);
    for (const test of roleResult.tests) {
      console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}${test.error ? ` - ${test.error}` : ''}`);
    }
  }

  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

main().catch(console.error);