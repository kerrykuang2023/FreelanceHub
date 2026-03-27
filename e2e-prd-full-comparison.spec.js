const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';
const TIMEOUT = 30000;
const TEST_RESULT_DIR = './e2e-test-results';
const SCREENSHOT_DIR = './e2e-test-screenshots';

if (!fs.existsSync(TEST_RESULT_DIR)) fs.mkdirSync(TEST_RESULT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function formatDate() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'INFO': '\x1b[36m',
    'SUCCESS': '\x1b[32m',
    'ERROR': '\x1b[31m',
    'WARNING': '\x1b[33m',
    'SECTION': '\x1b[35m',
  }[type] || '';
  const suffix = '\x1b[0m';
  console.log(`${prefix}[${timestamp}] [${type}] ${message}${suffix}`);
}

async function safeGoto(page, url, options = {}) {
  const defaultOptions = { timeout: TIMEOUT, waitUntil: 'domcontentloaded', ...options };
  for (let i = 0; i <= 2; i++) {
    try {
      await page.goto(url, defaultOptions);
      return true;
    } catch (e) {
      if (i < 2 && (e.message.includes('ERR_ABORTED') || e.message.includes('net::'))) {
        log(`Retry ${i + 1} for ${url}`, 'WARNING');
        await page.waitForTimeout(1000);
      } else {
        throw e;
      }
    }
  }
  return false;
}

