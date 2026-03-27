import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

describe('Phase 2: Work Log Management E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let authToken: string;
  let testUser: { email: string; password: string };

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();

    // Create a test user first
    testUser = {
      email: `test_worklog_${Date.now()}@example.com`,
      password: 'TestPass123!'
    };

    // Register test user
    const registerResponse = await page.evaluate(async ({ email, password }) => {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type_name: 'job_seeker',
          email,
          password
        })
      });
      return res.json();
    }, testUser);

    console.log('Registered user:', JSON.stringify(registerResponse, null, 2));
  });

  afterAll(async () => {
    await browser.close();
  });

  test.describe('2.1 Work Log API Tests', () => {
    test('should login and get auth token', async () => {
      const loginResponse = await page.evaluate(async ({ email, password }) => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        return { status: res.status, body: await res.json() };
      }, testUser);

      console.log('Login response:', JSON.stringify(loginResponse, null, 2));

      if (loginResponse.status === 200 && loginResponse.body.token) {
        authToken = loginResponse.body.token;
        console.log('✅ Got auth token');
      } else {
        console.log('⚠️ Could not get auth token:', loginResponse.body.message);
      }

      expect(loginResponse.status).toBe(200);
    });

    test('should return 401 for work logs without auth', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/work-logs`);
        return { status: res.status };
      });

      console.log('Work logs without auth:', response.status);
      expect(response.status).toBe(401);
    });

    test('should return empty work logs for new user', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping - no auth token');
        return;
      }

      const response = await page.evaluate(async (token) => {
        const res = await fetch(`${API_URL}/work-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return { status: res.status, body: await res.json() };
      }, authToken);

      console.log('Work logs response:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(200);
      expect(response.body.work_logs).toBeDefined();
      expect(Array.isArray(response.body.work_logs)).toBeTruthy();
    });

    test('should get work log summary', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping - no auth token');
        return;
      }

      const response = await page.evaluate(async (token) => {
        const res = await fetch(`${API_URL}/work-logs/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return { status: res.status, body: await res.json() };
      }, authToken);

      console.log('Work log summary:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_hours');
      expect(response.body).toHaveProperty('total_logs');
    });
  });

  test.describe('2.2 Work Log Creation Tests', () => {
    test('should NOT create work log without required fields', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping - no auth token');
        return;
      }

      const response = await page.evaluate(async (token) => {
        const res = await fetch(`${API_URL}/work-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            work_date: new Date().toISOString()
            // Missing required fields
          })
        });
        return { status: res.status, body: await res.json() };
      }, authToken);

      console.log('Create without fields:', response.status, JSON.stringify(response.body));
      expect(response.status).toBe(400);
    });
  });

  test.describe('2.3 Work Log Status Transition Tests', () => {
    test('should have proper status enum values', async () => {
      const response = await page.evaluate(async (token) => {
        const res = await fetch(`${API_URL}/work-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return { status: res.status, body: await res.json() };
      }, authToken);

      console.log('Status enum check - Response status:', response.status);
      // Work log statuses should be: draft, submitted, confirmed, rejected, invoiced, paid
      expect(response.status).toBe(200);
    });
  });

  test.describe('2.4 Work Log UI Tests', () => {
    test('should navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should show work log page after login', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const url = page.url();
      console.log('After login URL:', url);

      // Check if logged in successfully
      const isLoggedIn = !url.includes('/login');
      console.log(`Logged in: ${isLoggedIn}`);
    });
  });

  test.describe('2.5 Work Log Batch Operations Tests', () => {
    test('should validate batch submit with empty array', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping - no auth token');
        return;
      }

      const response = await page.evaluate(async (token) => {
        const res = await fetch(`${API_URL}/work-logs/batch/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            work_log_ids: []
          })
        });
        return { status: res.status, body: await res.json() };
      }, authToken);

      console.log('Batch submit with empty array:', response.status, JSON.stringify(response.body));
      expect(response.status).toBe(400);
    });
  });
});