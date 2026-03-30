const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
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
    console.log('\n🚀 Starting UI Tests for JobPortal\n');
    console.log('='.repeat(50));

    // Test 1: Homepage loads
    await test('Homepage loads successfully', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      if (!title) throw new Error('Page title is empty');
    });

    // Test 2: Jobs API returns data
    await test('Jobs API returns data', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?limit=5');
        return res.json();
      });
      if (!response.jobs) throw new Error('No jobs returned from API');
      console.log(`   Found ${response.jobs.length} jobs`);
    });

    // Test 3: Job cards are displayed
    await test('Job cards are displayed on homepage', async () => {
      await page.goto(BASE_URL);
      await delay(5000);
      
      // Get page content for debugging
      const bodyText = await page.locator('body').innerText();
      console.log('   Page body text (first 200 chars):', bodyText.substring(0, 200));
      
      // Check for different selectors
      const jobCards1 = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      const jobCards2 = await page.locator('main > div').count();
      const allDivs = await page.locator('main div').count();
      
      console.log(`   Selector 1 (main .overflow-hidden.rounded-lg.bg-white): ${jobCards1}`);
      console.log(`   Selector 2 (main > div): ${jobCards2}`);
      console.log(`   Selector 3 (main div): ${allDivs}`);
      
      // Check if loading text is present
      const isLoading = bodyText.includes('Loading');
      console.log(`   Is Loading: ${isLoading}`);
      
      if (jobCards1 > 0) {
        console.log(`   Found ${jobCards1} job cards`);
      } else {
        throw new Error('No job cards found with any selector');
      }
    });

    // Test 4: Job card click selects job
    await test('Job card click selects job', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      // More precise selector for job cards
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white');
      const count = await jobCards.count();
      console.log(`   Found ${count} job cards`);
      
      if (count > 0) {
        const firstJobCard = jobCards.first();
        await firstJobCard.click();
        await delay(500);
        const selectedBorder = await firstJobCard.evaluate(el => 
          el.classList.contains('border-indigo-600')
        );
        if (!selectedBorder) {
          const classes = await firstJobCard.getAttribute('class');
          console.log('   Card classes:', classes);
          throw new Error('Job card not selected - border-indigo-600 not found');
        }
      } else {
        throw new Error('No job cards found');
      }
    });

    // Test 5: Right sidebar shows job details
    await test('Right sidebar shows job details', async () => {
      await page.goto(BASE_URL);
      await delay(2000);
      const firstJobCard = page.locator('.grid > div').first();
      await firstJobCard.click();
      await delay(500);
      const sidebar = page.locator('aside').last();
      const applyButton = await sidebar.locator('button:has-text("View Details")').count();
      if (applyButton === 0) throw new Error('Apply button not found in sidebar');
    });

    // Test 6: Post a Job button exists
    await test('Post a Job button exists', async () => {
      await page.goto(BASE_URL);
      await delay(1000);
      const postJobButton = await page.locator('button:has-text("Post a Job")').count();
      if (postJobButton === 0) throw new Error('Post a Job button not found');
    });

    // Test 7: Post a Job button navigates to post-job page
    await test('Post a Job button navigates to post-job page', async () => {
      await page.goto(BASE_URL);
      await delay(1000);
      await page.click('button:has-text("Post a Job")');
      await delay(1000);
      const url = page.url();
      if (!url.includes('/post-job')) throw new Error('Did not navigate to post-job page');
    });

    // Test 8: Post Job page has form
    await test('Post Job page has form elements', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await delay(3000);
      const jobTypeSelect = await page.locator('select[name="job_type_id"]').count();
      const descriptionTextarea = await page.locator('textarea[name="job_description"]').count();
      const cityInput = await page.locator('input[name="city"]').count();
      if (jobTypeSelect === 0) throw new Error('Job type select not found');
      if (descriptionTextarea === 0) throw new Error('Description textarea not found');
      if (cityInput === 0) throw new Error('City input not found');
    });

    // Test 9: View Details & Apply navigates to job detail page
    await test('View Details & Apply navigates to job detail page', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      // More precise selector for job cards
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white');
      await jobCards.first().click();
      await delay(500);
      
      // Try different button text variations
      const applyBtn = page.locator('aside button:has-text("View Details")').first();
      await applyBtn.click({ timeout: 5000 });
      await delay(1000);
      const url = page.url();
      if (!url.includes('/jobs/')) throw new Error('Did not navigate to job detail page');
    });

    // Test 10: Job detail page shows job info
    await test('Job detail page shows job information', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      // More precise selector for job cards
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white');
      await jobCards.first().click();
      await delay(500);
      
      const applyBtn = page.locator('aside button:has-text("View Details")').first();
      await applyBtn.click({ timeout: 5000 });
      
      // Wait for the job detail page to load
      await page.waitForURL('**/jobs/**', { timeout: 5000 });
      await delay(3000); // Additional wait for rendering
      
      // Check for buttons - use more flexible selectors
      const applyButton = await page.locator('button:has-text("Apply")').count();
      const backButton = await page.locator('button:has-text("Back")').count();
      console.log(`   Apply buttons found: ${applyButton}, Back buttons found: ${backButton}`);
      
      if (applyButton === 0) throw new Error('Apply button not found');
      if (backButton === 0) throw new Error('Back button not found');
    });

    // Test 11: Save job functionality
    await test('Save job functionality works', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      // Click on the bookmark button (second button in the first job card)
      const bookmarkButton = page.locator('main .overflow-hidden.rounded-lg.bg-white').first().locator('button').last();
      await bookmarkButton.click({ timeout: 5000 });
      await delay(500);
      
      const savedJobs = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });
      if (savedJobs.length === 0) throw new Error('Job not saved to localStorage');
      console.log(`   Saved ${savedJobs.length} job(s)`);
    });

    // Test 12: Navigation sidebar exists
    await test('Navigation sidebar works', async () => {
      await page.goto(BASE_URL);
      await delay(2000);
      
      // Check for navigation elements in the header/sidebar
      const navLinks = await page.locator('nav').first().locator('a').count();
      console.log(`   Found ${navLinks} navigation links`);
    });

    // Test 13: Job Types API
    await test('Job Types API returns data', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs/types');
        return res.json();
      });
      if (!response.job_types) throw new Error('No job types returned from API');
      console.log(`   Found ${response.job_types.length} job types`);
    });

    // Test 14: Jobs API with pagination
    await test('Jobs API pagination works', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?page=1&limit=3');
        return res.json();
      });
      if (!response.jobs) throw new Error('No jobs returned');
      console.log(`   Page 1: ${response.jobs.length} jobs`);
    });

    // Take final screenshot
    await page.goto(BASE_URL);
    await delay(2000);
    await page.screenshot({ path: 'ui-test-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved to ui-test-screenshot.png');

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results Summary:');
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

runTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});
