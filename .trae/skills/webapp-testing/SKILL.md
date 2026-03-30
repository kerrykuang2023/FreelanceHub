---
name: "webapp-testing"
description: "Automates web application testing including E2E tests, UI validation, and API testing. Invoke when user needs to test web applications, run automated tests, validate UI behavior, or check API endpoints."
---

# Webapp Testing

Comprehensive guide for automated web application testing including E2E tests, UI validation, API testing, and test automation strategies.

## Use Cases

- End-to-end (E2E) testing
- User interface validation
- API endpoint testing
- Form validation testing
- Authentication flow testing
- Responsive design testing

## Testing Tools

### 1. Playwright (Recommended)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Job Portal', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Job Portal');
    await expect(page.locator('.job-card')).toHaveCount({ minimum: 1 });
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

### 2. Selenium WebDriver

```javascript
const { Builder, By, until } = require('selenium-webdriver');

(async () => {
  const driver = await new Builder().forBrowser('chrome').build();

  await driver.get('http://localhost:3000');

  const title = await driver.getTitle();
  console.log('Page title:', title);

  await driver.quit();
})();
```

## E2E Testing Patterns

### 1. Page Object Model

```typescript
class LoginPage {
  constructor(page: Page) {
    this.page = page;
  }

  get emailInput() {
    return this.page.locator('[data-testid="email-input"]');
  }

  get passwordInput() {
    return this.page.locator('[data-testid="password-input"]');
  }

  get submitButton() {
    return this.page.locator('[data-testid="login-button"]');
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Usage
test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('test@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

### 2. Authentication Testing

```typescript
test.describe('Authentication', () => {
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist session after refresh', async ({ page, context }) => {
    await context.storageState({ path: './auth-state.json' });

    await page.goto('/dashboard');
    await expect(page.locator('.user-name')).toBeVisible();
  });
});
```

### 3. Form Validation Testing

```typescript
test.describe('Form Validation', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/post-job');

    await page.click('[type="submit"]');

    await expect(page.locator('[data-field="title"] .error'))
      .toContainText('Title is required');
    await expect(page.locator('[data-field="description"] .error'))
      .toContainText('Description is required');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'notanemail');
    await page.click('[type="submit"]');

    await expect(page.locator('[data-field="email"] .error'))
      .toContainText('Invalid email format');
  });

  test('should validate date range', async ({ page }) => {
    await page.goto('/work-logs/new');

    await page.fill('[name="endDate"]', '2024-01-01');
    await page.fill('[name="startDate"]', '2024-01-15');

    await page.click('[type="submit"]');

    await expect(page.locator('.error-message'))
      .toContainText('End date must be after start date');
  });
});
```

### 4. API Testing

```typescript
test.describe('API Testing', () => {
  test('should return jobs list', async ({ request }) => {
    const response = await request.get('/api/jobs');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.jobs)).toBe(true);
  });

  test('should create job successfully', async ({ request }) => {
    const newJob = {
      job_type_id: 'type123',
      job_description: 'Test job description',
      job_location: {
        city: 'Shanghai',
        state: 'Shanghai',
        country: 'China'
      }
    };

    const response = await request.post('/api/jobs', {
      data: newJob,
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.job_description).toBe(newJob.job_description);
  });

  test('should reject unauthorized access', async ({ request }) => {
    const response = await request.post('/api/jobs', {
      data: { job_description: 'Test' }
    });

    expect(response.status()).toBe(401);
  });
});
```

## UI Testing Patterns

### 1. Element Visibility

```typescript
test('should display job details correctly', async ({ page }) => {
  await page.goto('/jobs/123');

  await expect(page.locator('.job-title')).toBeVisible();
  await expect(page.locator('.job-description')).toBeVisible();
  await expect(page.locator('.apply-button')).toBeEnabled();
  await expect(page.locator('.company-logo')).toHaveAttribute('src', /logo/);
});
```

### 2. Interactive Elements

```typescript
test('should open modal on button click', async ({ page }) => {
  await page.click('[data-testid="open-modal-button"]');

  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal-title')).toContainText('Confirm Action');
});

