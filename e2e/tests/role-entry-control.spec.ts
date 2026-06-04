import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from "@playwright/test";

const APP_URL = process.env.E2E_BASE_URL || "http://localhost:5137";
const API_URL = process.env.E2E_API_URL || "http://localhost:5555/api/v1";

const USERS = {
  admin: { email: "admin@test.com", password: "Test123456!" },
  hr: { email: "hr@test.com", password: "Test123456!" },
  freelancer: { email: "freelancer@test.com", password: "Test123456!" },
};

async function login(api: APIRequestContext, user: keyof typeof USERS) {
  const response = await api.post(`${API_URL}/auth/login`, { data: USERS[user] });
  expect(response.ok(), `${user} login should succeed`).toBeTruthy();
  const body = await response.json();
  const token = body.data?.token || body.token;
  expect(token, `${user} login should return token`).toBeTruthy();
  return token as string;
}

async function authenticate(page: Page, api: APIRequestContext, user: keyof typeof USERS) {
  const token = await login(api, user);
  await page.addInitScript((accessToken) => {
    localStorage.setItem("access_token", accessToken);
  }, token);
  return token;
}

async function expectPath(page: Page, path: string) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
}

async function ensurePublishedJob(api: APIRequestContext) {
  const jobsResponse = await api.get(`${API_URL}/jobs`, {
    params: { status: "published", limit: 1 },
  });
  expect(jobsResponse.ok()).toBeTruthy();
  const jobsBody = await jobsResponse.json();
  const existingJob = jobsBody.jobs?.[0];
  if (existingJob?._id) return existingJob._id as string;

  const hrToken = await login(api, "hr");
  const createResponse = await api.post(`${API_URL}/jobs`, {
    headers: { Authorization: `Bearer ${hrToken}` },
    data: {
      project_title: `Role audit project ${Date.now()}`,
      project_description: "Role access audit project with enough description text.",
      job_nature: "freelance",
      work_format: "remote",
      rate_type: "negotiable",
      rate_currency: "CNY",
      project_cycle: "1_month",
      hiring_count: 1,
      job_location: {
        city: "Shanghai",
        country: "China",
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const createBody = await createResponse.json();
  return createBody.job._id as string;
}

test.describe("role entry and control audit", () => {
  let api: APIRequestContext;
  let publishedJobId: string;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext();
    publishedJobId = await ensurePublishedJob(api);
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("guest cannot open the job posting flow directly", async ({ page }) => {
    await page.goto(`${APP_URL}/post-job`);
    await expectPath(page, "/login");
  });

  test("freelancer cannot access HR or admin management entry points", async ({ page }) => {
    const token = await authenticate(page, api, "freelancer");

    await page.goto(`${APP_URL}/post-job`);
    await expectPath(page, "/");

    await page.goto(`${APP_URL}/company/applications`);
    await expectPath(page, "/");

    await page.goto(`${APP_URL}/admin/financial`);
    await expectPath(page, "/");

    await page.goto(`${APP_URL}/jobs/${publishedJobId}/edit`);
    await expectPath(page, "/");

    const createResponse = await api.post(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        project_title: "Blocked freelancer job",
        project_description: "Freelancers should not be able to create job posts directly.",
        job_nature: "freelance",
        work_format: "remote",
        rate_type: "negotiable",
        project_cycle: "1_month",
        job_location: { city: "Shanghai", country: "China" },
      },
    });
    expect(createResponse.status()).toBe(403);
  });

  test("HR can post jobs but cannot enter freelancer application flow", async ({ page }) => {
    const token = await authenticate(page, api, "hr");

    await page.goto(`${APP_URL}/post-job`);
    await expect(page.getByTestId("post-job-page")).toBeVisible();

    await page.goto(`${APP_URL}/jobs/${publishedJobId}/apply`);
    await expectPath(page, "/");

    const applyResponse = await api.post(`${API_URL}/job-applications/jobs/${publishedJobId}/apply`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });
    expect(applyResponse.status()).toBe(403);
  });

  test("admin financial and settings links resolve to real pages", async ({ page }) => {
    await authenticate(page, api, "admin");

    await page.goto(`${APP_URL}/admin/financial`);
    await expectPath(page, "/admin");
    await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe("financial");
  });

  test("settings shortcut opens the profile settings tab", async ({ page }) => {
    await authenticate(page, api, "freelancer");

    await page.goto(`${APP_URL}/settings`);
    await expectPath(page, "/profile");
    await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe("settings");
    await expect(page.getByTestId("tab-settings")).toHaveClass(/border-blue/);
  });
});
