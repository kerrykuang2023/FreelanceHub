import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5137';
const SCREENSHOT_DIR = 'e2e-test-results/screenshots';

interface FeatureCheck {
  featureId: string;
  featureName: string;
  expectedElements: string[];
  foundElements: string[];
  missingElements: string[];
  status: 'pass' | 'fail' | 'partial';
  screenshot: string;
  notes: string;
}

const featureChecks: FeatureCheck[] = [];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function checkElements(page: Page, selectors: string[]): Promise<{ found: string[]; missing: string[] }> {
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found.push(selector);
      } else {
        missing.push(selector);
      }
    } catch {
      missing.push(selector);
    }
  }
  
  return { found, missing };
}

async function captureAndCheck(
  page: Page,
  featureId: string,
  featureName: string,
  expectedElements: string[],
  screenshotName: string
): Promise<FeatureCheck> {
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  const { found, missing } = await checkElements(page, expectedElements);
  
  const status: 'pass' | 'fail' | 'partial' = 
    missing.length === 0 ? 'pass' : 
    found.length > 0 ? 'partial' : 'fail';
  
  const check: FeatureCheck = {
    featureId,
    featureName,
    expectedElements,
    foundElements: found,
    missingElements: missing,
    status,
    screenshot: screenshotPath,
    notes: status === 'pass' ? 'All elements found' : 
           status === 'partial' ? `Missing: ${missing.join(', ')}` : 
           'No expected elements found'
  };
  
  featureChecks.push(check);
  console.log(`[${status.toUpperCase()}] ${featureId}: ${featureName}`);
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(', ')}`);
  }
  
  return check;
}

test.describe('Freelancer Role - Complete User Journey', () => {
  test('AUTH-001: Registration Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'AUTH-001',
      '用户注册',
      [
        'input[type="email"]',
        'input[type="password"]',
        'input[name*="name" i]',
        'button[type="submit"]',
        'select[name*="role" i], select[name*="type" i]'
      ],
      'freelancer/auth-001-register.png'
    );
  });

  test('AUTH-002: Login Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'AUTH-002',
      '用户登录',
      [
        'input[type="email"]',
        'input[type="password"]',
        'button[type="submit"]',
        'a:has-text("忘记密码"), a:has-text("forgot")'
      ],
      'freelancer/auth-002-login.png'
    );
  });

  test('AUTH-003: Password Recovery', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'AUTH-003',
      '密码找回',
      [
        'input[type="email"]',
        'button[type="submit"]'
      ],
      'freelancer/auth-003-forgot-password.png'
    );
  });

  test('PROFILE-001: Profile Page - Basic Info', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROFILE-001',
      '个人档案-基本信息',
      [
        '[class*="profile"]',
        'button:has-text("编辑"), button:has-text("修改")',
        'input[name*="name" i], [class*="user-name"]'
      ],
      'freelancer/profile-001-basic.png'
    );
  });

  test('PROFILE-002: Skills Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    const skillsTab = page.locator('button:has-text("技能"), button:has-text("Skills")');
    if (await skillsTab.count() > 0) {
      await skillsTab.first().click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'PROFILE-002',
      '技能标签管理',
      [
        'button:has-text("添加技能"), button:has-text("添加"), button:has-text("新增")',
        '[class*="skill"], [data-testid="skill-list"]'
      ],
      'freelancer/profile-002-skills.png'
    );
  });

  test('PROFILE-003: Project Experience', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    const expTab = page.locator('button:has-text("项目经历"), button:has-text("经历"), button:has-text("Experience")');
    if (await expTab.count() > 0) {
      await expTab.first().click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'PROFILE-003',
      '项目经历管理',
      [
        'button:has-text("添加经历"), button:has-text("添加"), button:has-text("新增")',
        '[class*="experience"], [class*="project"]'
      ],
      'freelancer/profile-003-experience.png'
    );
  });

  test('PROFILE-004: Certifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    const certTab = page.locator('button:has-text("证书"), button:has-text("资质"), button:has-text("Certification")');
    if (await certTab.count() > 0) {
      await certTab.first().click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'PROFILE-004',
      '资质证书管理',
      [
        'button:has-text("添加证书"), button:has-text("添加"), button:has-text("新增")',
        '[class*="certification"], [class*="certificate"]'
      ],
      'freelancer/profile-004-certifications.png'
    );
  });

  test('PROFILE-005: Rate Settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    const settingsTab = page.locator('button:has-text("设置"), button:has-text("费率"), button:has-text("Settings")');
    if (await settingsTab.count() > 0) {
      await settingsTab.first().click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'PROFILE-005',
      '费率设置',
      [
        'input[type="number"]',
        'select[name*="currency" i], select'
      ],
      'freelancer/profile-005-rates.png'
    );
  });

  test('PROJ-002: Project List - Browse', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-002',
      '项目列表-浏览',
      [
        'input[placeholder*="Search" i], input[placeholder*="搜索" i], input[type="text"]',
        '[class*="rounded-lg"], [class*="shadow"], [class*="cursor-pointer"]'
      ],
      'freelancer/proj-002-project-list.png'
    );
  });

  test('PROJ-003: Project Detail', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    
    const projectCard = page.locator('[class*="rounded-lg"], [class*="cursor-pointer"], [class*="shadow"]').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      await page.waitForLoadState('networkidle');
    }
    
    await captureAndCheck(
      page,
      'PROJ-003',
      '项目详情',
      [
        '[class*="detail"], [class*="description"], h1, h2, h3',
        'button:has-text("Apply"), button:has-text("申请"), button:has-text("Quick Apply")'
      ],
      'freelancer/proj-003-project-detail.png'
    );
  });

  test('PROJ-004: Project Application', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-004',
      '项目申请',
      [
        'form, textarea',
        'button[type="submit"]'
      ],
      'freelancer/proj-004-application.png'
    );
  });

  test('PROJ-006: Smart Recommendations', async ({ page }) => {
    await page.goto(`${BASE_URL}/recommendations`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-006',
      '智能推荐',
      [
        '[class*="recommend"], [class*="match"], [class*="rounded-lg"], [class*="shadow"]'
      ],
      'freelancer/proj-006-recommendations.png'
    );
  });

  test('WORKLOG-001: Work Log Entry', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs/new`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'WORKLOG-001',
      '工时填报',
      [
        'input[type="date"], input[type="text"]',
        'input[type="number"]',
        'textarea, input[name*="description" i]',
        'select',
        'button[type="submit"], button:has-text("Submit"), button:has-text("提交")'
      ],
      'freelancer/worklog-001-entry.png'
    );
  });

  test('WORKLOG-002: Work Log List', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-logs`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'WORKLOG-002',
      '工时列表',
      [
        'table, [class*="list"], [class*="overflow-hidden"]',
        'a:has-text("填报"), a:has-text("创建"), button:has-text("填报"), a[href*="new"], button:has-text("New")'
      ],
      'freelancer/worklog-002-list.png'
    );
  });

  test('INV-001: Invoice Creation', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'INV-001',
      '发票创建',
      [
        'form',
        'button[type="submit"]'
      ],
      'freelancer/inv-001-creation.png'
    );
  });

  test('INV-002: Invoice List', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'INV-002',
      '发票列表',
      [
        'table, [class*="list"], [class*="overflow-hidden"]',
        'a:has-text("创建"), button:has-text("创建"), a[href*="new"], button:has-text("New"), button:has-text("Create")'
      ],
      'freelancer/inv-002-list.png'
    );
  });

  test('MSG-001: Messages/Notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'MSG-001',
      '消息通知',
      [
        'button:has-text("全部"), button:has-text("未读")',
        'h1:has-text("消息中心")',
        'div.divide-y, [class*="divide-y"]'
      ],
      'freelancer/msg-001-messages.png'
    );
  });

  test('RATE-001: Ratings Received', async ({ page }) => {
    await page.goto(`${BASE_URL}/ratings`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'RATE-001',
      '评价管理',
      [
        'button:has-text("收到"), button:has-text("发出")',
        'h1:has-text("评价管理")',
        '[class*="divide-y"], svg[class*="star"], [class*="StarIcon"]'
      ],
      'freelancer/rate-001-ratings.png'
    );
  });

  test('STAT-001: Reports/Statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'STAT-001',
      '数据统计',
      [
        'h1:has-text("数据统计")',
        '[class*="rounded-xl"], [class*="shadow-sm"]',
        'select'
      ],
      'freelancer/stat-001-reports.png'
    );
  });
});

test.describe('Company User Role - Complete User Journey', () => {
  test('PROJ-001: Project Posting', async ({ page }) => {
    await page.goto(`${BASE_URL}/post-job`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-001',
      '项目发布',
      [
        'input[name*="title" i], input[placeholder*="标题" i]',
        'textarea, input[name*="description" i]',
        'select',
        'button[type="submit"]'
      ],
      'company/proj-001-posting.png'
    );
  });

  test('PROJ-007: Project Edit', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-jobs`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-007',
      '项目编辑入口',
      [
        'h1, h2',
        '[class*="rounded-lg"], [class*="shadow"], [class*="card"]'
      ],
      'company/proj-007-edit.png'
    );
  });

  test('PROJ-005: Application Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/applications`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'PROJ-005',
      '申请管理',
      [
        'h1:has-text("申请"), h1:has-text("Application")',
        '[class*="overflow-hidden"], [class*="rounded-xl"], table'
      ],
      'company/proj-005-applications.png'
    );
  });

  test('WORKLOG-008: Work Log Review', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/work-logs/pending`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'WORKLOG-008',
      '工时审核',
      [
        'h1:has-text("工时"), h1:has-text("HR")',
        '[class*="rounded-xl"], [class*="shadow-sm"]'
      ],
      'company/worklog-008-review.png'
    );
  });

  test('INV-006: Invoice Review', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/review`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'INV-006',
      '发票审核',
      [
        'h1:has-text("发票审核")',
        'table, [class*="overflow-x-auto"]'
      ],
      'company/inv-006-review.png'
    );
  });

  test('HR-001: HR Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/dashboard`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'HR-001',
      'HR仪表盘',
      [
        'h1:has-text("HR Dashboard"), h1:has-text("仪表盘")',
        '[class*="rounded-xl"], [class*="shadow-sm"]'
      ],
      'company/hr-001-dashboard.png'
    );
  });
});

