const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  async function test(name, fn) {
    results.total++;
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  try {
    console.log('\n🚀 Starting E2E Tests for JobPortal\n');
    console.log('='.repeat(60));

    // Test 1: Homepage loads
    await test('Homepage loads successfully', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      if (!title) throw new Error('Page title is empty');
    });

    // Test 2: Job cards displayed
    await test('Job cards are displayed', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      if (jobCards === 0) throw new Error('No job cards found');
      console.log(`   Found ${jobCards} job cards`);
    });

    // Test 3: Search and Post Job buttons exist
    await test('Search and Post Job buttons exist', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const searchInput = await page.locator('input[placeholder="Search Jobs"]').count();
      const postJobButton = await page.locator('button:has-text("Post a Job")').count();
      if (searchInput === 0) throw new Error('Search input not found');
      if (postJobButton === 0) throw new Error('Post Job button not found');
    });

    // Test 4: Job card selection
    await test('Job card can be selected', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);
      const hasSelectedClass = await firstJobCard.evaluate(el => el.classList.contains('border-indigo-600'));
      if (!hasSelectedClass) throw new Error('Job card not selected');
    });

    // Test 5: Sidebar shows job details
    await test('Sidebar shows job details', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);
      const viewDetailsBtn = await page.locator('aside button:has-text("View Details")').count();
      if (viewDetailsBtn === 0) throw new Error('View Details button not found');
    });

    // Test 6: Navigate to job detail page
    await test('Navigate to job detail page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);
      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForURL('**/jobs/**', { timeout: 5000 });
      await page.waitForTimeout(3000);
      const url = page.url();
      if (!url.includes('/jobs/')) throw new Error('Did not navigate to job detail page');
    });

    // Test 7: Job detail page shows info
    await test('Job detail page shows information', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);
      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);
      const applyButton = await page.locator('button:has-text("Apply")').count();
      const backButton = await page.locator('button:has-text("Back")').count();
      if (applyButton === 0) throw new Error('Apply button not found');
      if (backButton === 0) throw new Error('Back button not found');
    });

    // Test 8: Navigate to Post Job page
    await test('Navigate to Post Job page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Post a Job")');
      await page.waitForURL('**/post-job', { timeout: 5000 });
      const url = page.url();
      if (!url.includes('/post-job')) throw new Error('Did not navigate to post-job page');
    });

    // Test 9: Post Job form elements
    await test('Post Job form has all elements', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForTimeout(3000);
      const jobTypeSelect = await page.locator('select[name="job_type_id"]').count();
      const descriptionTextarea = await page.locator('textarea[name="job_description"]').count();
      const cityInput = await page.locator('input[name="city"]').count();
      const submitButton = await page.locator('button:has-text("Post Job")').count();
      if (jobTypeSelect === 0) throw new Error('Job type select not found');
      if (descriptionTextarea === 0) throw new Error('Description textarea not found');
      if (cityInput === 0) throw new Error('City input not found');
      if (submitButton === 0) throw new Error('Submit button not found');
    });

    // Test 10: Save job functionality
    await test('Save job functionality works', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      await page.evaluate(() => localStorage.clear());
      const bookmarkButton = page.locator('main .overflow-hidden.rounded-lg.bg-white').first().locator('button').last();
      await bookmarkButton.click();
      await page.waitForTimeout(1000);
      const savedJobs = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });
      if (savedJobs.length === 0) throw new Error('Job not saved');
      console.log(`   Saved ${savedJobs.length} job(s)`);
    });

    // Test 11: Search functionality
    await test('Search functionality works', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const searchInput = page.locator('input[placeholder="Search Jobs"]');
      await searchInput.fill('Developer');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000);
      console.log('   Search executed successfully');
    });

    // Test 12: Jobs API
    await test('Jobs API returns data', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?limit=5');
        return res.json();
      });
      if (!response.jobs) throw new Error('No jobs returned from API');
      console.log(`   Found ${response.jobs.length} jobs from API`);
    });

    // Test 13: Job Types API
    await test('Job Types API returns data', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs/types');
        return res.json();
      });
      if (!response.job_types) throw new Error('No job types returned from API');
      console.log(`   Found ${response.job_types.length} job types from API`);
    });

    // Test 14: Pagination
    await test('Pagination works', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?page=1&limit=3');
        return res.json();
      });
      if (!response.pagination) throw new Error('No pagination info');
      console.log(`   Page 1 has ${response.jobs.length} jobs`);
    });

    // Test 15: Navigate to Login page
    await test('Navigate to Login page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await page.click('text=Log in');
      await page.waitForURL('**/login', { timeout: 5000 });
      const url = page.url();
      if (!url.includes('/login')) throw new Error('Did not navigate to login page');
    });

    // Test 16: Login form elements
    await test('Login form has all elements', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(3000);
      const emailInput = await page.locator('#email').count();
      const passwordInput = await page.locator('#password').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      if (emailInput === 0) throw new Error('Email input not found');
      if (passwordInput === 0) throw new Error('Password input not found');
      if (submitButton === 0) throw new Error('Submit button not found');
    });

    // Test 17: Navigate to Register page
    await test('Navigate to Register page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(3000);
      await page.click('text=Register now');
      await page.waitForURL('**/register', { timeout: 5000 });
      const url = page.url();
      if (!url.includes('/register')) throw new Error('Did not navigate to register page');
    });

    // Test 18: Register form elements
    await test('Register form has all elements', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForTimeout(3000);
      const emailInput = await page.locator('#email').count();
      const passwordInput = await page.locator('#password').count();
      const confirmInput = await page.locator('#confirmPassword').count();
      if (emailInput === 0) throw new Error('Email input not found');
      if (passwordInput === 0) throw new Error('Password input not found');
      if (confirmInput === 0) throw new Error('Confirm password input not found');
    });

    // Take screenshots
    console.log('\n📸 Taking screenshots...');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
    console.log('   Saved: screenshots/homepage.png');

    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/post-job.png', fullPage: true });
    console.log('   Saved: screenshots/post-job.png');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/login.png', fullPage: true });
    console.log('   Saved: screenshots/login.png');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/register.png', fullPage: true });
    console.log('   Saved: screenshots/register.png');

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 E2E Test Results Summary:');
  console.log(`   Total: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log('\n');

  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }

  return results;
}

runE2ETests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});
