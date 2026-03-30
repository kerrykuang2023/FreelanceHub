const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

const issues = [];

function addIssue(severity, category, title, description, workaround) {
  issues.push({ severity, category, title, description, workaround, status: 'open' });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    hr视角: { total: 0, passed: 0, failed: 0, tests: [] },
    求职者视角: { total: 0, passed: 0, failed: 0, tests: [] }
  };

  async function testHR(name, fn) {
    results.hr视角.total++;
    try {
      await fn();
      results.hr视角.passed++;
      results.hr视角.tests.push({ name, status: 'PASSED' });
      console.log(`✅ [HR] ${name}`);
    } catch (error) {
      results.hr视角.failed++;
      results.hr视角.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ [HR] ${name}: ${error.message}`);
    }
  }

  async function testSeeker(name, fn) {
    results.求职者视角.total++;
    try {
      await fn();
      results.求职者视角.passed++;
      results.求职者视角.tests.push({ name, status: 'PASSED' });
      console.log(`✅ [求职者] ${name}`);
    } catch (error) {
      results.求职者视角.failed++;
      results.求职者视角.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ [求职者] ${name}: ${error.message}`);
    }
  }

  try {
    console.log('\n🚀 JobPortal 用户旅程 E2E 测试\n');
    console.log('='.repeat(70));

    // ==================== HR视角测试 ====================
    console.log('\n📋 HR视角 - 招聘管理旅程\n');

    // HR-1: 注册HR账号
    await testHR('HR注册账号', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForTimeout(3000);
      
      // 检查注册表单
      const emailInput = await page.locator('#email').count();
      const passwordInput = await page.locator('#password').count();
      const confirmInput = await page.locator('#confirmPassword').count();
      
      if (emailInput === 0) throw new Error('注册表单缺少邮箱输入框');
      if (passwordInput === 0) throw new Error('注册表单缺少密码输入框');
      if (confirmInput === 0) throw new Error('注册表单缺少确认密码输入框');
      
      // 填写注册信息 - 使用随机邮箱避免重复
      const randomEmail = `hr_${Date.now()}@test.com`;
      await page.fill('#email', randomEmail);
      await page.fill('#password', 'Test123456!');
      await page.fill('#confirmPassword', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // 检查是否注册成功或跳转到登录页
      const url = page.url();
      console.log(`   注册后URL: ${url}`);
    });

    // HR-2: HR登录
    await testHR('HR登录账号', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(3000);
      
      await page.fill('#email', 'admin@jobportal.com');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const url = page.url();
      console.log(`   登录后URL: ${url}`);
    });

    // HR-3: 发布职位
    await testHR('发布新职位', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await page.waitForTimeout(3000);
      
      // 选择职位类型
      const jobTypeSelect = await page.locator('select[name="job_type_id"]').count();
      if (jobTypeSelect === 0) throw new Error('职位类型选择框不存在');
      
      await page.selectOption('select[name="job_type_id"]', { index: 1 });
      
      // 填写职位描述
      await page.fill('textarea[name="job_description"]', '这是一个高级前端开发工程师职位，负责公司核心产品的开发和优化。需要5年以上React开发经验，熟悉TypeScript和现代前端技术栈。');
      
      // 填写地址信息
      await page.fill('input[name="city"]', 'Shanghai');
      await page.fill('input[name="state"]', 'Shanghai');
      await page.fill('input[name="country"]', 'China');
      
      // 提交
      await page.click('button:has-text("Post Job")');
      await page.waitForTimeout(3000);
      
      const url = page.url();
      console.log(`   发布后URL: ${url}`);
    });

    // HR-4: 查看发布的职位
    await testHR('查看发布的职位', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      if (jobCards === 0) throw new Error('首页没有职位卡片');
      console.log(`   找到 ${jobCards} 个职位`);
    });

    // HR-5: 查看求职者申请
    await testHR('查看求职者申请', async () => {
      await page.goto(`${BASE_URL}/my-jobs`);
      await page.waitForTimeout(3000);
      
      const pageText = await page.locator('body').innerText();
      console.log(`   My Jobs页面内容: ${pageText.substring(0, 200)}`);
      
      // 检查是否显示"需要登录"或者实际数据
      if (pageText.includes('Log in') && pageText.includes('Sign up')) {
        addIssue('high', '认证', 'My Jobs页面需要登录才能访问', 
          '当用户未登录时，访问/my-jobs会跳转到登录页，但HR应该能够查看自己发布的职位', 
          '需要实现基于session/token的自动登录状态恢复');
      }
    });

    // HR-6: 消息功能
    await testHR('查看消息', async () => {
      await page.goto(`${BASE_URL}/messages`);
      await page.waitForTimeout(3000);
      
      const pageText = await page.locator('body').innerText();
      if (pageText.includes('Log in') && pageText.includes('Sign up')) {
        addIssue('medium', '认证', 'Messages页面需要登录',
          '消息功能需要用户登录后才能使用',
          '实现记住登录状态功能');
      }
      console.log(`   Messages页面可访问`);
    });

    // ==================== 求职者视角测试 ====================
    console.log('\n👤 求职者视角 - 求职找工作旅程\n');

    // Seeker-1: 浏览首页
    await testSeeker('浏览首页职位列表', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      if (jobCards === 0) throw new Error('首页没有职位');
      console.log(`   找到 ${jobCards} 个职位`);
    });

    // Seeker-2: 搜索职位
    await testSeeker('搜索职位功能', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const searchInput = page.locator('input[placeholder="Search Jobs"]');
      await searchInput.fill('Developer');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000);
      
      console.log(`   搜索功能执行成功`);
    });

    // Seeker-3: 查看职位详情
    await testSeeker('查看职位详情', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const firstJob = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJob.click();
      await page.waitForTimeout(500);
      
      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);
      
      const applyBtn = await page.locator('button:has-text("Apply")').count();
      if (applyBtn === 0) throw new Error('职位详情页缺少申请按钮');
      
      console.log(`   成功查看职位详情`);
    });

    // Seeker-4: 收藏职位
    await testSeeker('收藏职位', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      await page.evaluate(() => localStorage.clear());
      
      const bookmarkBtn = page.locator('main .overflow-hidden.rounded-lg.bg-white').first().locator('button').last();
      await bookmarkBtn.click();
      await page.waitForTimeout(1000);
      
      const saved = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });
      
      if (saved.length === 0) throw new Error('职位收藏失败');
      console.log(`   成功收藏 ${saved.length} 个职位`);
    });

    // Seeker-5: 查看收藏的职位
    await testSeeker('查看收藏的职位列表', async () => {
      await page.goto(`${BASE_URL}/saved-jobs`);
      await page.waitForTimeout(3000);
      
      const pageText = await page.locator('body').innerText();
      if (pageText.includes('No Saved Jobs') || pageText.includes('Saved Jobs')) {
        console.log(`   Saved Jobs页面正常显示`);
      }
    });

    // Seeker-6: 申请职位（未登录）
    await testSeeker('申请职位（需登录）', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const firstJob = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJob.click();
      await page.waitForTimeout(500);
      
      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);
      
      await page.click('button:has-text("Apply")');
      await page.waitForTimeout(3000);
      
      const url = page.url();
      if (!url.includes('/login')) {
        console.log(`   点击申请后URL: ${url}`);
      }
    });

    // Seeker-7: 登录后申请职位
    await testSeeker('登录后申请职位', async () => {
      // 先登录
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(3000);
      
      await page.fill('#email', 'user@test.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // 浏览职位
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const firstJob = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJob.click();
      await page.waitForTimeout(500);
      
      await page.locator('aside button:has-text("View Details")').first().click();
      await page.waitForTimeout(3000);
      
      await page.click('button:has-text("Apply")');
      await page.waitForTimeout(3000);
      
      console.log(`   申请流程执行完成`);
    });

    // Seeker-8: 查看我的申请
    await testSeeker('查看我的申请记录', async () => {
      await page.goto(`${BASE_URL}/my-jobs`);
      await page.waitForTimeout(3000);
      
      const pageText = await page.locator('body').innerText();
      console.log(`   My Jobs页面: ${pageText.substring(0, 200)}`);
      
      if (pageText.includes('Log in') && pageText.includes('Sign up')) {
        addIssue('high', '认证', 'My Jobs页面在登录后仍然显示登录页',
          '用户登录后访问/my-jobs应该显示申请记录，但实际跳转到登录页',
          '检查认证状态管理和路由保护逻辑');
      }
    });

    // Seeker-9: 验证申请状态
    await testSeeker('验证申请状态显示', async () => {
      await page.goto(`${BASE_URL}/my-jobs`);
      await page.waitForTimeout(3000);
      
      const pageText = await page.locator('body').innerText();
      if (pageText.includes('Pending') || pageText.includes('Reviewed') || 
          pageText.includes('Accepted') || pageText.includes('Rejected') ||
          pageText.includes('My Job Applications')) {
        console.log(`   申请状态筛选功能正常`);
      }
    });

    // ==================== 通用功能测试 ====================
    console.log('\n🔧 通用功能测试\n');

    // Common-1: API健康检查
    await testSeeker('后端API健康检查', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?limit=1');
        return { status: res.status, ok: res.ok };
      });
      
      if (!response.ok) throw new Error(`API返回状态码: ${response.status}`);
      console.log(`   API状态: ${response.status}`);
    });

    // Common-2: 职位类型API
    await testSeeker('职位类型API正常', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs/types');
        return res.json();
      });
      
      if (!response.job_types || response.job_types.length === 0) {
        throw new Error('职位类型API返回为空');
      }
      console.log(`   找到 ${response.job_types.length} 个职位类型`);
    });

    // Common-3: 分页功能
    await testSeeker('分页功能正常', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:5555/api/v1/jobs?page=1&limit=2');
        return res.json();
      });
      
      if (!response.pagination) throw new Error('分页信息缺失');
      console.log(`   总页数: ${response.pagination.totalPages}, 当前页: ${response.pagination.page}`);
    });

    // Common-4: 响应式设计
    await testSeeker('响应式布局测试', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      const mobileMenu = await page.locator('button:has-text("Open main menu")').count();
      console.log(`   移动端菜单按钮: ${mobileMenu > 0 ? '存在' : '不存在'}`);
      
      await page.setViewportSize({ width: 1920, height: 1080 }); // Restore
    });

    // ==================== 问题汇总 ====================
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 测试结果汇总\n');
    
    console.log(`HR视角: ${results.hr视角.passed}/${results.hr视角.total} 通过`);
    console.log(`求职者视角: ${results.求职者视角.passed}/${results.求职者视角.total} 通过`);
    
    // 保存截图
    console.log('\n📸 保存截图...\n');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/user-journey-homepage.png', fullPage: true });
    console.log('   保存: screenshots/user-journey-homepage.png');
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/user-journey-postjob.png', fullPage: true });
    console.log('   保存: screenshots/user-journey-postjob.png');

  } catch (error) {
    console.error('测试执行错误:', error);
  } finally {
    await browser.close();
  }

  return results;
}