test.describe('Admin Role - Complete User Journey', () => {
  test('ADMIN-001: Admin Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'ADMIN-001',
      '管理员仪表盘',
      [
        'h1:has-text("系统管理"), h1:has-text("管理")',
        '[class*="rounded-xl"], [class*="shadow-sm"]'
      ],
      'admin/admin-001-dashboard.png'
    );
  });

  test('ADMIN-002: User Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    
    await captureAndCheck(
      page,
      'ADMIN-002',
      '用户管理',
      [
        'h1:has-text("用户管理")',
        'table, [class*="overflow-x-auto"]'
      ],
      'admin/admin-002-users.png'
    );
  });

  test('ADMIN-003: Company Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const companiesTab = page.locator('button:has-text("企业审核")');
    if (await companiesTab.count() > 0) {
      await companiesTab.click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'ADMIN-003',
      '企业管理',
      [
        'h1:has-text("系统管理"), button:has-text("企业审核")',
        'table, [class*="overflow-x-auto"]'
      ],
      'admin/admin-003-companies.png'
    );
  });

  test('ADMIN-004: Skill Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const skillsTab = page.locator('button:has-text("技能分类")');
    if (await skillsTab.count() > 0) {
      await skillsTab.click();
      await page.waitForTimeout(500);
    }
    
    await captureAndCheck(
      page,
      'ADMIN-004',
      '技能管理',
      [
        'h1:has-text("系统管理"), button:has-text("技能分类")',
        'button:has-text("添加分类")'
      ],
      'admin/admin-004-skills.png'
    );
  });
});

test.afterAll(() => {
  console.log('\n========== FEATURE CHECK SUMMARY ==========\n');
  
  const passed = featureChecks.filter(c => c.status === 'pass');
  const partial = featureChecks.filter(c => c.status === 'partial');
  const failed = featureChecks.filter(c => c.status === 'fail');
  
  console.log(`Total Features Checked: ${featureChecks.length}`);
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`⚠️ Partial: ${partial.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (partial.length > 0 || failed.length > 0) {
    console.log('\n---------- ISSUES FOUND ----------\n');
    
    [...partial, ...failed].forEach(check => {
      console.log(`[${check.status.toUpperCase()}] ${check.featureId}: ${check.featureName}`);
      console.log(`  Missing Elements: ${check.missingElements.join(', ')}`);
      console.log(`  Screenshot: ${check.screenshot}`);
      console.log('');
    });
  }
  
  const reportPath = path.join(SCREENSHOT_DIR, 'feature-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(featureChecks, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
});
