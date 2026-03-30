/**
 * JobPortal UI 测试 - 可视化浏览器模式
 * Interactive UI Test for JobPortal
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🚀 启动 JobPortal UI 测试...\n');
  
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,  // 显示浏览器窗口
    slowMo: 100,      // 减慢操作速度，便于观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('📱 正在打开 JobPortal 首页...\n');
  console.log('='.repeat(50));
  console.log('📋 测试指南:');
  console.log('='.repeat(50));
  console.log('1. 首页 - 查看职位列表');
  console.log('2. 注册页面 - /register');
  console.log('3. 登录页面 - /login');
  console.log('4. 登录后可测试:');
  console.log('   - 发布职位');
  console.log('   - 申请职位');
  console.log('   - 查看个人资料');
  console.log('='.repeat(50));
  console.log('\n💡 提示: 浏览器将保持打开，你可以手动测试所有功能');
  console.log('💡 关闭浏览器窗口即可结束测试\n');
  
  // 访问首页
  await page.goto('http://localhost:5137', { waitUntil: 'networkidle' });
  
  console.log('✅ 首页已加载');
  console.log('🌐 当前页面: http://localhost:5137\n');
  
  // 等待用户手动测试
  // 浏览器将保持打开直到用户关闭
  await page.waitForTimeout(1000);
  
  console.log('🎯 你现在可以:');
  console.log('   - 点击导航栏测试页面跳转');
  console.log('   - 注册新用户');
  console.log('   - 登录测试');
  console.log('   - 测试职位相关功能');
  console.log('\n⏳ 浏览器将保持打开，关闭窗口即可退出...\n');
  
  // 保持浏览器打开，直到用户手动关闭
  // 这里的超时设置为 10 分钟，足够用户进行测试
  await page.waitForTimeout(600000);
  
  await browser.close();
  console.log('\n👋 UI 测试结束');
})();
