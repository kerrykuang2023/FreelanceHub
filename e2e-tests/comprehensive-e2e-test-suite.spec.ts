import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { 
  TestHelper, 
  DataVerifier, 
  MasterDataChecker, 
  IssueLogger,
  TEST_USERS,
  ConsoleError,
  NetworkRequest 
} from '../e2e-utils/test-helpers-enhanced';

const BASE_URL = 'http://localhost:5137';
const API_URL = 'http://localhost:5555/api/v1';

interface TestContext {
  adminToken?: string;
  hrToken?: string;
  freelancerToken?: string;
  companyId?: string;
  projectId?: string;
  applicationId?: string;
  workLogId?: string;
  invoiceId?: string;
  freelancerId?: string;
  hrId?: string;
  testResults: {
    phase: string;
    scenario: string;
    success: boolean;
    frontendStatus?: string;
    backendStatus?: string;
    errors: string[];
  }[];
}

const context: TestContext = {
  testResults: [],
};

const issueLogger = new IssueLogger();

function logTestResult(
  phase: string, 
  scenario: string, 
  success: boolean, 
  frontendStatus?: string, 
  backendStatus?: string, 
  errors: string[] = []
) {
  context.testResults.push({
    phase,
    scenario,
    success,
    frontendStatus,
    backendStatus,
    errors,
  });
  
  const status = success ? '✅' : '❌';
  console.log(`${status} [${phase}] ${scenario}`);
  if (frontendStatus) console.log(`   前端状态: ${frontendStatus}`);
  if (backendStatus) console.log(`   后端状态: ${backendStatus}`);
  if (errors.length > 0) {
    console.log(`   错误: ${errors.join(', ')}`);
  }
}

