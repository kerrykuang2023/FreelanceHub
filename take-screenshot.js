const { chromium } = require('playwright');

(async () => {
  console.log('🚀 正在启动浏览器...');
  
  // 使用系统已安装的 Chrome
  const browser = await chromium.launch({
    channel: 'chrome',  // 使用系统 Chrome
    headless: true
  });
  
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  
  console.log('📱 正在访问 JobPortal 首页...');
  
  // 访问 JobPortal 首页
  await page.goto('http://localhost:5137', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // 等待页面加载完成
  await page.waitForTimeout(2000);
  
  console.log('📸 正在截图...');
  
  // 截图
  await page.screenshot({ 
    path: 'jobportal-homepage.png', 
    fullPage: true 
  });
  
  console.log('✅ 截图已保存: jobportal-homepage.png');
  
  await browser.close();
})();
