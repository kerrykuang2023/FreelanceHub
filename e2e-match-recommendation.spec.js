const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';
const API_URL = process.env.API_URL || 'http://localhost:5555/api/v1';

describe('Match Recommendation E2E Tests', () => {
  let browser;
  let page;
  let freelancerToken;
  let companyToken;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const freelancerLogin = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'freelancer@test.com',
        password: 'Test123456',
      },
    });
    const freelancerData = await freelancerLogin.json();
    freelancerToken = freelancerData.data?.token;

    const companyLogin = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'company@test.com',
        password: 'Test123456',
      },
    });
    const companyData = await companyLogin.json();
    companyToken = companyData.data?.token;
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Match Score API', () => {
    test('should calculate match score for freelancer and project', async () => {
      const response = await page.request.get(
        `${API_URL}/match/score?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalScore');
      expect(data.data).toHaveProperty('skillScore');
      expect(data.data).toHaveProperty('locationScore');
      expect(data.data).toHaveProperty('rateScore');
      expect(data.data).toHaveProperty('availabilityScore');
      expect(data.data.totalScore).toBeGreaterThanOrEqual(0);
      expect(data.data.totalScore).toBeLessThanOrEqual(100);
    });

    test('should return 400 when missing parameters', async () => {
      const response = await page.request.get(`${API_URL}/match/score`, {
        headers: {
          Authorization: `Bearer ${freelancerToken}`,
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PARAMS');
    });

    test('should return 401 when not authenticated', async () => {
      const response = await page.request.get(
        `${API_URL}/match/score?freelancerId=test-id&projectId=test-id`
      );

      expect(response.status()).toBe(401);
    });
  });

  describe('Project Recommendations API', () => {
    test('should get project recommendations for freelancer', async () => {
      const response = await page.request.get(
        `${API_URL}/match/recommendations/projects?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should filter by minimum score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/recommendations/projects?minScore=50`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.length > 0) {
        for (const item of data.data) {
          expect(item.matchScore.totalScore).toBeGreaterThanOrEqual(50);
        }
      }
    });
  });

  describe('Freelancer Recommendations API', () => {
    test('should get freelancer recommendations for project', async () => {
      const response = await page.request.get(
        `${API_URL}/match/recommendations/test-project-id/freelancers`,
        {
          headers: {
            Authorization: `Bearer ${companyToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Individual Match Components', () => {
    test('should get skill match score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/skill?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('score');
      expect(data.data).toHaveProperty('matchedSubCategories');
      expect(data.data).toHaveProperty('unmatchedSubCategories');
    });

    test('should get location match score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/location?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('score');
      expect(data.data).toHaveProperty('matchType');
    });

    test('should get rate match score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/rate?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('score');
      expect(data.data).toHaveProperty('matchType');
    });

    test('should get availability match score', async () => {
      const response = await page.request.get(
        `${API_URL}/match/availability?freelancerId=test-freelancer-id&projectId=test-project-id`,
        {
          headers: {
            Authorization: `Bearer ${freelancerToken}`,
          },
        }
      );

      const data = await response.json();
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('score');
      expect(data.data).toHaveProperty('matchType');
    });
  });
});