async function takeScreenshot(page, name) {
  const filename = `${formatDate()}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: true, timeout: 10000 });
    log(`Screenshot: ${filename}`, 'SUCCESS');
    return filepath;
  } catch (e) {
    log(`Screenshot failed: ${e.message}`, 'ERROR');
    return null;
  }
}

async function checkElement(page, selector, name) {
  try {
    const count = await page.locator(selector).count();
    return { name, found: count > 0, count };
  } catch (e) {
    return { name, found: false, count: 0, error: e.message };
  }
}

async function checkMultipleElements(page, selectors) {
  const results = [];
  for (const { selector, name } of selectors) {
    const result = await checkElement(page, selector, name);
    results.push(result);
  }
  return results;
}

const PRD_FEATURES = {
  AUTH: {
    'AUTH-001': { name: '用户注册', path: '/register', priority: 'P0' },
    'AUTH-002': { name: '用户登录', path: '/login', priority: 'P0' },
    'AUTH-003': { name: '密码找回', path: '/forgot-password', priority: 'P0' },
    'AUTH-004': { name: '身份认证', path: null, priority: 'P0' },
    'AUTH-005': { name: '角色切换', path: null, priority: 'P1' },
    'AUTH-006': { name: '登录日志', path: null, priority: 'P2' },
  },
  PROFILE: {
    'PROFILE-001': { name: '基本信息管理', path: '/profile', priority: 'P0' },
    'PROFILE-002': { name: '技能标签管理', path: '/profile', priority: 'P0' },
    'PROFILE-003': { name: '项目经历管理', path: '/profile', priority: 'P0' },
    'PROFILE-004': { name: '资质证书管理', path: '/profile', priority: 'P0' },
    'PROFILE-005': { name: '费率设置', path: '/profile', priority: 'P0' },
    'PROFILE-006': { name: '可用性日历', path: '/profile', priority: 'P1' },
    'PROFILE-007': { name: '档案预览', path: '/profile', priority: 'P1' },
    'PROFILE-008': { name: '档案完整度', path: '/profile', priority: 'P1' },
  },
  PROJ: {
    'PROJ-001': { name: '项目发布', path: '/post-job', priority: 'P0' },
    'PROJ-002': { name: '项目列表', path: '/my-jobs', priority: 'P0' },
    'PROJ-003': { name: '项目详情', path: '/jobs/:id', priority: 'P0' },
    'PROJ-004': { name: '项目申请', path: null, priority: 'P0' },
    'PROJ-005': { name: '申请管理', path: null, priority: 'P0' },
    'PROJ-006': { name: '智能推荐', path: '/match-recommendations', priority: 'P0' },
    'PROJ-007': { name: '项目编辑', path: null, priority: 'P0' },
    'PROJ-008': { name: '项目状态管理', path: null, priority: 'P0' },
    'PROJ-009': { name: '项目收藏', path: '/saved-jobs', priority: 'P1' },
    'PROJ-010': { name: '项目搜索', path: '/my-jobs', priority: 'P1' },
  },
  WORKLOG: {
    'WORKLOG-001': { name: '工时填报', path: '/work-logs/new', priority: 'P0' },
    'WORKLOG-002': { name: '工时列表', path: '/work-logs', priority: 'P0' },
    'WORKLOG-003': { name: '工时详情', path: null, priority: 'P0' },
    'WORKLOG-004': { name: '工时编辑', path: null, priority: 'P0' },
    'WORKLOG-005': { name: '工时删除', path: '/work-logs', priority: 'P0' },
    'WORKLOG-006': { name: '工时提交', path: '/work-logs', priority: 'P0' },
    'WORKLOG-007': { name: '批量提交', path: '/work-logs', priority: 'P0' },
    'WORKLOG-008': { name: '工时审核', path: '/company/work-logs/pending', priority: 'P0' },
    'WORKLOG-009': { name: '工时统计', path: '/', priority: 'P1' },
    'WORKLOG-010': { name: '工时导出', path: null, priority: 'P2' },
  },
  INV: {
    'INV-001': { name: '发票创建', path: '/invoices/new', priority: 'P0' },
    'INV-002': { name: '发票列表', path: '/invoices', priority: 'P0' },
    'INV-003': { name: '发票详情', path: null, priority: 'P0' },
    'INV-004': { name: '发票编辑', path: null, priority: 'P0' },
    'INV-005': { name: '发票提交', path: '/invoices', priority: 'P0' },
    'INV-006': { name: '发票审核', path: null, priority: 'P0' },
    'INV-007': { name: '付款确认', path: '/payments', priority: 'P0' },
    'INV-008': { name: '税务计算', path: '/invoices/new', priority: 'P0' },
    'INV-009': { name: '发票统计', path: '/reports', priority: 'P1' },
    'INV-010': { name: '发票导出', path: null, priority: 'P2' },
  },
  MSG: {
    'MSG-001': { name: '站内消息', path: '/messages', priority: 'P0' },
    'MSG-002': { name: '系统通知', path: null, priority: 'P0' },
    'MSG-003': { name: '消息设置', path: null, priority: 'P1' },
    'MSG-004': { name: '邮件通知', path: null, priority: 'P1' },
    'MSG-005': { name: '短信通知', path: null, priority: 'P2' },
  },
  RATE: {
    'RATE-001': { name: '顾问评价', path: '/ratings/create', priority: 'P1' },
    'RATE-002': { name: '企业评价', path: null, priority: 'P1' },
    'RATE-003': { name: '评价展示', path: null, priority: 'P1' },
    'RATE-004': { name: '评分统计', path: '/profile', priority: 'P1' },
    'RATE-005': { name: '评价管理', path: null, priority: 'P2' },
  },
  STAT: {
    'STAT-001': { name: '顾问收入统计', path: '/reports', priority: 'P1' },
    'STAT-002': { name: '顾问工时统计', path: '/reports', priority: 'P1' },
    'STAT-003': { name: '企业项目统计', path: '/hr/dashboard', priority: 'P1' },
    'STAT-004': { name: '企业顾问统计', path: null, priority: 'P1' },
    'STAT-005': { name: '平台运营统计', path: '/admin/dashboard', priority: 'P1' },
    'STAT-006': { name: '财务报表', path: '/reports', priority: 'P2' },
    'STAT-007': { name: '数据导出', path: null, priority: 'P2' },
  },
  ADMIN: {
    'ADMIN-001': { name: '仪表盘', path: '/admin/dashboard', priority: 'P0' },
    'ADMIN-002': { name: '用户管理', path: null, priority: 'P0' },
    'ADMIN-003': { name: '企业管理', path: '/admin/companies/:id', priority: 'P0' },
    'ADMIN-004': { name: '顾问管理', path: null, priority: 'P0' },
    'ADMIN-005': { name: '技能管理', path: '/admin/config/skill-categories', priority: 'P0' },
    'ADMIN-006': { name: '系统配置', path: '/admin/configuration', priority: 'P0' },
    'ADMIN-007': { name: '内容审核', path: null, priority: 'P1' },
    'ADMIN-008': { name: '纠纷处理', path: '/tickets', priority: 'P1' },
    'ADMIN-009': { name: '操作日志', path: null, priority: 'P2' },
    'ADMIN-010': { name: '数据分析', path: '/admin/dashboard', priority: 'P2' },
  },
  NEW_FEATURES: {
    'MATCH-001': { name: '智能匹配推荐', path: '/match-recommendations', priority: 'P0' },
    'CONTRACT-001': { name: '合同管理', path: '/contracts', priority: 'P0' },
    'MILESTONE-001': { name: '项目进度看板', path: '/milestones', priority: 'P1' },
    'PAYMENT-001': { name: '付款追踪', path: '/payments', priority: 'P0' },
    'TICKET-001': { name: '工单/纠纷处理', path: '/tickets', priority: 'P1' },
  },
};

async function testPublicPages(page) {
  log('=== Testing Public Pages ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const publicPages = [
    { url: '/', name: 'Homepage', featureId: 'PUBLIC-001' },
    { url: '/login', name: 'Login', featureId: 'AUTH-002' },
    { url: '/register', name: 'Register', featureId: 'AUTH-001' },
    { url: '/forgot-password', name: 'ForgotPassword', featureId: 'AUTH-003' },
  ];

  for (const pageInfo of publicPages) {
    log(`Testing: ${pageInfo.name}`);
    try {
      await safeGoto(page, `${BASE_URL}${pageInfo.url}`);
      await page.waitForTimeout(1500);
      await takeScreenshot(page, `public-${pageInfo.name.toLowerCase()}`);
      
      const elements = await checkMultipleElements(page, [
        { selector: 'form', name: 'Form' },
        { selector: 'input', name: 'Input' },
        { selector: 'button', name: 'Button' },
      ]);
      
      results.features[pageInfo.featureId] = {
        status: 'IMPLEMENTED',
        path: pageInfo.url,
        elements: elements,
      };
      results.passed++;
      log(`${pageInfo.name} OK`, 'SUCCESS');
    } catch (e) {
      results.failed++;
      results.errors.push(`${pageInfo.name}: ${e.message}`);
      results.features[pageInfo.featureId] = { status: 'ERROR', error: e.message };
      log(`${pageInfo.name} FAILED: ${e.message}`, 'ERROR');
    }
  }

  return results;
}

async function testFreelancerFeatures(page) {
  log('=== Testing Freelancer Features ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const freelancerPages = [
    { url: '/', name: 'FreelancerDashboard', featureId: 'STAT-001', selectors: ['h1', 'h2', '.card', '.stat', '.dashboard'] },
    { url: '/profile', name: 'Profile', featureId: 'PROFILE-001', selectors: ['form', 'input[name*="name"]', 'input[name*="email"]', 'button[type="submit"]'] },
    { url: '/my-jobs', name: 'MyJobs', featureId: 'PROJ-002', selectors: ['.job', '.project', 'table', '.list'] },
    { url: '/saved-jobs', name: 'SavedJobs', featureId: 'PROJ-009', selectors: ['.job', '.saved', 'table', '.list'] },
    { url: '/work-logs', name: 'WorkLogs', featureId: 'WORKLOG-002', selectors: ['table', '.work-log', 'button'] },
    { url: '/work-logs/new', name: 'CreateWorkLog', featureId: 'WORKLOG-001', selectors: ['form', 'select', 'input[type="date"]', 'textarea', 'button[type="submit"]'] },
    { url: '/invoices', name: 'Invoices', featureId: 'INV-002', selectors: ['table', '.invoice', 'button'] },
    { url: '/invoices/new', name: 'CreateInvoice', featureId: 'INV-001', selectors: ['form', 'select', 'input', 'button[type="submit"]'] },
    { url: '/match-recommendations', name: 'MatchRecommendations', featureId: 'MATCH-001', selectors: ['.match', '.recommendation', '.score', 'table', '.card'] },
    { url: '/contracts', name: 'Contracts', featureId: 'CONTRACT-001', selectors: ['table', '.contract', 'button'] },
    { url: '/milestones', name: 'Milestones', featureId: 'MILESTONE-001', selectors: ['.milestone', '.progress', 'table', '.card'] },
    { url: '/payments', name: 'Payments', featureId: 'PAYMENT-001', selectors: ['table', '.payment', 'button'] },
    { url: '/messages', name: 'Messages', featureId: 'MSG-001', selectors: ['.message', 'table', '.chat', '.list'] },
    { url: '/reports', name: 'Reports', featureId: 'STAT-001', selectors: ['.report', '.chart', '.stat', 'table'] },
    { url: '/ratings/create', name: 'CreateRating', featureId: 'RATE-001', selectors: ['form', '.rating', 'input[type="radio"]', 'button'] },
    { url: '/tickets', name: 'Tickets', featureId: 'TICKET-001', selectors: ['table', '.ticket', 'button'] },
  ];

  for (const pageInfo of freelancerPages) {
    log(`Testing: ${pageInfo.name}`);
    try {
      await safeGoto(page, `${BASE_URL}${pageInfo.url}`);
      await page.waitForTimeout(1500);
      await takeScreenshot(page, `freelancer-${pageInfo.name.toLowerCase()}`);
      
      const foundElements = [];
      for (const selector of pageInfo.selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) foundElements.push({ selector, count });
      }
      
      const hasContent = foundElements.length > 0;
      
      results.features[pageInfo.featureId] = {
        status: hasContent ? 'IMPLEMENTED' : 'EMPTY',
        path: pageInfo.url,
        foundElements,
      };
      
      if (hasContent) {
        results.passed++;
        log(`${pageInfo.name} OK`, 'SUCCESS');
      } else {
        results.failed++;
        results.errors.push(`${pageInfo.name}: Page empty or no matching elements`);
        log(`${pageInfo.name} EMPTY`, 'WARNING');
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${pageInfo.name}: ${e.message}`);
      results.features[pageInfo.featureId] = { status: 'ERROR', error: e.message };
      log(`${pageInfo.name} FAILED: ${e.message}`, 'ERROR');
    }
  }

  return results;
}

