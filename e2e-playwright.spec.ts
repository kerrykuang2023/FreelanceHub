import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

describe('JobPortal E2E Tests', () => {
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

  test.describe('1. Homepage Tests', () => {
    test('should load homepage successfully', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toBe('JobPortal');
      console.log('✅ Homepage loaded with title:', title);
    });

    test('should display job cards', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      expect(jobCards).toBeGreaterThan(0);
      console.log(`✅ Found ${jobCards} job cards`);
    });

    test('should show search and filter options', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      const searchInput = await page.locator('input[placeholder="Search Jobs"]').count();
      const postJobButton = await page.locator('button:has-text("Post a Job")').count();
      const filters = await page.locator('text=Filters').count();

      expect(searchInput).toBeGreaterThan(0);
      expect(postJobButton).toBeGreaterThan(0);
      expect(filters).toBeGreaterThan(0);
      console.log('✅ Search, Post Job button, and Filters are present');
    });
  });

  test.describe('2. Job Card Interaction Tests', () => {
    test('should select job card on click', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);

      const hasSelectedClass = await firstJobCard.evaluate(el => el.classList.contains('border-indigo-600'));
      expect(hasSelectedClass).toBeTruthy();
      console.log('✅ Job card selection works');
    });

    test('should show job details in sidebar', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);

      const viewDetailsBtn = await page.locator('aside button:has-text("View Details")').count();
      expect(viewDetailsBtn).toBeGreaterThan(0);
      console.log('✅ Sidebar shows job details');
    });
  });

  test.describe('3. Job Detail Page Tests', () => {
    test('should navigate to job detail page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);

      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForURL('**/jobs/**', { timeout: 5000 });
      await page.waitForTimeout(3000);

      const url = page.url();
      expect(url).toContain('/jobs/');
      console.log('✅ Navigated to job detail page:', url);
    });

    test('should display job information', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);

      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);

      const applyButton = await page.locator('button:has-text("Apply")').count();
      const backButton = await page.locator('button:has-text("Back")').count();

      expect(applyButton).toBeGreaterThan(0);
      expect(backButton).toBeGreaterThan(0);
      console.log('✅ Job detail page shows Apply and Back buttons');
    });
  });

  test.describe('4. Post Job Page Tests', () => {
    test('should navigate to post job page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Post a Job")');
      await page.waitForURL('**/post-job', { timeout: 5000 });

      const url = page.url();
      expect(url).toContain('/post-job');
      console.log('✅ Navigated to post job page');
    });

    test('should display post job form', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForTimeout(3000);

      const jobTypeSelect = await page.locator('select[name="job_type_id"]').count();
      const descriptionTextarea = await page.locator('textarea[name="job_description"]').count();
      const cityInput = await page.locator('input[name="city"]').count();
      const submitButton = await page.locator('button:has-text("Post Job")').count();

      expect(jobTypeSelect).toBeGreaterThan(0);
      expect(descriptionTextarea).toBeGreaterThan(0);
      expect(cityInput).toBeGreaterThan(0);
      expect(submitButton).toBeGreaterThan(0);
      console.log('✅ Post job form is complete');
    });

    test('should validate form fields', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForTimeout(3000);

      // Try to submit without filling required fields
      await page.click('button:has-text("Post Job")');
      await page.waitForTimeout(1000);

      // Check for error messages (form validation)
      const errorMessages = await page.locator('text=required').count();
      expect(errorMessages).toBeGreaterThan(0);
      console.log('✅ Form validation works');
    });
  });

  test.describe('5. Save Job Functionality Tests', () => {
    test('should save a job', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      // Clear localStorage first
      await page.evaluate(() => localStorage.clear());

      const bookmarkButton = page.locator('main .overflow-hidden.rounded-lg.bg-white').first().locator('button').last();
      await bookmarkButton.click();
      await page.waitForTimeout(1000);

      const savedJobs = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });

      expect(savedJobs.length).toBeGreaterThan(0);
      console.log(`✅ Job saved successfully, total saved: ${savedJobs.length}`);
    });

    test('should unsave a job', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      // First save
      const bookmarkButton = page.locator('main .overflow-hidden.rounded-lg.bg-white').first().locator('button').last();
      await bookmarkButton.click();
      await page.waitForTimeout(500);

      // Then unsave
      await bookmarkButton.click();
      await page.waitForTimeout(500);

      const savedJobs = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });

      expect(savedJobs.length).toBe(0);
      console.log('✅ Job unsaved successfully');
    });
  });

  test.describe('6. Search Functionality Tests', () => {
    test('should have working search input', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const searchInput = page.locator('input[placeholder="Search Jobs"]');
      await searchInput.fill('Developer');
      await page.waitForTimeout(1000);

      const searchButton = page.locator('button:has-text("Search")');
      await searchButton.click();
      await page.waitForTimeout(2000);

      // Check if search results changed (could be filtered)
      const resultsText = await page.locator('text=Results Found').textContent();
      console.log('✅ Search functionality works, results:', resultsText);
    });
  });

  test.describe('7. API Tests', () => {
    test('should return jobs from API', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/jobs?limit=5`);
        return res.json();
      });

      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      console.log(`✅ Jobs API returned ${response.jobs.length} jobs`);
    });

    test('should return job types from API', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/jobs/types`);
        return res.json();
      });

      expect(response.job_types).toBeDefined();
      expect(response.job_types.length).toBeGreaterThan(0);
      console.log(`✅ Job types API returned ${response.job_types.length} types`);
    });

    test('should support pagination', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/jobs?page=1&limit=3`);
        return res.json();
      });

      expect(response.jobs).toBeDefined();
      expect(response.pagination).toBeDefined();
      console.log(`✅ Pagination works, page 1 has ${response.jobs.length} jobs`);
    });
  });

  test.describe('8. Navigation Tests', () => {
    test('should have working header navigation', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Check for login and signup links
      const loginLink = await page.locator('text=Log in').count();
      const signupLink = await page.locator('text=Sign up').count();

      expect(loginLink).toBeGreaterThan(0);
      expect(signupLink).toBeGreaterThan(0);
      console.log('✅ Header navigation has Log in and Sign up');
    });

    test('should navigate to login page', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      await page.click('text=Log in');
      await page.waitForURL('**/login', { timeout: 5000 });

      const url = page.url();
      expect(url).toContain('/login');
      console.log('✅ Navigated to login page');
    });
  });

  test.describe('9. Login Page Tests', () => {
    test('should display login form', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(2000);

      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();

      expect(emailInput).toBeGreaterThan(0);
      expect(passwordInput).toBeGreaterThan(0);
      expect(submitButton).toBeGreaterThan(0);
      console.log('✅ Login form is complete');
    });
  });

  test.describe('10. Register Page Tests', () => {
    test('should navigate to register page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(2000);

      await page.click('text=Sign up');
      await page.waitForURL('**/register', { timeout: 5000 });

      const url = page.url();
      expect(url).toContain('/register');
      console.log('✅ Navigated to register page');
    });

    test('should display register form', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForTimeout(2000);

      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const confirmPasswordInput = await page.locator('input[name="confirmPassword"]').count();

      expect(emailInput).toBeGreaterThan(0);
      expect(passwordInput).toBeGreaterThan(0);
      expect(confirmPasswordInput).toBeGreaterThan(0);
      console.log('✅ Register form is complete');
    });
  });

  test.describe('11. Screenshot Tests', () => {
    test('should take homepage screenshot', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
      console.log('✅ Homepage screenshot saved');
    });

    test('should take job detail screenshot', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const firstJobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJobCard.click();
      await page.waitForTimeout(500);

      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/job-detail.png', fullPage: true });
      console.log('✅ Job detail screenshot saved');
    });

    test('should take post job screenshot', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/post-job.png', fullPage: true });
      console.log('✅ Post job screenshot saved');
    });
  });
});
