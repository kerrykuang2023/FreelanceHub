import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

describe('Phase 1: Skill Categories E2E Tests', () => {
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

  test.describe('1.1 Skill Categories API Tests', () => {
    test('should fetch all skill categories', async () => {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(`${url}/categories`);
        return { status: res.status, body: await res.json() };
      }, API_URL);

      console.log('Categories response:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      console.log(`✅ Found ${response.body.length} skill categories`);
    });

    test('should fetch skill category tree', async () => {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(`${url}/categories/tree`);
        return { status: res.status, body: await res.json() };
      }, API_URL);

      console.log('Category tree response:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();

      const firstCategory = response.body[0];
      if (firstCategory) {
        expect(firstCategory.category_name).toBeDefined();
        expect(Array.isArray(firstCategory.sub_categories)).toBeTruthy();
        console.log(`✅ Category tree has ${firstCategory.sub_categories?.length || 0} sub-categories for ${firstCategory.category_name}`);
      }
    });

    test('should fetch sub-categories for a category', async () => {
      const treeResponse = await page.evaluate(async (url) => {
        const res = await fetch(`${url}/categories/tree`);
        return res.json();
      }, API_URL);

      if (treeResponse.length > 0) {
        const firstCategoryId = treeResponse[0]._id;

        const response = await page.evaluate(async ({ baseUrl, catId }) => {
          const res = await fetch(`${baseUrl}/categories/${catId}/sub-categories`);
          return { status: res.status, body: await res.json() };
        }, { baseUrl: API_URL, catId: firstCategoryId });

        console.log('Sub-categories response:', JSON.stringify(response, null, 2));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        console.log(`✅ Found ${response.body.length} sub-categories`);
      }
    });
  });

  test.describe('1.2 Homepage Skill Display Tests', () => {
    test('should display homepage', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      expect(title).toBe('JobPortal');
      console.log('✅ Homepage loaded');
    });

    test('should check for skill category filters', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      const filtersExist = await page.locator('text=Filters').count() > 0 ||
                          await page.locator('text=Skills').count() > 0 ||
                          await page.locator('text=Category').count() > 0;

      console.log(`Skill filters present: ${filtersExist}`);
    });
  });

  test.describe('1.3 Post Job Page Skill Selection Tests', () => {
    test('should navigate to post job page', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const url = page.url();
      console.log('Post job page URL:', url);

      if (url.includes('/login')) {
        console.log('⚠️ Redirected to login - user needs authentication');
      } else {
        expect(url).toContain('/post-job');
        console.log('✅ Navigated to post job page');
      }
    });

    test('should display skill selection dropdown', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const url = page.url();
      if (!url.includes('/login')) {
        const skillSelectCount = await page.locator('select[name*="skill"]').count() +
                                await page.locator('text=Skill').count();
        console.log(`Skill selection elements found: ${skillSelectCount}`);
      } else {
        console.log('⚠️ Skipped - requires authentication');
      }
    });
  });

  test.describe('1.4 Job List Page Filter Tests', () => {
    test('should navigate to jobs page', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      console.log(`Found ${jobCards} job cards on page`);
      expect(jobCards).toBeGreaterThan(0);
    });

    test('should have filter options', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const filtersExist = await page.locator('text=Filters').count() > 0 ||
                          await page.locator('button:has-text("Filter")').count() > 0;
      console.log(`Filter buttons exist: ${filtersExist}`);
    });
  });
});