async function testHRFeatures(page) {
  log('=== Testing HR/Company Features ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const hrPages = [
    { url: '/hr/dashboard', name: 'HRDashboard', featureId: 'STAT-003', selectors: ['h1', 'h2', '.card', '.stat', '.dashboard'] },
    { url: '/post-job', name: 'PostJob', featureId: 'PROJ-001', selectors: ['form', 'input[name*="title"]', 'textarea', 'select', 'button[type="submit"]'] },
    { url: '/company/work-logs/pending', name: 'HRWorkLogs', featureId: 'WORKLOG-008', selectors: ['table', '.work-log', 'button', '.pending'] },
    { url: '/my-jobs', name: 'MyJobs', featureId: 'PROJ-002', selectors: ['table', '.job', '.project'] },
  ];

  for (const pageInfo of hrPages) {
    log(`Testing: ${pageInfo.name}`);
    try {
      await safeGoto(page, `${BASE_URL}${pageInfo.url}`);
      await page.waitForTimeout(1500);
      await takeScreenshot(page, `hr-${pageInfo.name.toLowerCase()}`);
      
      const foundElements = [];
      for (const selector of pageInfo.selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) foundElements.push({ selector, count });
      }
      
      const hasContent = foundElements.length > 0;
      
      results.features[pageInfo.featureId] = {
        status: hasContent ? 'IMPLEMENTED' : 'EMPTY',
        path: pageInfo.url,
        foundElements,
      };
      
      if (hasContent) {
        results.passed++;
        log(`${pageInfo.name} OK`, 'SUCCESS');
      } else {
        results.failed++;
        results.errors.push(`${pageInfo.name}: Page empty or no matching elements`);
        log(`${pageInfo.name} EMPTY`, 'WARNING');
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${pageInfo.name}: ${e.message}`);
      results.features[pageInfo.featureId] = { status: 'ERROR', error: e.message };
      log(`${pageInfo.name} FAILED: ${e.message}`, 'ERROR');
    }
  }

  return results;
}

async function testAdminFeatures(page) {
  log('=== Testing Admin Features ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const adminPages = [
    { url: '/admin/dashboard', name: 'AdminDashboard', featureId: 'ADMIN-001', selectors: ['h1', 'h2', '.card', '.stat', '.dashboard'] },
    { url: '/admin/configuration', name: 'SystemConfiguration', featureId: 'ADMIN-006', selectors: ['form', 'input', 'select', 'button', '.config'] },
    { url: '/admin/config/skill-categories', name: 'SkillCategories', featureId: 'ADMIN-005', selectors: ['table', '.skill', 'button', '.category'] },
    { url: '/admin/config/work-types', name: 'WorkTypes', featureId: 'ADMIN-005', selectors: ['table', '.work-type', 'button'] },
    { url: '/admin/config/tax-rates', name: 'TaxRates', featureId: 'ADMIN-006', selectors: ['table', '.tax', 'button'] },
    { url: '/admin/config/currencies', name: 'Currencies', featureId: 'ADMIN-006', selectors: ['table', '.currency', 'button'] },
    { url: '/tickets', name: 'AdminTickets', featureId: 'ADMIN-008', selectors: ['table', '.ticket', 'button'] },
  ];

  for (const pageInfo of adminPages) {
    log(`Testing: ${pageInfo.name}`);
    try {
      await safeGoto(page, `${BASE_URL}${pageInfo.url}`);
      await page.waitForTimeout(1500);
      await takeScreenshot(page, `admin-${pageInfo.name.toLowerCase()}`);
      
      const foundElements = [];
      for (const selector of pageInfo.selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) foundElements.push({ selector, count });
      }
      
      const hasContent = foundElements.length > 0;
      
      results.features[pageInfo.featureId] = {
        status: hasContent ? 'IMPLEMENTED' : 'EMPTY',
        path: pageInfo.url,
        foundElements,
      };
      
      if (hasContent) {
        results.passed++;
        log(`${pageInfo.name} OK`, 'SUCCESS');
      } else {
        results.failed++;
        results.errors.push(`${pageInfo.name}: Page empty or no matching elements`);
        log(`${pageInfo.name} EMPTY`, 'WARNING');
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${pageInfo.name}: ${e.message}`);
      results.features[pageInfo.featureId] = { status: 'ERROR', error: e.message };
      log(`${pageInfo.name} FAILED: ${e.message}`, 'ERROR');
    }
  }

  return results;
}