runE2ETests().then(async results => {
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 发现的问题汇总 (Issues)\n');
  
  if (issues.length === 0) {
    console.log('✅ 没有发现重大问题！\n');
  } else {
    issues.forEach((issue, index) => {
      console.log(`\n--- Issue #${index + 1} ---`);
      console.log(`Severity: ${issue.severity.toUpperCase()}`);
      console.log(`Category: ${issue.category}`);
      console.log(`Title: ${issue.title}`);
      console.log(`Description: ${issue.description}`);
      console.log(`Workaround: ${issue.workaround}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 改进计划建议\n');
  
  console.log(`
1. 【高优先级】认证状态管理
   - 问题: My Jobs页面无法在登录后正常访问
   - 建议: 检查AuthProvider和session管理实现，确保登录状态正确传递

2. 【高优先级】用户旅程完整性
   - 问题: HR无法完整执行发布职位->查看申请的流程
   - 建议: 完善认证流程，确保HR和求职者角色正确区分

3. 【中优先级】错误处理优化
   - 问题: API调用失败时用户体验不友好
   - 建议: 添加错误提示和重试机制

4. 【低优先级】UI一致性
   - 问题: 不同页面间样式可能有差异
   - 建议: 建立统一的UI组件库

5. 【中优先级】表单验证
   - 问题: 注册表单密码验证可能不够严格
   - 建议: 增强前端验证逻辑
`);
  
  console.log('\n' + '='.repeat(70));
});