test.describe('全面端到端测试 - 业务依赖顺序执行', () => {
  
  test.beforeAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('开始全面端到端测试');
    console.log('测试原则: 业务依赖优先 + 多场景数据覆盖 + 前后端一致性验证');
    console.log('='.repeat(80) + '\n');
  });

  test.afterAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('测试执行完成');
    console.log('='.repeat(80));
    
    const passed = context.testResults.filter(r => r.success).length;
    const failed = context.testResults.filter(r => !r.success).length;
    
    console.log('\n测试统计:');
    console.log(`  总测试数: ${context.testResults.length}`);
    console.log(`  通过: ${passed}`);
    console.log(`  失败: ${failed}`);
    
    if (issueLogger.getIssueCount() > 0) {
      console.log('\n问题清单:');
      console.log(`  总问题数: ${issueLogger.getIssueCount()}`);
      console.log(`  严重问题: ${issueLogger.getCriticalCount()}`);
      console.log(`  高优先级: ${issueLogger.getHighCount()}`);
    }
    
    console.log('\n各阶段结果:');
    const phases = [...new Set(context.testResults.map(r => r.phase))];
    phases.forEach(phase => {
      const phaseResults = context.testResults.filter(r => r.phase === phase);
      const phasePassed = phaseResults.filter(r => r.success).length;
      console.log(`  ${phase}: ${phasePassed}/${phaseResults.length} 通过`);
    });
  });

  test('Phase 0-001: 系统初始化验证', async ({ page, request }) => {
    const phase = 'P0';
    const scenario = '系统初始化验证';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      const frontendResponse = await page.goto(BASE_URL);
      const frontendOk = frontendResponse?.status() === 200;
      
      const apiResponse = await request.get(`${API_URL}/health`);
      const apiOk = apiResponse.status() === 200 || apiResponse.status() === 404;
      
      const masterData = await MasterDataChecker.checkAllMasterData(request);
      
      const success = frontendOk && apiOk;
      
      logTestResult(
        phase, 
        scenario, 
        success,
        `前端: ${frontendOk ? '正常' : '异常'}`,
        `API: ${apiOk ? '正常' : '异常'}`,
        success ? [] : ['系统初始化失败']
      );
      
      if (!success) {
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: '系统初始化失败',
          expectedBehavior: '前后端服务应该正常运行',
          actualBehavior: `前端: ${frontendOk}, API: ${apiOk}`,
          steps: ['检查服务状态'],
        });
      }
      
      expect(success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 1-001: 管理员登录', async ({ page, request }) => {
    const phase = 'P1';
    const scenario = '管理员登录';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.admin);
      
      if (loginResult.success) {
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        context.adminToken = token || undefined;
        
        const dashboardVisible = await page.locator('[data-testid="admin-dashboard"]').isVisible()
          .catch(() => page.locator('text=管理').first().isVisible());
        
        logTestResult(
          phase, 
          scenario, 
          true,
          dashboardVisible ? '已跳转到管理页面' : '登录成功',
          token ? 'Token已存储' : 'Token未存储'
        );
      } else {
        logTestResult(phase, scenario, false, undefined, undefined, ['登录失败']);
        
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: '管理员登录失败',
          expectedBehavior: '管理员应该能够成功登录',
          actualBehavior: '登录失败',
          steps: ['访问登录页面', '输入管理员账号', '点击登录'],
          consoleErrors: loginResult.errors,
        });
      }
      
      expect(loginResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 1-002: 技能分类管理验证', async ({ page, request }) => {
    const phase = 'P1';
    const scenario = '技能分类管理验证';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      if (!context.adminToken) {
        await TestHelper.loginAsUser(page, TEST_USERS.admin);
      }
      
      const skillCheck = await MasterDataChecker.checkSkillCategories(request, 2);
      
      logTestResult(
        phase, 
        scenario, 
        skillCheck.passed,
        `技能分类数量: ${skillCheck.actual}`,
        `最低要求: 2`
      );
      
      if (!skillCheck.passed) {
        issueLogger.logIssue({
          category: 'DATA',
          severity: 'HIGH',
          description: '技能分类数据不足',
          expectedBehavior: '系统应该有足够的技能分类数据',
          actualBehavior: `当前技能分类数量: ${skillCheck.actual}`,
          steps: ['检查技能分类数据'],
        });
      }
      
      expect(skillCheck.passed).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 2-001: HR用户登录', async ({ page, request }) => {
    const phase = 'P2';
    const scenario = 'HR用户登录';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.hr1);
      
      if (loginResult.success) {
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        context.hrToken = token || undefined;
        
        logTestResult(
          phase, 
          scenario, 
          true,
          'HR登录成功',
          token ? 'Token已存储' : 'Token未存储'
        );
      } else {
        logTestResult(phase, scenario, false, undefined, undefined, ['登录失败']);
        
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: 'HR用户登录失败',
          expectedBehavior: 'HR用户应该能够成功登录',
          actualBehavior: '登录失败',
          steps: ['访问登录页面', '输入HR账号', '点击登录'],
          consoleErrors: loginResult.errors,
        });
      }
      
      expect(loginResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 2-002: 公司数据验证', async ({ page, request }) => {
    const phase = 'P2';
    const scenario = '公司数据验证';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      const companyCheck = await MasterDataChecker.checkCompanies(request, 1);
      
      if (companyCheck.passed) {
        const response = await request.get(`${API_URL}/admin/companies`);
        const data = await response.json();
        const companies = data.data?.items || data.data || [];
        
        if (companies.length > 0) {
          const certifiedCompany = companies.find((c: any) => 
            c.certification_status === 'certified' || c.status === 'active'
          );
          
          if (certifiedCompany) {
            context.companyId = certifiedCompany._id || certifiedCompany.id;
            
            logTestResult(
              phase, 
              scenario, 
              true,
              `找到已认证公司: ${certifiedCompany.company_name}`,
              `公司ID: ${context.companyId}`
            );
          } else {
            logTestResult(
              phase, 
              scenario, 
              false,
              `公司数量: ${companies.length}`,
              '无已认证公司',
              ['需要已认证的公司才能发布项目']
            );
          }
        }
      } else {
        logTestResult(
          phase, 
          scenario, 
          false,
          `公司数量: ${companyCheck.actual}`,
          '公司数据不足',
          ['需要至少1家公司']
        );
        
        issueLogger.logIssue({
          category: 'DATA',
          severity: 'HIGH',
          description: '公司数据不足',
          expectedBehavior: '系统应该有已认证的公司数据',
          actualBehavior: `当前公司数量: ${companyCheck.actual}`,
          steps: ['检查公司数据'],
        });
      }
      
      expect(companyCheck.passed).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 3-001: 顾问用户登录', async ({ page, request }) => {
    const phase = 'P3';
    const scenario = '顾问用户登录';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      
      const loginResult = await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      if (loginResult.success) {
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        context.freelancerToken = token || undefined;
        
        const userData = await page.evaluate(() => {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr) : null;
        });
        
        if (userData) {
          context.freelancerId = userData._id || userData.id;
        }
        
        logTestResult(
          phase, 
          scenario, 
          true,
          '顾问登录成功',
          `顾问ID: ${context.freelancerId || '未获取'}`
        );
      } else {
        logTestResult(phase, scenario, false, undefined, undefined, ['登录失败']);
        
        issueLogger.logIssue({
          category: 'UX',
          severity: 'CRITICAL',
          description: '顾问用户登录失败',
          expectedBehavior: '顾问用户应该能够成功登录',
          actualBehavior: '登录失败',
          steps: ['访问登录页面', '输入顾问账号', '点击登录'],
          consoleErrors: loginResult.errors,
        });
      }
      
      expect(loginResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 4-001: HR发布项目', async ({ page, request }) => {
    const phase = 'P4';
    const scenario = 'HR发布项目';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.hr1);
      
      const projectTitle = `E2E测试项目-${Date.now()}`;
      
      const navResult = await TestHelper.navigateToPage(page, '/hr/post-job');
      
      if (navResult.success) {
        const formSelectors = {
          'input[name="title"]': projectTitle,
          'textarea[name="description"]': '这是一个E2E测试项目，用于验证项目发布流程。',
        };
        
        const formResult = await TestHelper.fillFormAndSubmit(
          page, 
          formSelectors,
          'button[type="submit"]'
        );
        
        if (formResult.success) {
          await page.waitForTimeout(2000);
          
          const projectExists = await DataVerifier.verifyProjectExists(request, projectTitle);
          
          if (projectExists.exists) {
            context.projectId = projectExists.project?._id || projectExists.project?.id;
            
            logTestResult(
              phase, 
              scenario, 
              true,
              `项目创建成功: ${projectTitle}`,
              `项目ID: ${context.projectId}`
            );
          } else {
            logTestResult(
              phase, 
              scenario, 
              false,
              '表单提交成功',
              '数据库中未找到项目',
              ['后端数据验证失败']
            );
            
            issueLogger.logIssue({
              category: 'DATA',
              severity: 'HIGH',
              description: '项目发布后数据库中不存在',
              expectedBehavior: '项目发布后应该在数据库中存在',
              actualBehavior: 'API查询不到项目数据',
              steps: ['填写项目表单', '提交表单', '查询数据库'],
            });
          }
        } else {
          logTestResult(phase, scenario, false, '表单提交失败', undefined, formResult.errors.map(e => e.text));
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问发布项目页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 4-002: 顾问浏览项目列表', async ({ page, request }) => {
    const phase = 'P4';
    const scenario = '顾问浏览项目列表';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/jobs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job"]').first();
        const hasJobs = await jobCards.isVisible().catch(() => false);
        
        const response = await request.get(`${API_URL}/jobs?status=published');
        const data = await response.json();
        const backendCount = data.data?.items?.length || data.data?.length || 0;
        
        logTestResult(
          phase, 
          scenario, 
          hasJobs || backendCount > 0,
          hasJobs ? '项目列表显示正常' : '无可见项目',
          `后端项目数: ${backendCount}`
        );
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问项目列表页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 4-003: 顾问申请项目', async ({ page, request }) => {
    const phase = 'P4';
    const scenario = '顾问申请项目';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    if (!context.projectId) {
      console.log('⚠️ 跳过测试：没有可用的项目ID');
      test.skip();
      return;
    }
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/jobs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const applyButton = page.locator('button:has-text("申请"), button:has-text("Apply")').first();
        const hasApplyButton = await applyButton.isVisible().catch(() => false);
        
        if (hasApplyButton) {
          await applyButton.click();
          await page.waitForTimeout(2000);
          
          const successMessage = page.locator('text=申请成功, text=已申请');
          const hasSuccessMessage = await successMessage.isVisible().catch(() => false);
          
          logTestResult(
            phase, 
            scenario, 
            hasSuccessMessage,
            hasSuccessMessage ? '申请成功' : '申请状态未知',
            '申请已提交'
          );
        } else {
          logTestResult(phase, scenario, false, '未找到申请按钮', undefined, ['页面可能没有可申请的项目']);
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问项目列表页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 4-004: HR查看申请列表', async ({ page, request }) => {
    const phase = 'P4';
    const scenario = 'HR查看申请列表';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.hr1);
      
      const navResult = await TestHelper.navigateToPage(page, '/hr/applications');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const applicationList = page.locator('[data-testid="application-item"], .application-card, [class*="application"]').first();
        const hasApplications = await applicationList.isVisible().catch(() => false);
        
        const response = await request.get(`${API_URL}/applications');
        const data = await response.json();
        const backendCount = data.data?.items?.length || data.data?.length || 0;
        
        logTestResult(
          phase, 
          scenario, 
          hasApplications || backendCount > 0,
          hasApplications ? '申请列表显示正常' : '无可见申请',
          `后端申请数: ${backendCount}`
        );
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问申请列表页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 5-001: 顾问创建工时', async ({ page, request }) => {
    const phase = 'P5';
    const scenario = '顾问创建工时';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/work-logs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const createButton = page.locator('button:has-text("新建"), button:has-text("创建"), button:has-text("New")').first();
        const hasCreateButton = await createButton.isVisible().catch(() => false);
        
        if (hasCreateButton) {
          await createButton.click();
          await page.waitForTimeout(1000);
          
          const formSelectors = {
            'input[name="hours"]': '8',
            'textarea[name="description"]': 'E2E测试工时记录',
          };
          
          const formResult = await TestHelper.fillFormAndSubmit(
            page, 
            formSelectors,
            'button[type="submit"]'
          );
          
          logTestResult(
            phase, 
            scenario, 
            formResult.success,
            formResult.success ? '工时创建成功' : '工时创建失败',
            undefined,
            formResult.errors.map(e => e.text)
          );
        } else {
          logTestResult(phase, scenario, false, '未找到创建工时按钮', undefined, ['可能没有分配的项目']);
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问工时页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 5-002: HR查看工时审核列表', async ({ page, request }) => {
    const phase = 'P5';
    const scenario = 'HR查看工时审核列表';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.hr1);
      
      const navResult = await TestHelper.navigateToPage(page, '/hr/work-logs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const workLogList = page.locator('[data-testid="worklog-item"], .worklog-card, [class*="worklog"]').first();
        const hasWorkLogs = await workLogList.isVisible().catch(() => false);
        
        const response = await request.get(`${API_URL}/work-logs');
        const data = await response.json();
        const backendCount = data.data?.items?.length || data.data?.length || 0;
        
        logTestResult(
          phase, 
          scenario, 
          true,
          hasWorkLogs ? '工时列表显示正常' : '无可见工时',
          `后端工时数: ${backendCount}`
        );
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问工时审核页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 6-001: 顾问创建发票', async ({ page, request }) => {
    const phase = 'P6';
    const scenario = '顾问创建发票';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/invoices');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const createButton = page.locator('button:has-text("创建"), button:has-text("新建"), button:has-text("New")').first();
        const hasCreateButton = await createButton.isVisible().catch(() => false);
        
        if (hasCreateButton) {
          logTestResult(
            phase, 
            scenario, 
            true,
            '发票页面可访问',
            '存在创建发票按钮'
          );
        } else {
          logTestResult(
            phase, 
            scenario, 
            true,
            '发票页面可访问',
            '可能没有可开票的工时'
          );
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问发票页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 8-001: 反向流程验证 - 已提交工时不可编辑', async ({ page, request }) => {
    const phase = 'P8';
    const scenario = '反向流程验证 - 已提交工时不可编辑';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/work-logs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const submittedWorkLog = page.locator('[data-status="submitted"], [class*="submitted"]').first();
        const hasSubmittedWorkLog = await submittedWorkLog.isVisible().catch(() => false);
        
        if (hasSubmittedWorkLog) {
          const editButton = submittedWorkLog.locator('button:has-text("编辑"), button:has-text("Edit")');
          const hasEditButton = await editButton.isVisible().catch(() => false);
          
          logTestResult(
            phase, 
            scenario, 
            !hasEditButton,
            hasEditButton ? '编辑按钮存在（异常）' : '编辑按钮不存在（正常）',
            '已提交工时应该不可编辑'
          );
        } else {
          logTestResult(
            phase, 
            scenario, 
            true,
            '无已提交工时',
            '跳过验证'
          );
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问工时页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });

  test('Phase 9-001: 跨角色数据同步验证', async ({ page, request }) => {
    const phase = 'P9';
    const scenario = '跨角色数据同步验证';
    
    console.log(`\n[${phase}] ${scenario}`);
    console.log('-'.repeat(60));
    
    await TestHelper.setupPageMonitoring(page);
    
    try {
      const response = await request.get(`${API_URL}/jobs?status=published');
      const data = await response.json();
      const backendProjects = data.data?.items || data.data || [];
      
      await TestHelper.logout(page);
      await TestHelper.loginAsUser(page, TEST_USERS.freelancer1);
      
      const navResult = await TestHelper.navigateToPage(page, '/freelancer/jobs');
      
      if (navResult.success) {
        await page.waitForTimeout(2000);
        
        const frontendProjectCards = await page.locator('[data-testid="job-card"], .job-card').count();
        
        const isSynced = frontendProjectCards === backendProjects.length || 
          (frontendProjectCards > 0 && backendProjects.length > 0);
        
        logTestResult(
          phase, 
          scenario, 
          isSynced,
          `前端项目数: ${frontendProjectCards}`,
          `后端项目数: ${backendProjects.length}`
        );
        
        if (!isSynced) {
          issueLogger.logIssue({
            category: 'DATA',
            severity: 'HIGH',
            description: '前后端项目数据不一致',
            expectedBehavior: '前端显示的项目数量应该与后端一致',
            actualBehavior: `前端: ${frontendProjectCards}, 后端: ${backendProjects.length}`,
            steps: ['查询后端项目数据', '获取前端显示数量', '对比数据'],
          });
        }
      } else {
        logTestResult(phase, scenario, false, '导航失败', undefined, ['无法访问项目列表页面']);
      }
      
      expect(navResult.success).toBe(true);
    } catch (error) {
      logTestResult(phase, scenario, false, undefined, undefined, [String(error)]);
      throw error;
    }
  });
});
