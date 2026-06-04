import { test, expect } from '@playwright/test';

const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:5137';
const API_URL = process.env.E2E_API_URL || 'http://localhost:5555/api/v1';

test('FREELANCER-DASHBOARD: 进行中项目数量与列表内容一致', async ({ page, request }) => {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'freelancer@test.com', password: 'Test123456!' },
  });
  expect(login.ok()).toBeTruthy();

  const loginBody = await login.json();
  const token = loginBody.data?.token || loginBody.token;
  expect(token).toBeTruthy();

  const projectsResponse = await request.get(`${API_URL}/jobs/my-projects?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(projectsResponse.ok()).toBeTruthy();
  const projectsBody = await projectsResponse.json();
  const ongoingProjects = (projectsBody.data || []).filter((project: any) =>
    ['published', 'in_progress', '发布', '进行中'].includes(project.status)
  );

  await page.addInitScript((accessToken) => {
    localStorage.setItem('access_token', accessToken);
  }, token);

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('进行中项目').first()).toBeVisible({ timeout: 15000 });

  const projectCards = page.getByTestId('ongoing-project-card');
  await expect(projectCards).toHaveCount(Math.min(ongoingProjects.length, 3));

  if (ongoingProjects.length > 0) {
    const firstProject = ongoingProjects[0];
    await expect(projectCards.first()).toContainText(firstProject.project_title || firstProject.job_title);
    await expect(projectCards.first()).toContainText(firstProject.company_name || firstProject.company_id?.company_name);
    await expect(projectCards.first()).toContainText('进行中');
  }
});
