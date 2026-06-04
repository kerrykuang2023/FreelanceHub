import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5137';
const API_URL = process.env.E2E_API_URL || 'http://localhost:5555/api/v1';

async function loginAsFreelancer(page: Page, request: APIRequestContext) {
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
  await page.goto(`${BASE_URL}/profile`);
  await expect(page.getByTestId('profile-container')).toBeVisible({ timeout: 15000 });
}

test.describe('PROFILE-TABS: 个人档案页签操作一致性', () => {
  test.beforeEach(async ({ page, request }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await loginAsFreelancer(page, request);
  });

  test('新增和保存后应在各页签立刻回显', async ({ page }) => {
    const stamp = Date.now();
    const headline = `资深交付顾问 ${stamp}`;
    const location = `上海 ${stamp}`;
    const summary = `长期负责企业系统实施、流程梳理和跨团队交付，测试批次 ${stamp}`;
    const skillName = `E2E技能-${stamp}`;
    const projectName = `E2E项目-${stamp}`;
    const schoolName = `E2E大学-${stamp}`;
    const certificationName = `E2E证书-${stamp}`;

    await page.getByTestId('edit-profile-btn').click();
    await page.getByTestId('basic-headline-input').fill(headline);
    await page.getByTestId('basic-location-input').fill(location);
    await page.getByTestId('basic-summary-input').fill(summary);
    await page.getByTestId('basic-info-submit-btn').click();
    await expect(page.getByText(summary)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(location)).toBeVisible({ timeout: 15000 });

    await page.getByTestId('tab-skills').click();
    await page.getByTestId('add-skill-btn').click();
    await page.getByTestId('skill-name-input').fill(skillName);
    await page.getByTestId('skill-level-select').selectOption('高级');
    await page.getByTestId('skill-years-input').fill('6');
    await page.getByTestId('skill-submit-btn').click();
    await expect(page.getByTestId('skill-list').getByText(skillName)).toBeVisible({ timeout: 15000 });

    await page.getByTestId('tab-experience').click();
    await page.getByTestId('add-experience-btn').click();
    await page.getByTestId('project-name-input').fill(projectName);
    await page.getByTestId('project-company-input').fill('E2E客户公司');
    await page.getByTestId('project-role-input').fill('解决方案顾问');
    await page.getByTestId('project-start-date-input').fill('2022-01-01');
    await page.getByTestId('project-description-input').fill('负责需求澄清、方案设计、上线验收和持续优化。');
    await page.getByTestId('project-technologies-input').fill('ERP, CRM, PMO');
    await page.getByTestId('project-submit-btn').click();
    await expect(page.getByTestId('experience-item').filter({ hasText: projectName })).toBeVisible({ timeout: 15000 });

    await page.getByTestId('tab-education').click();
    await page.getByTestId('add-education-btn').click();
    await page.getByTestId('education-school-input').fill(schoolName);
    await page.getByTestId('education-degree-input').fill('本科');
    await page.getByTestId('education-field-input').fill('计算机科学');
    await page.getByTestId('education-start-date-input').fill('2014-09-01');
    await page.getByTestId('education-end-date-input').fill('2018-06-30');
    await page.getByTestId('education-submit-btn').click();
    await expect(page.getByTestId('education-item').filter({ hasText: schoolName })).toBeVisible({ timeout: 15000 });

    await page.getByTestId('tab-certifications').click();
    await page.getByTestId('add-certification-btn').click();
    await page.getByTestId('certification-name-input').fill(certificationName);
    await page.getByTestId('certification-issuer-input').fill('FreelanceHub Academy');
    await page.getByTestId('certification-issue-date-input').fill('2024-03-01');
    await page.getByTestId('certification-credential-id-input').fill(`CERT-${stamp}`);
    await page.getByTestId('certification-submit-btn').click();
    await expect(page.getByTestId('certification-item').filter({ hasText: certificationName })).toBeVisible({ timeout: 15000 });

    await page.getByTestId('tab-settings').click();
    await page.getByTestId('hourly-rate-input').fill('680');
    await page.getByTestId('daily-rate-input').fill('4200');
    await page.getByTestId('save-rates-btn').click();
    await expect(page.getByTestId('save-rates-btn')).toBeEnabled({ timeout: 15000 });

    await page.getByTestId('availability-status-select').selectOption('open_to_opportunities');
    await page.getByTestId('available-hours-input').fill('32');
    await page.getByTestId('save-availability-btn').click();
    await expect(page.getByTestId('save-availability-btn')).toBeEnabled({ timeout: 15000 });

    const language = `中文-${stamp}`;
    const portfolioUrl = `https://example.com/portfolio-${stamp}`;
    await page.getByTestId('profile-language-input').fill(language);
    await page.getByTestId('profile-language-proficiency-select').selectOption('商务');
    await page.getByTestId('profile-portfolio-urls-input').fill(portfolioUrl);
    await page.getByTestId('save-profile-extras-btn').click();
    await expect(page.getByTestId('save-profile-extras-btn')).toBeEnabled({ timeout: 15000 });

    await page.getByTestId('tab-overview').click();
    await expect(page.getByText('可接单').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('每周可工作 32 小时')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(skillName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`${language} - 商务`)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: portfolioUrl })).toBeVisible({ timeout: 15000 });
  });
});
