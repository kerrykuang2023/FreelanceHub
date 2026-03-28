import { test } from '@playwright/test';

/**
 * Mock 用户工具函数
 * 用于在测试前设置最高权限用户，避免重复登录
 */

/**
 * 设置 Mock 用户 Token
 * 在测试开始前调用此函数设置用户认证信息
 */
export async function mockAuthenticatedUser(page: any, userType: 'admin' | 'freelancer' | 'company' = 'admin') {
  // 创建 Mock 用户数据
  const mockUsers = {
    admin: {
      _id: 'mock-admin-id-001',
      id: 'mock-admin-id-001',
      email: 'admin@jobportal.com',
      user_type: 'admin',
      role: 'admin',
      name: '系统管理员',
    },
    freelancer: {
      _id: 'mock-freelancer-id-001',
      id: 'mock-freelancer-id-001',
      email: 'freelancer@jobportal.com',
      user_type: 'freelancer',
      role: 'freelancer',
      name: '测试自由顾问',
    },
    company: {
      _id: 'mock-company-id-001',
      id: 'mock-company-id-001',
      email: 'company@jobportal.com',
      user_type: 'company',
      role: 'company',
      name: '测试企业用户',
    },
  };

  const mockUser = mockUsers[userType];

  // 设置 localStorage 中的 token（模拟登录状态）
  await page.addInitScript((user) => {
    // 模拟 JWT token
    const mockToken = 'mock-jwt-token-' + user.id;
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(user));
  }, mockUser);

  console.log(`✓ Mock ${userType} user authenticated: ${mockUser.email}`);
}

/**
 * 清除 Mock 用户数据
 */
export async function clearMockUser(page: any) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
  console.log('✓ Mock user cleared');
}

/**
 * 创建已认证的测试上下文
 * 使用示例：
 * test.describe('功能测试', () => {
 *   test.beforeEach(async ({ page }) => {
 *     await mockAuthenticatedUser(page, 'admin');
 *   });
 *   
 *   test('测试功能', async ({ page }) => {
 *     // 测试代码...
 *   });
 * });
 */
export function createAuthenticatedTest(userType: 'admin' | 'freelancer' | 'company' = 'admin') {
  return {
    beforeEach: async ({ page }: any) => {
      await mockAuthenticatedUser(page, userType);
    },
  };
}
