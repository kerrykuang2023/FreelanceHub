import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5137';
const API_URL = process.env.E2E_API_URL || 'http://localhost:5555/api/v1';

async function login(page: Page, request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: 'freelancer@test.com',
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

  return token;
}

async function getAcceptedJobId(request: APIRequestContext, token: string) {
  const response = await request.get(`${API_URL}/job-applications/my-applications?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const acceptedApplication = (body.applications || []).find((application: any) => application.status === 'accepted');
  return acceptedApplication?.job_post_id?._id || acceptedApplication?.job_post_id || null;
}

test.describe('JOB-DETAIL: 已录用岗位申请入口', () => {
  test('已录用后岗位详情和详细申请页都不能再次申请', async ({ page, request }) => {
    const token = await login(page, request);
    const jobId = await getAcceptedJobId(request, token);

    test.skip(!jobId, '当前测试数据没有已录用申请');

    await page.goto(`${BASE_URL}/jobs/${jobId}`);
    await expect(page.getByText('已录用，不能重复申请')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Apply with Details')).toHaveCount(0);
    await expect(page.getByText('Quick Apply')).toHaveCount(0);

    await page.goto(`${BASE_URL}/jobs/${jobId}/apply`);
    await expect(page.getByText(/已被录用|不能再申请|不能重复申请/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Submit Application' })).toBeDisabled();
  });
});
