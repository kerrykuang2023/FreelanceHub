import { test, expect, Page } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const BRAND_NAME = 'FreelanceHub';
const FORBIDDEN_BRAND_PATTERNS = [/JobPortal/i, /Job\s+Portal/i, /jobportal\.com/i];

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
  },
};

const SOURCE_SCAN_TARGETS = [
  'client/index.html',
  'client/src',
  'server/src/services/email.service.ts',
  'server/src/controllers',
];

const TEXT_FILE_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.ts',
  '.tsx',
]);

function getTextFiles(target: string): string[] {
  const fullPath = path.join(process.cwd(), target);

  if (!existsSync(fullPath)) {
    return [];
  }

  if (statSync(fullPath).isFile()) {
    return TEXT_FILE_EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
  }

  return readdirSync(fullPath).flatMap((entry) => {
    const entryPath = path.join(fullPath, entry);

    if (entry === 'node_modules' || entry === 'dist' || entry === 'build') {
      return [];
    }

    if (statSync(entryPath).isDirectory()) {
      return getTextFiles(path.relative(process.cwd(), entryPath));
    }

    return TEXT_FILE_EXTENSIONS.has(path.extname(entryPath)) ? [entryPath] : [];
  });
}

function collectForbiddenMatches(text: string, context: string): string[] {
  return FORBIDDEN_BRAND_PATTERNS.flatMap((pattern) => {
    const matches = text.match(pattern);
    return matches ? [`${context}: ${matches[0]}`] : [];
  });
}

async function assertNoOldBrandOnPage(page: Page, context: string) {
  const title = await page.title();
  const bodyText = await page.locator('body').innerText();
  const pageContent = await page.content();
  const ariaLabels = await page.locator('[aria-label]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('aria-label')?.trim()).filter(Boolean).join('\n')
  );
  const srOnlyLabels = await page.locator('.sr-only').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim()).filter(Boolean).join('\n')
  );

  const leaks = [
    ...collectForbiddenMatches(title, `${context} title`),
    ...collectForbiddenMatches(bodyText, `${context} visible text`),
    ...collectForbiddenMatches(pageContent, `${context} html`),
    ...collectForbiddenMatches(ariaLabels, `${context} aria labels`),
    ...collectForbiddenMatches(srOnlyLabels, `${context} screen-reader labels`),
  ];

  expect(leaks, `Old brand leaked in ${context}`).toEqual([]);
}

async function loginAsUser(page: Page, user: { email: string; password: string }) {
  await page.context().clearCookies();
  const response = await page.request.post('http://localhost:5555/api/v1/auth/login', {
    data: {
      email: user.email,
      password: user.password,
    },
  });
  const loginData = await response.json();
  const token = loginData.data?.token || loginData.token;

  expect(token, `Could not authenticate ${user.email}`).toBeTruthy();

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.evaluate((accessToken) => {
    localStorage.setItem('access_token', accessToken);
  }, token);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

test.describe('Brand verification - FreelanceHub', () => {
  test('source files used by UI and notifications do not contain old brand strings', () => {
    const scannedFiles = SOURCE_SCAN_TARGETS.flatMap(getTextFiles);
    const leaks = scannedFiles.flatMap((filePath) => {
      const text = readFileSync(filePath, 'utf8');
      return collectForbiddenMatches(text, path.relative(process.cwd(), filePath));
    });

    expect(scannedFiles.length).toBeGreaterThan(0);
    expect(leaks, 'Old brand leaked in source files').toEqual([]);
  });

  test('login page uses FreelanceHub in logo, title, hidden label, and footer copy', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await expect(page.getByText(BRAND_NAME).first()).toBeVisible();
    await expect(page.locator('.sr-only', { hasText: BRAND_NAME }).first()).toHaveText(BRAND_NAME);
    await expect(page).toHaveTitle(new RegExp(BRAND_NAME));
    await expect(page.locator('body')).toContainText(BRAND_NAME);
    await assertNoOldBrandOnPage(page, 'login page');
  });

  test('public app shell and footer use FreelanceHub without old-brand leaks', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.getByText(BRAND_NAME).first()).toBeVisible();
    await expect(page.locator('footer')).toContainText(BRAND_NAME);
    await expect(page).toHaveTitle(new RegExp(BRAND_NAME));
    await assertNoOldBrandOnPage(page, 'public app shell');
  });

  test('authenticated workspaces use FreelanceHub without visible or hidden old-brand leaks', async ({ page }) => {
    for (const [role, user] of Object.entries(TEST_USERS)) {
      await loginAsUser(page, user);

      await expect(page.getByText(BRAND_NAME).first()).toBeVisible();
      await expect(page.locator('.sr-only', { hasText: BRAND_NAME }).first()).toHaveText(BRAND_NAME);
      await assertNoOldBrandOnPage(page, `${role} workspace`);
    }
  });

  test('deep role pages keep the current brand in titles, labels, and rendered markup', async ({ page }) => {
    const pagesByRole = {
      freelancer: ['/jobs', '/work-logs', '/invoices', '/profile/switch-role'],
      hr: ['/post-job', '/company/applications', '/company/work-logs/pending', '/company/invoices/review', '/profile/switch-role'],
      admin: ['/admin', '/admin/users', '/admin/role-approvals', '/admin/configuration', '/profile/switch-role'],
    };

    for (const [role, pagePaths] of Object.entries(pagesByRole)) {
      await loginAsUser(page, TEST_USERS[role as keyof typeof TEST_USERS]);

      for (const pagePath of pagePaths) {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);

        await expect(page).toHaveTitle(new RegExp(BRAND_NAME));
        await assertNoOldBrandOnPage(page, `${role} ${pagePath}`);
      }
    }
  });

  test('HR onboarding copy uses the current brand', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.hr);
    await page.goto(`${BASE_URL}/hr/onboarding`);

    await expect(page.getByText(`欢迎加入${BRAND_NAME}`)).toBeVisible();
    await assertNoOldBrandOnPage(page, 'HR onboarding page');
  });
});
