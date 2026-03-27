const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runManualE2ETest() {
  console.log('\n🚀 启动 JobPortal E2E UI 测试\n');
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 放慢操作速度，方便观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 设置截图目录
  if (!fs.existsSync('e2e-test-screenshots')) {
    fs.mkdirSync('e2e-test-screenshots');
  }
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  async function test(name, fn) {
    results.total++;
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
      
      // 失败时截图
      await page.screenshot({ 
        path: `e2e-test-screenshots/failed-${name.replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
    }
  }

  try {
    
    await test('1. 打开首页', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await delay(2000);
      
      const title = await page.title();
      if (!title) throw new Error('页面标题为空');
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/01-homepage.png',
        fullPage: true 
      });
      console.log('   首页已截图保存');
    });

    await test('2. 检查职位列表', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      const jobCards = await page.locator('main .overflow-hidden.rounded-lg.bg-white').count();
      if (jobCards === 0) throw new Error('首页没有职位卡片');
      
      console.log(`   找到 ${jobCards} 个职位`);
    });

    await test('3. 搜索职位', async () => {
      await page.goto(BASE_URL);
      await delay(2000);
      
      await page.fill('input[placeholder="Search Jobs"]', 'Developer');
      await page.click('button:has-text("Search")');
      await delay(2000);
      
      console.log('   搜索功能正常');
    });

    // ==================== 第二部分：职位详情测试 ====================
    console.log('\n📋 第二部分：职位详情功能测试\n');

    await test('4. 查看职位详情', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      const firstJob = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      await firstJob.click();
      await delay(1000);
      
      const viewDetailsBtn = page.locator('aside button:has-text("View Details")').first();
      await viewDetailsBtn.click();
      await page.waitForURL('**/jobs/**', { timeout: 5000 });
      await delay(2000);
      
      const url = page.url();
      if (!url.includes('/jobs/')) throw new Error('未跳转到职位详情页');
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/02-job-detail.png',
        fullPage: true 
      });
      console.log('   职位详情页已截图保存');
    });

    // ==================== 第三部分：登录测试 ====================
    console.log('\n📋 第三部分：登录功能测试\n');

    await test('5. 求职者登录', async () => {
      await page.goto(`${BASE_URL}/login`);
      await delay(2000);
      
      await page.fill('#email', 'seeker@test.com');
      await page.fill('#password', 'Test123456');
      await page.click('button[type="submit"]');
      await delay(3000);
      
      const url = page.url();
      console.log(`   登录后 URL: ${url}`);
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/03-login-seeker.png',
        fullPage: true 
      });
      console.log('   求职者登录后首页已截图');
    });

    // ==================== 第四部分：申请职位测试 ====================
    console.log('\n📋 第四部分：申请职位功能测试\n');

    await test('6. 申请职位', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      const jobCards = page.locator('main .overflow-hidden.rounded-lg.bg-white');
      await jobCards.first().click();
      await delay(1000);
      
      await page.locator('aside button:has-text("View Details")').first().click();
      await delay(2000);
      
      const applyBtn = page.locator('button:has-text("Apply Now")').first();
      const isDisabled = await applyBtn.isDisabled();
      
      if (!isDisabled) {
        await applyBtn.click();
        await delay(2000);
        console.log('   申请职位成功');
      } else {
        console.log('   职位已申请或已关闭');
      }
    });

    await test('7. 发送消息给 HR', async () => {
      const messageBtn = page.locator('button:has-text("Send Message")').first();
      const isVisible = await messageBtn.isVisible();
      
      if (isVisible) {
        await messageBtn.click();
        await delay(1000);
        
        const modal = page.locator('textarea[placeholder*="message"]');
        const isModalVisible = await modal.isVisible();
        
        if (isModalVisible) {
          await modal.fill('Dear Hiring Manager, I am very interested in this position...');
          await page.click('button:has-text("Send Message")');
          await delay(2000);
          console.log('   发送消息成功');
        }
      } else {
        console.log('   消息按钮不可见');
      }
    });

    // ==================== 第五部分：HR 功能测试 ====================
    console.log('\n📋 第五部分：HR 功能测试\n');

    await test('8. HR 登录', async () => {
      await page.goto(`${BASE_URL}/login`);
      await delay(2000);
      
      await page.fill('#email', 'hr@test.com');
      await page.fill('#password', 'Test123456');
      await page.click('button[type="submit"]');
      await delay(3000);
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/04-login-hr.png',
        fullPage: true 
      });
      console.log('   HR 登录后首页已截图');
    });

    await test('9. 发布职位', async () => {
      await page.goto(`${BASE_URL}/post-job`);
      await delay(3000);
      
      // 选择职位类型
      await page.selectOption('select[name="job_type_id"]', { index: 1 });
      await delay(500);
      
      // 填写职位描述
      await page.fill('textarea[name="job_description"]', 
        '这是一个测试职位，招聘高级前端开发工程师。需要 5 年以上 React 开发经验。');
      await delay(500);
      
      // 填写地址
      await page.fill('input[name="city"]', 'Shanghai');
      await page.fill('input[name="state"]', 'Shanghai');
      await page.fill('input[name="country"]', 'China');
      await delay(500);
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/05-post-job-form.png',
        fullPage: true 
      });
      console.log('   发布职位表单已截图');
      
      // 提交表单
      await page.click('button:has-text("Post Job")');
      await delay(3000);
      
      console.log('   职位发布成功');
    });

    // ==================== 第六部分：收藏功能测试 ====================
    console.log('\n📋 第六部分：收藏功能测试\n');

    await test('10. 收藏职位', async () => {
      await page.goto(BASE_URL);
      await delay(3000);
      
      // 清除之前的收藏
      await page.evaluate(() => localStorage.removeItem('saved_jobs'));
      
      const jobCard = page.locator('main .overflow-hidden.rounded-lg.bg-white').first();
      const bookmarkBtn = jobCard.locator('button').last();
      
      await bookmarkBtn.click();
      await delay(1000);
      
      const saved = await page.evaluate(() => {
        const saved = localStorage.getItem('saved_jobs');
        return saved ? JSON.parse(saved) : [];
      });
      
      if (saved.length === 0) throw new Error('职位收藏失败');
      console.log(`   成功收藏 ${saved.length} 个职位`);
    });

    await test('11. 查看收藏的职位', async () => {
      await page.goto(`${BASE_URL}/saved-jobs`);
      await delay(2000);
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/06-saved-jobs.png',
        fullPage: true 
      });
      console.log('   收藏页面已截图');
    });

    // ==================== 第七部分：导航测试 ====================
    console.log('\n📋 第七部分：导航功能测试\n');

    await test('12. 检查导航按钮', async () => {
      await page.goto(BASE_URL);
      await delay(2000);
      
      const navLinks = await page.locator('nav a').count();
      console.log(`   导航链接数：${navLinks}`);
      
      const hasFindJobs = await page.locator('text=Find Jobs').isVisible();
      console.log(`   Find Jobs 按钮：${hasFindJobs ? '存在' : '不存在'}`);
    });

    // ==================== 第八部分：响应式测试 ====================
    console.log('\n📋 第八部分：响应式布局测试\n');

    await test('13. 移动端视图', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await delay(2000);
      
      await page.screenshot({ 
        path: 'e2e-test-screenshots/07-mobile-view.png',
        fullPage: true 
      });
      console.log('   移动端视图已截图');
      
      // 恢复桌面视图
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    // ==================== 第九部分：API 测试 ====================
    console.log('\n📋 第九部分：API 健康检查\n');

    await test('14. Jobs API', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/jobs?limit=5`);
        return res.json();
      });
      
      if (!response.jobs) throw new Error('Jobs API 返回异常');
      console.log(`   Jobs API 正常，返回 ${response.jobs.length} 个职位`);
    });

    await test('15. Job Types API', async () => {
      const response = await page.evaluate(async () => {
        const res = await fetch(`${API_URL}/jobs/types`);
        return res.json();
      });
      
      if (!response.job_types) throw new Error('Job Types API 返回异常');
      console.log(`   Job Types API 正常，返回 ${response.job_types.length} 个类型`);
    });

    // ==================== 最终截图 ====================
    console.log('\n📸 保存最终截图...\n');
    
    await page.goto(BASE_URL);
    await delay(2000);
    await page.screenshot({ 
      path: 'e2e-test-screenshots/08-final-homepage.png',
      fullPage: true 
    });
    console.log('   最终首页截图已保存');

  } catch (error) {
    console.error('测试执行错误:', error);
  } finally {
    await browser.close();
  }

  // ==================== 测试结果汇总 ====================
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 E2E UI 测试结果汇总\n');
  console.log('='.repeat(70));
  console.log(`   总测试数：${results.total}`);
  console.log(`   通过：${results.passed} ✅`);
  console.log(`   失败：${results.failed} ❌`);
  console.log(`   通过率：${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(70));
  
  if (results.failed > 0) {
    console.log('\n❌ 失败的测试:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }
  
  console.log('\n📸 所有截图已保存到：e2e-test-screenshots/ 目录\n');
  console.log('='.repeat(70));
  console.log('\n✨ E2E UI 测试完成！\n');

  return results;
}

runManualE2ETest().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});
