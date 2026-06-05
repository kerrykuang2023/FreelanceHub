import { test, expect, Page, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5137';
const API_URL = process.env.E2E_API_URL || 'http://localhost:5555/api/v1';

async function loginAsHR(page: Page, request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: 'hr@test.com',
      password: 'Test123456!',
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const token = body.token || body.data?.token || body.accessToken || body.data?.accessToken;
  expect(token).toBeTruthy();

  await page.goto(BASE_URL);
  await page.evaluate((accessToken) => {
    localStorage.setItem('access_token', accessToken);
  }, token);
}

function createUploadFixture() {
  const filePath = path.resolve('test-results/company-media-upload.png');
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAfElEQVR4nO3QQQ3AIADAQEDBRJzJCZzI0gnigf3UWtDXvfeeJ4r9OoA5gAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYgAEYwJwPcR4DC8TvX0YAAAAASUVORK5CYII=',
    'base64'
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, image);
  return filePath;
}

test.describe('COMPANY-MEDIA: company brand image management', () => {
  test('HR can upload and view the company logo', async ({ page, request }) => {
    await loginAsHR(page, request);
    await page.goto(`${BASE_URL}/company`);

    await expect(page.getByTestId('company-management-page')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('upload-cover-button')).toBeVisible();
    await expect(page.getByTestId('upload-logo-button')).toBeVisible();

    await page.getByTestId('logo-file-input').setInputFiles(createUploadFixture());
    await expect(page.getByTestId('company-success-message')).toBeVisible({ timeout: 20000 });

    const logo = page.getByTestId('company-logo-image');
    await expect(logo).toBeVisible({ timeout: 20000 });

    const src = await logo.getAttribute('src');
    expect(src).toContain('/uploads/logos/');
    const assetResponse = await request.get(src!);
    expect(assetResponse.ok()).toBeTruthy();
  });
});
