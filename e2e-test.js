/**
 * JobPortal 端到端测试套件
 * E2E Test Suite for JobPortal
 */

const { chromium } = require('playwright');
const http = require('http');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555';

// 测试结果收集
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 测试辅助函数
async function test(name, fn) {
  try {
    await fn();
    testResults.passed.push(name);
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function warn(message) {
  testResults.warnings.push(message);
  console.log(`⚠️  WARN: ${message}`);
}

// HTTP 请求辅助函数
function httpRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 主测试函数
(async () => {
  console.log('\n🧪 JobPortal 端到端测试套件');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // ==================== 阶段1: 环境检查 ====================
  console.log('\n📋 阶段1: 环境检查');
  console.log('-'.repeat(30));
  
  await test('前端服务可访问', async () => {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
  });
  
  await test('后端API可访问', async () => {
    const response = await httpRequest('/health');
    if (response.status !== 200) throw new Error(`API returned ${response.status}`);
  });
  
  // ==================== 阶段2: API接口测试 ====================
  console.log('\n📋 阶段2: API接口测试');
  console.log('-'.repeat(30));
  
  await test('用户类型接口', async () => {
    const response = await httpRequest('/api/v1/auth/user-types');
    if (response.status !== 200) throw new Error(`User types API failed: ${response.status}`);
    if (!Array.isArray(response.data)) throw new Error('Response should be an array');
  });
  
  await test('职位列表接口', async () => {
    const response = await httpRequest('/api/v1/jobs');
    // 接受 200 或 401（需要认证）作为有效响应
    if (response.status !== 200 && response.status !== 401) {
      throw new Error(`Jobs API failed: ${response.status}`);
    }
    if (response.status === 200 && !response.data.jobs) {
      throw new Error('Response should contain jobs array');
    }
  });
  
  // ==================== 阶段3: 页面路由测试 ====================
  console.log('\n📋 阶段3: 页面路由测试');
  console.log('-'.repeat(30));
  
  await test('首页加载正常', async () => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { timeout: 5000 });
    const title = await page.title();
    if (!title) throw new Error('Page title is empty');
  });
  
  await test('登录页面可访问', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('form', { timeout: 5000 });
  });
  
  await test('注册页面可访问', async () => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForSelector('form', { timeout: 5000 });
  });
  
  // ==================== 阶段4: 用户注册测试 ====================
  console.log('\n📋 阶段4: 用户注册测试');
  console.log('-'.repeat(30));
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test@123456';
  
  await test('注册页面表单元素存在', async () => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const confirmPasswordInput = await page.$('#confirmPassword');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!emailInput) throw new Error('Email input not found');
    if (!passwordInput) throw new Error('Password input not found');
    if (!confirmPasswordInput) throw new Error('Confirm password input not found');
    if (!submitButton) throw new Error('Submit button not found');
  });
  
  await test('用户注册流程', async () => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(1000);
    
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);
    
    const termsCheckbox = await page.$('#termsConditions');
    if (termsCheckbox) {
      await termsCheckbox.check();
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-register-result.png' });
  });
  
  // ==================== 阶段5: 用户登录测试 ====================
  console.log('\n📋 阶段5: 用户登录测试');
  console.log('-'.repeat(30));
  
  await test('登录页面表单元素存在', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!emailInput) throw new Error('Email input not found');
    if (!passwordInput) throw new Error('Password input not found');
    if (!submitButton) throw new Error('Submit button not found');
  });
  
  // ==================== 阶段6: 前端功能测试 ====================
  console.log('\n📋 阶段6: 前端功能测试');
  console.log('-'.repeat(30));
  
  await test('首页布局结构', async () => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    const header = await page.$('header, nav, [class*="header"], [class*="nav"]');
    const main = await page.$('main, [class*="main"], [class*="content"]');
    
    if (!header && !main) {
      warn('Page structure may not be standard');
    }
    
    await page.screenshot({ path: 'test-homepage-layout.png' });
  });
  
  await test('响应式设计 - 移动端', async () => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-mobile-view.png' });
    
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
  
  // ==================== 测试结果汇总 ====================
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  console.log(`✅ 通过: ${testResults.passed.length}`);
  console.log(`❌ 失败: ${testResults.failed.length}`);
  console.log(`⚠️  警告: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.failed.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name}`);
      console.log(`     ${f.error}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    testResults.warnings.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w}`);
    });
  }
  
  console.log('\n📸 截图文件:');
  console.log('  - test-register-result.png');
  console.log('  - test-homepage-layout.png');
  console.log('  - test-mobile-view.png');
  
  await browser.close();
  
  process.exit(testResults.failed.length > 0 ? 1 : 0);
})();
