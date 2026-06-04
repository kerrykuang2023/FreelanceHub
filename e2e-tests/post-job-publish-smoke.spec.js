const { test, expect } = require("@playwright/test");

test("HR can publish a project from the UI", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("http://localhost:5137/login");
  await page.fill('input[type="email"], input[name="email"]', "hr@test.com");
  await page.fill('input[type="password"], input[name="password"]', "Test123456!");
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);

  await page.goto("http://localhost:5137/post-job");
  await page.fill('[data-testid="project-title-input"]', `UI Publish Test ${Date.now()}`);
  await page.fill(
    '[data-testid="project-description-input"]',
    "This project is created from the browser UI to verify the publish button sends a request successfully."
  );
  await page.fill('input[name="rate_amount"]', "1000");
  await page.fill('input[name="city"]', "Shanghai");
  await page.fill('input[name="country"]', "China");

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/v1/jobs") && response.request().method() === "POST",
    { timeout: 15000 }
  );
  await page.click('[data-testid="submit-job-btn"]');
  const response = await responsePromise;
  const body = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(body.job?._id).toBeTruthy();
  expect(body.project_requirement_id).toBeTruthy();
  expect(consoleErrors.slice(0, 5)).toEqual([]);
});
