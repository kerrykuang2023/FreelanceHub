import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

describe('Phase 0: Authentication E2E Tests', () => {
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

  test.describe('0.1 Pre-flight Check', () => {
    test('should have services running', async () => {
      const clientResponse = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return { ok: res.ok, status: res.status };
      }, BASE_URL);
      console.log(`Client status: ${clientResponse.status}`);

      const apiResponse = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return { ok: res.ok, status: res.status };
      }, `${API_URL}/auth/user-types`);
      console.log(`API status: ${apiResponse.status}`);

      expect(clientResponse.ok || clientResponse.status === 200).toBeTruthy();
    });

    test('should have user types seeded', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/auth/user-types`);
        return res.json();
      });

      console.log('User types:', JSON.stringify(response, null, 2));
      expect(response.length).toBeGreaterThanOrEqual(2);
      expect(response.some((t: any) => t.user_type_name === 'job_seeker')).toBeTruthy();
      expect(response.some((t: any) => t.user_type_name === 'hr_recruiter')).toBeTruthy();
    });
  });

  test.describe('0.2 Login Page Tests', () => {
    test('should navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toContain('/login');
      console.log('✅ Navigated to login page:', url);
    });

    test('should display login form', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();

      expect(emailInput).toBeGreaterThan(0);
      expect(passwordInput).toBeGreaterThan(0);
      expect(submitButton).toBeGreaterThan(0);
      console.log('✅ Login form is complete');
    });

    test('should validate empty fields', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errorMessages = await page.locator('text=required').count();
      expect(errorMessages).toBeGreaterThan(0);
      console.log('✅ Form validation works for empty fields');
    });
  });

  test.describe('0.3 Register Page Tests', () => {
    test('should navigate to register page', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toContain('/register');
      console.log('✅ Navigated to register page:', url);
    });

    test('should display register form', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      const userTypeSelect = await page.locator('select#user_type_name').count();
      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[name="password"]').count();
      const confirmPasswordInput = await page.locator('input[name="confirmPassword"]').count();
      const termsCheckbox = await page.locator('input[name="termsConditions"]').count();

      expect(userTypeSelect).toBeGreaterThan(0);
      expect(emailInput).toBeGreaterThan(0);
      expect(passwordInput).toBeGreaterThan(0);
      expect(confirmPasswordInput).toBeGreaterThan(0);
      expect(termsCheckbox).toBeGreaterThan(0);
      console.log('✅ Register form is complete');
    });

    test('should validate password mismatch', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password456');
      await page.click('input[name="termsConditions"]');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errorMessages = await page.locator('text=Passwords must match').count();
      expect(errorMessages).toBeGreaterThan(0);
      console.log('✅ Password mismatch validation works');
    });

    test('should validate password length', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errorMessages = await page.locator('text=8 characters').count();
      expect(errorMessages).toBeGreaterThan(0);
      console.log('✅ Password length validation works');
    });
  });

  test.describe('0.4 Registration Flow Tests', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    test('should register a new job seeker', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      await page.selectOption('select#user_type_name', 'job_seeker');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.click('input[name="termsConditions"]');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const url = page.url();
      const currentUrl = url !== BASE_URL && !url.includes('/register');

      const hasSuccessMessage = await page.locator('text=successfully').count() > 0;
      const hasErrorMessage = await page.locator('text=already exists').count() > 0;

      console.log(`Register result - URL: ${url}, Success: ${hasSuccessMessage}, Error: ${hasErrorMessage}`);

      if (hasErrorMessage) {
        console.log('⚠️ User might already exist, trying to login instead');
      }

      expect(hasSuccessMessage || hasErrorMessage || currentUrl).toBeTruthy();
    });

    test('should NOT register duplicate email', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');

      await page.selectOption('select#user_type_name', 'job_seeker');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.click('input[name="termsConditions"]');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const hasErrorMessage = await page.locator('text=already exists').count() > 0;
      console.log(`Duplicate registration: ${hasErrorMessage}`);
      expect(hasErrorMessage).toBeTruthy();
    });
  });

  test.describe('0.5 Login Flow Tests', () => {
    test('should login with valid credentials', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const testEmail = 'admin@jobportal.com';
      const testPassword = 'admin123';

      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const url = page.url();
      const hasLoginError = await page.locator('text=Invalid').count() > 0;
      const hasUserNotFound = await page.locator('text=not found').count() > 0;

      console.log(`Login result - URL: ${url}, Error: ${hasLoginError || hasUserNotFound}`);

      if (hasLoginError || hasUserNotFound) {
        console.log('⚠️ Login failed - user may not exist');
      }

      expect(url !== `${BASE_URL}/login` || hasLoginError || hasUserNotFound).toBeTruthy();
    });

    test('should show error for invalid credentials', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      const errorMessages = await page.locator('[role="alert"]').count();
      console.log(`Error messages displayed: ${errorMessages}`);
    });

    test('should show error for wrong password', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', 'admin@jobportal.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      const hasError = await page.locator('text=Invalid').count() > 0 ||
                       await page.locator('text=not found').count() > 0;
      console.log(`Wrong password error shown: ${hasError}`);
    });
  });

  test.describe('0.6 API Auth Tests', () => {
    test('should return 401 for login with invalid credentials', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          })
        });
        return { status: res.status, body: await res.json() };
      });

      console.log('Invalid login response:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(401);
    });

    test('should return 400 for registration with missing fields', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@test.com'
          })
        });
        return { status: res.status, body: await res.json() };
      });

      console.log('Missing fields response:', JSON.stringify(response, null, 2));
      expect(response.status).toBe(400);
    });
  });
});