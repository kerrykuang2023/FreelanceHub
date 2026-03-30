---
name: "playwright"
description: "Automates browser testing and web scraping using Playwright. Invoke when user needs end-to-end testing, browser automation, screenshot capture, or web page interaction."
---

# Playwright

Playwright is a powerful automation tool for browser testing and web scraping. It enables reliable end-to-end testing for modern web apps with cross-browser support.

## When to Invoke

- End-to-end (E2E) testing of web applications
- Browser automation and scripting
- Web scraping and data extraction
- Screenshot and PDF generation
- Performance testing and monitoring
- Visual regression testing
- API testing alongside UI testing

## Installation

```bash
# Install Playwright
npm init playwright@latest

# Or install as dependency
npm install -D @playwright/test

# Install browsers
npx playwright install
```

## Basic Usage

### 1. Create a Test File

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('basic navigation', async ({ page }) => {
  // Navigate to a page
  await page.goto('https://example.com');
  
  // Check page title
  await expect(page).toHaveTitle(/Example/);
  
  // Click a button
  await page.click('button#submit');
  
  // Fill a form
  await page.fill('input[name="email"]', 'test@example.com');
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
});
```

### 2. Run Tests

```bash
# Run all tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test example.spec.ts

# Run with specific browser
npx playwright test --project=chromium
```

## Key Features

### Cross-Browser Testing
- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)

### Auto-Waiting
Playwright automatically waits for elements to be ready:
```typescript
// No need for manual waits
await page.click('button'); // Waits for button to be visible & enabled
```

### Assertions
```typescript
// Page assertions
await expect(page).toHaveTitle('Page Title');
await expect(page).toHaveURL(/.*dashboard/);

// Element assertions
const locator = page.locator('.item');
await expect(locator).toHaveCount(3);
await expect(locator).toHaveText('Expected Text');
await expect(locator).toBeVisible();
await expect(locator).toBeEnabled();
```

### Screenshots & Videos
```typescript
// Screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Video recording (configured in playwright.config.ts)
const context = await browser.newContext({
  recordVideo: { dir: 'videos/' }
});
```

## Configuration

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Common Patterns

### Page Object Model
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
}

// tests/login.spec.ts
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### API Testing
```typescript
import { test, expect } from '@playwright/test';

test('API response check', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toContainEqual({
    id: 1,
    name: 'John'
  });
});
```

### Web Scraping
```typescript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  
  // Extract data
  const items = await page.$$eval('.item', elements => 
    elements.map(el => ({
      title: el.querySelector('h2')?.textContent,
      price: el.querySelector('.price')?.textContent
    }))
  );
  
  console.log(items);
  await browser.close();
})();
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Avoid hardcoded timeouts** - use auto-waiting
3. **Run tests in parallel** for faster execution
4. **Use Page Object Model** for maintainable tests
5. **Enable tracing** for debugging failures
6. **Run tests in CI/CD** for continuous validation

## Debugging

```bash
# Debug mode
npx playwright test --debug

# Step through tests
npx playwright test --paused

# View trace
npx playwright show-trace trace.zip
```

## Commands Summary

| Command | Description |
|---------|-------------|
| `npx playwright test` | Run all tests |
| `npx playwright test --ui` | Open UI mode |
| `npx playwright test --headed` | Show browser window |
| `npx playwright test --debug` | Debug mode |
| `npx playwright install` | Install browsers |
| `npx playwright codegen` | Generate tests from actions |
