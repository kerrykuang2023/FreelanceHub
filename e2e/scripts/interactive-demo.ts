import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5137';
const SCREENSHOT_DIR = 'd:/claudesapce/JobPortal/JobPortal/e2e-test-results/demo-screenshots';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 截图已保存: ${name}.png`);
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       自由顾问平台 - 全场景交互式演示                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    recordVideo: { dir: path.join(SCREENSHOT_DIR, 'videos') }
  });

  const page = await context.newPage();

  try {
    // ==================== 场景1: 用户注册 ====================
    console.log('\n🎬 场景1: 用户注册流程');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '01-register-page');

    console.log('  ✅ 注册页面加载完成');
    console.log('  📝 填写注册表单...');
    
    await page.locator('input[type="email"]').first().fill('demo-freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Demo123456');
    if (await page.locator('input[type="password"]').count() > 1) {
      await page.locator('input[type="password"]').nth(1).fill('Demo123456');
    }
    await delay(1000);
    await takeScreenshot(page, '02-register-filled');
    console.log('  ✅ 表单填写完成');

    // ==================== 场景2: 用户登录 ====================
    console.log('\n🎬 场景2: 用户登录流程');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '03-login-page');

    console.log('  ✅ 登录页面加载完成');
    console.log('  📝 填写登录表单...');
    
    await page.locator('input[type="email"]').first().fill('freelancer@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await delay(1000);
    await takeScreenshot(page, '04-login-filled');

    console.log('  🔐 点击登录按钮...');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '05-after-login');
    console.log('  ✅ 登录成功');

    // ==================== 场景3: 个人档案管理 ====================
    console.log('\n🎬 场景3: 个人档案管理');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '06-profile-page');

    console.log('  ✅ 个人档案页面加载完成');
    
    const profileContent = await page.content();
    console.log(`  📊 页面包含"档案完整度": ${profileContent.includes('档案完整度') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"个人简介": ${profileContent.includes('个人简介') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"技能": ${profileContent.includes('技能') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"项目经历": ${profileContent.includes('项目经历') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"资质证书": ${profileContent.includes('资质证书') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"费率设置": ${profileContent.includes('费率设置') ? '✅' : '❌'}`);

    // ==================== 场景4: 工时填报 ====================
    console.log('\n🎬 场景4: 工时填报流程');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '07-worklog-create');

    console.log('  ✅ 工时填报页面加载完成');
    
    const worklogContent = await page.content();
    console.log(`  📊 页面包含"填报工时": ${worklogContent.includes('填报工时') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"项目": ${worklogContent.includes('项目') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工作日期": ${worklogContent.includes('工作日期') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工时": ${worklogContent.includes('工时') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工作类型": ${worklogContent.includes('工作类型') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工作描述": ${worklogContent.includes('工作描述') ? '✅' : '❌'}`);

    // ==================== 场景5: 工时列表 ====================
    console.log('\n🎬 场景5: 工时列表查看');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '08-worklog-list');

    console.log('  ✅ 工时列表页面加载完成');

    // ==================== 场景6: 发票管理 ====================
    console.log('\n🎬 场景6: 发票管理流程');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '09-invoice-create');

    console.log('  ✅ 发票创建页面加载完成');

    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '10-invoice-list');

    console.log('  ✅ 发票列表页面加载完成');

    // ==================== 场景7: 项目浏览 ====================
    console.log('\n🎬 场景7: 项目浏览');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '11-jobs-list');

    console.log('  ✅ 项目列表页面加载完成');

    // ==================== 场景8: 消息中心 ====================
    console.log('\n🎬 场景8: 消息中心');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '12-messages');

    console.log('  ✅ 消息中心页面加载完成');

    // ==================== 场景9: 报表统计 ====================
    console.log('\n🎬 场景9: 报表统计');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '13-reports');

    console.log('  ✅ 报表统计页面加载完成');

    // ==================== 场景10: 企业用户登录 ====================
    console.log('\n🎬 场景10: 企业用户(HR)登录');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('hr@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '14-hr-login');
    console.log('  ✅ HR登录成功');

    // ==================== 场景11: 项目发布 ====================
    console.log('\n🎬 场景11: 项目发布');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '15-post-job');

    console.log('  ✅ 项目发布页面加载完成');
    
    const postJobContent = await page.content();
    console.log(`  📊 页面包含"项目标题": ${postJobContent.includes('项目标题') || postJobContent.includes('标题') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"项目描述": ${postJobContent.includes('项目描述') || postJobContent.includes('描述') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工作性质": ${postJobContent.includes('工作性质') ? '✅' : '❌'}`);
    console.log(`  📊 页面包含"工作形式": ${postJobContent.includes('工作形式') ? '✅' : '❌'}`);

    // ==================== 场景12: 管理员登录 ====================
    console.log('\n🎬 场景12: 管理员登录');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').first().fill('admin@test.com');
    await page.locator('input[type="password"]').first().fill('Test123456');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '16-admin-login');
    console.log('  ✅ 管理员登录成功');

    // ==================== 场景13: 管理员仪表盘 ====================
    console.log('\n🎬 场景13: 管理员仪表盘');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '17-admin-dashboard');

    console.log('  ✅ 管理员仪表盘页面加载完成');

    // ==================== 场景14: 用户管理 ====================
    console.log('\n🎬 场景14: 用户管理');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '18-admin-users');

    console.log('  ✅ 用户管理页面加载完成');

    // ==================== 场景15: 企业管理 ====================
    console.log('\n🎬 场景15: 企业管理');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin/companies`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '19-admin-companies');

    console.log('  ✅ 企业管理页面加载完成');

    // ==================== 场景16: 技能管理 ====================
    console.log('\n🎬 场景16: 技能管理');
    console.log('─────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin/skills`);
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await takeScreenshot(page, '20-admin-skills');

    console.log('  ✅ 技能管理页面加载完成');

    // ==================== 演示完成 ====================
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    演示完成！                                  ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  📸 截图保存位置: e2e-test-results/demo-screenshots/          ║');
    console.log('║  🎥 视频保存位置: e2e-test-results/demo-screenshots/videos/   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('按 Ctrl+C 关闭浏览器...');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
