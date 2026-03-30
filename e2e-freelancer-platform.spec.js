const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const API_URL = process.env.API_URL || 'http://localhost:5555/api/v1';

describe('Freelancer Platform Complete E2E Tests', () => {
  let browser;
  let page;
  let freelancerToken;
  let companyToken;
  let adminToken;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Authentication', () => {
    test('Freelancer login', async () => {
      const response = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'freelancer@test.com',
          password: 'Test123456',
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      freelancerToken = data.data?.token;
    });

    test('Company login', async () => {
      const response = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'company@test.com',
          password: 'Test123456',
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      companyToken = data.data?.token;
    });

    test('Admin login', async () => {
      const response = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'admin@test.com',
          password: 'Admin123456',
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      adminToken = data.data?.token;
    });
  });

  describe('Match Recommendation System', () => {
    test('Get match score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/score?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: { Authorization: `Bearer ${freelancerToken}` },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalScore');
    });

    test('Get project recommendations', async () => {
      const response = await page.request.get(
        `${API_URL}/match/recommendations/projects`,
        {
          headers: { Authorization: `Bearer ${freelancerToken}` },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Contract Management', () => {
    let templateId;
    let contractId;

    test('Create contract template', async () => {
      const response = await page.request.post(`${API_URL}/contracts/templates`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Standard Service Contract',
          description: 'Standard contract for freelancer services',
          content: 'This contract is between {{company_name}} and {{freelancer_name}}...',
          variables: [
            { name: 'company_name', label: 'Company Name', type: 'text', required: true },
            { name: 'freelancer_name', label: 'Freelancer Name', type: 'text', required: true },
            { name: 'start_date', label: 'Start Date', type: 'date', required: true },
          ],
          is_default: true,
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(201);
      expect(data.success).toBe(true);
      templateId = data.data?._id;
    });

    test('Get contract templates', async () => {
      const response = await page.request.get(`${API_URL}/contracts/templates`, {
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBeGreaterThan(0);
    });

    test('Create contract', async () => {
      const response = await page.request.post(`${API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${companyToken}` },
        data: {
          template_id: templateId,
          project_id: 'test-project-id',
          freelancer_id: 'test-freelancer-id',
          company_id: 'test-company-id',
          title: 'Test Contract',
          variables: [
            { name: 'company_name', value: 'Test Company' },
            { name: 'freelancer_name', value: 'Test Freelancer' },
            { name: 'start_date', value: '2024-01-01' },
          ],
          start_date: '2024-01-01',
          end_date: '2024-06-30',
          terms: {
            daily_rate: 2000,
            currency: 'CNY',
            payment_terms: '月结',
            working_hours: '标准工时',
            notice_period_days: 30,
          },
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(201);
      contractId = data.data?._id;
    });

    test('Submit contract for signature', async () => {
      const response = await page.request.post(
        `${API_URL}/contracts/${contractId}/submit`,
        {
          headers: { Authorization: `Bearer ${companyToken}` },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Message System', () => {
    test('Get messages', async () => {
      const response = await page.request.get(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Get unread count', async () => {
      const response = await page.request.get(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('unreadCount');
    });

    test('Mark all as read', async () => {
      const response = await page.request.put(`${API_URL}/messages/read-all`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Rating System', () => {
    test('Create rating', async () => {
      const response = await page.request.post(`${API_URL}/ratings`, {
        headers: { Authorization: `Bearer ${companyToken}` },
        data: {
          project_id: 'test-project-id',
          reviewee_id: 'test-freelancer-id',
          dimensions: {
            professional_skill: 5,
            work_attitude: 4,
            communication: 5,
            delivery_quality: 4,
          },
          comment: 'Excellent work!',
          is_anonymous: false,
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(201);
      expect(data.success).toBe(true);
    });

    test('Get ratings', async () => {
      const response = await page.request.get(`${API_URL}/ratings`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Report System', () => {
    test('Get income report', async () => {
      const response = await page.request.get(
        `${API_URL}/reports/income?period=monthly&year=2024`,
        {
          headers: { Authorization: `Bearer ${freelancerToken}` },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Get project income breakdown', async () => {
      const response = await page.request.get(
        `${API_URL}/reports/income/projects`,
        {
          headers: { Authorization: `Bearer ${freelancerToken}` },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Get worklog stats', async () => {
      const response = await page.request.get(`${API_URL}/reports/worklog-stats`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Ticket System', () => {
    let ticketId;

    test('Create ticket', async () => {
      const response = await page.request.post(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
        data: {
          title: 'Payment Issue',
          description: 'I have not received my payment for the last project.',
          category: 'dispute',
          priority: 'high',
        },
      });
      const data = await response.json();
      expect(response.status()).toBe(201);
      expect(data.success).toBe(true);
      ticketId = data.data?._id;
    });

    test('Get tickets', async () => {
      const response = await page.request.get(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Add message to ticket', async () => {
      const response = await page.request.post(
        `${API_URL}/tickets/${ticketId}/messages`,
        {
          headers: { Authorization: `Bearer ${freelancerToken}` },
          data: {
            content: 'Please check the invoice number INV-2024-001',
          },
        }
      );
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Get ticket stats', async () => {
      const response = await page.request.get(`${API_URL}/tickets/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total');
    });
  });

  describe('Payment System', () => {
    test('Get payments', async () => {
      const response = await page.request.get(`${API_URL}/payments`, {
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });

    test('Get payment stats', async () => {
      const response = await page.request.get(`${API_URL}/payments/stats`, {
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