async function testNavigation(page) {
  log('=== Testing Navigation & Layout ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const viewports = [
    { size: { width: 1920, height: 1080 }, name: 'desktop' },
    { size: { width: 768, height: 1024 }, name: 'tablet' },
    { size: { width: 375, height: 667 }, name: 'mobile' },
  ];

  for (const vp of viewports) {
    log(`Testing viewport: ${vp.name}`);
    try {
      await page.setViewportSize(vp.size);
      await safeGoto(page, BASE_URL);
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `layout-${vp.name}`);
      results.passed++;
    } catch (e) {
      results.failed++;
      results.errors.push(`Viewport ${vp.name}: ${e.message}`);
    }
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  return results;
}

async function testAPIs(page) {
  log('=== Testing APIs ===', 'SECTION');
  const results = { passed: 0, failed: 0, errors: [], features: {} };

  const apis = [
    { endpoint: '/jobs', name: 'JobsAPI' },
    { endpoint: '/skills/categories', name: 'SkillsAPI' },
    { endpoint: '/auth/login', name: 'AuthAPI', method: 'POST', body: { email: 'test@test.com', password: 'wrong' } },
  ];

  for (const api of apis) {
    log(`Testing API: ${api.name}`);
    try {
      const response = await page.evaluate(async ({ apiUrl, endpoint, method, body }) => {
        try {
          const res = await fetch(`${apiUrl}${endpoint}`, {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
          });
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { error: e.message };
        }
      }, { apiUrl: API_URL, ...api });

      if (response.ok || response.status === 400 || response.status === 401) {
        results.passed++;
        results.features[api.name] = { status: 'WORKING', response };
        log(`${api.name} OK (${response.status})`, 'SUCCESS');
      } else if (response.error) {
        results.failed++;
        results.errors.push(`${api.name}: ${response.error}`);
        results.features[api.name] = { status: 'ERROR', error: response.error };
      } else {
        results.passed++;
        results.features[api.name] = { status: 'RESPONDING', response };
        log(`${api.name} responding (${response.status})`, 'WARNING');
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${api.name}: ${e.message}`);
      results.features[api.name] = { status: 'ERROR', error: e.message };
    }
  }

  return results;
}

async function generateComparisonReport(testResults) {
  log('=== Generating PRD Comparison Report ===', 'SECTION');
  
  const comparison = {
    summary: {
      totalPRDFeatures: 0,
      implementedFeatures: 0,
      missingFeatures: 0,
      errorFeatures: 0,
      completionRate: '0%',
    },
    byModule: {},
    missingFeaturesList: [],
    implementedFeaturesList: [],
  };

  for (const [module, features] of Object.entries(PRD_FEATURES)) {
    const moduleResult = {
      total: Object.keys(features).length,
      implemented: 0,
      missing: 0,
      error: 0,
      features: {},
    };

    for (const [featureId, featureInfo] of Object.entries(features)) {
      comparison.summary.totalPRDFeatures++;
      
      let status = 'MISSING';
      
      for (const testType of ['public', 'freelancer', 'hr', 'admin']) {
        if (testResults[testType]?.features?.[featureId]) {
          status = testResults[testType].features[featureId].status;
          break;
        }
      }

      moduleResult.features[featureId] = {
        name: featureInfo.name,
        priority: featureInfo.priority,
        expectedPath: featureInfo.path,
        status,
      };

      if (status === 'IMPLEMENTED') {
        moduleResult.implemented++;
        comparison.summary.implementedFeatures++;
        comparison.implementedFeaturesList.push({
          featureId,
          name: featureInfo.name,
          module,
          priority: featureInfo.priority,
        });
      } else if (status === 'MISSING' || status === 'EMPTY') {
        moduleResult.missing++;
        comparison.summary.missingFeatures++;
        if (featureInfo.priority === 'P0') {
          comparison.missingFeaturesList.push({
            featureId,
            name: featureInfo.name,
            module,
            priority: featureInfo.priority,
            expectedPath: featureInfo.path,
          });
        }
      } else {
        moduleResult.error++;
        comparison.summary.errorFeatures++;
      }
    }

    moduleResult.completionRate = `${Math.round((moduleResult.implemented / moduleResult.total) * 100)}%`;
    comparison.byModule[module] = moduleResult;
  }

  comparison.summary.completionRate = `${Math.round(
    (comparison.summary.implementedFeatures / comparison.summary.totalPRDFeatures) * 100
  )}%`;

  return comparison;
}

async function runTests() {
  const startTime = Date.now();
  log('Starting Comprehensive PRD E2E Testing', 'SECTION');
  log(`Base URL: ${BASE_URL}`, 'INFO');
  log(`API URL: ${API_URL}`, 'INFO');

  let browser, context, page;
  const allResults = {};

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') log(`Browser: ${msg.text().substring(0, 80)}`, 'WARNING');
    });

    page.on('pageerror', error => {
      log(`Page Error: ${error.message.substring(0, 80)}`, 'WARNING');
    });

    allResults.public = await testPublicPages(page);
    allResults.freelancer = await testFreelancerFeatures(page);
    allResults.hr = await testHRFeatures(page);
    allResults.admin = await testAdminFeatures(page);
    allResults.navigation = await testNavigation(page);
    allResults.apis = await testAPIs(page);

    const comparison = await generateComparisonReport(allResults);
    allResults.comparison = comparison;

  } catch (e) {
    log(`Fatal error: ${e.message}`, 'ERROR');
    allResults.fatalError = e.message;
  } finally {
    if (browser) await browser.close();
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const report = {
    testRun: {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}s`,
      baseUrl: BASE_URL,
      apiUrl: API_URL,
    },
    results: allResults,
    comparison: allResults.comparison,
  };

  const reportPath = path.join(TEST_RESULT_DIR, `prd-e2e-full-comparison-${formatDate()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Report saved: ${reportPath}`, 'SUCCESS');

  console.log('\n' + '='.repeat(70));
  console.log('PRD E2E TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Duration: ${duration}s`);
  
  if (allResults.comparison) {
    console.log(`\nPRD Feature Completion: ${allResults.comparison.summary.completionRate}`);
    console.log(`Total PRD Features: ${allResults.comparison.summary.totalPRDFeatures}`);
    console.log(`Implemented: ${allResults.comparison.summary.implementedFeatures}`);
    console.log(`Missing: ${allResults.comparison.summary.missingFeatures}`);
    console.log(`Errors: ${allResults.comparison.summary.errorFeatures}`);
    
    console.log('\n--- Missing P0 Features ---');
    allResults.comparison.missingFeaturesList
      .filter(f => f.priority === 'P0')
      .forEach(f => console.log(`  [${f.featureId}] ${f.name} (${f.module})`));
  }

  console.log('\n--- Test Results by Role ---');
  for (const [name, result] of Object.entries(allResults)) {
    if (result && typeof result === 'object' && 'passed' in result) {
      console.log(`${name}: Passed=${result.passed}, Failed=${result.failed}`);
    }
  }

  console.log('='.repeat(70));
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(70));

  return report;
}

runTests()
  .then(report => {
    log('E2E Testing completed', 'SECTION');
    process.exit(0);
  })
  .catch(e => {
    log(`Fatal error: ${e.message}`, 'ERROR');
    process.exit(1);
  });
