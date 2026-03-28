import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

test('Debug login response structure', async ({ page, request }) => {
  console.log('\n========== 登录响应结构调试 ==========\n');
  
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: 'freelancer@test.com',
      password: 'Test123456!'
    }
  });
  
  const body = await response.json();
  console.log('API响应结构:', JSON.stringify(body, null, 2));
  
  console.log('\nbody.token:', body.token);
  console.log('body.data?.token:', body.data?.token);
  console.log('body.user:', body.user);
  console.log('body.data?.user:', body.data?.user);
});