test('should close modal on cancel', async ({ page }) => {
  await page.click('[data-testid="open-modal-button"]');
  await page.click('[data-testid="cancel-button"]');

  await expect(page.locator('.modal')).not.toBeVisible();
});
```

### 3. Data Display

```typescript
test('should display pagination correctly', async ({ page }) => {
  await page.goto('/jobs');

  await expect(page.locator('.pagination')).toBeVisible();
  await expect(page.locator('.pagination .page-number')).toHaveCount(10);
  await expect(page.locator('.showing-records')).toContainText('Showing 1-10 of 100');
});
```

### 4. Loading States

```typescript
test('should show loading spinner during API call', async ({ page }) => {
  await page.click('[data-testid="submit-button"]');

  await expect(page.locator('.loading-spinner')).toBeVisible();

  await page.waitForResponse('**/api/**');

  await expect(page.locator('.loading-spinner')).not.toBeVisible();
});
```

## Test Data Management

### 1. Fixtures

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
});

test.describe('With test data', () => {
  test.use({ testData: sampleJobPost });

  test('should create job with test data', async ({ page, testData }) => {
    await page.goto('/post-job');

    await page.fill('[name="title"]', testData.title);
    await page.fill('[name="description"]', testData.description);

    await page.click('[type="submit"]');

    await expect(page.locator('.success-message'))
      .toContainText('Job created successfully');
  });
});
```

### 2. Test Database

```typescript
beforeEach(async () => {
  await testDb.clear();
  await testDb.seed({
    users: [{ email: 'test@example.com', role: 'admin' }],
    jobs: [sampleJob],
    companies: [sampleCompany]
  });
});

afterEach(async () => {
  await testDb.cleanup();
});
```

## Freelancer Platform Tests

### 1. Work Log Tests

```typescript
test.describe('Work Log Management', () => {
  test('should create work log', async ({ page }) => {
    await page.goto('/work-logs/new');

    await page.selectOption('[name="project"]', 'SAP MM Project');
    await page.fill('[name="workDate"]', '2024-01-15');
    await page.fill('[name="hoursWorked"]', '8');
    await page.selectOption('[name="workType"]', '远程工作');
    await page.fill('[name="description"]', 'Completed inventory module configuration');

    await page.click('[data-testid="submit-worklog"]');

    await expect(page.locator('.success-message'))
      .toContainText('Work log submitted successfully');
  });

  test('should validate work hours', async ({ page }) => {
    await page.goto('/work-logs/new');

    await page.fill('[name="hoursWorked"]', '25');

    await page.click('[data-testid="submit-worklog"]');

    await expect(page.locator('[data-field="hoursWorked"] .error'))
      .toContainText('Hours must be between 0 and 24');
  });
});
```

### 2. Payment Tests

```typescript
test.describe('Payment Processing', () => {
  test('should display pending payments', async ({ page }) => {
    await page.goto('/payments');

    await expect(page.locator('.payment-card')).toHaveCount(3);
    await expect(page.locator('.payment-status.pending')).toBeVisible();
  });

  test('should upload payment voucher', async ({ page }) => {
    await page.goto('/payments/123');

    const fileInput = page.locator('[data-testid="voucher-upload"]');
    await fileInput.setInputFiles('./test-data/voucher.pdf');

    await page.click('[data-testid="submit-voucher"]');

    await expect(page.locator('.success-message'))
      .toContainText('Voucher uploaded successfully');
  });
});
```

## Test Reporting

### 1. Screenshots on Failure

```typescript
test('failed test takes screenshot', async ({ page }) => {
  await page.goto('/dashboard');

  try {
    await expect(page.locator('.non-existent-element')).toBeVisible();
  } catch (error) {
    await page.screenshot({
      path: `./test-results/screenshots/${Date.now()}.png`,
      fullPage: true
    });
    throw error;
  }
});
```

### 2. Test Summary

```typescript
afterAll(async () => {
  const report = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    skipped: tests.filter(t => t.status === 'skipped').length,
    duration: Date.now() - startTime
  };

  console.log('Test Report:', report);

  await generateHTMLReport(report);
});
```

## CI/CD Integration

```yaml
# GitHub Actions example
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: test-screenshots
          path: ./test-results/screenshots/
```
